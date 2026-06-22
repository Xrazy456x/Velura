import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Home as HomeIcon,
  KeyRound,
  Loader2,
  MailCheck,
  MapPin,
  Sparkles,
  UsersRound
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiClient, getApiError } from "../api/client.js";
import { site } from "../config/site.js";

const steps = ["Service", "Property", "Add-ons", "Schedule", "Access", "Quote", "Details", "Confirm"];

const serviceOptions = [
  {
    key: "eot",
    title: "End of Tenancy",
    description: "Move-in, move-out, landlord, and agent-ready cleans.",
    icon: ClipboardList
  },
  {
    key: "deep_clean",
    title: "Deep Clean",
    description: "Top-to-bottom detail clean for homes that need a full reset.",
    icon: Sparkles
  },
  {
    key: "regular",
    title: "Regular Clean",
    description: "Weekly, fortnightly, or monthly cleaning priced per visit.",
    icon: Clock3
  },
  {
    key: "turnover",
    title: "Airbnb Turnover",
    description: "Short-stay reset with presentation details and optional linen.",
    icon: UsersRound
  },
  {
    key: "office",
    title: "Office Clean",
    description: "Workplace cleaning for offices, studios, and team spaces.",
    icon: Building2
  },
  {
    key: "commercial",
    title: "Commercial Clean",
    description: "Premises cleaning for washrooms, shared areas, bins, glass, and floors.",
    icon: Building2
  },
  {
    key: "emergency",
    title: "Emergency Clean",
    description: "Priority deep cleaning when the job needs fast attention.",
    icon: MailCheck
  },
  {
    key: "student",
    title: "Student / HMO",
    description: "Higher-use property reset based on end-of-tenancy scope.",
    icon: HomeIcon
  }
];

const propertyOptions = [
  { key: "studio", label: "Studio" },
  { key: "flat", label: "Flat" },
  { key: "house", label: "House" }
];

const conditionOptions = [
  { key: "good", label: "Good", description: "Normal use" },
  { key: "average", label: "Average", description: "Some build-up" },
  { key: "soiled", label: "Heavy", description: "More time needed" }
];

const frequencyOptions = [
  { key: "one_off", label: "One-off" },
  { key: "weekly", label: "Weekly" },
  { key: "fortnightly", label: "Fortnightly" },
  { key: "monthly", label: "Monthly" }
];

const domesticAddOns = [
  { key: "carpet_steam", label: "Carpet steam clean" },
  { key: "oven_deep", label: "Oven deep clean" },
  { key: "fridge", label: "Fridge clean" },
  { key: "balcony", label: "Balcony clean" },
  { key: "cupboards", label: "Inside cupboards" },
  { key: "wall_spot", label: "Wall spot cleaning" },
  { key: "exterior_windows", label: "External windows" },
  { key: "linen", label: "Linen change" }
];

const commercialAddOns = [
  { key: "washroom_sanitise", label: "Washroom sanitising" },
  { key: "desk_sanitise", label: "Desk and touchpoint sanitising" },
  { key: "internal_glass", label: "Internal glass and partitions" },
  { key: "waste_bag_change", label: "Bin liner and waste reset" },
  { key: "consumables_restock", label: "Consumables restock" },
  { key: "kitchen_point_clean", label: "Staff kitchen point clean" },
  { key: "floor_machine", label: "Machine floor clean" }
];

const initialForm = {
  serviceType: "eot",
  propertyType: "flat",
  bedrooms: 1,
  bathrooms: 1,
  condition: "good",
  urgency: "standard",
  frequency: "one_off",
  addOns: [],
  carpetRooms: 1,
  linenSets: 1,
  addOnAreas: 1,
  preferredDate: "",
  preferredTime: "",
  address: "",
  accessInstructions: "",
  parkingNotes: "",
  quoteNotes: "",
  clientName: "",
  email: "",
  phone: ""
};

function isWorkspaceService(serviceType) {
  return serviceType === "office" || serviceType === "commercial";
}

function selectClass(isActive) {
  return `rounded-lg border p-4 text-left transition duration-200 ${
    isActive
      ? "border-coral bg-amber-50 text-coal shadow-soft"
      : "border-stone-200 bg-white text-stone-700 hover:border-coral hover:bg-mist"
  }`;
}

function numberOptions(max = 5) {
  return Array.from({ length: max + 1 }, (_, index) => index);
}

