import {
  Calculator,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Edit3,
  History,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  PhoneCall,
  RefreshCw,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  UserPlus,
  UsersRound,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiClient, getApiError } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";

const tabs = [
  { key: "leads", label: "Inquiries" },
  { key: "bookings", label: "Bookings" },
  { key: "employees", label: "Employees" },
  { key: "pricing", label: "Pricing" },
  { key: "messages", label: "Messages" },
  { key: "users", label: "Accounts" },
  { key: "audit", label: "Audit" }
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
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
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
    year: "numeric"
  }).format(value);
}

function shortDateLabel(value) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(value);
}

function formatBookingTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("leads");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [deletedBookings, setDeletedBookings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reviewsMeta, setReviewsMeta] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [bookingForm, setBookingForm] = useState(() => createInitialBookingForm());
  const [bookingStatus, setBookingStatus] = useState("idle");
  const [bookingAction, setBookingAction] = useState("idle");
  const [editingBookingId, setEditingBookingId] = useState("");
  const [bookingFocusDate, setBookingFocusDate] = useState("");
  const [managerForm, setManagerForm] = useState(initialManagerForm);
  const [managerStatus, setManagerStatus] = useState("idle");
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [passwordStatus, setPasswordStatus] = useState("idle");
  const [resetPasswordForms, setResetPasswordForms] = useState({});
  const [resetPasswordStatus, setResetPasswordStatus] = useState({});
  const [employeeForm, setEmployeeForm] = useState(initialEmployeeForm);
  const [employeeStatus, setEmployeeStatus] = useState("idle");

  const isAdmin = user?.role === "admin";

  async function loadBookingRecords() {
    const [bookingsResponse, deletedBookingsResponse] = await Promise.all([
      apiClient.get("/bookings"),
      apiClient.get("/bookings/deleted")
    ]);

    setBookings(bookingsResponse.data.bookings || []);
    setDeletedBookings(deletedBookingsResponse.data.bookings || []);
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
        employeesResponse,
        pricingResponse,
        messagesResponse,
        reviewsResponse,
        auditResponse
      ] = await Promise.all([
        apiClient.get("/users"),
        apiClient.get("/leads"),
        apiClient.get("/bookings"),
        apiClient.get("/bookings/deleted"),
        apiClient.get("/employees"),
        apiClient.get("/quote/pricing"),
        apiClient.get("/messages"),
        apiClient.get("/reviews"),
        apiClient.get("/audit?limit=100")
      ]);

      setUsers(usersResponse.data.users || []);
      setLeads(leadsResponse.data.leads || []);
      setBookings(bookingsResponse.data.bookings || []);
      setDeletedBookings(deletedBookingsResponse.data.bookings || []);
      setEmployees(employeesResponse.data.employees || []);
      setPricing(pricingResponse.data.pricing || null);
      setMessages(messagesResponse.data.messages || []);
      setReviewsMeta(reviewsResponse.data.meta || null);
      setAuditEvents(auditResponse.data.auditEvents || []);
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
      { label: "Deleted", value: deletedBookings.length, icon: Trash2, tone: "berry" },
      { label: "Cleaners", value: employees.length, icon: UsersRound, tone: "coral" },
      { label: "Messages", value: messages.length, icon: Mail, tone: "berry" },
      { label: "Google rating", value: reviewsMeta?.averageRating ? Number(reviewsMeta.averageRating).toFixed(1) : "N/A", icon: Star, tone: "coal" },
      { label: "Audit events", value: auditEvents.length, icon: History, tone: "leaf" }
    ],
    [auditEvents.length, bookings.length, deletedBookings.length, employees.length, leads.length, messages.length, reviewsMeta, users]
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
      setBookingFocusDate(data.booking.scheduledFor);
      setBookingForm(createInitialBookingForm());
      setEditingBookingId("");
      setBookingStatus("success");
      await loadBookingRecords();
      await loadAuditEvents();
    } catch (requestError) {
      setBookingStatus("error");
      setError(getApiError(requestError, editingBookingId ? "Booking could not be updated." : "Booking could not be created."));
    }
  }

  async function deleteBooking(bookingId) {
    if (!window.confirm("Move this booking to Recently deleted? You can restore it if this was a mistake.")) {
      return;
    }

    const previous = bookings;
    const previousDeleted = deletedBookings;
    setBookings((current) => current.filter((booking) => booking._id !== bookingId));
    setError("");

    try {
      const { data } = await apiClient.delete(`/bookings/${bookingId}`);
      setDeletedBookings((current) => [data.booking, ...current.filter((booking) => booking._id !== bookingId)]);
      await loadAuditEvents();
    } catch (requestError) {
      setBookings(previous);
      setDeletedBookings(previousDeleted);
      setError(getApiError(requestError, "Booking could not be deleted."));
    }
  }

  async function restoreBooking(bookingId) {
    const previous = bookings;
    const previousDeleted = deletedBookings;
    const bookingToRestore = deletedBookings.find((booking) => booking._id === bookingId);

    if (bookingToRestore) {
      setBookings((current) =>
        [...current, { ...bookingToRestore, deletedAt: null, deletedBy: null }].sort(
          (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
        )
      );
    }

    setDeletedBookings((current) => current.filter((booking) => booking._id !== bookingId));
    setError("");

    try {
      const { data } = await apiClient.post(`/bookings/${bookingId}/restore`);
      setBookings((current) =>
        [...current.filter((booking) => booking._id !== bookingId), data.booking].sort(
          (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
        )
      );
      await loadAuditEvents();
    } catch (requestError) {
      setBookings(previous);
      setDeletedBookings(previousDeleted);
      setError(getApiError(requestError, "Booking could not be restored."));
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
    } catch (requestError) {
      setBookings(previous);
      setError(getApiError(requestError, "Booking status could not be updated."));
    }
  }

  async function sendBookingEmailConfirmation(bookingId) {
    setError("");
    setBookingAction(`email:${bookingId}`);

    try {
      const { data } = await apiClient.post(`/bookings/${bookingId}/email-confirmation`);
      setBookings((current) => current.map((booking) => (booking._id === bookingId ? data.booking : booking)));
      await loadAuditEvents();
    } catch (requestError) {
      setError(getApiError(requestError, "Email confirmation could not be sent."));
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
    } catch (requestError) {
      setError(getApiError(requestError, "Phone confirmation could not be recorded."));
    } finally {
      setBookingAction("idle");
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
    setEmployeeForm((current) => ({ ...current, [name]: value }));
  }

  async function createEmployee(event) {
    event.preventDefault();
    setError("");
    setEmployeeStatus("submitting");

    try {
      const payload = {
        ...employeeForm,
        skills: employeeForm.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      };
      const { data } = await apiClient.post("/employees", payload);
      setEmployees((current) => [data.employee, ...current]);
      setEmployeeForm(initialEmployeeForm);
      setEmployeeStatus("success");
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

  async function markMessage(messageId, isRead) {
    const previous = messages;
    setMessages((current) => current.map((message) => (message._id === messageId ? { ...message, isRead } : message)));

    try {
      const { data } = await apiClient.patch(`/messages/${messageId}`, { isRead });
      setMessages((current) => current.map((message) => (message._id === messageId ? data.message : message)));
      await loadAuditEvents();
    } catch (requestError) {
      setMessages(previous);
      setError(getApiError(requestError, "Message could not be updated."));
    }
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
            to view Velura inquiries, bookings, messages, and team accounts.
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
          <p className="mt-3 text-stone-600">Manage cleaning inquiries, bookings, client messages, account access, and review signals.</p>
        </div>
        <button className="button-secondary" onClick={loadDashboard} type="button" disabled={status === "loading"}>
          {status === "loading" ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <RefreshCw size={18} aria-hidden="true" />}
          Refresh
        </button>
      </div>

      {error && <div className="mt-6 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-stone-200 bg-white p-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
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
          {activeTab === "bookings" && (
            <BookingPanel
              actionStatus={bookingAction}
              bookings={bookings}
              deletedBookings={deletedBookings}
              editingBookingId={editingBookingId}
              employees={employees}
              focusDate={bookingFocusDate}
              leads={leads}
              form={bookingForm}
              status={bookingStatus}
              onCancelEdit={cancelBookingEdit}
              onChange={updateBookingForm}
              onDelete={deleteBooking}
              onDatePick={selectBookingDate}
              onEdit={startEditingBooking}
              onEmailConfirmation={sendBookingEmailConfirmation}
              onPhoneConfirmation={markBookingPhoneConfirmed}
              onRestore={restoreBooking}
              onSubmit={createBooking}
              onStatusChange={updateBookingStatus}
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
          {activeTab === "messages" && <MessageTable messages={messages} onReadChange={markMessage} />}
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
        </div>
      )}
    </section>
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
  deletedBookings,
  editingBookingId,
  employees,
  focusDate,
  leads,
  form,
  status,
  onCancelEdit,
  onChange,
  onDelete,
  onDatePick,
  onEdit,
  onEmailConfirmation,
  onPhoneConfirmation,
  onRestore,
  onSubmit,
  onStatusChange
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const selectedDateKey = dateKey(selectedDate);
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

  useEffect(() => {
    if (!focusDate) {
      return;
    }

    const nextSelectedDate = new Date(focusDate);

    if (Number.isNaN(nextSelectedDate.getTime())) {
      return;
    }

    setSelectedDate(nextSelectedDate);
    setVisibleMonth(startOfMonth(nextSelectedDate));
  }, [focusDate]);

  function selectCalendarDay(day) {
    setSelectedDate(day);
    onDatePick(day);
  }

  return (
    <div className="grid gap-6">
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
          bookings={selectedBookings}
          employees={employees}
          selectedDate={selectedDate}
          onDelete={onDelete}
          onEdit={onEdit}
          onEmailConfirmation={onEmailConfirmation}
          onPhoneConfirmation={onPhoneConfirmation}
          onStatusChange={onStatusChange}
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
      <RecentlyDeletedBookings bookings={deletedBookings} onRestore={onRestore} />
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
                        {formatBookingTime(booking.scheduledFor)} {booking.clientName}
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
  employees,
  selectedDate,
  onDelete,
  onEdit,
  onEmailConfirmation,
  onPhoneConfirmation,
  onStatusChange
}) {
  return (
    <section className="panel p-5">
      <p className="eyebrow">Selected day</p>
      <h2 className="mt-1 text-2xl font-extrabold text-coal">{shortDateLabel(selectedDate)}</h2>
      <div className="mt-5 grid gap-3">
        {bookings.map((booking) => {
          const latestLog =
            booking.communicationLog && booking.communicationLog.length > 0
              ? booking.communicationLog[booking.communicationLog.length - 1]
              : null;

          return (
            <article className="rounded-lg border border-stone-200 bg-white p-4" key={booking._id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-extrabold text-coal">{booking.clientName}</p>
                    <StatusBadge value={booking.status} />
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
                {booking.assignedEmployees?.length > 0 && (
                  <p className="font-semibold text-stone-500">
                    Cleaners:{" "}
                    {booking.assignedEmployees
                      .map((employee) =>
                        typeof employee === "object"
                          ? employee.name
                          : employees.find((item) => item._id === employee)?.name || employee
                      )
                      .join(", ")}
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
                  onClick={() => onEmailConfirmation(booking._id)}
                  disabled={actionStatus === `email:${booking._id}`}
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
                  onClick={() => onPhoneConfirmation(booking._id)}
                  disabled={!booking.phone || actionStatus === `phone:${booking._id}`}
                >
                  {actionStatus === `phone:${booking._id}` ? (
                    <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  ) : (
                    <PhoneCall size={16} aria-hidden="true" />
                  )}
                  Phone confirmed
                </button>
                <button className="button-secondary px-3 py-2 text-rose-700" type="button" onClick={() => onDelete(booking._id)}>
                  <Trash2 size={16} aria-hidden="true" />
                  Delete job
                </button>
              </div>
            </article>
          );
        })}
        {bookings.length === 0 && (
          <div className="rounded-lg border border-dashed border-stone-300 bg-mist p-5 text-sm font-semibold text-stone-500">
            No bookings on this date.
          </div>
        )}
      </div>
    </section>
  );
}

function RecentlyDeletedBookings({ bookings, onRestore }) {
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
              <button className="button-secondary px-3 py-2" type="button" onClick={() => onRestore(booking._id)}>
                <RefreshCw size={16} aria-hidden="true" />
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
          <input className="input-field" type="email" name="email" value={form.email} onChange={onChange} required />
        </label>
        <label className="grid gap-2 text-sm font-bold text-coal">
          Phone
          <input className="input-field" name="phone" value={form.phone} onChange={onChange} required />
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

function MessageTable({ messages, onReadChange }) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
          <thead className="bg-mist text-xs font-bold uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Read</th>
              <th className="px-4 py-3">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {messages.map((message) => (
              <tr key={message._id}>
                <td className="px-4 py-4">
                  <p className="font-extrabold text-coal">{message.name}</p>
                  <p className="text-stone-500">{message.email}</p>
                </td>
                <td className="max-w-xl px-4 py-4 text-stone-600">{message.body}</td>
                <td className="px-4 py-4">
                  <label className="inline-flex items-center gap-2 text-sm font-bold text-stone-700">
                    <input
                      className="h-4 w-4 accent-amber-700"
                      type="checkbox"
                      checked={message.isRead}
                      onChange={(event) => onReadChange(message._id, event.target.checked)}
                    />
                    {message.isRead ? "Read" : "Unread"}
                  </label>
                </td>
                <td className="px-4 py-4 text-stone-500">{new Date(message.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {messages.length === 0 && <EmptyRow label="No messages yet" columns={4} />}
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
