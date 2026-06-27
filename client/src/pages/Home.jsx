import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  KeyRound,
  LineChart,
  MessageSquareText,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { site } from "../config/site.js";

const serviceIndex = [
  {
    number: "01",
    title: "Private homes",
    description: "Quiet weekly, fortnightly, and deep residential care for spaces that need a composed finish.",
    meta: "Regular / Deep"
  },
  {
    number: "02",
    title: "Tenancy handovers",
    description: "Checklist-led move-in and move-out cleaning with notes for access, parking, add-ons, and condition.",
    meta: "EOT / HMO"
  },
  {
    number: "03",
    title: "Commercial spaces",
    description: "Office, studio, salon, and shared-area cleaning shaped around timing, touchpoints, and presentation.",
    meta: "Office / Retail"
  }
];

const workflowHighlights = [
  {
    icon: MessageSquareText,
    title: "One clear client thread",
    body: "Quotes, photo requests, ownership, and booking notes sit in one operational view."
  },
  {
    icon: CalendarCheck,
    title: "Diary before delivery",
    body: "Bookings carry reference numbers, cleaner assignments, access notes, and parking detail."
  },
  {
    icon: KeyRound,
    title: "Access handled carefully",
    body: "Managers can keep important property instructions visible before the cleaner arrives."
  }
];

