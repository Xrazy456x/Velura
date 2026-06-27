export default function PageHeader({ eyebrow, title, description }) {
  return (
    <section className="border-b border-stone-200 bg-white">
      <div className="section-shell grid gap-8 py-14 sm:py-18 lg:grid-cols-[0.65fr_1.35fr] lg:items-end">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <div className="mt-6 hidden h-px w-full bg-coral/40 lg:block" aria-hidden="true" />
        </div>
        <div>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight text-coal sm:text-5xl lg:text-6xl">{title}</h1>
          {description && <p className="mt-5 max-w-3xl text-base leading-7 text-stone-600 sm:text-lg">{description}</p>}
        </div>
      </div>
    </section>
  );
}
