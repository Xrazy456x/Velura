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

function buildEmailHtml(title, lines = []) {
  const body = lines
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 12px;color:#4f463f;line-height:1.65;">${escapeHtml(line)}</p>`)
    .join("");

  return `
    <div style="margin:0;padding:28px;background:#f8f3e8;font-family:Inter,Arial,sans-serif;color:#241f1a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e6ddd0;border-radius:12px;overflow:hidden;">
        <div style="background:#16110e;padding:24px 28px;color:#ffffff;">
          <p style="margin:0 0 6px;color:#dec06f;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Velura</p>
          <h1 style="margin:0;font-size:24px;line-height:1.25;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:28px;">
          ${body}
          <div style="margin-top:22px;padding-top:18px;border-top:1px solid #eee6da;">
            <p style="margin:0;color:#8f6a52;font-weight:700;">Luxury cleaning, gently delivered.</p>
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
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone || "Not provided"}`,
    `Company: ${lead.company || "Not provided"}`,
    `Service: ${lead.service}`,
    "",
    lead.message
  ];

  return sendEmail({
    to: env.smtp.contactTo,
    replyTo: lead.email,
    subject: `New ${lead.service} inquiry from ${lead.name}`,
    text: lines.join("\n"),
    html: buildEmailHtml(`New inquiry from ${lead.name}`, lines)
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
    body: `Hello ${booking.clientName}, your Velura booking is set: ${bookingSummary(booking)}. Reply to this number if anything needs changing.`
  });
}

export async function sendBookingSmsStatusUpdate(booking, previousStatus) {
  const statusText = booking.status === "completed" ? "completed" : `updated to ${booking.status}`;

  return sendSms({
    to: booking.phone,
    body: `Hello ${booking.clientName}, your Velura booking has been ${statusText}. Previous status: ${previousStatus || "not set"}. ${bookingSummary(booking)}.`
  });
}

export async function sendBookingConfirmation(booking) {
  if (!isEmailConfigured()) {
    console.info("Email provider is not configured. Skipping booking confirmation email.");
    return { sent: false, reason: "Email provider not configured" };
  }

  const lines = [
    `Hello ${booking.clientName},`,
    "",
    "Thank you for choosing Velura. Your cleaning booking has been placed in our diary.",
    "",
    `Service: ${booking.service}`,
    `Date and time: ${formatBookingDate(booking.scheduledFor)}`,
    `Estimated duration: ${booking.durationMinutes} minutes`,
    `Address: ${booking.address}`,
    booking.accessInstructions ? `Access instructions: ${booking.accessInstructions}` : "",
    booking.parkingNotes ? `Parking notes: ${booking.parkingNotes}` : "",
    "",
    booking.notes ? `Notes: ${booking.notes}` : "",
    "If anything needs changing, please reply to this email and our team will help.",
    "",
    "Velura",
    "Luxury cleaning, gently delivered"
  ].filter(Boolean);

  return sendEmail({
    to: booking.email,
    replyTo: env.smtp.contactTo,
    subject: `Your Velura cleaning booking for ${formatBookingDate(booking.scheduledFor)}`,
    text: lines.join("\n"),
    html: buildEmailHtml("Your Velura booking", lines)
  });
}

export async function sendBookingStatusUpdate(booking, previousStatus) {
  if (!isEmailConfigured()) {
    console.info("Email provider is not configured. Skipping booking status email.");
    return { sent: false, reason: "Email provider not configured" };
  }

  const statusText = booking.status === "completed" ? "completed" : `updated to ${booking.status}`;
  const lines = [
    `Hello ${booking.clientName},`,
    "",
    `Your Velura cleaning booking has been ${statusText}.`,
    "",
    `Previous status: ${previousStatus || "not set"}`,
    `Current status: ${booking.status}`,
    `Service: ${booking.service}`,
    `Date and time: ${formatBookingDate(booking.scheduledFor)}`,
    `Address: ${booking.address}`,
    booking.accessInstructions ? `Access instructions: ${booking.accessInstructions}` : "",
    booking.parkingNotes ? `Parking notes: ${booking.parkingNotes}` : "",
    "",
    booking.status === "completed"
      ? "Thank you for trusting Velura with your space. We hope everything feels beautifully refreshed."
      : "Please reply to this email if you need anything adjusted.",
    "",
    "Velura",
    "Luxury cleaning, gently delivered"
  ].filter(Boolean);

  return sendEmail({
    to: booking.email,
    replyTo: env.smtp.contactTo,
    subject: `Your Velura booking has been ${statusText}`,
    text: lines.join("\n"),
    html: buildEmailHtml(`Your booking has been ${statusText}`, lines)
  });
}

export async function sendBookingTeamNotification(booking, eventLabel = "created") {
  if (!isEmailConfigured()) {
    console.info("Email provider is not configured. Skipping internal booking notification email.");
    return { sent: false, reason: "Email provider not configured" };
  }

  const lines = [
    `Booking ${eventLabel}`,
    "",
    `Client: ${booking.clientName}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone || "Not provided"}`,
    `Service: ${booking.service}`,
    `Date and time: ${formatBookingDate(booking.scheduledFor)}`,
    `Duration: ${booking.durationMinutes} minutes`,
    `Address: ${booking.address}`,
    `Status: ${booking.status}`,
    `Preferred contact: ${booking.communicationPreference}`,
    booking.accessInstructions ? `Access instructions: ${booking.accessInstructions}` : "",
    booking.parkingNotes ? `Parking notes: ${booking.parkingNotes}` : "",
    "",
    booking.notes ? `Notes: ${booking.notes}` : ""
  ].filter(Boolean);

  return sendEmail({
    to: env.smtp.contactTo,
    replyTo: booking.email,
    subject: `Velura booking ${eventLabel}: ${booking.clientName}`,
    text: lines.join("\n"),
    html: buildEmailHtml(`Booking ${eventLabel}`, lines)
  });
}
