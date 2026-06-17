export default function PageHeader({ eyebrow, title, description }) {
  return (
    <section className="bg-white">
      <div className="section-shell py-14 sm:py-18">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight text-coal sm:text-5xl">{title}</h1>
        {description && <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">{description}</p>}
      </div>
    </section>
  );
}
