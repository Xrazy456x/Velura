const variants = {
  new: "bg-amber-100 text-amber-800 ring-amber-200",
  contacted: "bg-lime-100 text-lime-800 ring-lime-200",
  closed: "bg-stone-200 text-stone-700 ring-stone-300",
  reviewing: "bg-sky-100 text-sky-800 ring-sky-200",
  awaiting_photos: "bg-amber-100 text-amber-800 ring-amber-200",
  quoted: "bg-lime-100 text-lime-800 ring-lime-200",
  booked: "bg-coal text-white ring-coal/20",
  scheduled: "bg-amber-100 text-amber-800 ring-amber-200",
  confirmed: "bg-lime-100 text-lime-800 ring-lime-200",
  completed: "bg-coal text-white ring-coal/20",
  cancelled: "bg-rose-100 text-rose-800 ring-rose-200",
  draft: "bg-stone-200 text-stone-700 ring-stone-300",
  sent: "bg-sky-100 text-sky-800 ring-sky-200",
  paid: "bg-lime-100 text-lime-800 ring-lime-200",
  void: "bg-rose-100 text-rose-800 ring-rose-200",
  active: "bg-lime-100 text-lime-800 ring-lime-200",
  inactive: "bg-rose-100 text-rose-800 ring-rose-200"
};

export default function StatusBadge({ value }) {
  const label = value || "new";
  const displayLabel = label.replace(/_/g, " ");

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ${variants[label] || variants.new}`}>
      {displayLabel}
    </span>
  );
}
