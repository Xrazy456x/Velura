import PageHeader from "../components/PageHeader.jsx";
import { site } from "../config/site.js";

const sections = [
  {
    title: "Quotes and estimates",
    body: "Instant quotes are guide prices based on the details provided. Final pricing may change after Velura confirms property size, condition, access, parking, add-ons, congestion charges, specialist work, or heavy build-up."
  },
  {
    title: "Bookings",
    body: "A booking is confirmed only when Velura accepts the job and agrees the date, time, scope, and communication method. Managers may contact you by email, text message, or phone to confirm details."
  },
  {
    title: "Access and parking",
    body: "Clients are responsible for providing safe access, accurate entry instructions, parking information, permits where needed, and any site rules. Delays, failed access, or parking charges may affect timing and price."
  },
  {
    title: "Cancellations and changes",
    body: "Please tell Velura as early as possible if a booking needs to change. Late cancellations, lockouts, or major scope changes may be chargeable where staff time has been reserved."
  },
  {
    title: "Service limits",
    body: "Velura does not handle hazardous waste, pest infestations, unsafe areas, biohazards, mould remediation, high-level exterior work, or any task that requires specialist licensing unless agreed in writing."
  },
  {
    title: "Client responsibilities",
    body: "Clients should secure valuables, fragile items, cash, medication, confidential documents, and personal items before a visit. Pets, alarms, keys, and building rules should be clearly explained before the clean."
  },
  {
    title: "Quality follow-up",
    body: "If something is missed, contact Velura promptly with photos or details so the team can review the issue and decide the appropriate follow-up."
  },
  {
    title: "Website and manager portal",
    body: "The website, quote calculator, and manager portal are provided to help organise inquiries, quote reviews, bookings, and employees. Access to manager tools is restricted to authorised accounts."
  }
];

export default function Terms() {
  return (
    <>
      <PageHeader
        eyebrow="Terms"
        title="Velura service terms."
        description="A starter set of booking, quote, access, parking, and service terms for Velura cleaning work."
      />

      <section className="bg-mist">
        <div className="section-shell grid gap-4 py-14 sm:py-18">
          {sections.map((section) => (
            <article key={section.title} className="panel p-6">
              <h2 className="text-xl font-extrabold text-coal">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">{section.body}</p>
            </article>
          ))}
          <article className="panel p-6">
            <h2 className="text-xl font-extrabold text-coal">Contact</h2>
            <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
              Questions about these terms can be sent to{" "}
              <a className="font-bold text-berry hover:underline" href={`mailto:${site.contactEmail}`}>
                {site.contactEmail}
              </a>
              . These starter terms should be reviewed before public launch.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
