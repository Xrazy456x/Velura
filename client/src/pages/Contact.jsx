import { ArrowRight, ClipboardList, Loader2, MailCheck, MessageSquareText, Send } from "lucide-react";
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

const contactSteps = [
  {
    icon: MessageSquareText,
    title: "Tell us the space",
    body: "Service type, property size, area, condition, access, and timing help the team understand the work."
  },
  {
    icon: ClipboardList,
    title: "We review the scope",
    body: "A manager checks whether photos, parking notes, or extra details are needed before confirming next steps."
  },
  {
    icon: MailCheck,
    title: "You hear back clearly",
    body: "Replies are handled through Velura Services so the communication trail stays easy to follow."
  }
];

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
        <div className="section-shell grid gap-8 py-14 sm:py-18 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="border border-stone-200 bg-white p-6 shadow-soft">
            <p className="eyebrow">Response</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-coal">A calm, discreet booking flow.</h2>
            <p className="mt-4 text-sm leading-6 text-stone-600">
              Velura keeps contact details, service notes, email follow-ups, and booking status in one place so every
              follow-up feels polished and personal.
            </p>
            <div className="mt-7 divide-y divide-stone-200 border-y border-stone-200">
              {contactSteps.map((step, index) => (
                <div key={step.title} className="grid grid-cols-[auto_1fr] gap-4 py-5">
                  <div className="grid h-10 w-10 place-items-center bg-mist text-coral">
                    <step.icon size={19} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-coal">
                      {String(index + 1).padStart(2, "0")} / {step.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link className="button-secondary mt-7 w-full justify-between sm:w-auto" to="/quote">
              Prefer the guided quote?
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </aside>

          <form className="grid gap-5 border border-stone-200 bg-white p-5 shadow-soft sm:p-6" onSubmit={handleSubmit}>
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
              <Link className="text-berry hover:underline" to="/privacy">
                privacy notice
              </Link>
              {" "}and{" "}
              <Link className="text-berry hover:underline" to="/terms">
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
