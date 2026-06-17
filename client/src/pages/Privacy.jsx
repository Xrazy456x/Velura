import PageHeader from "../components/PageHeader.jsx";
import { site } from "../config/site.js";

const sections = [
  {
    title: "Information Velura collects",
    body: "Velura may collect your name, email, phone number, property or company name, service choice, quote selections, preferred date and time, access instructions, parking notes, booking notes, and messages you send through the website."
  },
  {
    title: "How the information is used",
    body: "We use your information to prepare quotes, respond to inquiries, arrange bookings, assign cleaners, send service communications, maintain client records, manage quality, and keep audit records for security and accountability."
  },
  {
    title: "Cleaner and manager access",
    body: "Authorised managers can access inquiries, bookings, cleaner schedules, messages, and audit logs. Cleaner assignment information is used to organise work and give the assigned team the details needed to complete a visit."
  },
  {
    title: "Storage and retention",
    body: "Velura keeps records only for as long as needed for service delivery, legal, tax, accounting, insurance, dispute, quality, and audit purposes. Records should be reviewed regularly and deleted or anonymised when no longer needed."
  },
  {
    title: "Sharing",
    body: "Velura does not sell personal information. Data may be shared with trusted service providers such as hosting, email, SMS, database, analytics, or payment providers where needed to operate the service."
  },
  {
    title: "Security",
    body: "The manager portal uses account access controls, password hashing, protected API routes, and audit logging. No system is risk-free, so access should be limited to trained managers and credentials should be kept private."
  },
  {
    title: "Your rights",
    body: "Under UK data protection law, you may have rights to access, correct, erase, restrict, or object to use of your personal information. Some records may need to be kept where Velura has a legal or legitimate business reason."
  }
];

export default function Privacy() {
  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        title="How Velura handles personal information."
        description="A practical privacy notice for inquiries, quotes, bookings, cleaner scheduling, and manager records."
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
              For privacy requests, contact{" "}
              <a className="font-bold text-berry hover:underline" href={`mailto:${site.contactEmail}`}>
                {site.contactEmail}
              </a>
              . This starter notice should be reviewed before public launch.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
