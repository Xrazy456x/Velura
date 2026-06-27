import { ArrowRight, CheckCircle2, ClipboardCheck, Clock3, KeyRound, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";

const serviceDetails = [
  {
    title: "Regular and deep residential cleans",
    body: "Regular cleans keep kitchens, bathrooms, floors, dusting, touchpoints, and presentation under control. Deep cleans add more time for build-up, trims, glass, appliance edges, and the detailed areas that need a slower reset."
  },
  {
    title: "End-of-tenancy and HMO resets",
    body: "Move-out and HMO work is scoped around property size, condition, bathrooms, optional carpet cleaning, oven/fridge extras, access instructions, and parking requirements."
  },
  {
    title: "Office and commercial cleaning",
    body: "Workspace quotes use office/commercial add-ons such as washroom sanitising, desk and touchpoint cleaning, internal glass, waste reset, consumables restock, staff kitchen points, and floor-machine work."
  },
  {
    title: "Short-stay turnovers",
    body: "Airbnb and short-stay resets focus on reliable timing, fresh presentation, kitchen and bathroom readiness, linen options, and notes that help cleaners move cleanly between bookings."
  }
];

const capabilityRows = [
  {
    label: "Residential",
    title: "Regular care and detailed resets",
    detail:
      "Calm weekly or fortnightly maintenance cleans sit alongside careful top-to-bottom deep refreshes for kitchens, bathrooms, bedrooms, skirting, glass, and touchpoints.",
    tags: ["Signature home", "Regular", "Deep refresh"]
  },
  {
    label: "Property handover",
    title: "Tenancy, move-in, and move-out cleaning",
    detail:
      "Move-in, move-out, HMO, and student-property work is checklist-led for landlords, tenants, and agents, with add-ons and property condition reviewed before confirmation.",
    tags: ["End of tenancy", "HMO", "Student"]
  },
  {
    label: "Commercial",
    title: "Office, studio, and shared-space cleaning",
    detail:
      "Discreet office and studio care is shaped around opening times, washrooms, touchpoints, shared areas, internal glass, waste reset, floor care, and daily presentation.",
    tags: ["Office", "Studio", "Retail", "Premises"]
  },
  {
    label: "Short stay",
    title: "Turnovers with presentation detail",
    detail: "For Airbnb and short-let properties where timing, reset quality, linen notes, and cleaner instructions matter.",
    tags: ["Airbnb", "Short-let", "Linen notes"]
  }
];

const qualitySteps = [
  {
    icon: ClipboardCheck,
    title: "Scope",
    body: "Service, property type, condition, add-ons, access, and parking are captured before the job is confirmed."
  },
  {
    icon: Clock3,
    title: "Schedule",
    body: "Bookings sit on the manager calendar with duration, reference number, and assigned cleaner notes."
  },
  {
    icon: KeyRound,
    title: "Access",
    body: "Important property instructions are visible before arrival so the clean can start smoothly."
  },
  {
    icon: CheckCircle2,
    title: "Close",
    body: "Managers can confirm completion, invoice, and keep a record of the communication trail."
  }
];

export default function Services() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Cleaning services for homes, handovers, offices, and commercial premises."
        description="Choose regular care, a deep reset, tenancy support, commercial cleaning, or short-stay turnover work with clear scope and notes from the start."
      />

      <section className="bg-white">
        <div className="section-shell py-14 sm:py-18">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="eyebrow">Capability index</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-coal sm:text-5xl">
                Cleanly separated services, clearly scoped.
              </h2>
              <p className="mt-5 text-base leading-7 text-stone-600">
                Residential, handover, commercial, and short-stay work each need a different brief. Velura keeps the
                scope clear before the team arrives.
              </p>
              <Link className="button-primary mt-7" to="/quote">
                Instant quote
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>

            <div className="border-y border-stone-200">
              {capabilityRows.map((row, index) => (
                <motion.article
                  key={row.title}
                  className="grid gap-4 border-b border-stone-200 py-6 last:border-b-0 md:grid-cols-[150px_1fr] lg:grid-cols-[170px_minmax(300px,0.9fr)_minmax(420px,1.1fr)] lg:items-start"
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.22 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">{row.label}</p>
                  <div>
                    <h3 className="text-2xl font-extrabold leading-tight text-coal">{row.title}</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {row.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-mist px-3 py-1 text-xs font-bold text-berry">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-stone-600 sm:text-base">{row.detail}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-mist">
        <div className="section-shell py-14 sm:py-18">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Scope notes</p>
              <h2 className="mt-3 text-3xl font-extrabold text-coal sm:text-4xl">What Velura can cover</h2>
            </div>
            <Sparkles className="hidden text-coral sm:block" size={32} aria-hidden="true" />
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {serviceDetails.map((detail, index) => (
              <motion.article
                key={detail.title}
                className="border border-stone-200 bg-white p-6 shadow-soft"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.05 }}
              >
                <p className="text-xl font-extrabold text-coal">{detail.title}</p>
                <p className="mt-4 text-sm leading-6 text-stone-600 sm:text-base">{detail.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-coal text-white">
        <div className="section-shell py-14 sm:py-18">
          <div className="max-w-3xl">
            <p className="eyebrow text-gold">Quality protocol</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">
              The premium feeling comes from the process around the clean.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {qualitySteps.map((step, index) => (
              <motion.article
                key={step.title}
                className="border border-white/15 bg-white/10 p-5"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between gap-4">
                  <step.icon className="text-gold" size={22} aria-hidden="true" />
                  <span className="text-sm font-extrabold text-coral">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-5 text-xl font-extrabold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-stone-300">{step.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
