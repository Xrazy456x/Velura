import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { apiClient, getApiError } from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  service: "Signature Home Cleaning",
  message: ""
};

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("submitting");
    setNotice("");

    try {
      await apiClient.post("/leads", form);
      setForm(initialForm);
      setNotice("Thank you. Your Velura inquiry has been received and the team will follow up gently.");
      setStatus("success");
    } catch (error) {
      setNotice(getApiError(error, "Unable to send your inquiry right now."));
      setStatus("error");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Tell us about the space."
        description="Share the property, service type, and timing you have in mind. Every request is captured for the Velura team to review."
      />

      <section className="bg-mist">
        <div className="section-shell grid gap-8 py-14 sm:py-18 lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="panel p-6">
            <p className="eyebrow">Response</p>
            <h2 className="mt-3 text-2xl font-extrabold text-coal">A calm, discreet booking flow.</h2>
            <p className="mt-4 text-sm leading-6 text-stone-600">
              Velura keeps contact details, service notes, messages, and booking status in one place so every follow-up
              feels polished and personal.
            </p>
            <div className="mt-6 space-y-3 text-sm font-semibold text-stone-700">
              <p className="rounded-lg bg-mist p-3 ring-1 ring-stone-200">Requests start as new.</p>
              <p className="rounded-lg bg-mist p-3 ring-1 ring-stone-200">Admins can mark contacted or closed.</p>
              <p className="rounded-lg bg-mist p-3 ring-1 ring-stone-200">Service notes stay attached to the inquiry.</p>
            </div>
          </aside>

          <form className="panel grid gap-4 p-5 sm:p-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-coal">
                Name
                <input className="input-field" name="name" value={form.name} onChange={updateField} required />
              </label>
              <label className="grid gap-2 text-sm font-bold text-coal">
                Email
                <input className="input-field" type="email" name="email" value={form.email} onChange={updateField} required />
              </label>
              <label className="grid gap-2 text-sm font-bold text-coal">
                Phone
                <input className="input-field" name="phone" value={form.phone} onChange={updateField} />
              </label>
              <label className="grid gap-2 text-sm font-bold text-coal">
                Property or company
                <input className="input-field" name="company" value={form.company} onChange={updateField} />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-bold text-coal">
              Service
              <select className="input-field" name="service" value={form.service} onChange={updateField}>
                <option>Signature Home Cleaning</option>
                <option>Regular Clean</option>
                <option>Deep Clean</option>
                <option>End of Tenancy</option>
                <option>Office & Studio Care</option>
                <option>Commercial Clean</option>
                <option>Airbnb Turnover</option>
                <option>Other - please specify in the message box</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-coal">
              Message
              <textarea
                className="input-field min-h-36 resize-none"
                name="message"
                value={form.message}
                onChange={updateField}
                required
              />
            </label>
            <p className="text-xs font-semibold leading-5 text-stone-500">
              By sending this inquiry, you agree that Velura may use your details to respond and manage your request.
              See our{" "}
              <Link className="text-berry hover:underline" to="/portal/privacy">
                privacy notice
              </Link>
              {" "}and{" "}
              <Link className="text-berry hover:underline" to="/portal/terms">
                terms
              </Link>
              .
            </p>
            {notice && (
              <div
                className={`rounded-lg p-4 text-sm font-semibold ${
                  status === "error" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-900"
                }`}
              >
                {notice}
              </div>
            )}
            <button className="button-primary sm:w-fit" type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
              Request Velura
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
