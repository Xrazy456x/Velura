import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getApiError } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("submitting");
    setError("");

    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, "Login failed."));
      setStatus("error");
    }
  }

  return (
    <>
      <PageHeader eyebrow="Velura Portal" title="Welcome back." description="Access private manager tools for bookings, quotes, accounts, and operations." />
      <section className="bg-mist">
        <div className="section-shell flex justify-center py-14 sm:py-18">
          <form className="panel grid w-full max-w-lg gap-4 p-6" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-bold text-coal">
              Email
              <input className="input-field" type="email" name="email" value={form.email} onChange={updateField} required />
            </label>
            <label className="grid gap-2 text-sm font-bold text-coal">
              Password
              <input
                className="input-field"
                type="password"
                name="password"
                value={form.password}
                onChange={updateField}
                required
              />
            </label>
            {error && <div className="rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
            <button className="button-primary" type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
              Portal login
            </button>
            <p className="text-center text-sm font-semibold text-stone-600">
              Accounts are created inside the portal by an existing manager.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
