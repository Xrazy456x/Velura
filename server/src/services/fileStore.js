import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const fileStorePath = fileURLToPath(new URL("../../data/dev-db.json", import.meta.url));

const emptyDatabase = {
  users: [],
  leads: [],
  messages: [],
  quoteRequests: [],
  bookings: [],
  invoices: [],
  employees: [],
  reviews: [],
  auditEvents: []
};

let queue = Promise.resolve();

function now() {
  return new Date().toISOString();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sortNewest(items) {
  return [...items].sort((a, b) => new Date(b.createdAt || b.fetchedAt || 0) - new Date(a.createdAt || a.fetchedAt || 0));
}

export function publicUser(user) {
  if (!user) {
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function ensureFileStore() {
  await mkdir(dirname(fileStorePath), { recursive: true });

  try {
    await readFile(fileStorePath, "utf8");
  } catch {
    await writeFile(fileStorePath, `${JSON.stringify(emptyDatabase, null, 2)}\n`);
  }
}

async function readDatabase() {
  await ensureFileStore();
  const raw = await readFile(fileStorePath, "utf8");
  const parsed = JSON.parse(raw);

  return {
    ...emptyDatabase,
    ...parsed,
    users: parsed.users || [],
    leads: parsed.leads || [],
    messages: parsed.messages || [],
    quoteRequests: parsed.quoteRequests || [],
    bookings: parsed.bookings || [],
    invoices: parsed.invoices || [],
    employees: parsed.employees || [],
    reviews: parsed.reviews || [],
    auditEvents: parsed.auditEvents || []
  };
}

async function writeDatabase(database) {
  await writeFile(fileStorePath, `${JSON.stringify(database, null, 2)}\n`);
}

function updateDatabase(updater) {
  queue = queue.then(async () => {
    const database = await readDatabase();
    const result = await updater(database);
    await writeDatabase(database);
    return clone(result);
  });

  return queue;
}

export async function countUsers() {
  const database = await readDatabase();
  return database.users.length;
}

export async function findUserByEmail(email) {
  const database = await readDatabase();
  return clone(database.users.find((user) => user.email === email.toLowerCase()) || null);
}

export async function findUserById(id) {
  const database = await readDatabase();
  return clone(database.users.find((user) => user._id === id) || null);
}

export async function createUser(payload) {
  return updateDatabase((database) => {
    const timestamp = now();
    const user = {
      _id: randomUUID(),
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash: payload.passwordHash,
      role: payload.role || "user",
      status: payload.status || "active",
      createdAt: timestamp,
      updatedAt: timestamp
    };

    database.users.push(user);
    return user;
  });
}

export async function listUsers() {
  const database = await readDatabase();
  return clone(sortNewest(database.users).map(publicUser));
}

export async function updateUser(id, updates) {
  return updateDatabase((database) => {
    const user = database.users.find((account) => account._id === id);

    if (!user) {
      return null;
    }

    Object.assign(user, updates, { updatedAt: now() });
    return publicUser(user);
  });
}

export async function deleteUser(id) {
  return updateDatabase((database) => {
    const index = database.users.findIndex((account) => account._id === id);

    if (index === -1) {
      return null;
    }

    const [user] = database.users.splice(index, 1);
    return publicUser(user);
  });
}

export async function findLeadById(id) {
  const database = await readDatabase();
  return clone(database.leads.find((item) => item._id === id) || null);
}

export async function createLead(payload) {
  return updateDatabase((database) => {
    const timestamp = now();
    const lead = {
      _id: randomUUID(),
      name: payload.name,
      email: payload.email.toLowerCase(),
      phone: payload.phone || "",
      company: payload.company || "",
      service: payload.service || "General inquiry",
      message: payload.message,
      status: "new",
      source: "website",
      createdAt: timestamp,
      updatedAt: timestamp
    };

    database.leads.push(lead);
    return lead;
  });
}

export async function listLeads() {
  const database = await readDatabase();
  return clone(sortNewest(database.leads));
}

export async function updateLeadStatus(id, status) {
  return updateDatabase((database) => {
    const lead = database.leads.find((item) => item._id === id);

    if (!lead) {
      return null;
    }

    lead.status = status;
    lead.updatedAt = now();
    return lead;
  });
}

export async function findMessageById(id) {
  const database = await readDatabase();
  return clone(database.messages.find((item) => item._id === id) || null);
}

export async function createMessage(payload) {
  return updateDatabase((database) => {
    const timestamp = now();
    const message = {
      _id: randomUUID(),
      lead: payload.lead,
      name: payload.name,
      email: payload.email.toLowerCase(),
      subject: payload.subject,
      body: payload.body,
      isRead: false,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    database.messages.push(message);
    return message;
  });
}

export async function listMessages() {
  const database = await readDatabase();
  return clone(sortNewest(database.messages));
}

export async function updateMessage(id, updates) {
  return updateDatabase((database) => {
    const message = database.messages.find((item) => item._id === id);

    if (!message) {
      return null;
    }

    Object.assign(message, updates, { updatedAt: now() });
    return message;
  });
}

export async function nextQuoteReference(year) {
  return updateDatabase((database) => {
    const prefix = `VQ-${year}-`;
    const latest = database.quoteRequests.reduce((max, quoteRequest) => {
      const current = String(quoteRequest.quoteReference || "");

      if (!current.startsWith(prefix)) {
        return max;
      }

      const numericPart = Number(current.replace(prefix, ""));
      return Number.isFinite(numericPart) ? Math.max(max, numericPart) : max;
    }, 0);

    return `${prefix}${String(latest + 1).padStart(4, "0")}`;
  });
}

export async function createQuoteRequest(payload) {
  return updateDatabase((database) => {
    const timestamp = now();
    const quoteRequest = {
      _id: randomUUID(),
      quoteReference: payload.quoteReference,
      clientName: payload.clientName,
      email: payload.email.toLowerCase(),
      phone: payload.phone,
      address: payload.address || "",
      preferredDate: payload.preferredDate || "",
      preferredTime: payload.preferredTime || "",
      accessInstructions: payload.accessInstructions || "",
      parkingNotes: payload.parkingNotes || "",
      quoteNotes: payload.quoteNotes || "",
      status: payload.status || "new",
      quoteInput: payload.quoteInput,
      quoteResult: payload.quoteResult,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    database.quoteRequests.push(quoteRequest);
    return quoteRequest;
  });
}

export async function listQuoteRequests() {
  const database = await readDatabase();
  return clone(sortNewest(database.quoteRequests));
}

export async function findQuoteRequestById(id) {
  const database = await readDatabase();
  return clone(database.quoteRequests.find((quoteRequest) => quoteRequest._id === id) || null);
}

export async function updateQuoteRequest(id, updates) {
  return updateDatabase((database) => {
    const quoteRequest = database.quoteRequests.find((item) => item._id === id);

    if (!quoteRequest) {
      return null;
    }

    Object.assign(quoteRequest, updates, { updatedAt: now() });
    return quoteRequest;
  });
}

export async function findBookingById(id) {
  const database = await readDatabase();
  return clone(database.bookings.find((item) => item._id === id) || null);
}

export async function nextBookingNumber(year) {
  return updateDatabase((database) => {
    const prefix = `VEL-${year}-`;
    const latest = database.bookings.reduce((max, booking) => {
      const current = String(booking.bookingNumber || "");

      if (!current.startsWith(prefix)) {
        return max;
      }

      const numericPart = Number(current.replace(prefix, ""));
      return Number.isFinite(numericPart) ? Math.max(max, numericPart) : max;
    }, 0);

    return `${prefix}${String(latest + 1).padStart(4, "0")}`;
  });
}

export async function createBooking(payload) {
  return updateDatabase((database) => {
    const timestamp = now();
    const booking = {
      _id: randomUUID(),
      lead: payload.lead || null,
      bookingNumber: payload.bookingNumber || "",
      clientName: payload.clientName,
      email: payload.email.toLowerCase(),
      phone: payload.phone || "",
      service: payload.service,
      address: payload.address,
      scheduledFor: payload.scheduledFor instanceof Date ? payload.scheduledFor.toISOString() : payload.scheduledFor,
      durationMinutes: payload.durationMinutes || 120,
      status: payload.status || "scheduled",
      communicationPreference: payload.communicationPreference || "email",
      assignedEmployees: payload.assignedEmployees || [],
      accessInstructions: payload.accessInstructions || "",
      parkingNotes: payload.parkingNotes || "",
      notes: payload.notes || "",
      communicationLog: payload.communicationLog || [],
      createdBy: payload.createdBy || null,
      leadSnapshot: payload.leadSnapshot || null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    database.bookings.push(booking);
    return booking;
  });
}

export async function listBookings() {
  const database = await readDatabase();
  return clone(
    [...database.bookings]
      .filter((booking) => !booking.deletedAt)
      .sort((a, b) => {
        const bySchedule = new Date(a.scheduledFor || 0) - new Date(b.scheduledFor || 0);
        return bySchedule || new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      })
  );
}

export async function listDeletedBookings() {
  const database = await readDatabase();
  return clone(
    [...database.bookings]
      .filter((booking) => booking.deletedAt)
      .sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0))
  );
}

export async function updateBooking(id, updates) {
  return updateDatabase((database) => {
    const booking = database.bookings.find((item) => item._id === id);

    if (!booking) {
      return null;
    }

    Object.assign(booking, updates, { updatedAt: now() });
    return booking;
  });
}

export async function softDeleteBooking(id, deletedBy = null) {
  return updateDatabase((database) => {
    const booking = database.bookings.find((item) => item._id === id && !item.deletedAt);

    if (!booking) {
      return null;
    }

    booking.deletedAt = now();
    booking.deletedBy = deletedBy;
    booking.updatedAt = now();
    return booking;
  });
}

export async function restoreBooking(id) {
  return updateDatabase((database) => {
    const booking = database.bookings.find((item) => item._id === id && item.deletedAt);

    if (!booking) {
      return null;
    }

    booking.deletedAt = null;
    booking.deletedBy = null;
    booking.updatedAt = now();
    return booking;
  });
}

export async function nextInvoiceNumber(year) {
  return updateDatabase((database) => {
    const prefix = `INV-${year}-`;
    const latest = database.invoices.reduce((max, invoice) => {
      const current = String(invoice.invoiceNumber || "");

      if (!current.startsWith(prefix)) {
        return max;
      }

      const numericPart = Number(current.replace(prefix, ""));
      return Number.isFinite(numericPart) ? Math.max(max, numericPart) : max;
    }, 0);

    return `${prefix}${String(latest + 1).padStart(4, "0")}`;
  });
}

export async function createInvoice(payload) {
  return updateDatabase((database) => {
    const timestamp = now();
    const invoice = {
      _id: randomUUID(),
      booking: payload.booking,
      invoiceNumber: payload.invoiceNumber,
      bookingReference: payload.bookingReference || "",
      status: payload.status || "draft",
      clientName: payload.clientName,
      email: payload.email.toLowerCase(),
      phone: payload.phone || "",
      billingAddress: payload.billingAddress,
      service: payload.service,
      bookingDate: payload.bookingDate instanceof Date ? payload.bookingDate.toISOString() : payload.bookingDate,
      issueDate: payload.issueDate instanceof Date ? payload.issueDate.toISOString() : payload.issueDate,
      dueDate: payload.dueDate instanceof Date ? payload.dueDate.toISOString() : payload.dueDate,
      currency: payload.currency || "GBP",
      lineItems: payload.lineItems || [],
      subtotal: payload.subtotal || 0,
      vatTotal: payload.vatTotal || 0,
      total: payload.total || 0,
      paymentInstructions: payload.paymentInstructions || "",
      notes: payload.notes || "",
      createdBy: payload.createdBy || null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    database.invoices.push(invoice);
    return invoice;
  });
}

export async function listInvoices() {
  const database = await readDatabase();
  return clone(sortNewest(database.invoices));
}

export async function findInvoiceById(id) {
  const database = await readDatabase();
  return clone(database.invoices.find((invoice) => invoice._id === id) || null);
}

export async function updateInvoice(id, updates) {
  return updateDatabase((database) => {
    const invoice = database.invoices.find((item) => item._id === id);

    if (!invoice) {
      return null;
    }

    Object.assign(invoice, updates, { updatedAt: now() });
    return invoice;
  });
}

export async function findEmployeeById(id) {
  const database = await readDatabase();
  return clone(database.employees.find((employee) => employee._id === id) || null);
}

export async function listEmployees() {
  const database = await readDatabase();
  return clone(
    [...database.employees].sort((a, b) => {
      const byStatus = String(a.status || "").localeCompare(String(b.status || ""));
      return byStatus || String(a.name || "").localeCompare(String(b.name || ""));
    })
  );
}

export async function createEmployee(payload) {
  return updateDatabase((database) => {
    const timestamp = now();
    const employee = {
      _id: randomUUID(),
      name: payload.name,
      email: payload.email ? payload.email.toLowerCase() : "",
      phone: payload.phone || "",
      role: payload.role || "Cleaner",
      status: payload.status || "active",
      skills: payload.skills || [],
      availabilityNotes: payload.availabilityNotes || "",
      createdBy: payload.createdBy || null,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    database.employees.push(employee);
    return employee;
  });
}

export async function updateEmployee(id, updates) {
  return updateDatabase((database) => {
    const employee = database.employees.find((item) => item._id === id);

    if (!employee) {
      return null;
    }

    Object.assign(employee, updates, { updatedAt: now() });
    return employee;
  });
}

export async function deleteEmployee(id) {
  return updateDatabase((database) => {
    const index = database.employees.findIndex((item) => item._id === id);

    if (index === -1) {
      return null;
    }

    const [employee] = database.employees.splice(index, 1);
    database.bookings.forEach((booking) => {
      booking.assignedEmployees = (booking.assignedEmployees || []).filter((employeeId) => employeeId !== id);
      booking.updatedAt = now();
    });
    return employee;
  });
}

export async function listReviews(placeId) {
  const database = await readDatabase();
  return clone(
    database.reviews
      .filter((review) => !placeId || review.placeId === placeId)
      .sort((a, b) => new Date(b.publishTime || b.createdAt || 0) - new Date(a.publishTime || a.createdAt || 0))
      .slice(0, 5)
  );
}

export async function findLatestReview(placeId) {
  const database = await readDatabase();
  const latest = database.reviews
    .filter((review) => review.placeId === placeId)
    .sort((a, b) => new Date(b.fetchedAt || 0) - new Date(a.fetchedAt || 0))[0];

  return clone(latest || null);
}

export async function upsertReviews(records) {
  return updateDatabase((database) => {
    for (const record of records) {
      const existing = database.reviews.find((review) => review.googleReviewName === record.googleReviewName);

      if (existing) {
        Object.assign(existing, record, { updatedAt: now() });
      } else {
        database.reviews.push({
          _id: randomUUID(),
          ...record,
          createdAt: now(),
          updatedAt: now()
        });
      }
    }

    return records;
  });
}

export async function createAuditEvent(payload) {
  return updateDatabase((database) => {
    const timestamp = now();
    const auditEvent = {
      _id: randomUUID(),
      ...payload,
      expiresAt: payload.expiresAt instanceof Date ? payload.expiresAt.toISOString() : payload.expiresAt,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    database.auditEvents.push(auditEvent);
    return auditEvent;
  });
}

export async function listAuditEvents({ limit = 100 } = {}) {
  const database = await readDatabase();
  const currentTime = Date.now();

  return clone(
    sortNewest(database.auditEvents)
      .filter((event) => !event.expiresAt || new Date(event.expiresAt).getTime() > currentTime)
      .slice(0, limit)
  );
}