export default function Home() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-coal text-white">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={site.heroImage}
          alt="Bright luxury living room prepared for a professional clean"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-coal/95 via-coal/76 to-coal/32" aria-hidden="true" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(222,192,111,0.18),transparent_35%,rgba(119,133,110,0.22))]" aria-hidden="true" />
        <div className="section-shell relative grid min-h-[82vh] items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="flex flex-wrap items-center gap-3">
              <img className="w-56 max-w-full drop-shadow-[0_18px_45px_rgba(0,0,0,0.45)] sm:w-72" src={site.logo} alt="Velura logo" />
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-stone-100 backdrop-blur">
                London-led, available beyond
              </span>
            </div>
            <p className="mt-8 inline-flex text-xs font-bold uppercase tracking-[0.16em] text-coral">{site.tagline}</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Calm, detailed cleaning for homes and commercial spaces.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-100 drop-shadow sm:text-xl">
              A refined cleaning service for London and surrounding areas, with flexibility for selected work further
              afield when the scope is right.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="button-primary bg-white text-coal hover:bg-stone-100" to="/quote">
                Instant quote
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="button-secondary border-white/35 bg-white/10 text-white hover:bg-white hover:text-coal" to="/services">
                Explore services
                <ChevronRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {site.stats.map((item) => (
                <div key={item.label} className="border-t border-white/25 pt-3">
                  <p className="text-2xl font-extrabold">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold text-stone-200">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lift backdrop-blur-xl">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22, duration: 0.9, ease: "easeOut" }}>
                <div className="flex items-center justify-between gap-5 border-b border-white/15 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">Velura operating standard</p>
                    <p className="mt-2 text-2xl font-extrabold">Scope before shine.</p>
                  </div>
                  <Sparkles className="text-gold" size={28} aria-hidden="true" />
                </div>
                <div className="divide-y divide-white/15">
                  {workflowHighlights.map((item) => (
                    <div key={item.title} className="grid grid-cols-[auto_1fr] gap-4 py-5">
                      <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/20 bg-coal/35 text-coral">
                        <item.icon size={20} aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-lg font-extrabold">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-stone-200">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-mist">
        <div className="border-y border-stone-200 bg-white/60 py-4">
          <div className="section-shell flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-stone-500">
            {["Residential", "End of tenancy", "Office care", "Commercial", "Airbnb turnover", "After builders"].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div className="section-shell py-14 sm:py-18">
          <div className="max-w-3xl">
            <p className="eyebrow">Service index</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-coal sm:text-5xl">
              Every clean starts with the right kind of brief.
            </h2>
          </div>
          <div className="mt-10 border-y border-stone-200">
            {serviceIndex.map((item, index) => (
              <motion.article
                key={item.title}
                className="group grid gap-4 border-b border-stone-200 py-6 last:border-b-0 md:grid-cols-[72px_1fr] lg:grid-cols-[90px_minmax(280px,0.85fr)_minmax(460px,1.25fr)_220px] lg:items-start"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.24 }}
                transition={{ delay: index * 0.05 }}
              >
                <p className="text-sm font-extrabold text-coral">{item.number}</p>
                <h3 className="text-3xl font-extrabold text-coal transition group-hover:text-berry">{item.title}</h3>
                <p className="max-w-2xl text-sm leading-6 text-stone-600 sm:text-base">{item.description}</p>
                <span className="w-fit rounded-full border border-coral/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-berry lg:justify-self-end">
                  {item.meta}
                </span>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="section-shell grid gap-10 py-14 sm:py-18 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Built for operators</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-coal sm:text-4xl">
              Premium cleaning with quiet operational discipline.
            </h2>
            <p className="mt-5 text-base leading-7 text-stone-600">
              Velura presents calmly to customers while the manager portal keeps quote reviews, bookings, assigned
              cleaners, invoices, client communication, and quality notes in one reliable workflow.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="button-primary" to="/quote">
                Get an instant quote
                <ClipboardList size={18} aria-hidden="true" />
              </Link>
              <Link className="button-secondary" to="/about">
                Meet the system
              </Link>
            </div>
          </div>

          <div className="overflow-hidden border border-stone-200 bg-mist shadow-soft">
            <div className="border-b border-stone-200 bg-coal px-5 py-4 text-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">Booking snapshot</p>
                  <p className="mt-1 text-lg font-extrabold">Velura client care</p>
                </div>
                <BadgeCheck className="text-gold" size={24} aria-hidden="true" />
              </div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              {[
                { icon: ClipboardList, label: "New inquiries", value: "24", tone: "bg-amber-50 text-coral" },
                { icon: LineChart, label: "Repeat bookings", value: "68%", tone: "bg-stone-100 text-leaf" },
                { icon: ShieldCheck, label: "Insured teams", value: "3", tone: "bg-rose-50 text-berry" }
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-stone-200 p-4">
                  <div className={`grid h-9 w-9 place-items-center rounded-lg ${item.tone}`}>
                    <item.icon size={18} aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-2xl font-extrabold text-coal">{item.value}</p>
                  <p className="text-sm font-semibold text-stone-500">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-200 p-5">
              <div className="space-y-3">
                {[
                  ["Kensington townhouse", "new", "Signature clean"],
                  ["Mayfair apartment", "contacted", "Deep refresh"],
                  ["Shoreditch studio", "closed", "Move-out clean"]
                ].map(([name, status, label]) => (
                  <div key={name} className="flex items-center justify-between gap-3 rounded-lg bg-mist p-3">
                    <div>
                      <p className="text-sm font-bold text-coal">{name}</p>
                      <p className="text-xs font-semibold text-stone-500">{label}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold capitalize text-stone-700 ring-1 ring-stone-200">
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-coal text-white">
        <div className="section-shell grid gap-8 py-14 sm:py-18 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="eyebrow text-gold">Method</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">The clean is only one part of the service.</h2>
            <p className="mt-5 text-base leading-7 text-stone-300">
              The strongest premium service is felt before the team arrives: expectations are clear, access is known,
              the cleaner understands the property, and the client knows what happens next.
            </p>
          </div>
          <div className="divide-y divide-white/15 border-y border-white/15">
            {site.process.map((item, index) => (
              <motion.article
                key={item.title}
                className="grid gap-5 py-7 sm:grid-cols-[auto_1fr]"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="text-sm font-extrabold text-coral">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <div className="flex items-center gap-3">
                    <item.icon className="text-gold" size={21} aria-hidden="true" />
                    <h3 className="text-2xl font-extrabold">{item.title}</h3>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300 sm:text-base">{item.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
