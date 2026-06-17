import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { site } from "../config/site.js";

export default function ComingSoon() {
  const launchHighlights = [
    {
      title: "Residential care",
      description: "Signature home cleans, deep refreshes, move-in support, and end-of-tenancy preparation.",
      icon: Sparkles
    },
    {
      title: "Commercial spaces",
      description: "Office, studio, shared-area, washroom, and touchpoint cleaning for composed workspaces.",
      icon: ShieldCheck
    },
    {
      title: "Private booking portal",
      description: "Approved accounts can already access quotes, inquiries, bookings, and manager tools.",
      icon: LockKeyhole
    }
  ];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-coal text-white">
        <img
          className="absolute inset-0 h-full w-full object-cover object-center"
          src={site.heroImage}
          alt="Bright luxury interior prepared for Velura cleaning"
        />
        <div className="absolute inset-0 bg-coal/50" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-coal/95 via-coal/90 to-coal/70" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-coal/75 via-coal/20 to-white/5" aria-hidden="true" />

        <div className="section-shell relative flex min-h-[76vh] items-center py-16 sm:py-20">
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <p className="inline-flex rounded-full border border-coral/50 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-gold backdrop-blur">
              Coming soon
            </p>
            <h1 className="mt-6 text-4xl font-extrabold uppercase leading-[1.02] tracking-[0.12em] drop-shadow sm:text-6xl sm:tracking-[0.14em] lg:text-7xl">
              {site.name}
            </h1>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-coral sm:text-base">{site.tagline}</p>
            <p className="mt-6 max-w-2xl text-base leading-7 text-stone-100 drop-shadow sm:text-xl sm:leading-8">
              A refined cleaning company for homes, apartments, offices, and commercial spaces. The full public site is
              coming soon; approved accounts can access the private Velura portal.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="button-primary bg-white text-coal hover:bg-stone-100" to="/login">
                Portal login
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a className="button-secondary border-white/35 bg-white/10 text-white hover:bg-white hover:text-coal" href={`mailto:${site.contactEmail}`}>
                <Mail size={18} aria-hidden="true" />
                {site.contactEmail}
              </a>
            </div>

            <div className="mt-10 hidden max-w-2xl gap-3 sm:grid sm:grid-cols-3">
              {[
                ["Launch status", "Preparing"],
                ["Services", "Home & commercial"],
                ["Portal", "Account access"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur">
                  <p className="text-lg font-extrabold">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-stone-200">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-mist">
        <div className="section-shell grid gap-4 py-12 md:grid-cols-3">
          {launchHighlights.map((item, index) => (
            <motion.article
              key={item.title}
              className="panel p-5"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.06 }}
            >
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-mist text-coral">
                <item.icon size={21} aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-lg font-extrabold text-coal">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="section-shell grid gap-8 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Velura launch</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-coal sm:text-4xl">
              Luxury cleaning, gently delivered.
            </h2>
            <p className="mt-5 text-base leading-7 text-stone-600">
              We are preparing the public website with service details, online quotes, and contact options. Until then,
              the private portal remains available for approved Velura accounts.
            </p>
          </div>

          <div className="panel p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-coal text-white">
                  <CalendarCheck size={21} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-coal">Private portal access</p>
                  <p className="text-sm font-semibold text-stone-500">For approved Velura accounts only</p>
                </div>
              </div>
              <Link className="button-primary" to="/login">
                Login
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
