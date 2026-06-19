import { Buffer } from "node:buffer";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

function isEmailConfigured() {
  return isResendConfigured() || isSmtpConfigured();
}

function isResendConfigured() {
  return Boolean(env.resend.apiKey && env.smtp.from && env.smtp.contactTo);
}

function isSmtpConfigured() {
  return Boolean(env.smtp.host && env.smtp.from && env.smtp.contactTo);
}

function isSmsConfigured() {
  return Boolean(env.twilio.accountSid && env.twilio.authToken && env.twilio.fromNumber);
}

function createTransporter() {
  const transportConfig = {
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    requireTLS: env.smtp.requireTls
  };

  if (env.smtp.user && env.smtp.pass) {
    transportConfig.auth = {
      user: env.smtp.user,
      pass: env.smtp.pass
    };
  }

  return nodemailer.createTransport(transportConfig);
}

function normalizeRecipients(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function bookingReference(booking) {
  if (booking?.bookingNumber) {
    return booking.bookingNumber;
  }

  const fallback = String(booking?._id || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(-6);

  return fallback ? `VEL-${fallback}` : "VEL-BOOKING";
}

function formatDuration(minutes = 0) {
  const totalMinutes = Number(minutes) || 0;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours && remainingMinutes) {
    return `${hours} hr ${remainingMinutes} min`;
  }

  if (hours) {
    return `${hours} hr`;
  }

  return `${totalMinutes} min`;
}

function humanStatus(value = "") {
  return String(value).replace(/_/g, " ");
}

function buildDetailRows(rows = []) {
  const visibleRows = rows.filter((row) => {
    const value = row?.value;
    return value !== undefined && value !== null && String(value).trim() !== "";
  });

  if (!visibleRows.length) {
    return "";
  }

  return `
    <div style="margin:24px 0;border:1px solid #eee1cf;border-radius:14px;overflow:hidden;background:#fffaf2;">
      ${visibleRows
        .map(
          (row) => `
            <div style="display:block;padding:14px 18px;border-bottom:1px solid #eee1cf;">
              <p style="margin:0 0 3px;color:#8f6a52;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(row.label)}</p>
              <p style="margin:0;color:#241f1a;font-size:15px;font-weight:700;line-height:1.5;">${escapeHtml(row.value)}</p>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function buildEmailHtml(title, lines = [], options = {}) {
  const {
    eyebrow = "Velura",
    referenceLabel = "Booking reference",
    referenceValue = "",
    detailRows = [],
    replyNote = "",
    footerNote = "Luxury cleaning, gently delivered."
  } = options;
  const body = lines
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 14px;color:#4f463f;font-size:15px;line-height:1.7;">${escapeHtml(line)}</p>`)
    .join("");

  return `
    <div style="margin:0;padding:32px 16px;background:#f8f3e8;font-family:Inter,Arial,sans-serif;color:#241f1a;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #eadfcc;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(36,31,26,0.08);">
        <div style="background:#16110e;padding:30px 30px 26px;color:#ffffff;">
          <p style="margin:0 0 8px;color:#dec06f;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
          <h1 style="margin:0;max-width:560px;font-size:28px;line-height:1.22;font-weight:800;">${escapeHtml(title)}</h1>
          ${
            referenceValue
              ? `<div style="display:inline-block;margin-top:18px;padding:10px 14px;border:1px solid rgba(222,192,111,0.55);border-radius:999px;background:rgba(222,192,111,0.12);">
                  <span style="color:#dec06f;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(referenceLabel)}</span>
                  <span style="margin-left:8px;color:#ffffff;font-size:14px;font-weight:800;">${escapeHtml(referenceValue)}</span>
                </div>`
              : ""
          }
        </div>
        <div style="padding:30px;">
          ${body}
          ${buildDetailRows(detailRows)}
          ${
            replyNote
              ? `<div style="margin:22px 0 0;padding:16px 18px;border-radius:14px;background:#eef8f6;border:1px solid #cce8e2;">
                  <p style="margin:0;color:#245b52;font-size:14px;font-weight:700;line-height:1.55;">${escapeHtml(replyNote)}</p>
                </div>`
              : ""
          }
          <div style="margin-top:26px;padding-top:20px;border-top:1px solid #eee6da;">
            <p style="margin:0 0 4px;color:#241f1a;font-weight:800;">Velura</p>
            <p style="margin:0;color:#8f6a52;font-weight:700;">${escapeHtml(footerNote)}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function sendResendEmail({ to, replyTo, subject, text, html }) {
  const payload = {
    from: env.smtp.from,
    to: normalizeRecipients(to),
    subject,
    text,
    html
  };

  if (replyTo) {
    payload.reply_to = normalizeRecipients(replyTo);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resend.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Resend email failed with ${response.status}: ${data?.message || JSON.stringify(data)}`);
  }

  return { sent: true, provider: "resend", id: data.id };
}

