const stats = [
  { value: "5", label: "Volcano-named rooms" },
  { value: "15 min", label: "To Kinigi Park HQ" },
  { value: "4.9 / 5", label: "Average guest rating" },
  { value: "24 / 7", label: "Concierge & permit help" },
];

export default function TrustBar() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-16 lg:px-10">
      <div className="grid grid-cols-2 gap-6 border-y border-tide-700/10 py-8 dark:border-sand-100/10 sm:grid-cols-4 sm:gap-8 sm:py-10">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center sm:text-left">
            <p className="font-display text-2xl font-semibold text-tide-800 dark:text-sand-50 sm:text-3xl lg:text-4xl">
              {stat.value}
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-widest2 text-ink/45 dark:text-sand-100/50 sm:text-[11px]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