function bedroomsLabel(value, workspaceMode) {
  if (workspaceMode) {
    if (value === 0) {
      return "Small workspace";
    }

    return value === 5 ? "5+ work areas" : `${value} work area${value === 1 ? "" : "s"}`;
  }

  if (value === 0) {
    return "Studio";
  }

  return value === 5 ? "5+ bedrooms" : `${value} bedroom${value === 1 ? "" : "s"}`;
}

export default function Quote() {
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [quote, setQuote] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [quoteSubmitStatus, setQuoteSubmitStatus] = useState("idle");
  const [quoteSubmitError, setQuoteSubmitError] = useState("");
  const [submittedReference, setSubmittedReference] = useState("");

  const selectedService = serviceOptions.find((service) => service.key === form.serviceType) || serviceOptions[0];
  const workspaceMode = isWorkspaceService(form.serviceType);
  const activeAddOns = workspaceMode ? commercialAddOns : domesticAddOns;
  const payload = useMemo(
    () => ({
      serviceType: form.serviceType,
      propertyType: workspaceMode ? "office" : form.propertyType,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      condition: form.condition,
      urgency: form.urgency,
      frequency: form.frequency,
      addOns: form.addOns,
      carpetRooms: Number(form.carpetRooms),
      linenSets: Number(form.linenSets),
      addOnAreas: Number(form.addOnAreas)
    }),
    [form, workspaceMode]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setStatus("loading");
      setError("");

      try {
        const { data } = await apiClient.post("/quote/calculate", payload, { signal: controller.signal });
        setQuote(data.quote);
        setStatus("ready");
      } catch (requestError) {
        if (requestError.name === "CanceledError") {
          return;
        }

        setError(getApiError(requestError, "The quote calculator could not load."));
        setStatus("error");
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [payload]);

  function updateField(name, value) {
    setQuoteSubmitStatus("idle");
    setQuoteSubmitError("");
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function updateService(serviceType) {
    const nextAddOns = isWorkspaceService(serviceType) ? commercialAddOns : domesticAddOns;

    setForm((current) => ({
      ...current,
      serviceType,
      propertyType: isWorkspaceService(serviceType) ? "flat" : current.propertyType,
      urgency: serviceType === "emergency" ? "same_day" : current.urgency,
      addOns: current.addOns.filter((key) => nextAddOns.some((addOn) => addOn.key === key))
    }));
  }

  function toggleAddOn(key) {
    setForm((current) => ({
      ...current,
      addOns: current.addOns.includes(key) ? current.addOns.filter((item) => item !== key) : [...current.addOns, key]
    }));
  }

  function nextStep() {
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setActiveStep((current) => Math.max(current - 1, 0));
  }

  async function submitQuoteRequest() {
    setQuoteSubmitStatus("submitting");
    setQuoteSubmitError("");
    setSubmittedReference("");

    try {
      const { data } = await apiClient.post("/quote/requests", {
        clientName: form.clientName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
        accessInstructions: form.accessInstructions,
        parkingNotes: form.parkingNotes,
        quoteNotes: form.quoteNotes,
        quoteInput: payload
      });

      setSubmittedReference(data.quoteRequest?.quoteReference || "");
      setQuoteSubmitStatus("success");
    } catch (requestError) {
      setQuoteSubmitStatus("error");
      setQuoteSubmitError(getApiError(requestError, "Your quote request could not be sent."));
    }
  }

  return (
    <section className="bg-mist py-10 sm:py-14">
      <div className="section-shell">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.65fr)] lg:items-end">
          <div className="animate-floatIn">
            <p className="eyebrow">Velura instant quote</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-tight text-coal sm:text-5xl">
              Build your cleaning quote step by step.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
              Choose the service, property, add-ons, schedule, access notes, and contact details. Velura gives you a live
              guide price before you send the inquiry.
            </p>
          </div>
          <div className="panel flex items-center gap-4 p-4">
            <img className="h-14 w-14 rounded-lg object-contain" src={site.mark} alt="" />
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-coral">{site.name}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-stone-600">{site.tagline}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.8fr)]">
          <form className="panel overflow-hidden" onSubmit={(event) => event.preventDefault()}>
            <div className="border-b border-stone-200 bg-white p-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
                {steps.map((step, index) => (
                  <button
                    className={`rounded-lg px-3 py-2 text-xs font-extrabold transition ${
                      activeStep === index ? "bg-coal text-white" : "bg-mist text-stone-600 hover:text-coal"
                    }`}
                    key={step}
                    onClick={() => setActiveStep(index)}
                    type="button"
                  >
                    <span className="mr-1 text-coral">{index + 1}</span>
                    {step}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-6">
              {activeStep === 0 && (
                <section>
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-coal text-white">
                      <ClipboardList size={20} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="eyebrow">Step 1 of 8</p>
                      <h2 className="text-2xl font-extrabold text-coal">Choose a service</h2>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {serviceOptions.map((service) => {
                      const Icon = service.icon;
                      const isActive = form.serviceType === service.key;

                      return (
                        <button
                          aria-pressed={isActive}
                          className={selectClass(isActive)}
                          key={service.key}
                          onClick={() => updateService(service.key)}
                          type="button"
                        >
                          <Icon className={isActive ? "text-coral" : "text-stone-500"} size={22} aria-hidden="true" />
                          <span className="mt-3 block text-sm font-extrabold">{service.title}</span>
                          <span className="mt-2 block text-xs font-semibold leading-5 text-stone-500">{service.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {activeStep === 1 && (
                <section className="grid gap-5">
                  <StepTitle icon={HomeIcon} eyebrow="Step 2 of 8" title="Property details" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-bold text-coal">
                      Property type
                      <select
                        className="input-field"
                        value={workspaceMode ? "office" : form.propertyType}
                        onChange={(event) => updateField("propertyType", event.target.value)}
                        disabled={workspaceMode}
                      >
                        {workspaceMode ? (
                          <option value="office">Office / commercial premises</option>
                        ) : (
                          propertyOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))
                        )}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-coal">
                      {workspaceMode ? "Workspace size" : "Bedrooms"}
                      <select
                        className="input-field"
                        value={form.bedrooms}
                        onChange={(event) => updateField("bedrooms", Number(event.target.value))}
                      >
                        {numberOptions(5).map((value) => (
                          <option key={value} value={value}>
                            {bedroomsLabel(value, workspaceMode)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-coal">
                      {workspaceMode ? "Washrooms" : "Bathrooms"}
                      <select
                        className="input-field"
                        value={form.bathrooms}
                        onChange={(event) => updateField("bathrooms", Number(event.target.value))}
                      >
                        {numberOptions(8)
                          .slice(1)
                          .map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-coal">
                      Timing
                      <select className="input-field" value={form.urgency} onChange={(event) => updateField("urgency", event.target.value)}>
                        <option value="standard">Standard booking</option>
                        <option value="same_day">Same-day / urgent</option>
                      </select>
                    </label>
                    {form.serviceType === "regular" && (
                      <label className="grid gap-2 text-sm font-bold text-coal md:col-span-2">
                        Cleaning frequency
                        <select
                          className="input-field"
                          value={form.frequency}
                          onChange={(event) => updateField("frequency", event.target.value)}
                        >
                          {frequencyOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-coal">Condition</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {conditionOptions.map((option) => {
                        const isActive = form.condition === option.key;

                        return (
                          <button
                            aria-pressed={isActive}
                            className={selectClass(isActive)}
                            key={option.key}
                            onClick={() => updateField("condition", option.key)}
                            type="button"
                          >
                            <span className="block text-sm font-extrabold">{option.label}</span>
                            <span className="mt-1 block text-xs font-semibold text-stone-500">{option.description}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {activeStep === 2 && (
                <section>
                  <StepTitle icon={Sparkles} eyebrow="Step 3 of 8" title={workspaceMode ? "Commercial add-ons" : "Add-ons"} />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {activeAddOns.map((option) => {
                      const isActive = form.addOns.includes(option.key);

                      return (
                        <button
                          aria-pressed={isActive}
                          className={`flex min-h-14 items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm font-bold transition ${
                            isActive
                              ? "border-coral bg-amber-50 text-coal"
                              : "border-stone-200 bg-white text-stone-700 hover:border-coral hover:bg-mist"
                          }`}
                          key={option.key}
                          onClick={() => toggleAddOn(option.key)}
                          type="button"
                        >
                          <span>{option.label}</span>
                          {isActive && <CheckCircle2 className="shrink-0 text-coral" size={18} aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                  {(form.addOns.includes("carpet_steam") || form.addOns.includes("linen") || workspaceMode) && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      {form.addOns.includes("carpet_steam") && (
                        <QuantitySelect label="Carpet rooms" value={form.carpetRooms} onChange={(value) => updateField("carpetRooms", value)} />
                      )}
                      {form.addOns.includes("linen") && (
                        <QuantitySelect label="Linen sets" value={form.linenSets} onChange={(value) => updateField("linenSets", value)} />
                      )}
                      {workspaceMode && form.addOns.length > 0 && (
                        <QuantitySelect label="Commercial areas" value={form.addOnAreas} onChange={(value) => updateField("addOnAreas", value)} />
                      )}
                    </div>
                  )}
                </section>
              )}

              {activeStep === 3 && (
                <section className="grid gap-5">
                  <StepTitle icon={CalendarCheck} eyebrow="Step 4 of 8" title="Preferred schedule" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-bold text-coal">
                      Preferred date
                      <input className="input-field" type="date" value={form.preferredDate} onChange={(event) => updateField("preferredDate", event.target.value)} />
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-coal">
                      Preferred time
                      <input className="input-field" type="time" value={form.preferredTime} onChange={(event) => updateField("preferredTime", event.target.value)} />
                    </label>
                  </div>
                </section>
              )}

              {activeStep === 4 && (
                <section className="grid gap-5">
                  <StepTitle icon={KeyRound} eyebrow="Step 5 of 8" title="Access and parking" />
                  <label className="grid gap-2 text-sm font-bold text-coal">
                    Property address
                    <input
                      className="input-field"
                      value={form.address}
                      onChange={(event) => updateField("address", event.target.value)}
                      placeholder="Full address or area, for example Canary Wharf, London"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-coal">
                    Access instructions
                    <textarea
                      className="input-field min-h-32 resize-none"
                      value={form.accessInstructions}
                      onChange={(event) => updateField("accessInstructions", event.target.value)}
                      placeholder="Keys, concierge, alarm, entry code, lift details, pets, or anything the team should know."
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-coal">
                    Parking notes
                    <textarea
                      className="input-field min-h-28 resize-none"
                      value={form.parkingNotes}
                      onChange={(event) => updateField("parkingNotes", event.target.value)}
                      placeholder="Driveway, paid parking, permit, loading bay, congestion zone, or nearest option."
                    />
                  </label>
                </section>
              )}

              {activeStep === 5 && <QuoteResult quote={quote} status={status} error={error} />}

              {activeStep === 6 && (
                <section className="grid gap-5">
                  <StepTitle icon={MailCheck} eyebrow="Step 7 of 8" title="Contact details" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-bold text-coal">
                      Name
                      <input className="input-field" value={form.clientName} onChange={(event) => updateField("clientName", event.target.value)} />
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-coal">
                      Email
                      <input className="input-field" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-coal sm:col-span-2">
                      Phone
                      <input className="input-field" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
                    </label>
                    <label className="grid gap-2 text-sm font-bold text-coal sm:col-span-2">
                      Extra notes
                      <textarea
                        className="input-field min-h-28 resize-none"
                        value={form.quoteNotes}
                        onChange={(event) => updateField("quoteNotes", event.target.value)}
                        placeholder="Anything we should review before confirming the scope or requesting photos."
                      />
                    </label>
                  </div>
                </section>
              )}

              {activeStep === 7 && (
                <section className="grid gap-5">
                  <StepTitle icon={CheckCircle2} eyebrow="Step 8 of 8" title="Ready to send" />
                  <div className="rounded-lg bg-mist p-4 text-sm font-semibold leading-6 text-stone-700">
                    Your quote request will go straight to the Velura manager portal for review. This is a guide
                    estimate, and we may reply by email asking for photos before confirming the scope and price.
                  </div>
                  {quoteSubmitStatus === "success" ? (
                    <div className="rounded-lg bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                      Quote request sent. Reference: {submittedReference}
                    </div>
                  ) : (
                    <button className="button-primary w-fit" type="button" onClick={submitQuoteRequest} disabled={quoteSubmitStatus === "submitting"}>
                      {quoteSubmitStatus === "submitting" ? (
                        <Loader2 className="animate-spin" size={18} aria-hidden="true" />
                      ) : (
                        <MailCheck size={18} aria-hidden="true" />
                      )}
                      Submit quote request
                    </button>
                  )}
                  {quoteSubmitStatus === "error" && <div className="rounded-lg bg-rose-50 p-4 text-sm font-bold text-rose-700">{quoteSubmitError}</div>}
                </section>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <button className="button-secondary" onClick={previousStep} type="button" disabled={activeStep === 0}>
                <ChevronLeft size={18} aria-hidden="true" />
                Back
              </button>
              <button className="button-primary" onClick={nextStep} type="button" disabled={activeStep === steps.length - 1}>
                Next
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          </form>

          <aside className="panel h-fit p-5 shadow-lift lg:sticky lg:top-24 lg:min-h-[720px]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Live estimate</p>
                <h2 className="mt-1 min-h-16 text-2xl font-extrabold leading-tight text-coal">{selectedService.title}</h2>
              </div>
              <img className="h-12 w-12 rounded-lg object-contain" src={site.mark} alt="" />
            </div>
            <QuoteResult compact quote={quote} status={status} error={error} />
            <div className="mt-5 grid min-h-[150px] gap-3 rounded-lg bg-mist p-4 text-sm font-semibold text-stone-600">
              <p className="flex min-h-8 items-center gap-2">
                <CalendarCheck size={16} className="shrink-0 text-coral" aria-hidden="true" />
                <span className="truncate">{form.preferredDate || "No date selected"} {form.preferredTime || ""}</span>
              </p>
              <p className="flex min-h-8 items-center gap-2">
                <MapPin size={16} className="shrink-0 text-coral" aria-hidden="true" />
                <span className="truncate">{form.address || "Address not added"}</span>
              </p>
              <p className="flex min-h-8 items-center gap-2">
                <KeyRound size={16} className="shrink-0 text-coral" aria-hidden="true" />
                <span className="truncate">{form.accessInstructions ? "Access instructions added" : "Access instructions not added"}</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function StepTitle({ eyebrow, icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-coal text-white">
        <Icon size={20} aria-hidden="true" />
      </div>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="text-2xl font-extrabold text-coal">{title}</h2>
      </div>
    </div>
  );
}

function QuantitySelect({ label, onChange, value }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-coal">
      {label}
      <select className="input-field" value={value} onChange={(event) => onChange(Number(event.target.value))}>
        {numberOptions(10)
          .slice(1)
          .map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
      </select>
    </label>
  );
}

function QuoteResult({ compact = false, error, quote, status }) {
  if (status === "loading" && !quote) {
    return (
      <div className="mt-5">
        <div className="grid min-h-[178px] place-items-center rounded-lg bg-coal p-5 text-white">
          <div className="flex items-center gap-3 text-sm font-bold text-stone-200">
            <Loader2 className="animate-spin text-gold" size={18} aria-hidden="true" />
            Calculating estimate
          </div>
        </div>
        <p className="mt-4 min-h-12 text-xs font-semibold leading-5 text-stone-500">
          This is a guide estimate. The confirmed price may change after photos, access, parking, property condition, and full scope are reviewed.
        </p>
      </div>
    );
  }

  if (status === "error" && !quote) {
    return <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>;
  }

  if (!quote) {
    return null;
  }

  return (
    <div className={compact ? "mt-5 min-h-[296px]" : "mt-5"}>
      <div className="relative min-h-[178px] rounded-lg bg-coal p-5 text-white">
        {status === "loading" && (
          <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-stone-200">
            <Loader2 className="animate-spin text-gold" size={13} aria-hidden="true" />
            Updating
          </div>
        )}
        <p className="min-h-6 pr-28 text-sm font-bold text-stone-300">{quote.propertyLabel}</p>
        <p className="mt-2 min-h-[3.25rem] text-4xl font-extrabold leading-tight text-gold tabular-nums">{quote.displayPrice}</p>
        {quote.estimatedDurationHours && (
          <p className="mt-2 min-h-6 text-sm font-semibold text-stone-200">
            Estimated duration: <span className="tabular-nums">{quote.estimatedDurationHours}</span> hours
          </p>
        )}
      </div>

      {quote.needsInspection ? (
        <div className="mt-4 rounded-lg border border-coral/40 bg-amber-50 p-4 text-sm font-semibold leading-6 text-stone-700">
          {quote.caveat}
        </div>
      ) : (
        !compact && (
          <div className="mt-4 grid gap-3">
            {quote.breakdown.map((line) => (
              <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-3" key={`${line.label}-${line.detail}`}>
                <div>
                  <p className="text-sm font-extrabold text-coal">{line.label}</p>
                  <p className="mt-1 text-xs font-semibold text-stone-500">{line.detail}</p>
                </div>
                <p className="shrink-0 text-sm font-extrabold text-coal">{line.displayPrice}</p>
              </div>
            ))}
          </div>
        )
      )}

      <p className="mt-4 min-h-12 text-xs font-semibold leading-5 text-stone-500">{quote.caveat}</p>
    </div>
  );
}
