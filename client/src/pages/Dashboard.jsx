import {
  Calculator,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  CheckCircle2,
  Download,
  Edit3,
  FileText,
  History,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  TriangleAlert,
  UserPlus,
  UsersRound,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiClient, buildApiUrl, getApiError } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const tabs = [
  { key: "leads", label: "Inquiries" },
  { key: "quotes", label: "Quote review" },
  { key: "bookings", label: "Bookings" },
  { key: "invoices", label: "Invoices" },
  { key: "employees", label: "Employees" },
  { key: "pricing", label: "Pricing" },
  { key: "reviews", label: "Reviews" },
  { key: "users", label: "Accounts" },
  { key: "audit", label: "Audit" },
  { key: "governance", label: "Governance" }
];

const initialManagerForm = {
  name: "",
  email: "",
  password: "",
  role: "user"
};

const initialPasswordForm = {
  currentPassword: "",
  newPassword: ""
};

const initialEmployeeForm = {
  name: "",
  email: "",
  phone: "",
  role: "Cleaner",
  status: "active",
  skills: "",
  availabilityNotes: ""
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const bookingTimeZone = "Europe/London";

function zonedDateParts(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: bookingTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
      .formatToParts(date)
      .filter((part) => ["year", "month", "day"].includes(part.type))
      .map((part) => [part.type, part.value])
  );
}

function formatDateTimeInput(value = new Date()) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function createInitialBookingForm() {
  const tomorrowMorning = new Date();
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(9, 0, 0, 0);

  return {
    leadId: "",
    clientName: "",
    email: "",
    phone: "",
    service: "",
    address: "",
    scheduledFor: formatDateTimeInput(tomorrowMorning),
    durationMinutes: "120",
    communicationPreference: "email",
    assignedEmployeeIds: [],
    accessInstructions: "",
    parkingNotes: "",
    notes: "",
    sendConfirmation: true
  };
}

function bookingToForm(booking) {
  return {
    leadId: typeof booking.lead === "object" ? booking.lead?._id || "" : booking.lead || "",
    clientName: booking.clientName || "",
    email: booking.email || "",
    phone: booking.phone || "",
    service: booking.service || "",
    address: booking.address || "",
    scheduledFor: formatDateTimeInput(booking.scheduledFor),
    durationMinutes: String(booking.durationMinutes || 120),
    communicationPreference: booking.communicationPreference || "email",
    assignedEmployeeIds: (booking.assignedEmployees || []).map((employee) => (typeof employee === "object" ? employee._id : employee)),
    accessInstructions: booking.accessInstructions || "",
    parkingNotes: booking.parkingNotes || "",
    notes: booking.notes || "",
    sendConfirmation: false
  };
}

function quoteRequestToBookingForm(quoteRequest) {
  const quote = quoteRequest.quoteResult || {};
  const input = quoteRequest.quoteInput || {};
  const preferredDate = quoteRequest.preferredDate || "";
  const preferredTime = quoteRequest.preferredTime || "09:00";
  const preferredDateTime = preferredDate ? `${preferredDate}T${preferredTime}` : createInitialBookingForm().scheduledFor;
  const guidePrice = quote.displayPrice ? `Guide price: ${quote.displayPrice}` : "";
  const quoteScope = [quote.serviceLabel || input.serviceType, quote.propertyLabel].filter(Boolean).join(" - ");
  const notes = [
    `Created from quote ${quoteRequest.quoteReference}.`,
    guidePrice,
    quoteScope ? `Scope: ${quoteScope}` : "",
    quoteRequest.quoteNotes ? `Client notes: ${quoteRequest.quoteNotes}` : ""
  ].filter(Boolean);

  return {
    ...createInitialBookingForm(),
    clientName: quoteRequest.clientName || "",
    email: quoteRequest.email || "",
    phone: quoteRequest.phone || "",
    service: quote.serviceLabel || input.serviceType || "",
    address: quoteRequest.address || "",
    scheduledFor: preferredDateTime,
    accessInstructions: quoteRequest.accessInstructions || "",
    parkingNotes: quoteRequest.parkingNotes || "",
    notes: notes.join("\n"),
    sendConfirmation: false
  };
}

function startOfMonth(value) {
  const date = new Date(value);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addMonths(value, amount) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + amount);
  return startOfMonth(date);
}

function dateKey(value) {
  const parts = zonedDateParts(value);

  if (!parts) {
    return "";
  }

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function buildCalendarDays(monthDate) {
  const firstDay = startOfMonth(monthDate);
  const gridStart = new Date(firstDay);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  gridStart.setDate(firstDay.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });
}

function monthLabel(value) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: bookingTimeZone
  }).format(value);
}

function shortDateLabel(value) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: bookingTimeZone
  }).format(value);
}

function formatBookingTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: bookingTimeZone
  });
}

function formatDateInput(value = new Date()) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function createInitialInvoiceForm() {
  const today = new Date();

  return {
    bookingId: "",
    issueDate: formatDateInput(today),
    dueDate: formatDateInput(addDays(today, 14)),
    status: "draft",
    paymentInstructions:
      "Please pay by bank transfer to the Velura Services Tide account. Use the invoice number as the payment reference.",
    notes: "",
    lineItems: [{ description: "", quantity: "1", unitPrice: "", vatRate: "0" }]
  };
}

function formatCurrency(value, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency
  }).format(Number(value) || 0);
}

