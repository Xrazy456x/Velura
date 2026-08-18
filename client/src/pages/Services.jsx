import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import ReviewCarousel from "../components/ReviewCarousel.jsx";
import { site } from "../config/site.js";

const capabilityRows = [
  {
    label: "Residential",
    title: "Regular care and detailed resets",
    detail:
      "Weekly or fortnightly maintenance cleans sit alongside careful top-to-bottom refreshes for kitchens, bathrooms, bedrooms, skirting, glass, and touchpoints.",
    tags: ["Regular", "Deep refresh"]
  },
  {
    label: "Property handover",
    title: "Tenancy, move-in, and move-out cleaning",
    detail:
      "Move-in, move-out, HMO, and student-property work is checklist-led, with add-ons and property condition reviewed before confirmation.",
    tags: ["End of tenancy", "HMO", "Student"]
  },
  {
    label: "Commercial",
    title: "Office, studio, and shared-space cleaning",
    detail:
      "Discreet care shaped around opening times, washrooms, touchpoints, internal glass, waste reset, floor care, and daily presentation.",
    tags: ["Office", "Studio", "Premises"]
  },
  {
    label: "Short stay",
    title: "Turnovers with presentation detail",
    detail: "Reliable resets for Airbnb and short-let properties where timing, linen notes, and cleaner instructions matter.",
    tags: ["Airbnb", "Short-let"]
  }
];

export default function Services() {
  return (
    <>
      <PageHeader
        eyebrow="About & services"
        title="Thoughtful cleaning, shaped around the space."
        description="Velura brings calm, detailed care to homes, handovers, workspaces, and short-stay properties across London and surrounding areas."
      />

      <section className="bg-white">
        <div className="section-shell grid gap-10 py-14 sm:py-18 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative min-h-[460px] overflow-hidden rounded-2xl bg-stone-100 shadow-soft">
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src="/cleaning-gallery/kitchen-finish.jpg"
              alt="A bright kitchen carefully prepared by Velura"
            />
            <div className="absolute inset-x-5 bottom-5 rounded-xl border border-white/40 bg-coal/75 p-5 text-white backdrop-blur-md sm:inset-x-7 sm:bottom-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">The Velura standard</p>
              <p className="mt-2 text-xl font-extrabold">Luxury cleaning, gently delivered.</p>
            </div>
          </div>

          <div>
            <p className="eyebrow">Who we are</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-coal sm:text-5xl">A considered service, without the noise.</h2>
            <p className="mt-5 text-base leading-7 text-stone-600">
              We believe premium cleaning should feel straightforward: a clear brief, respectful access, careful work,
              and a space that feels properly reset when we leave.
            </p>
            <p className="mt-4 text-base leading-7 text-stone-600">
              Every booking is scoped before it is confirmed, so the team understands the property, timing, add-ons,
              and finishing details that matter to you.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {site.values.map((value) => (
                <article className="rounded-xl border border-stone-200 bg-mist p-4" key={value.title}>
                  <value.icon className="text-coral" size={21} aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-extrabold leading-5 text-coal">{value.title}</h3>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ReviewCarousel />

      <section className="bg-mist">
        <div className="section-shell py-14 sm:py-18">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="eyebrow">What we do</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-coal sm:text-5xl">One team, four clear service areas.</h2>
              <p className="mt-5 text-base leading-7 text-stone-600">
                Choose the service that fits your space. We will confirm condition, access, timing, and any extras before the booking goes ahead.
              </p>
              <Link className="button-primary mt-7" to="/quote">Instant quote <ArrowRight size={18} aria-hidden="true" /></Link>
            </div>

            <div className="border-y border-stone-300">
              {capabilityRows.map((row, index) => (
                <motion.article
                  key={row.title}
                  className="grid gap-4 border-b border-stone-300 py-6 last:border-b-0 md:grid-cols-[150px_1fr] lg:grid-cols-[150px_minmax(240px,0.9fr)_minmax(320px,1.1fr)] lg:items-start"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-coral">{row.label}</p>
                  <div>
                    <h3 className="text-xl font-extrabold leading-tight text-coal sm:text-2xl">{row.title}</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {row.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-berry">{tag}</span>
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

      <section className="bg-coal py-12 text-white">
        <div className="section-shell flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-gold">
              <Sparkles size={18} />
              <span className="text-xs font-bold uppercase tracking-[0.16em]">Ready when you are</span>
            </div>
            <h2 className="mt-3 text-3xl font-extrabold">Tell us about your space.</h2>
            <p className="mt-3 text-stone-300">You will see clear pricing and can include the add-ons your clean needs.</p>
          </div>
          <Link className="button-primary shrink-0 bg-white text-coal hover:bg-stone-100" to="/quote">Start your quote <ArrowRight size={18} /></Link>
        </div>
      </section>
    </>
  );
}