async function sendSmtpEmail({ to, replyTo, subject, text, html }) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: env.smtp.from,
    to: normalizeRecipients(to),
    replyTo,
    subject,
    text,
    html
  });

  return { sent: true, provider: "smtp" };
}

async function sendEmail(options) {
  if (isResendConfigured()) {
    return sendResendEmail(options);
  }

  if (isSmtpConfigured()) {
    return sendSmtpEmail(options);
  }

  console.info("Email provider is not configured. Skipping email.");
  return { sent: false, reason: "Email provider not configured" };
}

function bookingSummary(booking) {
  return `${booking.service} on ${formatBookingDate(booking.scheduledFor)} at ${booking.address}`;
}

function formatBookingDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/London"
  }).format(new Date(value));
}

export async function sendLeadNotification(lead) {
  if (!isEmailConfigured()) {
    console.info("Email provider is not configured. Skipping lead notification email.");
    return { sent: false, reason: "Email provider not configured" };
  }

  const lines = [
    `A new Velura inquiry has arrived from ${lead.name}.`,
    "Reply directly to this email to respond to the client.",
    lead.message
  ];

  return sendEmail({
    to: env.smtp.contactTo,
    replyTo: lead.email,
    subject: `New ${lead.service} inquiry from ${lead.name}`,
    text: lines.join("\n"),
    html: buildEmailHtml(`New inquiry from ${lead.name}`, lines, {
      eyebrow: "Velura inquiry",
      detailRows: [
        { label: "Name", value: lead.name },
        { label: "Email", value: lead.email },
        { label: "Phone", value: lead.phone || "Not provided" },
        { label: "Company", value: lead.company || "Not provided" },
        { label: "Service", value: lead.service }
      ],
      replyNote: `Replying to this email will reply to ${lead.email}.`
    })
  });
}

async function sendSms({ to, body }) {
  if (!to) {
    return { sent: false, reason: "Client phone number is missing" };
  }

  if (!isSmsConfigured()) {
    console.info("Twilio is not configured. Skipping booking SMS.");
    return { sent: false, reason: "Twilio not configured" };
  }

  const credentials = Buffer.from(`${env.twilio.accountSid}:${env.twilio.authToken}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.twilio.accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      To: to,
      From: env.twilio.fromNumber,
      Body: body
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio SMS failed with ${response.status}: ${errorText}`);
  }

  return { sent: true };
}

export async function sendBookingSmsConfirmation(booking) {
  return sendSms({
    to: booking.phone,
    body: `Hello ${booking.clientName}, your Velura booking ${bookingReference(booking)} is set: ${bookingSummary(booking)}. Reply to this number if anything needs changing.`
  });
}

export async function sendBookingSmsStatusUpdate(booking, previousStatus) {
  const statusText = booking.status === "completed" ? "completed" : `updated to ${booking.status}`;

  return sendSms({
    to: booking.phone,
    body: `Hello ${booking.clientName}, your Velura booking ${bookingReference(booking)} has been ${statusText}. Previous status: ${previousStatus || "not set"}. ${bookingSummary(booking)}.`
  });
}

export async function sendBookingConfirmation(booking) {
  if (!isEmailConfigured()) {
    console.info("Email provider is not configured. Skipping booking confirmation email.");
    return { sent: false, reason: "Email provider not configured" };
  }

  const reference = bookingReference(booking);
  const lines = [
    `Hello ${booking.clientName},`,
    `Thank you for choosing Velura. Your cleaning booking is now in our diary under reference ${reference}.`,
    "Our team will arrive prepared for the agreed service. If anything changes before the visit, just reply directly to this email."
  ].filter(Boolean);
  const detailRows = [
    { label: "Booking reference", value: reference },
    { label: "Service", value: booking.service },
    { label: "Date and time", value: formatBookingDate(booking.scheduledFor) },
    { label: "Estimated duration", value: formatDuration(booking.durationMinutes) },
    { label: "Address", value: booking.address },
    { label: "Access instructions", value: booking.accessInstructions },
    { label: "Parking notes", value: booking.parkingNotes },
    { label: "Booking notes", value: booking.notes }
  ];
  const textLines = [
    ...lines,
    "",
    ...detailRows.filter((row) => row.value).map((row) => `${row.label}: ${row.value}`),
    "",
    `Reply to this email and your message will go to ${env.smtp.contactTo}.`,
    "",
    "Velura",
    "Luxury cleaning, gently delivered"
  ];

  return sendEmail({
    to: booking.email,
    replyTo: env.smtp.contactTo,
    subject: `Velura booking ${reference} is confirmed`,
    text: textLines.join("\n"),
    html: buildEmailHtml("Your Velura booking is confirmed", lines, {
      eyebrow: "Booking confirmation",
      referenceValue: reference,
      detailRows,
      replyNote: `Need to make a change? Reply directly to this email and your message will go to ${env.smtp.contactTo}.`
    })
  });
}

