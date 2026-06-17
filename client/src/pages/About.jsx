import { motion } from "framer-motion";
import PageHeader from "../components/PageHeader.jsx";
import { site } from "../config/site.js";

export default function About() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="Residential polish and commercial reliability, delivered with care."
        description="Velura supports homes, offices, short-stay spaces, and commercial premises with gentle products, thoughtful routines, and organised client care behind every visit."
      />

      <section className="bg-mist">
        <div className="section-shell grid gap-8 py-14 sm:py-18 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="overflow-hidden rounded-lg shadow-soft">
            <img
              className="h-full min-h-[360px] w-full object-cover"
              src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1400&q=85"
              alt="Luxury bathroom finished after a professional clean"
            />
          </div>
          <div>
            <p className="eyebrow">Velura standard</p>
            <h2 className="mt-3 text-3xl font-extrabold text-coal sm:text-4xl">
              A considered finish for private spaces and working environments.
            </h2>
            <p className="mt-5 text-base leading-7 text-stone-600">
              From a family bathroom to a team washroom, from a short-stay reset to an office clean before opening,
              Velura is designed to feel discreet, dependable, and beautifully considered in every space we care for.
            </p>
            <p className="mt-4 text-base leading-7 text-stone-600">
              Commercial clients need repeatable scopes, cleaner assignment, access notes, parking details, and clear
              follow-up. Velura keeps that operational detail quiet in the background so the service feels calm at the door.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {site.values.map((item, index) => (
                <motion.article
                  key={item.title}
                  className="panel p-4"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.06 }}
                >
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-mist text-coral">
                    <item.icon size={20} aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-extrabold text-coal">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{item.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="section-shell py-14 sm:py-18">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {site.industries.map((item) => (
              <article key={item.name} className="rounded-lg border border-stone-200 bg-mist p-5">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-coral">
                  <item.icon size={20} aria-hidden="true" />
                </div>
                <p className="mt-5 text-lg font-extrabold text-coal">{item.name}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
