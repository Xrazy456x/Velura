export default function StatCard({ icon: Icon, label, value, tone = "leaf" }) {
  const toneClasses = {
    leaf: "bg-lime-50 text-leaf",
    coral: "bg-amber-50 text-coral",
    berry: "bg-rose-50 text-berry",
    coal: "bg-stone-100 text-coal"
  };

  return (
    <article className="panel p-5">
      <div className={`grid h-10 w-10 place-items-center rounded-lg ${toneClasses[tone] || toneClasses.leaf}`}>
        <Icon size={20} aria-hidden="true" />
      </div>
      <p className="mt-5 text-3xl font-extrabold text-coal">{value}</p>
      <p className="mt-1 text-sm font-semibold text-stone-500">{label}</p>
    </article>
  );
}