export async function sendBookingStatusUpdate(booking, previousStatus) {
  if (!isEmailConfigured()) {
    console.info("Email provider is not configured. Skipping booking status email.");
    return { sent: false, reason: "Email provider not configured" };
  }

  const reference = bookingReference(booking);
  const statusText = booking.status === "completed" ? "completed" : `updated to ${booking.status}`;
  const lines = [
    `Hello ${booking.clientName},`,
    `Your Velura booking ${reference} has been ${statusText}.`,
    booking.status === "completed"
      ? "Thank you for trusting Velura with your space. We hope everything feels beautifully refreshed."
      : "Please reply to this email if you need anything adjusted."
  ].filter(Boolean);
  const detailRows = [
    { label: "Booking reference", value: reference },
    { label: "Previous status", value: previousStatus || "Not set" },
    { label: "Current status", value: humanStatus(booking.status) },
    { label: "Service", value: booking.service },
    { label: "Date and time", value: formatBookingDate(booking.scheduledFor) },
    { label: "Address", value: booking.address },
    { label: "Access instructions", value: booking.accessInstructions },
    { label: "Parking notes", value: booking.parkingNotes }
  ];
  const textLines = [
    ...lines,
    "",
    ...detailRows.filter((row) => row.value).map((row) => `${row.label}: ${row.value}`),
    "",
    `Reply to this email and your message will go to ${env.smtp.contactTo}.`,
    "",
    "Velura",
    "Luxury cleaning, gently delivered"
  ];

  return sendEmail({
    to: booking.email,
    replyTo: env.smtp.contactTo,
    subject: `Velura booking ${reference} has been ${statusText}`,
    text: textLines.join("\n"),
    html: buildEmailHtml(`Your booking has been ${statusText}`, lines, {
      eyebrow: "Booking update",
      referenceValue: reference,
      detailRows,
      replyNote: `Questions about this update? Reply directly to this email and your message will go to ${env.smtp.contactTo}.`
    })
  });
}

export async function sendBookingTeamNotification(booking, eventLabel = "created") {
  if (!isEmailConfigured()) {
    console.info("Email provider is not configured. Skipping internal booking notification email.");
    return { sent: false, reason: "Email provider not configured" };
  }

  const reference = bookingReference(booking);
  const lines = [
    `Booking ${eventLabel}: ${reference}`,
    "Reply directly to this email if you want to respond to the client."
  ].filter(Boolean);
  const detailRows = [
    { label: "Booking reference", value: reference },
    { label: "Client", value: booking.clientName },
    { label: "Email", value: booking.email },
    { label: "Phone", value: booking.phone || "Not provided" },
    { label: "Service", value: booking.service },
    { label: "Date and time", value: formatBookingDate(booking.scheduledFor) },
    { label: "Duration", value: formatDuration(booking.durationMinutes) },
    { label: "Address", value: booking.address },
    { label: "Status", value: humanStatus(booking.status) },
    { label: "Preferred contact", value: booking.communicationPreference },
    { label: "Access instructions", value: booking.accessInstructions },
    { label: "Parking notes", value: booking.parkingNotes },
    { label: "Booking notes", value: booking.notes }
  ];
  const textLines = [
    ...lines,
    "",
    ...detailRows.filter((row) => row.value).map((row) => `${row.label}: ${row.value}`)
  ];

  return sendEmail({
    to: env.smtp.contactTo,
    replyTo: booking.email,
    subject: `[${reference}] Velura booking ${eventLabel}: ${booking.clientName}`,
    text: textLines.join("\n"),
    html: buildEmailHtml(`Booking ${eventLabel}`, lines, {
      eyebrow: "Manager booking alert",
      referenceValue: reference,
      detailRows,
      replyNote: `Replying to this email will reply to ${booking.email}.`
    })
  });
}
