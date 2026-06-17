import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import { site } from "../config/site.js";

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

export default function Services() {
  return (
    <>
      <PageHeader
        eyebrow="Services"
        title="Cleaning services for homes, handovers, offices, and commercial premises."
        description="Choose regular care, a deep reset, tenancy support, commercial cleaning, or short-stay turnover work with clear scope and notes from the start."
      />

      <section className="bg-mist">
        <div className="section-shell grid gap-4 py-14 sm:py-18 md:grid-cols-2">
          {site.services.map((service, index) => (
            <motion.article
              key={service.title}
              className="panel p-6"
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.06 }}
            >
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-mist text-coral">
                <service.icon size={23} aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold text-coal">{service.title}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">{service.description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="section-shell py-14 sm:py-18">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Scope</p>
              <h2 className="mt-3 text-3xl font-extrabold text-coal sm:text-4xl">What Velura can cover</h2>
            </div>
            <Link className="button-primary" to="/portal/quote">
              Instant quote
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {serviceDetails.map((detail) => (
              <article key={detail.title} className="panel p-6">
                <p className="text-xl font-extrabold text-coal">{detail.title}</p>
                <p className="mt-4 text-sm leading-6 text-stone-600 sm:text-base">{detail.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
