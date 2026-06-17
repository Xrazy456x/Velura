import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, ChevronRight, ClipboardList, LineChart, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import ReviewCarousel from "../components/ReviewCarousel.jsx";
import { site } from "../config/site.js";

export default function Home() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-coal text-white">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={site.heroImage}
          alt="Bright luxury living room prepared for a professional clean"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-coal/95 via-coal/72 to-coal/20" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-coal/45 via-transparent to-white/5" aria-hidden="true" />
        <div className="section-shell relative flex min-h-[76vh] items-center py-16 sm:py-20">
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <img className="mb-6 w-64 max-w-full drop-shadow-[0_18px_45px_rgba(0,0,0,0.45)] sm:w-80" src={site.logo} alt="Velura logo" />
            <p className="inline-flex rounded-full border border-coral/45 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-coral">
              {site.tagline}
            </p>
            <h1 className="mt-6 text-5xl font-extrabold uppercase leading-[1.02] tracking-[0.16em] sm:text-6xl lg:text-7xl">
              {site.name}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-100 drop-shadow sm:text-xl">
              A refined cleaning company for homes, apartments, offices, and short-stay spaces that deserve a calm,
              careful, beautifully finished clean.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="button-primary bg-white text-coal hover:bg-stone-100" to="/portal/quote">
                Instant quote
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="button-secondary border-white/35 bg-white/10 text-white hover:bg-white hover:text-coal" to="/portal/services">
                Explore services
                <ChevronRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {site.stats.map((item) => (
                <div key={item.label} className="rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur">
                  <p className="text-2xl font-extrabold">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold text-stone-200">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-mist">
        <div className="section-shell grid gap-4 py-12 md:grid-cols-4">
          {site.process.map((item, index) => (
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
        <div className="section-shell grid gap-10 py-14 sm:py-18 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="eyebrow">Built for operators</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-coal sm:text-4xl">
              Premium cleaning with quiet operational discipline.
            </h2>
            <p className="mt-5 text-base leading-7 text-stone-600">
              Velura presents as calm and luxurious to customers, while the dashboard keeps inquiries, client
              messages, job status, users, and Google reviews organised behind the scenes.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="button-primary" to="/portal/quote">
                Get an instant quote
                <ClipboardList size={18} aria-hidden="true" />
              </Link>
              <Link className="button-secondary" to="/portal/about">
                Meet the system
              </Link>
            </div>
          </div>

          <div className="panel overflow-hidden">
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

      <ReviewCarousel />
    </>
  );
}
