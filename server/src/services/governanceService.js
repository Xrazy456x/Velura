import { env } from "../config/env.js";
import { useFileDatabase } from "../config/database.js";
import AuditEvent from "../models/AuditEvent.js";
import Booking from "../models/Booking.js";
import Employee from "../models/Employee.js";
import Invoice from "../models/Invoice.js";
import Lead from "../models/Lead.js";
import Message from "../models/Message.js";
import QuoteRequest from "../models/QuoteRequest.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import * as fileStore from "./fileStore.js";

const retentionPolicy = [
  {
    area: "Active client records",
    records: "Quotes, active bookings, client contact details, access notes, parking notes",
    retention: "Keep while the quote or booking is active.",
    action: "Review once the work is completed, closed, or clearly abandoned."
  },
  {
    area: "Unused quote requests",
    records: "Quotes that never become bookings",
    retention: "Review after 12-18 months.",
    action: "Delete or anonymise if there is no ongoing client relationship, dispute, or accounting reason to keep it."
  },
  {
    area: "Completed bookings and invoices",
    records: "Booking records, invoices, payment reference notes",
    retention: "Keep for up to 6 years for accounting, dispute handling, and business records.",
    action: "Retain only the fields needed for those purposes."
  },
  {
    area: "Audit logs",
    records: "Manager actions, status changes, delete/restore actions, email actions",
    retention: `${env.auditLogRetentionDays} days`,
    action: "Automatically expires in MongoDB through the audit log TTL index."
  },
  {
    area: "Employee/cleaner records",
    records: "Cleaner names, email addresses, phone numbers, assignment history",
    retention: "Keep while active, then review when they leave.",
    action: "Keep only what is needed for work history, accounting, or dispute handling."
  },
  {
    area: "Marketing lists",
    records: "Names, emails, phone numbers used for marketing",
    retention: "Keep only for people who clearly opted in.",
    action: "Separate marketing consent from service communications before sending campaigns."
  }
];

const controls = [
  "MongoDB stores the current operational record.",
  "Audit events store important history: who changed what, and when.",
  "Communication logs store email/SMS/phone actions without duplicating every email body.",
  "Manager ownership prevents two managers emailing the same client at the same time.",
  "Recently deleted bookings are soft-deleted so mistakes can be restored.",
  "Passwords are hashed and never stored in plain text."
];

async function mongoCounts() {
  const [
    users,
    leads,
    messages,
    quoteRequests,
    activeBookings,
    deletedBookings,
    invoices,
    employees,
    reviews,
    auditEvents
  ] = await Promise.all([
    User.countDocuments(),
    Lead.countDocuments(),
    Message.countDocuments(),
    QuoteRequest.countDocuments(),
    Booking.countDocuments({ $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] }),
    Booking.countDocuments({ deletedAt: { $exists: true, $ne: null } }),
    Invoice.countDocuments(),
    Employee.countDocuments(),
    Review.countDocuments(),
    AuditEvent.countDocuments()
  ]);

  return {
    users,
    leads,
    messages,
    quoteRequests,
    activeBookings,
    deletedBookings,
    invoices,
    employees,
    reviews,
    auditEvents
  };
}

export async function getGovernanceSummary() {
  const counts = useFileDatabase() ? await fileStore.getRecordCounts() : await mongoCounts();

  return {
    generatedAt: new Date().toISOString(),
    databaseMode: useFileDatabase() ? "file" : "mongodb",
    auditLogRetentionDays: env.auditLogRetentionDays,
    counts,
    retentionPolicy,
    controls
  };
}
