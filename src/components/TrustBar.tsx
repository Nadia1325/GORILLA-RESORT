const stats = [
  { value: "5", label: "Volcano-named rooms" },
  { value: "15 min", label: "To Kinigi Park HQ" },
  { value: "4.9 / 5", label: "Average guest rating" },
  { value: "24 / 7", label: "Concierge & permit help" },
  { value: "Anywhere", label: "Airport, park & city transfers", href: "#transport" },
];

export default function TrustBar() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-16 lg:px-10">
      <div className="grid grid-cols-2 gap-6 border-y border-tide-700/10 py-8 dark:border-sand-100/10 sm:grid-cols-3 sm:gap-8 sm:py-10 lg:grid-cols-5">
        {stats.map((stat, index) => {
          const isLast = index === stats.length - 1;
          const content = (
            <>
              <p className="font-display text-2xl font-semibold text-tide-800 dark:text-sand-50 sm:text-3xl lg:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-widest2 text-ink/45 dark:text-sand-100/50 sm:text-[11px]">
                {stat.label}
              </p>
            </>
          );

          const className = `text-center sm:text-left ${isLast ? "col-span-2 sm:col-span-1" : ""}`;

          return stat.href ? (
            <a key={stat.label} href={stat.href} className={`${className} transition hover:opacity-70`}>
              {content}
            </a>
          ) : (
            <div key={stat.label} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
