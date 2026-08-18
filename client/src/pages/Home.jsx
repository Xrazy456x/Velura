import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  MessageSquareText,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { site } from "../config/site.js";

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
    body: "Managers keep important property instructions visible before the cleaner arrives."
  }
];

const gallery = [
  { src: "/cleaning-gallery/kitchen-finish.jpg", alt: "Freshly cleaned bright kitchen", label: "Kitchen finish" },
  { src: "/cleaning-gallery/living-room-finish.jpg", alt: "Freshly prepared living room", label: "Living space" },
  { src: "/cleaning-gallery/bathroom-finish.jpg", alt: "Freshly cleaned tiled bathroom", label: "Bathroom detail" },
  { src: "/cleaning-gallery/bedroom-finish.jpg", alt: "Freshly prepared bedroom", label: "Bedroom reset" },
  { src: "/cleaning-gallery/wardrobe-room-finish.jpg", alt: "Clean and prepared wardrobe room", label: "Move-in preparation" }
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
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:180px_100%]"
          aria-hidden="true"
        />

        <div className="section-shell relative grid min-h-[82vh] items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <img
                className="w-56 max-w-full drop-shadow-[0_18px_45px_rgba(0,0,0,0.5)] sm:w-72"
                src={site.logo}
                alt="Velura logo"
              />
              <span className="w-fit rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                London-led, available beyond
              </span>
            </div>

            <p className="mt-10 text-xs font-bold uppercase tracking-[0.16em] text-gold">{site.tagline}</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-extrabold leading-[0.98] text-white sm:text-6xl xl:text-7xl">
              Calm, detailed cleaning for homes and commercial spaces.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-stone-100 sm:text-lg">
              A refined cleaning service for London and surrounding areas, with flexibility for selected work further
              afield when the scope is right.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="button-primary bg-white text-coal hover:bg-stone-100" to="/quote">
                Instant quote <ArrowRight size={18} />
              </Link>
              <Link className="button-secondary border-white/35 bg-white/10 text-white hover:bg-white hover:text-coal" to="/services">
                About &amp; services <ChevronRight size={18} />
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 border-y border-white/20 py-5">
              {site.stats.map((stat) => (
                <div className="border-r border-white/20 px-3 first:pl-0 last:border-r-0" key={stat.label}>
                  <p className="text-2xl font-extrabold text-white sm:text-3xl">{stat.value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-300 sm:text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.aside
            className="hidden rounded-2xl border border-white/25 bg-stone-300/45 p-7 shadow-2xl backdrop-blur-xl lg:block"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, delay: 0.12 }}
          >
            <div className="flex items-center justify-between gap-6 border-b border-white/25 pb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">Velura operating standard</p>
                <h2 className="mt-3 text-3xl font-extrabold text-white">Scope before shine.</h2>
              </div>
              <Sparkles className="shrink-0 text-gold" size={32} aria-hidden="true" />
            </div>

            <div>
              {workflowHighlights.map((item) => (
                <div className="grid grid-cols-[52px_1fr] gap-4 border-b border-white/20 py-6 last:border-b-0 last:pb-0" key={item.title}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-coal/35">
                    <item.icon className="text-gold" size={22} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-stone-100">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.aside>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-18">
        <div className="section-shell">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">Recent work</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight text-coal sm:text-4xl">Real spaces, carefully finished.</h2>
              <p className="mt-4 text-base leading-7 text-stone-600">A look at some of the homes our team has recently prepared and refreshed.</p>
            </div>
            <Link className="button-secondary shrink-0" to="/quote">Book your clean</Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {gallery.map((image) => (
              <figure className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-stone-100 shadow-sm" key={image.src}>
                <img
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-coal/75 to-transparent px-4 pb-4 pt-12 text-sm font-bold text-white">
                  {image.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gold/15 py-10 sm:py-12">
        <div className="section-shell">
          <div className="mx-auto grid max-w-5xl gap-6 rounded-2xl bg-white p-6 shadow-soft sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-coral">
                <Sparkles size={18} />
                <span className="text-xs font-extrabold uppercase tracking-[0.14em]">Ready when you are</span>
              </div>
              <h2 className="mt-3 text-2xl font-extrabold leading-tight text-coal sm:text-3xl">Let’s make your space feel refreshed.</h2>
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-stone-600">
                <CheckCircle2 size={17} className="shrink-0 text-leaf" /> Clear pricing before you book.
              </p>
            </div>
            <Link className="button-primary w-full shrink-0 sm:w-fit" to="/quote">Start your quote <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