function calculateInvoiceTotals(lineItems = []) {
  return lineItems.reduce(
    (totals, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const vatRate = Number(item.vatRate) || 0;
      const amount = quantity * unitPrice;
      const vat = amount * (vatRate / 100);

      return {
        subtotal: totals.subtotal + amount,
        vatTotal: totals.vatTotal + vat,
        total: totals.total + amount + vat
      };
    },
    { subtotal: 0, vatTotal: 0, total: 0 }
  );
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

function bookingAssignedCleaners(booking, employees = []) {
  return (booking?.assignedEmployees || [])
    .map((employee) => {
      if (employee && typeof employee === "object") {
        return employee;
      }

      return employees.find((item) => item._id === employee) || { _id: employee, name: employee };
    })
    .filter(Boolean);
}

function bookingCleanerEmails(booking, employees = []) {
  return bookingAssignedCleaners(booking, employees).filter((employee) => employee?.email);
}

function recordUserId(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
}

function recordUserLabel(value, users = []) {
  if (!value) {
    return "Unassigned";
  }

  if (typeof value === "object") {
    return value.name || value.email || "Assigned manager";
  }

  const match = users.find((account) => recordUserId(account) === recordUserId(value));
  return match?.name || match?.email || "Assigned manager";
}

function isOwnedByCurrentUser(record, user) {
  const owner = recordUserId(record?.assignedManager);
  return Boolean(owner && owner === recordUserId(user));
}

function isOwnedByAnotherUser(record, user) {
  const owner = recordUserId(record?.assignedManager);
  return Boolean(owner && owner !== recordUserId(user));
}

function communicationStatusLabel(value = "new") {
  return String(value || "new").replace(/_/g, " ");
}

function OwnershipBadge({ record, users = [] }) {
  const hasOwner = Boolean(recordUserId(record?.assignedManager));
  const label = recordUserLabel(record?.assignedManager, users);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${
        hasOwner ? "bg-coal text-white" : "bg-stone-100 text-stone-600"
      }`}
    >
      <ShieldCheck size={13} aria-hidden="true" />
      {hasOwner ? `Owned by ${label}` : "Unassigned"}
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("leads");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [deletedBookings, setDeletedBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [googleReviews, setGoogleReviews] = useState([]);
  const [reviewsMeta, setReviewsMeta] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [governance, setGovernance] = useState(null);
  const [quoteAction, setQuoteAction] = useState("idle");
  const [bookingForm, setBookingForm] = useState(() => createInitialBookingForm());
  const [bookingStatus, setBookingStatus] = useState("idle");
  const [bookingAction, setBookingAction] = useState("idle");
  const [editingBookingId, setEditingBookingId] = useState("");
  const [bookingFocus, setBookingFocus] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState(() => createInitialInvoiceForm());
  const [invoiceStatus, setInvoiceStatus] = useState("idle");
  const [invoiceAction, setInvoiceAction] = useState("idle");
  const [reviewAction, setReviewAction] = useState("idle");
  const [managerForm, setManagerForm] = useState(initialManagerForm);
  const [managerStatus, setManagerStatus] = useState("idle");
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [passwordStatus, setPasswordStatus] = useState("idle");
  const [resetPasswordForms, setResetPasswordForms] = useState({});
  const [resetPasswordStatus, setResetPasswordStatus] = useState({});
  const [employeeForm, setEmployeeForm] = useState(initialEmployeeForm);
  const [employeeStatus, setEmployeeStatus] = useState("idle");

  const isAdmin = user?.role === "admin";

  function showToast(message, type = "success") {
    const id = Date.now();
    setToast({ id, message, type });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4200);
  }

  async function loadBookingRecords({ keepBooking } = {}) {
    const cacheBuster = Date.now();
    const [bookingsResponse, deletedBookingsResponse] = await Promise.all([
      apiClient.get("/bookings", { params: { _: cacheBuster } }),
      apiClient.get("/bookings/deleted", { params: { _: cacheBuster } })
    ]);

    const activeBookings = bookingsResponse.data.bookings || [];
    const visibleBookings = keepBooking
      ? [
          ...activeBookings.filter((booking) => booking._id !== keepBooking._id),
          keepBooking
        ].sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
      : activeBookings;

    setBookings(visibleBookings);
    setDeletedBookings(deletedBookingsResponse.data.bookings || []);
  }

  function focusBookingOnCalendar(booking) {
    if (!booking?.scheduledFor) {
      return;
    }

    setBookingFocus({
      id: booking._id,
      date: booking.scheduledFor,
      updatedAt: Date.now()
    });
  }

  async function loadInvoiceRecords() {
    const { data } = await apiClient.get("/invoices");
    setInvoices(data.invoices || []);
  }

  async function loadEmployeeRecords() {
    const { data } = await apiClient.get("/employees");
    setEmployees(data.employees || []);
  }

  async function loadDashboard() {
    setStatus("loading");
    setError("");

    try {
      if (!isAdmin) {
        setStatus("ready");
        return;
      }

      const [
        usersResponse,
        leadsResponse,
        bookingsResponse,
        deletedBookingsResponse,
        invoicesResponse,
        employeesResponse,
        pricingResponse,
        quoteRequestsResponse,
        reviewsResponse,
        auditResponse,
        governanceResponse
      ] = await Promise.all([
        apiClient.get("/users"),
        apiClient.get("/leads"),
        apiClient.get("/bookings"),
        apiClient.get("/bookings/deleted"),
        apiClient.get("/invoices"),
        apiClient.get("/employees"),
        apiClient.get("/quote/pricing"),
        apiClient.get("/quote/requests"),
        apiClient.get("/reviews"),
        apiClient.get("/audit?limit=100"),
        apiClient.get("/governance")
      ]);

      setUsers(usersResponse.data.users || []);
      setLeads(leadsResponse.data.leads || []);
      setBookings(bookingsResponse.data.bookings || []);
      setDeletedBookings(deletedBookingsResponse.data.bookings || []);
      setInvoices(invoicesResponse.data.invoices || []);
      setEmployees(employeesResponse.data.employees || []);
      setPricing(pricingResponse.data.pricing || null);
      setQuoteRequests(quoteRequestsResponse.data.quoteRequests || []);
      setGoogleReviews(reviewsResponse.data.reviews || []);
      setReviewsMeta(reviewsResponse.data.meta || null);
      setAuditEvents(auditResponse.data.auditEvents || []);
      setGovernance(governanceResponse.data.governance || null);
      setStatus("ready");
    } catch (requestError) {
      setError(getApiError(requestError, "Dashboard data could not be loaded."));
      setStatus("error");
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [isAdmin]);

  const stats = useMemo(
    () => [
      { label: "Managers", value: users.filter((account) => account.role === "admin").length, icon: UsersRound, tone: "leaf" },
      { label: "Inquiries", value: leads.length, icon: ClipboardList, tone: "coral" },
      { label: "Bookings", value: bookings.length, icon: CalendarCheck, tone: "leaf" },
      { label: "Invoices", value: invoices.length, icon: FileText, tone: "coal" },
      { label: "Deleted", value: deletedBookings.length, icon: Trash2, tone: "berry" },
      { label: "Cleaners", value: employees.length, icon: UsersRound, tone: "coral" },
      { label: "Quote reviews", value: quoteRequests.filter((quoteRequest) => activeQuoteStatuses.includes(quoteRequest.status)).length, icon: Mail, tone: "berry" },
      { label: "Google rating", value: reviewsMeta?.averageRating ? Number(reviewsMeta.averageRating).toFixed(1) : "N/A", icon: Star, tone: "coal" },
      { label: "Audit events", value: auditEvents.length, icon: History, tone: "leaf" }
    ],
    [auditEvents.length, bookings.length, deletedBookings.length, employees.length, invoices.length, leads.length, quoteRequests.length, reviewsMeta, users]
  );

  async function updateLeadStatus(leadId, nextStatus) {
    const previous = leads;
    setLeads((current) => current.map((lead) => (lead._id === leadId ? { ...lead, status: nextStatus } : lead)));

    try {
      const { data } = await apiClient.patch(`/leads/${leadId}/status`, { status: nextStatus });
      setLeads((current) => current.map((lead) => (lead._id === leadId ? data.lead : lead)));
      await loadAuditEvents();
    } catch (requestError) {
      setLeads(previous);
      setError(getApiError(requestError, "Inquiry status could not be updated."));
    }
  }

  function updateBookingForm(event) {
    const { checked, name, type, value } = event.target;

    if (name === "assignedEmployeeIds") {
      setBookingForm((current) => ({
        ...current,
        assignedEmployeeIds: checked
          ? [...current.assignedEmployeeIds, value]
          : current.assignedEmployeeIds.filter((employeeId) => employeeId !== value)
      }));
      return;
    }

    if (name === "leadId") {
      const selectedLead = leads.find((lead) => lead._id === value);

      setBookingForm((current) => ({
        ...current,
        leadId: value,
        clientName: selectedLead?.name || current.clientName,
        email: selectedLead?.email || current.email,
        phone: selectedLead?.phone || current.phone,
        service: selectedLead?.service || current.service,
        notes: selectedLead?.message ? selectedLead.message : current.notes
      }));
      return;
    }

    setBookingForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  function selectBookingDate(date) {
    setBookingForm((current) => {
      const currentDateTime = new Date(current.scheduledFor || new Date());
      const nextDateTime = new Date(date);
      const hours = Number.isNaN(currentDateTime.getTime()) ? 9 : currentDateTime.getHours();
      const minutes = Number.isNaN(currentDateTime.getTime()) ? 0 : currentDateTime.getMinutes();

      nextDateTime.setHours(hours, minutes, 0, 0);

      return {
        ...current,
        scheduledFor: formatDateTimeInput(nextDateTime)
      };
    });
  }

  function startEditingBooking(booking) {
    setEditingBookingId(booking._id);
    setBookingStatus("idle");
    setError("");
    setBookingForm(bookingToForm(booking));
  }

  function cancelBookingEdit() {
    setEditingBookingId("");
    setBookingStatus("idle");
    setBookingForm(createInitialBookingForm());
  }

  async function createBooking(event) {
    event.preventDefault();
    setError("");
    setBookingStatus("submitting");

    try {
      const payload = {
        ...bookingForm,
        durationMinutes: Number(bookingForm.durationMinutes)
      };
      const { data } = editingBookingId
        ? await apiClient.patch(`/bookings/${editingBookingId}`, payload)
        : await apiClient.post("/bookings", payload);

      setBookings((current) =>
        editingBookingId
          ? current.map((booking) => (booking._id === editingBookingId ? data.booking : booking))
          : [data.booking, ...current]
      );
      focusBookingOnCalendar(data.booking);
      setBookingForm(createInitialBookingForm());
      setEditingBookingId("");
      setBookingStatus("success");
      await loadBookingRecords({ keepBooking: data.booking });
      await loadAuditEvents();
      showToast(editingBookingId ? "Booking updated." : "Booking saved to the calendar.");
    } catch (requestError) {
      setBookingStatus("error");
      const message = getApiError(requestError, editingBookingId ? "Booking could not be updated." : "Booking could not be created.");
      setError(message);
      showToast(message, "error");
    }
  }

  async function deleteBooking(bookingId) {
    if (!window.confirm("Move this booking to Recently deleted? You can restore it if this was a mistake.")) {
      return;
    }

    const previous = bookings;
    const previousDeleted = deletedBookings;
    const bookingToDelete = bookings.find((booking) => booking._id === bookingId);
    setError("");
    setBookingAction(`delete:${bookingId}`);
    setBookings((current) => current.filter((booking) => booking._id !== bookingId));

    try {
      const { data } = await apiClient.delete(`/bookings/${bookingId}`);
      const deletedBooking = data.booking || {
        ...bookingToDelete,
        deletedAt: new Date().toISOString()
      };

      setDeletedBookings((current) => [deletedBooking, ...current.filter((booking) => booking._id !== bookingId)]);
      await Promise.allSettled([loadBookingRecords(), loadAuditEvents()]);
      showToast("Booking moved to Recently deleted.");
    } catch (requestError) {
      setBookings(previous);
      setDeletedBookings(previousDeleted);
      const message = getApiError(requestError, "Booking could not be deleted.");
      setError(message);
      showToast(message, "error");
    } finally {
      setBookingAction("idle");
    }
  }

  async function restoreBooking(bookingId) {
    const previous = bookings;
    const previousDeleted = deletedBookings;
    const bookingToRestore = deletedBookings.find((booking) => booking._id === bookingId);
    setError("");
    setBookingAction(`restore:${bookingId}`);

    if (bookingToRestore) {
      const optimisticBooking = {
        ...bookingToRestore,
        deletedAt: null,
        deletedBy: null
      };

      focusBookingOnCalendar(optimisticBooking);
      setBookings((current) =>
        [...current.filter((booking) => booking._id !== bookingId), optimisticBooking].sort(
          (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
        )
      );
      setDeletedBookings((current) => current.filter((booking) => booking._id !== bookingId));
    }

    try {
      const { data } = await apiClient.post(`/bookings/${bookingId}/restore`);
      const restoredBooking = data.booking;

      focusBookingOnCalendar(restoredBooking);
      setBookings((current) =>
        [...current.filter((booking) => booking._id !== bookingId), restoredBooking].sort(
          (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
        )
      );
      setDeletedBookings((current) => current.filter((booking) => booking._id !== bookingId));
      await Promise.allSettled([loadBookingRecords(), loadAuditEvents()]);
      showToast("Booking restored to the calendar.");
    } catch (requestError) {
      setBookings(previous);
      setDeletedBookings(previousDeleted);
      const message = getApiError(requestError, "Booking could not be restored.");
      setError(message);
      showToast(message, "error");
    } finally {
      setBookingAction("idle");
    }
  }

  async function updateBookingStatus(bookingId, nextStatus) {
    const previous = bookings;
    setBookings((current) =>
      current.map((booking) => (booking._id === bookingId ? { ...booking, status: nextStatus } : booking))
    );

    try {
      const { data } = await apiClient.patch(`/bookings/${bookingId}/status`, {
        status: nextStatus,
        sendClientUpdate: true
      });
      setBookings((current) => current.map((booking) => (booking._id === bookingId ? data.booking : booking)));
      await loadAuditEvents();
      showToast(`Booking status updated to ${nextStatus}.`);
    } catch (requestError) {
      setBookings(previous);
      const message = getApiError(requestError, "Booking status could not be updated.");
      setError(message);
      showToast(message, "error");
    }
  }

  async function sendBookingEmailConfirmation(bookingId) {
    setError("");
    setBookingAction(`email:${bookingId}`);

    try {
      const { data } = await apiClient.post(`/bookings/${bookingId}/email-confirmation`);
      setBookings((current) => current.map((booking) => (booking._id === bookingId ? data.booking : booking)));
      await loadAuditEvents();
      showToast("Client confirmation email sent.");
    } catch (requestError) {
      const message = getApiError(requestError, "Email confirmation could not be sent.");
      setError(message);
      showToast(message, "error");
    } finally {
      setBookingAction("idle");
    }
  }

  async function sendBookingCleanerBrief(bookingId) {
    setError("");
    setBookingAction(`cleaners:${bookingId}`);

    try {
      const { data } = await apiClient.post(`/bookings/${bookingId}/cleaner-brief`);
      setBookings((current) => current.map((booking) => (booking._id === bookingId ? data.booking : booking)));
      await Promise.allSettled([loadBookingRecords(), loadAuditEvents()]);
      showToast("Cleaner job brief email sent.");
    } catch (requestError) {
      const message = getApiError(requestError, "Cleaner job brief could not be sent.");
      setError(message);
      showToast(message, "error");
    } finally {
      setBookingAction("idle");
    }
  }

  async function markBookingPhoneConfirmed(bookingId) {
    setError("");
    setBookingAction(`phone:${bookingId}`);

    try {
      const { data } = await apiClient.post(`/bookings/${bookingId}/phone-confirmation`, {
        detail: "Phone confirmation completed by manager."
      });
      setBookings((current) => current.map((booking) => (booking._id === bookingId ? data.booking : booking)));
      await loadAuditEvents();
      showToast("Phone confirmation recorded.");
    } catch (requestError) {
      const message = getApiError(requestError, "Phone confirmation could not be recorded.");
      setError(message);
      showToast(message, "error");
    } finally {
      setBookingAction("idle");
    }
  }

  async function updateBookingOwnership(booking, action) {
    if (action === "take" && isOwnedByAnotherUser(booking, user)) {
      const owner = recordUserLabel(booking.assignedManager, users);

      if (!window.confirm(`This booking is currently owned by ${owner}. Take it over?`)) {
        return;
      }
    }

    setError("");
    setBookingAction(`owner:${booking._id}`);

    try {
      const { data } = await apiClient.patch(`/bookings/${booking._id}/ownership`, { action });
      setBookings((current) => current.map((item) => (item._id === booking._id ? data.booking : item)));
      await loadAuditEvents();
      showToast(action === "take" ? "Booking ownership updated." : "Booking ownership released.");
    } catch (requestError) {
      const message = getApiError(requestError, "Booking ownership could not be updated.");
      setError(message);
      showToast(message, "error");
    } finally {
      setBookingAction("idle");
    }
  }

  function updateInvoiceForm(event) {
    const { name, value } = event.target;
    setInvoiceStatus("idle");

    if (name === "bookingId") {
      const selectedBooking = bookings.find((booking) => booking._id === value);

      setInvoiceForm((current) => ({
        ...current,
        bookingId: value,
        lineItems: current.lineItems.map((item, index) =>
          index === 0 && !item.description.trim()
            ? {
                ...item,
                description: selectedBooking ? `${selectedBooking.service} - ${bookingReference(selectedBooking)}` : item.description
              }
            : item
        )
      }));
      return;
    }

    setInvoiceForm((current) => ({ ...current, [name]: value }));
  }

  function updateInvoiceLineItem(index, field, value) {
    setInvoiceStatus("idle");
    setInvoiceForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    }));
  }

  function addInvoiceLineItem() {
    setInvoiceForm((current) => ({
      ...current,
      lineItems: [...current.lineItems, { description: "", quantity: "1", unitPrice: "", vatRate: "0" }]
    }));
  }

  function removeInvoiceLineItem(index) {
    setInvoiceForm((current) => ({
      ...current,
      lineItems: current.lineItems.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  async function createInvoice(event) {
    event.preventDefault();
    setError("");
    setInvoiceStatus("submitting");

    try {
      const payload = {
        ...invoiceForm,
        lineItems: invoiceForm.lineItems.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          vatRate: Number(item.vatRate)
        }))
      };
      const { data } = await apiClient.post("/invoices", payload);

      setInvoices((current) => [data.invoice, ...current]);
      setInvoiceForm(createInitialInvoiceForm());
      setInvoiceStatus("success");
      await Promise.allSettled([loadInvoiceRecords(), loadAuditEvents()]);
    } catch (requestError) {
      setInvoiceStatus("error");
      setError(getApiError(requestError, "Invoice could not be created."));
    }
  }

  async function updateInvoiceStatus(invoiceId, nextStatus) {
    const previous = invoices;
    setInvoices((current) =>
      current.map((invoice) => (invoice._id === invoiceId ? { ...invoice, status: nextStatus } : invoice))
    );

    try {
      const { data } = await apiClient.patch(`/invoices/${invoiceId}/status`, { status: nextStatus });
      setInvoices((current) => current.map((invoice) => (invoice._id === invoiceId ? data.invoice : invoice)));
      await loadAuditEvents();
    } catch (requestError) {
      setInvoices(previous);
      setError(getApiError(requestError, "Invoice status could not be updated."));
    }
  }

  async function downloadInvoicePdf(invoice) {
    setError("");
    setInvoiceAction(`pdf:${invoice._id}`);

    try {
      const { data } = await apiClient.post(`/invoices/${invoice._id}/download-ticket`);
      const url = buildApiUrl(`/invoices/${invoice._id}/pdf/direct?ticket=${encodeURIComponent(data.token)}`);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoiceNumber || "velura-invoice"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (requestError) {
      setError(getApiError(requestError, "Invoice PDF could not be downloaded."));
    } finally {
      setInvoiceAction("idle");
    }
  }

  async function refreshGoogleReviews() {
    setError("");
    setReviewAction("refreshing");

    try {
      const { data } = await apiClient.post("/reviews/refresh");
      setGoogleReviews(data.reviews || []);
      setReviewsMeta(data.meta || null);
    } catch (requestError) {
      setError(getApiError(requestError, "Google reviews could not be refreshed. Check the Places API key and Place ID."));
    } finally {
      setReviewAction("idle");
    }
  }

  async function updateUserRole(userId, nextRole) {
    const previous = users;
    setUsers((current) => current.map((account) => (account._id === userId ? { ...account, role: nextRole } : account)));

    try {
      const { data } = await apiClient.patch(`/users/${userId}`, { role: nextRole });
      setUsers((current) => current.map((account) => (account._id === userId ? data.user : account)));
      await loadAuditEvents();
    } catch (requestError) {
      setUsers(previous);
      setError(getApiError(requestError, "User role could not be updated."));
    }
  }

  function updateManagerForm(event) {
    const { name, value } = event.target;
    setManagerForm((current) => ({ ...current, [name]: value }));
  }

  function updatePasswordForm(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  }

  function updateResetPasswordForm(userId, value) {
    setResetPasswordForms((current) => ({ ...current, [userId]: value }));
  }

  async function createManager(event) {
    event.preventDefault();
    setError("");
    setManagerStatus("submitting");

    try {
      const { data } = await apiClient.post("/users", managerForm);
      setUsers((current) => [data.user, ...current]);
      setManagerForm(initialManagerForm);
      setManagerStatus("success");
      await loadAuditEvents();
    } catch (requestError) {
      setError(getApiError(requestError, "Account could not be created."));
      setManagerStatus("error");
    }
  }

  async function changeOwnPassword(event) {
    event.preventDefault();
    setError("");
    setPasswordStatus("submitting");

    try {
      await apiClient.patch("/auth/password", passwordForm);
      setPasswordForm(initialPasswordForm);
      setPasswordStatus("success");
      await loadAuditEvents();
    } catch (requestError) {
      setPasswordStatus("error");
      setError(getApiError(requestError, "Password could not be changed."));
    }
  }

  async function resetManagerPassword(userId) {
    const password = resetPasswordForms[userId] || "";

    if (password.length < 8) {
      setError("Temporary password must be at least 8 characters.");
      return;
    }

    setError("");
    setResetPasswordStatus((current) => ({ ...current, [userId]: "submitting" }));

    try {
      await apiClient.patch(`/users/${userId}/password`, { password });
      setResetPasswordForms((current) => ({ ...current, [userId]: "" }));
      setResetPasswordStatus((current) => ({ ...current, [userId]: "success" }));
      await loadAuditEvents();
    } catch (requestError) {
      setResetPasswordStatus((current) => ({ ...current, [userId]: "error" }));
      setError(getApiError(requestError, "Password could not be reset."));
    }
  }

  async function deleteManager(userId) {
    if (!window.confirm("Delete this account?")) {
      return;
    }

    const previous = users;
    setUsers((current) => current.filter((account) => account._id !== userId));
    setError("");

    try {
      await apiClient.delete(`/users/${userId}`);
      await loadAuditEvents();
    } catch (requestError) {
      setUsers(previous);
      setError(getApiError(requestError, "Account could not be deleted."));
    }
  }

  function updateEmployeeForm(event) {
    const { name, value } = event.target;
    setEmployeeStatus("idle");
    setEmployeeForm((current) => ({ ...current, [name]: value }));
  }

  async function createEmployee(event) {
    event.preventDefault();
    setError("");
    setEmployeeStatus("submitting");

    try {
      const payload = {
        ...employeeForm,
        name: employeeForm.name.trim(),
        email: employeeForm.email.trim(),
        phone: employeeForm.phone.trim(),
        role: employeeForm.role.trim() || "Cleaner",
        availabilityNotes: employeeForm.availabilityNotes.trim(),
        skills: employeeForm.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      };
      const { data } = await apiClient.post("/employees", payload);
      setEmployees((current) => [data.employee, ...current]);
      setEmployeeForm(initialEmployeeForm);
      setEmployeeStatus("success");
      await loadEmployeeRecords();
      await loadAuditEvents();
    } catch (requestError) {
      setError(getApiError(requestError, "Cleaner profile could not be created."));
      setEmployeeStatus("error");
    }
  }

  async function updateEmployeeStatus(employeeId, nextStatus) {
    const previous = employees;
    const target = employees.find((employee) => employee._id === employeeId);

    if (!target) {
      return;
    }

    setEmployees((current) => current.map((employee) => (employee._id === employeeId ? { ...employee, status: nextStatus } : employee)));

    try {
      const { data } = await apiClient.patch(`/employees/${employeeId}`, {
        ...target,
        status: nextStatus,
        skills: target.skills || []
      });
      setEmployees((current) => current.map((employee) => (employee._id === employeeId ? data.employee : employee)));
      await loadAuditEvents();
    } catch (requestError) {
      setEmployees(previous);
      setError(getApiError(requestError, "Cleaner status could not be updated."));
    }
  }

  async function deleteEmployee(employeeId) {
    if (!window.confirm("Delete this cleaner profile? They will be removed from assigned jobs.")) {
      return;
    }

    const previousEmployees = employees;
    const previousBookings = bookings;
    setEmployees((current) => current.filter((employee) => employee._id !== employeeId));
    setBookings((current) =>
      current.map((booking) => ({
        ...booking,
        assignedEmployees: (booking.assignedEmployees || []).filter((employee) =>
          typeof employee === "object" ? employee._id !== employeeId : employee !== employeeId
        )
      }))
    );

    try {
      await apiClient.delete(`/employees/${employeeId}`);
      await loadAuditEvents();
    } catch (requestError) {
      setEmployees(previousEmployees);
      setBookings(previousBookings);
      setError(getApiError(requestError, "Cleaner profile could not be deleted."));
    }
  }

  async function updateQuoteRequestStatus(quoteRequestId, nextStatus) {
    const previous = quoteRequests;
    setQuoteRequests((current) =>
      current.map((quoteRequest) => (quoteRequest._id === quoteRequestId ? { ...quoteRequest, status: nextStatus } : quoteRequest))
    );

    try {
      const { data } = await apiClient.patch(`/quote/requests/${quoteRequestId}/status`, { status: nextStatus });
      setQuoteRequests((current) =>
        current.map((quoteRequest) => (quoteRequest._id === quoteRequestId ? data.quoteRequest : quoteRequest))
      );
      await loadAuditEvents();
      showToast(`Quote ${data.quoteRequest.quoteReference} moved to ${quoteStatusLabel(nextStatus)}.`);
    } catch (requestError) {
      setQuoteRequests(previous);
      const message = getApiError(requestError, "Quote request could not be updated.");
      setError(message);
      showToast(message, "error");
    }
  }

  async function sendQuotePhotoRequest(quoteRequestId) {
    setError("");
    setQuoteAction(`photos:${quoteRequestId}`);

    try {
      const { data } = await apiClient.post(`/quote/requests/${quoteRequestId}/photo-request`);
      setQuoteRequests((current) =>
        current.map((quoteRequest) => (quoteRequest._id === quoteRequestId ? data.quoteRequest : quoteRequest))
      );
      await loadAuditEvents();
      showToast(`Photo request email sent to ${data.quoteRequest.clientName}.`);
    } catch (requestError) {
      const message = getApiError(requestError, "Photo request email could not be sent.");
      setError(message);
      showToast(message, "error");
    } finally {
      setQuoteAction("idle");
    }
  }

  async function updateQuoteOwnership(quoteRequest, action) {
    if (action === "take" && isOwnedByAnotherUser(quoteRequest, user)) {
      const owner = recordUserLabel(quoteRequest.assignedManager, users);

      if (!window.confirm(`This quote is currently owned by ${owner}. Take it over?`)) {
        return;
      }
    }

    setError("");
    setQuoteAction(`owner:${quoteRequest._id}`);

    try {
      const { data } = await apiClient.patch(`/quote/requests/${quoteRequest._id}/ownership`, { action });
      setQuoteRequests((current) =>
        current.map((item) => (item._id === quoteRequest._id ? data.quoteRequest : item))
      );
      await loadAuditEvents();
      showToast(action === "take" ? "Quote ownership updated." : "Quote ownership released.");
    } catch (requestError) {
      const message = getApiError(requestError, "Quote ownership could not be updated.");
      setError(message);
      showToast(message, "error");
    } finally {
      setQuoteAction("idle");
    }
  }

  function startBookingFromQuote(quoteRequest) {
    setBookingForm(quoteRequestToBookingForm(quoteRequest));
    setEditingBookingId("");
    setBookingStatus("idle");
    setError("");
    setActiveTab("bookings");
  }

  async function loadAuditEvents() {
    const { data } = await apiClient.get("/audit?limit=100");
    setAuditEvents(data.auditEvents || []);
  }

  if (!isAdmin) {
    return (
      <section className="section-shell py-14 sm:py-18">
        <div className="panel max-w-2xl p-6">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-amber-50 text-coral">
            <ShieldCheck size={24} aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold text-coal">Dashboard</h1>
          <p className="mt-3 text-stone-600">
            You are signed in as <span className="font-bold text-coal">{user?.name}</span>. Manager access is required
            to view Velura inquiries, quote requests, bookings, and team accounts.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell py-10 sm:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Velura admin</p>
          <h1 className="mt-3 text-4xl font-extrabold text-coal">Dashboard</h1>
          <p className="mt-3 text-stone-600">Manage inquiries, quote reviews, bookings, cleaners, account access, and review signals.</p>
        </div>
        <button className="button-secondary" onClick={loadDashboard} type="button" disabled={status === "loading"}>
          {status === "loading" ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <RefreshCw size={18} aria-hidden="true" />}
          Refresh
        </button>
      </div>

      {toast && <ActionToast toast={toast} onDismiss={() => setToast(null)} />}

      {error && <div className="mt-6 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-9">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-stone-200 bg-white p-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`rounded-lg px-3 py-3 text-sm font-extrabold capitalize transition ${
                activeTab === tab.key ? "bg-coal text-white" : "text-stone-600 hover:bg-mist hover:text-coal"
              }`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {status === "loading" ? (
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-white p-5 text-sm font-semibold text-stone-600 shadow-soft">
          <Loader2 className="animate-spin text-coral" size={20} aria-hidden="true" />
          Loading Velura records
        </div>
      ) : (
        <div className="mt-6">
          {activeTab === "leads" && <LeadTable leads={leads} onStatusChange={updateLeadStatus} />}
          {activeTab === "quotes" && (
            <QuoteReviewPanel
              actionStatus={quoteAction}
              currentUser={user}
              quoteRequests={quoteRequests}
              users={users}
              onCreateBooking={startBookingFromQuote}
              onOwnershipChange={updateQuoteOwnership}
              onPhotoRequest={sendQuotePhotoRequest}
              onStatusChange={updateQuoteRequestStatus}
            />
          )}
          {activeTab === "bookings" && (
            <BookingPanel
              actionStatus={bookingAction}
              bookings={bookings}
              currentUser={user}
              deletedBookings={deletedBookings}
              editingBookingId={editingBookingId}
              employees={employees}
              focusBooking={bookingFocus}
              leads={leads}
              form={bookingForm}
              status={bookingStatus}
              users={users}
              onCancelEdit={cancelBookingEdit}
              onChange={updateBookingForm}
              onDelete={deleteBooking}
              onDatePick={selectBookingDate}
              onEdit={startEditingBooking}
              onCleanerBrief={sendBookingCleanerBrief}
              onEmailConfirmation={sendBookingEmailConfirmation}
              onOwnershipChange={updateBookingOwnership}
              onPhoneConfirmation={markBookingPhoneConfirmed}
              onRestore={restoreBooking}
              onSubmit={createBooking}
              onStatusChange={updateBookingStatus}
            />
          )}
          {activeTab === "invoices" && (
            <InvoicePanel
              actionStatus={invoiceAction}
              bookings={bookings}
              form={invoiceForm}
              invoices={invoices}
              status={invoiceStatus}
              onAddLineItem={addInvoiceLineItem}
              onChange={updateInvoiceForm}
              onDownloadPdf={downloadInvoicePdf}
              onLineItemChange={updateInvoiceLineItem}
              onRemoveLineItem={removeInvoiceLineItem}
              onStatusChange={updateInvoiceStatus}
              onSubmit={createInvoice}
            />
          )}
          {activeTab === "employees" && (
            <EmployeePanel
              employees={employees}
              form={employeeForm}
              status={employeeStatus}
              onChange={updateEmployeeForm}
              onDelete={deleteEmployee}
              onStatusChange={updateEmployeeStatus}
              onSubmit={createEmployee}
            />
          )}
          {activeTab === "pricing" && <PricingPanel pricing={pricing} />}
          {activeTab === "reviews" && (
            <ReviewsPanel meta={reviewsMeta} reviews={googleReviews} status={reviewAction} onRefresh={refreshGoogleReviews} />
          )}
          {activeTab === "users" && (
            <div className="grid gap-6">
              <PasswordChangePanel
                form={passwordForm}
                status={passwordStatus}
                onChange={updatePasswordForm}
                onSubmit={changeOwnPassword}
              />
              <ManagerForm
                form={managerForm}
                status={managerStatus}
                onChange={updateManagerForm}
                onSubmit={createManager}
              />
              <UserTable
                users={users}
                currentUserId={user?._id}
                resetForms={resetPasswordForms}
                resetStatus={resetPasswordStatus}
                onDelete={deleteManager}
                onPasswordChange={updateResetPasswordForm}
                onPasswordReset={resetManagerPassword}
                onRoleChange={updateUserRole}
              />
            </div>
          )}
          {activeTab === "audit" && <AuditTable auditEvents={auditEvents} />}
          {activeTab === "governance" && <GovernancePanel governance={governance} />}
        </div>
      )}
    </section>
  );
}

function InvoicePanel({
  actionStatus,
  bookings,
  form,
  invoices,
  status,
  onAddLineItem,
  onChange,
  onDownloadPdf,
  onLineItemChange,
  onRemoveLineItem,
  onStatusChange,
  onSubmit
}) {
  const totals = calculateInvoiceTotals(form.lineItems);
  const selectedBooking = bookings.find((booking) => booking._id === form.bookingId);

  return (
    <div className="grid gap-6">
      <form className="panel grid gap-4 p-5" onSubmit={onSubmit}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="eyebrow">Manager only</p>
            <h2 className="mt-1 text-2xl font-extrabold text-coal">Create invoice</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-stone-500">
              Build a PDF invoice from a booking, save it to MongoDB, then upload or match the PDF inside Tide.
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-mist px-4 py-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-stone-500">Total preview</p>
            <p className="mt-1 text-2xl font-extrabold text-coal">{formatCurrency(totals.total)}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <label className="grid gap-2 text-sm font-bold text-coal lg:col-span-2">
            Booking
            <select className="input-field" name="bookingId" value={form.bookingId} onChange={onChange} required>
              <option value="">Choose booking</option>
              {bookings.map((booking) => (
                <option value={booking._id} key={booking._id}>
                  {bookingReference(booking)} - {booking.clientName} - {booking.service}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-coal">
            Issue date
            <input className="input-field" type="date" name="issueDate" value={form.issueDate} onChange={onChange} required />
          </label>
          <label className="grid gap-2 text-sm font-bold text-coal">
            Due date
            <input className="input-field" type="date" name="dueDate" value={form.dueDate} onChange={onChange} required />
          </label>
        </div>

        {selectedBooking && (
          <div className="rounded-lg border border-stone-200 bg-mist p-4 text-sm font-semibold text-stone-600">
            <p className="font-extrabold text-coal">{selectedBooking.clientName}</p>
            <p className="mt-1">
              {selectedBooking.email} {selectedBooking.phone ? `| ${selectedBooking.phone}` : ""}
            </p>
            <p className="mt-1">{selectedBooking.address}</p>
          </div>
        )}

        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-extrabold text-coal">Line items</h3>
            <button className="button-secondary px-3 py-2" type="button" onClick={onAddLineItem}>
              <Plus size={16} aria-hidden="true" />
              Add line
            </button>
          </div>

          {form.lineItems.map((item, index) => (
            <div className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 lg:grid-cols-[1fr_90px_120px_100px_auto]" key={index}>
              <label className="grid gap-2 text-sm font-bold text-coal">
                Description
                <input
                  className="input-field"
                  value={item.description}
                  onChange={(event) => onLineItemChange(index, "description", event.target.value)}
                  placeholder="Cleaning service"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-coal">
                Qty
                <input
                  className="input-field"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(event) => onLineItemChange(index, "quantity", event.target.value)}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-coal">
                Unit price
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(event) => onLineItemChange(index, "unitPrice", event.target.value)}
                  placeholder="0.00"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-coal">
                VAT %
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={item.vatRate}
                  onChange={(event) => onLineItemChange(index, "vatRate", event.target.value)}
                />
              </label>
              <button
                className="button-secondary self-end px-3 py-2 text-rose-700"
                type="button"
                onClick={() => onRemoveLineItem(index)}
                disabled={form.lineItems.length === 1}
              >
                <Trash2 size={16} aria-hidden="true" />
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-coal">
              Payment instructions
              <textarea
                className="input-field min-h-28 resize-none"
                name="paymentInstructions"
                value={form.paymentInstructions}
                onChange={onChange}
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-coal">
              Invoice notes
              <textarea className="input-field min-h-24 resize-none" name="notes" value={form.notes} onChange={onChange} />
            </label>
          </div>

          <div className="rounded-lg border border-stone-200 bg-mist p-4">
            <div className="grid gap-3 text-sm font-bold text-stone-600">
              <div className="flex justify-between gap-3">
                <span>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>VAT</span>
                <span>{formatCurrency(totals.vatTotal)}</span>
              </div>
              <div className="flex justify-between gap-3 border-t border-stone-300 pt-3 text-lg text-coal">
                <span>Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
            <button className="button-primary mt-5 w-full" type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <FileText size={18} aria-hidden="true" />}
              Create invoice
            </button>
          </div>
        </div>

        {status === "success" && (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            Invoice created and saved to MongoDB.
          </p>
        )}
        {status === "error" && (
          <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            Invoice could not be created. Check the message at the top of the dashboard.
          </p>
        )}
      </form>

      <section className="panel p-5">
        <div>
          <p className="eyebrow">Invoice records</p>
          <h2 className="mt-1 text-2xl font-extrabold text-coal">Saved invoices</h2>
          <p className="mt-2 text-sm font-semibold text-stone-500">
            Download a PDF for Tide, and update the status when it is sent, paid, or void.
          </p>
        </div>

        <div className="mt-5 grid gap-4">
          {invoices.map((invoice) => (
            <article className="rounded-lg border border-stone-200 bg-white p-4" key={invoice._id}>
              <div className="grid gap-4 lg:grid-cols-[1fr_160px_170px_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold text-coal">{invoice.invoiceNumber}</p>
                    <span className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-extrabold text-berry">
                      {invoice.bookingReference || "Booking"}
                    </span>
                    <StatusBadge value={invoice.status} />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-stone-600">
                    {invoice.clientName} - {invoice.service}
                  </p>
                  <p className="mt-1 text-xs font-bold text-stone-500">
                    Due {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-GB") : "not set"}
                  </p>
                </div>
                <p className="text-xl font-extrabold text-coal">{formatCurrency(invoice.total, invoice.currency || "GBP")}</p>
                <select
                  className="input-field"
                  value={invoice.status}
                  onChange={(event) => onStatusChange(invoice._id, event.target.value)}
                >
                  <option value="draft">draft</option>
                  <option value="sent">sent</option>
                  <option value="paid">paid</option>
                  <option value="void">void</option>
                </select>
                <button className="button-secondary px-3 py-2" type="button" onClick={() => onDownloadPdf(invoice)}>
                  {actionStatus === `pdf:${invoice._id}` ? (
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  ) : (
                    <Download size={16} aria-hidden="true" />
                  )}
                  PDF
                </button>
              </div>
            </article>
          ))}
          {invoices.length === 0 && (
            <div className="rounded-lg border border-dashed border-stone-300 bg-mist p-5 text-sm font-semibold text-stone-500">
              No invoices created yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EmployeePanel({ employees, form, status, onChange, onDelete, onStatusChange, onSubmit }) {
  return (
    <div className="grid gap-6">
      <form className="panel grid gap-4 p-5 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end" onSubmit={onSubmit}>
        <label className="grid gap-2 text-sm font-bold text-coal">
          Cleaner name
          <input className="input-field" name="name" value={form.name} onChange={onChange} required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-coal">
          Email
          <input className="input-field" type="email" name="email" value={form.email} onChange={onChange} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-coal">
          Phone
          <input className="input-field" name="phone" value={form.phone} onChange={onChange} />
        </label>
        <button className="button-primary" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <UserPlus size={18} aria-hidden="true" />}
          Add cleaner
        </button>
        <label className="grid gap-2 text-sm font-bold text-coal">
          Role
          <input className="input-field" name="role" value={form.role} onChange={onChange} />
        </label>
        <label className="grid gap-2 text-sm font-bold text-coal">
          Status
          <select className="input-field" name="status" value={form.status} onChange={onChange}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-coal lg:col-span-2">
          Skills
          <input className="input-field" name="skills" value={form.skills} onChange={onChange} placeholder="Deep clean, office, carpet, supervisor" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-coal lg:col-span-4">
          Availability notes
          <textarea
            className="input-field min-h-24 resize-none"
            name="availabilityNotes"
            value={form.availabilityNotes}
            onChange={onChange}
            placeholder="Working days, preferred areas, annual leave, school-run constraints, or commercial-only notes."
          />
        </label>
        {status === "success" && (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 lg:col-span-4">
            Cleaner added and saved to the database.
          </p>
        )}
        {status === "error" && (
          <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 lg:col-span-4">
            Cleaner could not be added. Check the message at the top of the dashboard.
          </p>
        )}
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        {employees.map((employee) => (
          <article className="panel p-5" key={employee._id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-lg font-extrabold text-coal">{employee.name}</p>
                <p className="text-sm font-semibold text-stone-500">{employee.role || "Cleaner"}</p>
              </div>
              <select
                className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700"
                value={employee.status}
                onChange={(event) => onStatusChange(employee._id, event.target.value)}
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
            <div className="mt-4 grid gap-2 text-sm font-semibold text-stone-600">
              {employee.email && <p>{employee.email}</p>}
              {employee.phone && <p>{employee.phone}</p>}
              {employee.skills?.length > 0 && <p>Skills: {employee.skills.join(", ")}</p>}
              {employee.availabilityNotes && <p>Availability: {employee.availabilityNotes}</p>}
            </div>
            <button className="button-secondary mt-4 px-3 py-2 text-rose-700" type="button" onClick={() => onDelete(employee._id)}>
              <Trash2 size={16} aria-hidden="true" />
              Delete cleaner
            </button>
          </article>
        ))}
        {employees.length === 0 && (
          <div className="panel p-6 text-sm font-semibold text-stone-500">No cleaners added yet.</div>
        )}
      </div>
    </div>
  );
}

function PricingPanel({ pricing }) {
  if (!pricing) {
    return (
      <div className="panel p-5">
        <div className="flex items-center gap-3 text-sm font-semibold text-stone-600">
          <Loader2 className="animate-spin text-coral" size={18} aria-hidden="true" />
          Loading pricing
        </div>
      </div>
    );
  }

  const conditions = Object.entries(pricing.conditionOptions || {});
  const urgency = Object.entries(pricing.urgencyOptions || {});
  const frequencies = Object.entries(pricing.frequencyOptions || {});

  return (
    <div className="grid gap-6">
      <section className="panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-coal text-white">
                <Calculator size={22} aria-hidden="true" />
              </div>
              <div>
                <p className="eyebrow">Manager only</p>
                <h2 className="text-2xl font-extrabold text-coal">Velura pricing list</h2>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-stone-600">{pricing.sourceNote}</p>
          </div>
          <div className="rounded-lg bg-mist px-4 py-3 text-sm font-extrabold text-coal">Version: {pricing.version}</div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(pricing.rules || []).map((rule) => (
            <div className="rounded-lg border border-stone-200 bg-white p-3 text-sm font-semibold leading-6 text-stone-600" key={rule}>
              {rule}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {(pricing.priceSections || []).map((section) => (
          <section className="panel overflow-hidden" key={`${section.serviceType}-${section.group}`}>
            <div className="border-b border-stone-200 bg-mist p-4">
              <h3 className="text-lg font-extrabold text-coal">{section.label}</h3>
            </div>
            <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
              <thead className="text-xs font-bold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Guide price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {(section.rows || []).map((row) => (
                  <tr key={`${section.label}-${row.bedrooms}`}>
                    <td className="px-4 py-3 font-bold text-coal">{row.bedrooms}</td>
                    <td className="px-4 py-3 font-semibold text-stone-700">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
        <section className="panel overflow-hidden">
          <div className="border-b border-stone-200 bg-mist p-4">
            <h3 className="text-lg font-extrabold text-coal">Add-ons</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
              <thead className="text-xs font-bold uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3">Add-on</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {(pricing.addOns || []).map((addOn) => (
                  <tr key={addOn.key}>
                    <td className="px-4 py-3 font-bold text-coal">{addOn.label}</td>
                    <td className="px-4 py-3 font-semibold capitalize text-stone-600">{addOn.category}</td>
                    <td className="px-4 py-3 font-semibold text-stone-600">{addOn.unit}</td>
                    <td className="px-4 py-3 font-semibold text-stone-700">{addOn.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel p-5">
          <h3 className="text-lg font-extrabold text-coal">Rules and inspection work</h3>
          <div className="mt-4 grid gap-4">
            <div>
              <p className="text-sm font-extrabold text-coal">Condition multipliers</p>
              <div className="mt-2 grid gap-2">
                {conditions.map(([key, condition]) => (
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-mist px-3 py-2 text-sm" key={key}>
                    <span className="font-bold text-stone-700">{condition.label}</span>
                    <span className="font-extrabold text-coal">
                      {condition.multiplier === 1 ? "Base" : `+${Math.round((condition.multiplier - 1) * 100)}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-extrabold text-coal">Scheduling</p>
              <div className="mt-2 grid gap-2">
                {urgency.map(([key, option]) => (
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-mist px-3 py-2 text-sm" key={key}>
                    <span className="font-bold text-stone-700">{option.label}</span>
                    <span className="font-extrabold text-coal">
                      {option.multiplier === 1 ? "Base" : `+${Math.round((option.multiplier - 1) * 100)}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-extrabold text-coal">Regular clean frequency</p>
              <div className="mt-2 grid gap-2">
                {frequencies.map(([key, option]) => (
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-mist px-3 py-2 text-sm" key={key}>
                    <span className="font-bold text-stone-700">{option.label}</span>
                    <span className="font-extrabold text-coal">{Math.round(option.multiplier * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-extrabold text-coal">Quoted on inspection</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(pricing.inspectionItems || []).map((item) => (
                  <span className="rounded-full bg-coal px-3 py-1 text-xs font-bold text-white" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReviewsPanel({ meta, reviews, status, onRefresh }) {
  const configured = Boolean(meta?.configured);
  const fetchedLabel = meta?.fetchedAt ? new Date(meta.fetchedAt).toLocaleString("en-GB") : "Not refreshed yet";

  return (
    <div className="grid gap-6">
      <section className="panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="eyebrow">Google Reviews</p>
            <h2 className="mt-1 text-2xl font-extrabold text-coal">Review connection</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-stone-500">
              Add the Google Places API key and Place ID in Render, then refresh here to cache the latest available reviews in MongoDB.
            </p>
          </div>
          <button className="button-primary" type="button" onClick={onRefresh} disabled={status === "refreshing" || !configured}>
            {status === "refreshing" ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <RefreshCw size={18} aria-hidden="true" />}
            Refresh reviews
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-stone-200 bg-mist p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-stone-500">Status</p>
            <p className="mt-2 text-lg font-extrabold text-coal">{configured ? "Connected" : "Not connected"}</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-mist p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-stone-500">Rating</p>
            <p className="mt-2 text-lg font-extrabold text-coal">
              {meta?.averageRating ? Number(meta.averageRating).toFixed(1) : "N/A"}
            </p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-mist p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-stone-500">Review count</p>
            <p className="mt-2 text-lg font-extrabold text-coal">{meta?.userRatingCount || "N/A"}</p>
          </div>
          <div className="rounded-lg border border-stone-200 bg-mist p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-stone-500">Last cached</p>
            <p className="mt-2 text-sm font-extrabold text-coal">{fetchedLabel}</p>
          </div>
        </div>

        {!configured && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
            Add `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID` to Render, then redeploy the API. Use only the Place ID value, not the full
            `places/...` path.
          </div>
        )}
      </section>

      <section className="panel p-5">
        <div>
          <p className="eyebrow">Cached reviews</p>
          <h2 className="mt-1 text-2xl font-extrabold text-coal">Latest Google review cards</h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((review) => (
            <article className="rounded-lg border border-stone-200 bg-white p-4" key={review._id || review.googleReviewName}>
              <div className="flex items-center gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} size={15} fill={index < Math.round(review.rating || 0) ? "currentColor" : "none"} aria-hidden="true" />
                ))}
              </div>
              <p className="mt-3 line-clamp-5 text-sm font-semibold leading-6 text-stone-600">
                {review.comment || "Rating submitted without a written comment."}
              </p>
              <p className="mt-4 font-extrabold text-coal">{review.authorName || "Google user"}</p>
              <p className="text-xs font-bold text-stone-500">{review.relativePublishTimeDescription || "Google review"}</p>
            </article>
          ))}
          {reviews.length === 0 && (
            <div className="rounded-lg border border-dashed border-stone-300 bg-mist p-5 text-sm font-semibold text-stone-500 md:col-span-2 xl:col-span-3">
              No cached Google reviews yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function LeadTable({ leads, onStatusChange }) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
          <thead className="bg-mist text-xs font-bold uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Inquiry</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {leads.map((lead) => (
              <tr key={lead._id}>
                <td className="px-4 py-4">
                  <p className="font-extrabold text-coal">{lead.name}</p>
                  <p className="text-stone-500">{lead.email}</p>
                  {lead.company && <p className="text-stone-500">{lead.company}</p>}
                </td>
                <td className="px-4 py-4 font-semibold text-stone-700">{lead.service}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={lead.status} />
                    <select
                      className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700"
                      value={lead.status}
                      onChange={(event) => onStatusChange(lead._id, event.target.value)}
                    >
                      <option value="new">new</option>
                      <option value="contacted">contacted</option>
                      <option value="closed">closed</option>
                    </select>
                  </div>
                </td>
                <td className="px-4 py-4 text-stone-500">{new Date(lead.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {leads.length === 0 && <EmptyRow label="No inquiries yet" columns={4} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BookingPanel({
  actionStatus,
  bookings,
  currentUser,
  deletedBookings,
  editingBookingId,
  employees,
  focusBooking,
  leads,
  form,
  status,
  users,
  onCancelEdit,
  onChange,
  onDelete,
  onDatePick,
  onEdit,
  onCleanerBrief,
  onEmailConfirmation,
  onOwnershipChange,
  onPhoneConfirmation,
  onRestore,
  onSubmit,
  onStatusChange
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [bookingSearch, setBookingSearch] = useState("");
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const selectedDateKey = dateKey(selectedDate);
  const normalizedSearch = bookingSearch.trim().toLowerCase();
  const bookingsByDate = useMemo(
    () =>
      bookings.reduce((grouped, booking) => {
        const key = dateKey(booking.scheduledFor);

        if (!key) {
          return grouped;
        }

        return {
          ...grouped,
          [key]: [...(grouped[key] || []), booking].sort(
            (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
          )
        };
      }, {}),
    [bookings]
  );
  const selectedBookings = bookingsByDate[selectedDateKey] || [];
  const searchResults = useMemo(() => {
    if (!normalizedSearch) {
      return [];
    }

    return bookings.filter((booking) =>
      [
        bookingReference(booking),
        booking.clientName,
        booking.email,
        booking.phone,
        booking.service,
        booking.address,
        booking.status
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    );
  }, [bookings, normalizedSearch]);

  useEffect(() => {
    if (!focusBooking?.date) {
      return;
    }

    const nextSelectedDate = new Date(focusBooking.date);

    if (Number.isNaN(nextSelectedDate.getTime())) {
      return;
    }

    setSelectedDate(nextSelectedDate);
    setVisibleMonth(startOfMonth(nextSelectedDate));
  }, [focusBooking]);

  function selectCalendarDay(day) {
    setSelectedDate(day);
    onDatePick(day);
  }

  return (
    <div className="grid gap-6">
      <section className="panel p-5">
        <label className="grid gap-2 text-sm font-bold text-coal">
          Search bookings
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-coral" size={18} aria-hidden="true" />
            <input
              className="input-field pl-11"
              value={bookingSearch}
              onChange={(event) => setBookingSearch(event.target.value)}
              placeholder="Search VEL-2026-0001, client name, email, phone, service, or address"
            />
          </div>
        </label>
      </section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <BookingCalendar
          bookingsByDate={bookingsByDate}
          days={calendarDays}
          selectedDate={selectedDate}
          visibleMonth={visibleMonth}
          onMonthChange={setVisibleMonth}
          onSelectDay={selectCalendarDay}
        />
        <SelectedDaySchedule
          actionStatus={actionStatus}
          bookings={normalizedSearch ? searchResults : selectedBookings}
          currentUser={currentUser}
          employees={employees}
          emptyLabel={normalizedSearch ? "No bookings match that search." : "No bookings on this date."}
          selectedDate={selectedDate}
          subtitle={normalizedSearch ? `${searchResults.length} matching booking${searchResults.length === 1 ? "" : "s"}` : ""}
          title={normalizedSearch ? "Search results" : ""}
          onDelete={onDelete}
          onEdit={onEdit}
          onCleanerBrief={onCleanerBrief}
          onEmailConfirmation={onEmailConfirmation}
          onOwnershipChange={onOwnershipChange}
          onPhoneConfirmation={onPhoneConfirmation}
          onStatusChange={onStatusChange}
          users={users}
        />
      </div>
      <BookingForm
        editingBookingId={editingBookingId}
        employees={employees}
        leads={leads}
        form={form}
        status={status}
        onCancelEdit={onCancelEdit}
        onChange={onChange}
        onSubmit={onSubmit}
      />
      <RecentlyDeletedBookings actionStatus={actionStatus} bookings={deletedBookings} onRestore={onRestore} />
    </div>
  );
}

function BookingCalendar({ bookingsByDate, days, selectedDate, visibleMonth, onMonthChange, onSelectDay }) {
  const todayKey = dateKey(new Date());
  const selectedKey = dateKey(selectedDate);

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Booking calendar</p>
          <h2 className="mt-1 text-2xl font-extrabold text-coal">{monthLabel(visibleMonth)}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Previous month"
            className="grid h-10 w-10 place-items-center rounded-lg border border-stone-200 bg-white text-coal transition hover:border-coral hover:text-berry"
            onClick={() => onMonthChange(addMonths(visibleMonth, -1))}
            title="Previous month"
            type="button"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            className="button-secondary px-4 py-2"
            onClick={() => onMonthChange(startOfMonth(new Date()))}
            type="button"
          >
            Today
          </button>
          <button
            aria-label="Next month"
            className="grid h-10 w-10 place-items-center rounded-lg border border-stone-200 bg-white text-coal transition hover:border-coral hover:text-berry"
            onClick={() => onMonthChange(addMonths(visibleMonth, 1))}
            title="Next month"
            type="button"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-stone-200 bg-mist text-center text-xs font-extrabold uppercase tracking-wide text-stone-500">
            {weekdayLabels.map((day) => (
              <div className="px-3 py-3" key={day}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = dateKey(day);
              const dayBookings = bookingsByDate[key] || [];
              const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
              const isSelected = key === selectedKey;
              const isToday = key === todayKey;

              return (
                <button
                  aria-label={`Select ${shortDateLabel(day)} ${day.getFullYear()}`}
                  className={`min-h-[122px] border-b border-r border-stone-200 p-2 text-left transition hover:bg-amber-50 ${
                    isSelected ? "bg-amber-50 ring-2 ring-inset ring-coral" : "bg-white"
                  } ${isCurrentMonth ? "text-coal" : "text-stone-400"}`}
                  key={key}
                  onClick={() => onSelectDay(day)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full text-sm font-extrabold ${
                        isToday ? "bg-coal text-white" : "bg-transparent"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="rounded-full bg-coral/20 px-2 py-0.5 text-xs font-extrabold text-berry">
                        {dayBookings.length}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 grid gap-1">
                    {dayBookings.slice(0, 3).map((booking) => (
                      <span
                        className={`truncate rounded-md px-2 py-1 text-xs font-bold ${calendarStatusClass(booking.status)}`}
                        key={booking._id}
                      >
                        {formatBookingTime(booking.scheduledFor)} {bookingReference(booking)} {booking.clientName}
                      </span>
                    ))}
                    {dayBookings.length > 3 && (
                      <span className="text-xs font-bold text-stone-500">+{dayBookings.length - 3} more</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function SelectedDaySchedule({
  actionStatus,
  bookings,
  currentUser,
  employees,
  emptyLabel = "No bookings on this date.",
  selectedDate,
  subtitle = "",
  title = "",
  onDelete,
  onEdit,
  onCleanerBrief,
  onEmailConfirmation,
  onOwnershipChange,
  onPhoneConfirmation,
  onStatusChange,
  users = []
}) {
  return (
    <section className="panel p-5">
      <p className="eyebrow">Selected day</p>
      <h2 className="mt-1 text-2xl font-extrabold text-coal">{title || shortDateLabel(selectedDate)}</h2>
      {subtitle && <p className="mt-2 text-sm font-semibold text-stone-500">{subtitle}</p>}
      <div className="mt-5 grid gap-3">
        {bookings.map((booking) => {
          const latestLog =
            booking.communicationLog && booking.communicationLog.length > 0
              ? booking.communicationLog[booking.communicationLog.length - 1]
              : null;
          const assignedCleaners = bookingAssignedCleaners(booking, employees);
          const cleanerEmailCount = bookingCleanerEmails(booking, employees).length;
          const ownedByMe = isOwnedByCurrentUser(booking, currentUser);
          const ownedBySomeoneElse = isOwnedByAnotherUser(booking, currentUser);

          return (
            <article className="rounded-lg border border-stone-200 bg-white p-4" key={booking._id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-extrabold text-coal">{booking.clientName}</p>
                    <span className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-extrabold text-berry">
                      {bookingReference(booking)}
                    </span>
                    <StatusBadge value={booking.status} />
                    <OwnershipBadge record={booking} users={users} />
                  </div>
                  <p className="mt-1 font-semibold text-stone-600">{booking.service}</p>
                </div>
                <select
                  className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700"
                  value={booking.status}
                  onChange={(event) => onStatusChange(booking._id, event.target.value)}
                >
                  <option value="scheduled">scheduled</option>
                  <option value="confirmed">confirmed</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-stone-600">
                <p className="flex items-center gap-2">
                  <Clock size={16} className="text-coral" aria-hidden="true" />
                  <span>
                    {formatBookingTime(booking.scheduledFor)} for {booking.durationMinutes} minutes
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-coral" aria-hidden="true" />
                  <span>{booking.address}</span>
                </p>
                <p className="font-semibold text-stone-500">
                  {booking.communicationPreference || "email"}:{" "}
                  {latestLog ? `${latestLog.status} - ${latestLog.detail}` : "No update sent yet"}
                </p>
                <p className="font-semibold text-stone-500">
                  Client thread: {communicationStatusLabel(booking.communicationStatus)}
                  {booking.lastClientContactedAt
                    ? ` - last contacted ${new Date(booking.lastClientContactedAt).toLocaleString("en-GB")}`
                    : ""}
                </p>
                {assignedCleaners.length > 0 && (
                  <p className="font-semibold text-stone-500">
                    Cleaners: {assignedCleaners.map((employee) => employee.name || employee.email || employee._id).join(", ")}
                  </p>
                )}
                {booking.accessInstructions && <p className="font-semibold text-stone-500">Access: {booking.accessInstructions}</p>}
                {booking.parkingNotes && <p className="font-semibold text-stone-500">Parking: {booking.parkingNotes}</p>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="button-secondary px-3 py-2" type="button" onClick={() => onEdit(booking)}>
                  <Edit3 size={16} aria-hidden="true" />
                  Edit
                </button>
                <button
                  className="button-secondary px-3 py-2"
                  type="button"
                  onClick={() => onOwnershipChange(booking, ownedByMe ? "release" : "take")}
                  disabled={actionStatus === `owner:${booking._id}`}
                  title={ownedBySomeoneElse ? "Take over this client thread before emailing." : undefined}
                >
                  {actionStatus === `owner:${booking._id}` ? (
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  ) : ownedByMe ? (
                    <X size={16} aria-hidden="true" />
                  ) : (
                    <UserPlus size={16} aria-hidden="true" />
                  )}
                  {ownedByMe ? "Release" : ownedBySomeoneElse ? "Take over" : "Take"}
                </button>
                <button
                  className="button-secondary px-3 py-2"
                  type="button"
                  onClick={() => onEmailConfirmation(booking._id)}
                  disabled={ownedBySomeoneElse || actionStatus === `email:${booking._id}`}
                  title={ownedBySomeoneElse ? "Take over this booking before emailing the client." : undefined}
                >
                  {actionStatus === `email:${booking._id}` ? (
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  ) : (
                    <Send size={16} aria-hidden="true" />
                  )}
                  Email confirmation
                </button>
                <button
                  className="button-secondary px-3 py-2"
                  type="button"
                  onClick={() => onCleanerBrief(booking._id)}
                  disabled={cleanerEmailCount === 0 || actionStatus === `cleaners:${booking._id}`}
                  title={cleanerEmailCount === 0 ? "Assign cleaners with email addresses before sending a job brief." : "Email assigned cleaners"}
                >
                  {actionStatus === `cleaners:${booking._id}` ? (
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  ) : (
                    <Mail size={16} aria-hidden="true" />
                  )}
                  Email cleaners
                </button>
                <button
                  className="button-secondary px-3 py-2"
                  type="button"
                  onClick={() => onPhoneConfirmation(booking._id)}
                  disabled={!booking.phone || ownedBySomeoneElse || actionStatus === `phone:${booking._id}`}
                  title={ownedBySomeoneElse ? "Take over this booking before recording client phone contact." : undefined}
                >
                  {actionStatus === `phone:${booking._id}` ? (
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  ) : (
                    <PhoneCall size={16} aria-hidden="true" />
                  )}
                  Phone confirmed
                </button>
                <button
                  className="button-secondary px-3 py-2 text-rose-700"
                  type="button"
                  onClick={() => onDelete(booking._id)}
                  disabled={actionStatus === `delete:${booking._id}`}
                >
                  {actionStatus === `delete:${booking._id}` ? (
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  ) : (
                    <Trash2 size={16} aria-hidden="true" />
                  )}
                  Delete job
                </button>
              </div>
            </article>
          );
        })}
        {bookings.length === 0 && (
          <div className="rounded-lg border border-dashed border-stone-300 bg-mist p-5 text-sm font-semibold text-stone-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </section>
  );
}

function RecentlyDeletedBookings({ actionStatus, bookings, onRestore }) {
  return (
    <section className="panel p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Recovery</p>
          <h2 className="mt-1 text-2xl font-extrabold text-coal">Recently deleted bookings</h2>
          <p className="mt-2 text-sm font-semibold text-stone-500">
            Deleted jobs are hidden from the calendar but can be restored from here.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {bookings.map((booking) => (
          <article className="rounded-lg border border-stone-200 bg-white p-4" key={booking._id}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-extrabold text-coal">{booking.clientName}</p>
                  <span className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-extrabold text-berry">
                    {bookingReference(booking)}
                  </span>
                  <StatusBadge value={booking.status} />
                </div>
                <p className="mt-1 text-sm font-semibold text-stone-600">
                  {booking.service} - {formatBookingTime(booking.scheduledFor)} on{" "}
                  {new Date(booking.scheduledFor).toLocaleDateString("en-GB")}
                </p>
                <p className="mt-1 text-xs font-bold text-stone-500">
                  Deleted {booking.deletedAt ? new Date(booking.deletedAt).toLocaleString("en-GB") : "recently"}
                </p>
              </div>
              <button
                className="button-secondary px-3 py-2"
                type="button"
                onClick={() => onRestore(booking._id)}
                disabled={actionStatus === `restore:${booking._id}`}
              >
                {actionStatus === `restore:${booking._id}` ? (
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                ) : (
                  <RefreshCw size={16} aria-hidden="true" />
                )}
                Restore
              </button>
            </div>
          </article>
        ))}
        {bookings.length === 0 && (
          <div className="rounded-lg border border-dashed border-stone-300 bg-mist p-5 text-sm font-semibold text-stone-500">
            No recently deleted bookings.
          </div>
        )}
      </div>
    </section>
  );
}

function calendarStatusClass(status) {
  const variants = {
    scheduled: "bg-amber-100 text-amber-800",
    confirmed: "bg-lime-100 text-lime-800",
    completed: "bg-coal text-white",
    cancelled: "bg-rose-100 text-rose-800"
  };

  return variants[status] || variants.scheduled;
}

function BookingForm({ editingBookingId, employees, leads, form, status, onCancelEdit, onChange, onSubmit }) {
  const assignedCleanerNames = employees
    .filter((employee) => form.assignedEmployeeIds.includes(employee._id))
    .map((employee) => employee.name);
  const assignedCleanerLabel =
    assignedCleanerNames.length > 0 ? assignedCleanerNames.join(", ") : "Select cleaners";

  return (
    <form className="panel grid gap-4 p-5" onSubmit={onSubmit}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">{editingBookingId ? "Edit booking" : "New booking"}</p>
          <h2 className="mt-1 text-2xl font-extrabold text-coal">
            {editingBookingId ? "Update booking details" : "Create a booking"}
          </h2>
        </div>
        {editingBookingId && (
          <button className="button-secondary px-4 py-2" type="button" onClick={onCancelEdit}>
            <X size={16} aria-hidden="true" />
            Cancel edit
          </button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm font-bold text-coal">
          Linked inquiry
          <select className="input-field" name="leadId" value={form.leadId} onChange={onChange}>
            <option value="">Manual booking</option>
            {leads.map((lead) => (
              <option key={lead._id} value={lead._id}>
                {lead.name} - {lead.service}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-coal">
          Client name
          <input className="input-field" name="clientName" value={form.clientName} onChange={onChange} required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-coal">
          Email
          <input
            className="input-field"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="Optional for manual bookings"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-coal">
          Phone
          <input className="input-field" name="phone" value={form.phone} onChange={onChange} placeholder="Optional" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-coal">
          Service
          <input className="input-field" name="service" value={form.service} onChange={onChange} required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-coal">
          Date and time
          <input
            className="input-field"
            type="datetime-local"
            name="scheduledFor"
            value={form.scheduledFor}
            onChange={onChange}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-coal">
          Duration
          <select className="input-field" name="durationMinutes" value={form.durationMinutes} onChange={onChange}>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
            <option value="180">3 hours</option>
            <option value="240">4 hours</option>
            <option value="360">6 hours</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-coal">
          Client contact
          <select
            className="input-field"
            name="communicationPreference"
            value={form.communicationPreference}
            onChange={onChange}
          >
            <option value="email">Email</option>
            <option value="sms">Text message</option>
            <option value="phone">Phone call</option>
          </select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-bold text-coal">
        Cleaning address
        <textarea
          className="input-field min-h-24 resize-none"
          name="address"
          value={form.address}
          onChange={onChange}
          required
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="grid gap-2 text-sm font-bold text-coal">
          Access instructions
          <textarea
            className="input-field min-h-24 resize-none"
            name="accessInstructions"
            value={form.accessInstructions}
            onChange={onChange}
            placeholder="Keys, alarm, concierge, entry code, pets, lift, or site contact."
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-coal">
          Parking notes
          <textarea
            className="input-field min-h-24 resize-none"
            name="parkingNotes"
            value={form.parkingNotes}
            onChange={onChange}
            placeholder="Permit, driveway, paid bay, loading zone, congestion charge, or nearest option."
          />
        </label>
        <div className="grid gap-2 text-sm font-bold text-coal">
          Assigned cleaners
          <details className="group relative">
            <summary className="input-field flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <span className="truncate text-left">{assignedCleanerLabel}</span>
              <ChevronDown className="shrink-0 transition group-open:rotate-180" size={18} aria-hidden="true" />
            </summary>
            <div className="absolute z-20 mt-2 grid max-h-52 w-full gap-2 overflow-y-auto rounded-lg border border-stone-200 bg-white p-3 shadow-soft">
              {employees.map((employee) => (
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700" key={employee._id}>
                  <input
                    className="h-4 w-4 accent-amber-700"
                    type="checkbox"
                    name="assignedEmployeeIds"
                    value={employee._id}
                    checked={form.assignedEmployeeIds.includes(employee._id)}
                    onChange={onChange}
                  />
                  {employee.name}
                </label>
              ))}
              {employees.length === 0 && <p className="text-sm font-semibold text-stone-500">Add cleaners in the Employees tab.</p>}
            </div>
          </details>
        </div>
      </div>

      <label className="grid gap-2 text-sm font-bold text-coal">
        Booking notes
        <textarea className="input-field min-h-24 resize-none" name="notes" value={form.notes} onChange={onChange} />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid gap-2">
          <label className="inline-flex items-center gap-2 text-sm font-bold text-stone-700">
            <input
              className="h-4 w-4 accent-amber-700"
              type="checkbox"
              name="sendConfirmation"
              checked={form.sendConfirmation}
              onChange={onChange}
              disabled={Boolean(editingBookingId)}
            />
            Send client confirmation
          </label>
          {editingBookingId && (
            <p className="text-sm font-semibold text-stone-500">Use the booking card buttons to send email or record phone confirmation.</p>
          )}
          {!editingBookingId && (
            <p className="text-sm font-semibold text-stone-500">
              Email and phone are optional for manual bookings. Confirmations are skipped when contact details are missing.
            </p>
          )}
          {status === "success" && (
            <p className="text-sm font-bold text-lime-700">
              {editingBookingId ? "Booking updated." : "Booking saved."}
            </p>
          )}
        </div>
        <button className="button-primary" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <CalendarCheck size={18} aria-hidden="true" />}
          {editingBookingId ? "Update booking" : "Save booking"}
        </button>
      </div>
    </form>
  );
}

const quoteStatuses = ["new", "reviewing", "awaiting_photos", "quoted", "booked", "closed"];
const activeQuoteStatuses = ["new", "reviewing", "awaiting_photos", "quoted"];
const quoteFilterTabs = [
  { key: "active", label: "Active", statuses: activeQuoteStatuses },
  { key: "awaiting_photos", label: "Awaiting photos", statuses: ["awaiting_photos"] },
  { key: "quoted", label: "Quoted", statuses: ["quoted"] },
  { key: "booked", label: "Booked", statuses: ["booked"] },
  { key: "closed", label: "Closed", statuses: ["closed"] },
  { key: "all", label: "All", statuses: quoteStatuses }
];

function quoteStatusLabel(value = "") {
  return String(value || "").replace(/_/g, " ");
}

function QuoteReviewPanel({
  actionStatus,
  currentUser,
  quoteRequests,
  users,
  onCreateBooking,
  onOwnershipChange,
  onPhotoRequest,
  onStatusChange
}) {
  const [activeQuoteFilter, setActiveQuoteFilter] = useState("active");
  const activeFilter = quoteFilterTabs.find((filter) => filter.key === activeQuoteFilter) || quoteFilterTabs[0];
  const visibleQuoteRequests = quoteRequests.filter((quoteRequest) => activeFilter.statuses.includes(quoteRequest.status));
  const quoteCounts = quoteFilterTabs.reduce(
    (counts, filter) => ({
      ...counts,
      [filter.key]: quoteRequests.filter((quoteRequest) => filter.statuses.includes(quoteRequest.status)).length
    }),
    {}
  );

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-stone-200 bg-white p-5">
        <p className="eyebrow">Quote review</p>
        <h2 className="mt-1 text-2xl font-extrabold text-coal">Review submitted quotes</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-stone-500">
          The active queue shows quote requests that still need work. Booked and closed quotes stay archived here for
          audit and follow-up.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {quoteFilterTabs.map((filter) => (
            <button
              className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${
                activeQuoteFilter === filter.key ? "bg-coal text-white" : "bg-mist text-stone-600 hover:bg-amber-50 hover:text-coal"
              }`}
              key={filter.key}
              onClick={() => setActiveQuoteFilter(filter.key)}
              type="button"
            >
              {filter.label} ({quoteCounts[filter.key] || 0})
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
          <thead className="bg-mist text-xs font-bold uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Quote</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {visibleQuoteRequests.map((quoteRequest) => {
              const quote = quoteRequest.quoteResult || {};
              const input = quoteRequest.quoteInput || {};
              const ownedByMe = isOwnedByCurrentUser(quoteRequest, currentUser);
              const ownedBySomeoneElse = isOwnedByAnotherUser(quoteRequest, currentUser);

              return (
                <tr key={quoteRequest._id}>
                  <td className="px-4 py-4">
                    <p className="font-extrabold text-coal">{quoteRequest.quoteReference}</p>
                    <p className="mt-1 text-xs font-bold text-stone-500">{quoteStatusLabel(quoteRequest.status)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-extrabold text-coal">{quoteRequest.clientName}</p>
                    <p className="text-stone-500">{quoteRequest.email}</p>
                    <p className="text-stone-500">{quoteRequest.phone}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-extrabold text-coal">{quote.displayPrice || "Quote pending"}</p>
                    <p className="text-stone-500">{quote.serviceLabel || input.serviceType}</p>
                    <p className="text-stone-500">{quote.propertyLabel}</p>
                  </td>
                  <td className="max-w-sm px-4 py-4 text-stone-600">
                    {quoteRequest.address && <p className="font-semibold">{quoteRequest.address}</p>}
                    <p>{quoteRequest.preferredDate || "No date"} {quoteRequest.preferredTime || ""}</p>
                    {quoteRequest.accessInstructions && <p className="mt-1">Access: {quoteRequest.accessInstructions}</p>}
                    {quoteRequest.parkingNotes && <p className="mt-1">Parking: {quoteRequest.parkingNotes}</p>}
                    {quoteRequest.quoteNotes && <p className="mt-1">Notes: {quoteRequest.quoteNotes}</p>}
                  </td>
                  <td className="px-4 py-4">
                    <OwnershipBadge record={quoteRequest} users={users} />
                    <p className="mt-2 text-xs font-bold capitalize text-stone-500">
                      {communicationStatusLabel(quoteRequest.communicationStatus)}
                    </p>
                    {quoteRequest.lastClientContactedAt && (
                      <p className="mt-1 text-xs font-semibold text-stone-500">
                        Last emailed {new Date(quoteRequest.lastClientContactedAt).toLocaleDateString("en-GB")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700"
                      value={quoteRequest.status}
                      onChange={(event) => onStatusChange(quoteRequest._id, event.target.value)}
                    >
                      {quoteStatuses.map((status) => (
                        <option key={status} value={status}>
                          {quoteStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                    {quoteRequest.photoRequestSentAt && (
                      <p className="mt-2 text-xs font-bold text-stone-500">
                        Photos requested {new Date(quoteRequest.photoRequestSentAt).toLocaleDateString("en-GB")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="button-secondary whitespace-nowrap px-3 py-2"
                        type="button"
                        onClick={() => onOwnershipChange(quoteRequest, ownedByMe ? "release" : "take")}
                        disabled={actionStatus === `owner:${quoteRequest._id}`}
                        title={ownedBySomeoneElse ? "Take over this quote before emailing." : undefined}
                      >
                        {actionStatus === `owner:${quoteRequest._id}` ? (
                          <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                        ) : ownedByMe ? (
                          <X size={16} aria-hidden="true" />
                        ) : (
                          <UserPlus size={16} aria-hidden="true" />
                        )}
                        {ownedByMe ? "Release" : ownedBySomeoneElse ? "Take over" : "Take"}
                      </button>
                      <button
                        className="button-secondary whitespace-nowrap px-3 py-2"
                        type="button"
                        onClick={() => onPhotoRequest(quoteRequest._id)}
                        disabled={ownedBySomeoneElse || actionStatus === `photos:${quoteRequest._id}`}
                        title={ownedBySomeoneElse ? "Take over this quote before emailing the client." : undefined}
                      >
                        {actionStatus === `photos:${quoteRequest._id}` ? (
                          <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                        ) : (
                          <Mail size={16} aria-hidden="true" />
                        )}
                        Ask photos
                      </button>
                      <button className="button-secondary whitespace-nowrap px-3 py-2" type="button" onClick={() => onCreateBooking(quoteRequest)}>
                        <CalendarCheck size={16} aria-hidden="true" />
                        Create booking
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-stone-500">{new Date(quoteRequest.createdAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
            {visibleQuoteRequests.length === 0 && <EmptyRow label={`No ${activeFilter.label.toLowerCase()} quote requests.`} columns={8} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PasswordChangePanel({ form, status, onChange, onSubmit }) {
  return (
    <form className="panel grid gap-4 p-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end" onSubmit={onSubmit}>
      <div className="lg:col-span-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-amber-50 text-coral">
            <KeyRound size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">Account security</p>
            <h2 className="text-2xl font-extrabold text-coal">Change my password</h2>
          </div>
        </div>
      </div>
      <label className="grid gap-2 text-sm font-bold text-coal">
        Current password
        <input className="input-field" type="password" name="currentPassword" value={form.currentPassword} onChange={onChange} required />
      </label>
      <label className="grid gap-2 text-sm font-bold text-coal">
        New password
        <input className="input-field" type="password" name="newPassword" minLength={8} value={form.newPassword} onChange={onChange} required />
      </label>
      <button className="button-primary" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <KeyRound size={18} aria-hidden="true" />}
        Update password
      </button>
      {status === "success" && <p className="text-sm font-bold text-lime-700 lg:col-span-3">Password changed.</p>}
    </form>
  );
}

function ManagerForm({ form, status, onChange, onSubmit }) {
  return (
    <form className="panel grid gap-4 p-5 lg:grid-cols-[1fr_1fr_1fr_180px_auto] lg:items-end" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-bold text-coal">
        Account name
        <input className="input-field" name="name" value={form.name} onChange={onChange} required />
      </label>
      <label className="grid gap-2 text-sm font-bold text-coal">
        Email
        <input className="input-field" type="email" name="email" value={form.email} onChange={onChange} required />
      </label>
      <label className="grid gap-2 text-sm font-bold text-coal">
        Temporary password
        <input
          className="input-field"
          type="password"
          name="password"
          minLength={8}
          value={form.password}
          onChange={onChange}
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-coal">
        Access level
        <select className="input-field" name="role" value={form.role} onChange={onChange}>
          <option value="user">Portal user</option>
          <option value="admin">Manager</option>
        </select>
      </label>
      <button className="button-primary" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <UserPlus size={18} aria-hidden="true" />}
        Add account
      </button>
    </form>
  );
}

function UserTable({
  users,
  currentUserId,
  resetForms,
  resetStatus,
  onDelete,
  onPasswordChange,
  onPasswordReset,
  onRoleChange
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
          <thead className="bg-mist text-xs font-bold uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Password</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {users.map((account) => (
              <tr key={account._id}>
                <td className="px-4 py-4">
                  <p className="font-extrabold text-coal">{account.name}</p>
                  <p className="text-stone-500">{account.email}</p>
                </td>
                <td className="px-4 py-4">
                  <select
                    className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-bold text-stone-700"
                    value={account.role}
                    onChange={(event) => onRoleChange(account._id, event.target.value)}
                    disabled={account._id === currentUserId}
                  >
                    <option value="user">Portal user</option>
                    <option value="admin">Manager</option>
                  </select>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge value={account.status} />
                </td>
                <td className="px-4 py-4">
                  <form
                    className="flex min-w-[260px] flex-col gap-2 sm:flex-row"
                    onSubmit={(event) => {
                      event.preventDefault();
                      onPasswordReset(account._id);
                    }}
                  >
                    <input
                      className="input-field py-2 text-sm"
                      type="password"
                      minLength={8}
                      placeholder="Temporary password"
                      value={resetForms[account._id] || ""}
                      onChange={(event) => onPasswordChange(account._id, event.target.value)}
                    />
                    <button className="button-secondary px-3 py-2" type="submit" disabled={resetStatus[account._id] === "submitting"}>
                      {resetStatus[account._id] === "submitting" ? (
                        <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                      ) : (
                        <KeyRound size={16} aria-hidden="true" />
                      )}
                      Reset
                    </button>
                  </form>
                  {resetStatus[account._id] === "success" && (
                    <p className="mt-2 text-xs font-bold text-lime-700">Password reset.</p>
                  )}
                </td>
                <td className="px-4 py-4 text-stone-500">{new Date(account.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-4">
                  <button
                    className="button-secondary px-3 py-2 text-rose-700"
                    type="button"
                    onClick={() => onDelete(account._id)}
                    disabled={account._id === currentUserId}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && <EmptyRow label="No accounts yet" columns={6} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GovernancePanel({ governance }) {
  if (!governance) {
    return (
      <div className="panel p-5 text-sm font-semibold text-stone-500">
        Governance summary is not available yet.
      </div>
    );
  }

  const counts = governance.counts || {};
  const countItems = [
    ["Users", counts.users],
    ["Leads", counts.leads],
    ["Quotes", counts.quoteRequests],
    ["Active bookings", counts.activeBookings],
    ["Deleted bookings", counts.deletedBookings],
    ["Invoices", counts.invoices],
    ["Cleaners", counts.employees],
    ["Audit events", counts.auditEvents]
  ];

  return (
    <div className="grid gap-6">
      <section className="panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="eyebrow">Data governance</p>
            <h2 className="mt-1 text-2xl font-extrabold text-coal">Retention and accountability</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-stone-500">
              Velura keeps current operational records in MongoDB, keeps important action history in the audit log, and
              avoids storing unnecessary duplicate communication content inside the portal.
            </p>
          </div>
          <div className="rounded-lg bg-mist px-4 py-3 text-sm font-bold text-stone-600">
            <p>Database: <span className="capitalize text-coal">{governance.databaseMode}</span></p>
            <p className="mt-1">Audit retention: <span className="text-coal">{governance.auditLogRetentionDays} days</span></p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {countItems.map(([label, value]) => (
            <div className="rounded-lg border border-stone-200 bg-mist p-4" key={label}>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-stone-500">{label}</p>
              <p className="mt-2 text-2xl font-extrabold text-coal">{value ?? 0}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-coral">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="eyebrow">Controls</p>
            <h3 className="text-xl font-extrabold text-coal">How the portal protects the workflow</h3>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {(governance.controls || []).map((control) => (
            <div className="rounded-lg border border-stone-200 bg-white p-4 text-sm font-semibold leading-6 text-stone-600" key={control}>
              {control}
            </div>
          ))}
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-stone-200 bg-white p-5">
          <p className="eyebrow">Retention policy</p>
          <h3 className="mt-1 text-xl font-extrabold text-coal">Recommended Velura data lifecycle</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-stone-500">
            This is a practical operating policy for the portal. It should be reviewed as the business grows or if your
            accountant, insurer, or legal adviser gives a stricter requirement.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
            <thead className="bg-mist text-xs font-bold uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Records</th>
                <th className="px-4 py-3">Retention</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {(governance.retentionPolicy || []).map((rule) => (
                <tr key={rule.area}>
                  <td className="px-4 py-4 font-extrabold text-coal">{rule.area}</td>
                  <td className="max-w-xs px-4 py-4 text-stone-600">{rule.records}</td>
                  <td className="px-4 py-4 font-bold text-stone-700">{rule.retention}</td>
                  <td className="max-w-sm px-4 py-4 text-stone-600">{rule.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AuditTable({ auditEvents }) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
          <thead className="bg-mist text-xs font-bold uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {auditEvents.map((event) => (
              <tr key={event._id}>
                <td className="whitespace-nowrap px-4 py-4 text-stone-500">
                  {new Date(event.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-4 font-bold text-coal">{event.action}</td>
                <td className="px-4 py-4 text-stone-600">{event.actor?.email || "Website visitor"}</td>
                <td className="max-w-xl px-4 py-4 text-stone-700">{event.summary}</td>
              </tr>
            ))}
            {auditEvents.length === 0 && <EmptyRow label="No audit events yet" columns={4} />}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyRow({ label, columns }) {
  return (
    <tr>
      <td className="px-4 py-8 text-center text-sm font-semibold text-stone-500" colSpan={columns}>
        {label}
      </td>
    </tr>
  );
}

function ActionToast({ toast, onDismiss }) {
  const isError = toast.type === "error";
  const Icon = isError ? TriangleAlert : CheckCircle2;

  return (
    <div className="fixed right-4 top-4 z-50 w-[min(92vw,360px)] rounded-lg border border-stone-200 bg-white p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${isError ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
          <Icon size={19} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-coal">{isError ? "Action failed" : "Action complete"}</p>
          <p className="mt-1 text-sm font-semibold leading-5 text-stone-600">{toast.message}</p>
        </div>
        <button className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-stone-500 hover:bg-mist hover:text-coal" type="button" onClick={onDismiss} aria-label="Dismiss notification">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
