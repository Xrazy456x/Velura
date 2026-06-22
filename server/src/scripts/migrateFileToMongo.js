import { readFile } from "node:fs/promises";
import mongoose from "mongoose";
import { connectDatabase, useFileDatabase } from "../config/database.js";
import AuditEvent from "../models/AuditEvent.js";
import Booking from "../models/Booking.js";
import Employee from "../models/Employee.js";
import Invoice from "../models/Invoice.js";
import Lead from "../models/Lead.js";
import Message from "../models/Message.js";
import QuoteRequest from "../models/QuoteRequest.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { fileStorePath } from "../services/fileStore.js";

function asDate(value, fallback = new Date()) {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
}

async function upsertBy(Model, filter, payload) {
  return Model.findOneAndUpdate(
    filter,
    {
      $setOnInsert: payload
    },
    {
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      timestamps: false,
      upsert: true
    }
  );
}

async function main() {
  await connectDatabase();

  if (useFileDatabase()) {
    throw new Error("MongoDB is not connected. Set DATABASE_DRIVER=mongodb, DATABASE_FALLBACK_TO_FILE=false, and MONGO_URI first.");
  }

  const raw = await readFile(fileStorePath, "utf8");
  const database = JSON.parse(raw);
  const idMaps = {
    users: new Map(),
    leads: new Map(),
    employees: new Map(),
    bookings: new Map()
  };
  const counts = {
    users: 0,
    leads: 0,
    messages: 0,
    quoteRequests: 0,
    employees: 0,
    bookings: 0,
    invoices: 0,
    reviews: 0,
    auditEvents: 0
  };

  for (const user of database.users || []) {
    const saved = await upsertBy(
      User,
      { email: user.email },
      {
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role || "user",
        status: user.status || "active",
        createdAt: asDate(user.createdAt),
        updatedAt: asDate(user.updatedAt)
      }
    );
    idMaps.users.set(user._id, saved._id);
    counts.users += 1;
  }

  for (const employee of database.employees || []) {
    const filter = employee.email ? { email: employee.email } : { name: employee.name, createdAt: asDate(employee.createdAt) };
    const saved = await upsertBy(Employee, filter, {
      name: employee.name,
      email: employee.email || "",
      phone: employee.phone || "",
      role: employee.role || "Cleaner",
      status: employee.status || "active",
      skills: employee.skills || [],
      availabilityNotes: employee.availabilityNotes || "",
      createdBy: idMaps.users.get(employee.createdBy) || null,
      createdAt: asDate(employee.createdAt),
      updatedAt: asDate(employee.updatedAt)
    });
    idMaps.employees.set(employee._id, saved._id);
    counts.employees += 1;
  }

  for (const lead of database.leads || []) {
    const saved = await upsertBy(
      Lead,
      {
        email: lead.email,
        createdAt: asDate(lead.createdAt)
      },
      {
        name: lead.name,
        email: lead.email,
        phone: lead.phone || "",
        company: lead.company || "",
        service: lead.service || "General inquiry",
        message: lead.message,
        status: lead.status || "new",
        source: lead.source || "website",
        createdAt: asDate(lead.createdAt),
        updatedAt: asDate(lead.updatedAt)
      }
    );
    idMaps.leads.set(lead._id, saved._id);
    counts.leads += 1;
  }

  for (const message of database.messages || []) {
    await upsertBy(
      Message,
      {
        email: message.email,
        createdAt: asDate(message.createdAt),
        subject: message.subject
      },
      {
        lead: idMaps.leads.get(message.lead) || null,
        name: message.name,
        email: message.email,
        subject: message.subject,
        body: message.body,
        isRead: Boolean(message.isRead),
        createdAt: asDate(message.createdAt),
        updatedAt: asDate(message.updatedAt)
      }
    );
    counts.messages += 1;
  }

  for (const quoteRequest of database.quoteRequests || []) {
    await upsertBy(
      QuoteRequest,
      {
        quoteReference: quoteRequest.quoteReference
      },
      {
        quoteReference: quoteRequest.quoteReference,
        clientName: quoteRequest.clientName,
        email: quoteRequest.email,
        phone: quoteRequest.phone,
        address: quoteRequest.address || "",
        preferredDate: quoteRequest.preferredDate || "",
        preferredTime: quoteRequest.preferredTime || "",
        accessInstructions: quoteRequest.accessInstructions || "",
        parkingNotes: quoteRequest.parkingNotes || "",
        quoteNotes: quoteRequest.quoteNotes || "",
        status: quoteRequest.status || "new",
        quoteInput: quoteRequest.quoteInput,
        quoteResult: quoteRequest.quoteResult,
        photoRequestSentAt: quoteRequest.photoRequestSentAt ? asDate(quoteRequest.photoRequestSentAt) : null,
        createdAt: asDate(quoteRequest.createdAt),
        updatedAt: asDate(quoteRequest.updatedAt)
      }
    );
    counts.quoteRequests += 1;
  }

  for (const booking of database.bookings || []) {
    const saved = await upsertBy(
      Booking,
      {
        email: booking.email,
        service: booking.service,
        address: booking.address,
        scheduledFor: asDate(booking.scheduledFor)
      },
      {
        lead: idMaps.leads.get(booking.lead) || null,
        bookingNumber: booking.bookingNumber || undefined,
        clientName: booking.clientName,
        email: booking.email,
        phone: booking.phone || "",
        service: booking.service,
        address: booking.address,
        scheduledFor: asDate(booking.scheduledFor),
        durationMinutes: booking.durationMinutes || 120,
        status: booking.status || "scheduled",
        communicationPreference: booking.communicationPreference || "email",
        assignedEmployees: (booking.assignedEmployees || []).map((id) => idMaps.employees.get(id)).filter(Boolean),
        accessInstructions: booking.accessInstructions || "",
        parkingNotes: booking.parkingNotes || "",
        notes: booking.notes || "",
        communicationLog: booking.communicationLog || [],
        createdBy: idMaps.users.get(booking.createdBy) || null,
        deletedAt: booking.deletedAt ? asDate(booking.deletedAt) : null,
        deletedBy: idMaps.users.get(booking.deletedBy) || null,
        createdAt: asDate(booking.createdAt),
        updatedAt: asDate(booking.updatedAt)
      }
    );
    idMaps.bookings.set(booking._id, saved._id);
    counts.bookings += 1;
  }

  for (const invoice of database.invoices || []) {
    await upsertBy(
      Invoice,
      { invoiceNumber: invoice.invoiceNumber },
      {
        booking: idMaps.bookings?.get(invoice.booking) || null,
        invoiceNumber: invoice.invoiceNumber,
        bookingReference: invoice.bookingReference || "",
        status: invoice.status || "draft",
        clientName: invoice.clientName,
        email: invoice.email,
        phone: invoice.phone || "",
        billingAddress: invoice.billingAddress,
        service: invoice.service,
        bookingDate: invoice.bookingDate ? asDate(invoice.bookingDate) : undefined,
        issueDate: asDate(invoice.issueDate),
        dueDate: asDate(invoice.dueDate),
        currency: invoice.currency || "GBP",
        lineItems: invoice.lineItems || [],
        subtotal: invoice.subtotal || 0,
        vatTotal: invoice.vatTotal || 0,
        total: invoice.total || 0,
        paymentInstructions: invoice.paymentInstructions || "",
        notes: invoice.notes || "",
        createdBy: idMaps.users.get(invoice.createdBy) || null,
        createdAt: asDate(invoice.createdAt),
        updatedAt: asDate(invoice.updatedAt)
      }
    );
    counts.invoices += 1;
  }

  for (const review of database.reviews || []) {
    await upsertBy(
      Review,
      { googleReviewName: review.googleReviewName },
      {
        placeId: review.placeId,
        googleReviewName: review.googleReviewName,
        authorName: review.authorName || "Google user",
        profilePhotoUrl: review.profilePhotoUrl,
        rating: review.rating,
        comment: review.comment || "",
        relativePublishTimeDescription: review.relativePublishTimeDescription,
        publishTime: review.publishTime ? asDate(review.publishTime) : undefined,
        googleMapsUri: review.googleMapsUri,
        averageRating: review.averageRating,
        userRatingCount: review.userRatingCount,
        fetchedAt: asDate(review.fetchedAt),
        createdAt: asDate(review.createdAt),
        updatedAt: asDate(review.updatedAt)
      }
    );
    counts.reviews += 1;
  }

  for (const event of database.auditEvents || []) {
    await upsertBy(
      AuditEvent,
      {
        action: event.action,
        resource: event.resource,
        summary: event.summary,
        createdAt: asDate(event.createdAt)
      },
      {
        action: event.action,
        resource: event.resource,
        resourceId: event.resourceId,
        summary: event.summary,
        actor: event.actor || {},
        metadata: event.metadata || {},
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        expiresAt: asDate(event.expiresAt, new Date(Date.now() + 1000 * 60 * 60 * 24 * 2190)),
        createdAt: asDate(event.createdAt),
        updatedAt: asDate(event.updatedAt)
      }
    );
    counts.auditEvents += 1;
  }

  console.log("File database migration finished.");
  console.table(counts);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
