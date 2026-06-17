import { Buffer } from "node:buffer";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

function isEmailConfigured() {
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
    console.info("SMTP is not configured. Skipping lead notification email.");
    return { sent: false, reason: "SMTP not configured" };
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: env.smtp.from,
    to: env.smtp.contactTo,
    replyTo: lead.email,
    subject: `New ${lead.service} inquiry from ${lead.name}`,
    text: [
      `Name: ${lead.name}`,
      `Email: ${lead.email}`,
      `Phone: ${lead.phone || "Not provided"}`,
      `Company: ${lead.company || "Not provided"}`,
      `Service: ${lead.service}`,
      "",
      lead.message
    ].join("\n")
  });

  return { sent: true };
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
    console.info("SMTP is not configured. Skipping booking confirmation email.");
    return { sent: false, reason: "SMTP not configured" };
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: env.smtp.from,
    to: booking.email,
    replyTo: env.smtp.contactTo,
    subject: `Your Velura cleaning booking for ${formatBookingDate(booking.scheduledFor)}`,
    text: [
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
    ]
      .filter(Boolean)
      .join("\n")
  });

  return { sent: true };
}

export async function sendBookingStatusUpdate(booking, previousStatus) {
  if (!isEmailConfigured()) {
    console.info("SMTP is not configured. Skipping booking status email.");
    return { sent: false, reason: "SMTP not configured" };
  }

  const statusText = booking.status === "completed" ? "completed" : `updated to ${booking.status}`;
  const transporter = createTransporter();

  await transporter.sendMail({
    from: env.smtp.from,
    to: booking.email,
    replyTo: env.smtp.contactTo,
    subject: `Your Velura booking has been ${statusText}`,
    text: [
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
    ].join("\n")
  });

  return { sent: true };
}

export async function sendBookingTeamNotification(booking, eventLabel = "created") {
  if (!isEmailConfigured()) {
    console.info("SMTP is not configured. Skipping internal booking notification email.");
    return { sent: false, reason: "SMTP not configured" };
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: env.smtp.from,
    to: env.smtp.contactTo,
    replyTo: booking.email,
    subject: `Velura booking ${eventLabel}: ${booking.clientName}`,
    text: [
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
    ]
      .filter(Boolean)
      .join("\n")
  });

  return { sent: true };
}
