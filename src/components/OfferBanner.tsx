import { useReveal } from "../hooks/useReveal";

export default function OfferBanner() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-10">
      <div
        ref={ref}
        className="reveal relative overflow-hidden rounded-3xl bg-gradient-to-br from-tide-900 via-tide-900 to-tide-900 px-6 py-12 sm:px-14 sm:py-14"
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-coral-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-gold-400/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-lg">
            <span className="eyebrow text-gold-300">
              <span className="h-px w-8 bg-gold-300/60" aria-hidden="true" />
              Trekking season package
            </span>
            <h2 className="mt-4 font-display text-2xl font-medium text-sand-50 sm:text-3xl lg:text-4xl">
              Turn your stay into a complete gorilla trekking escape
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-sand-100/80 sm:text-base">
              Stay three nights or more and let our team simplify your adventure with permit guidance, trek planning and airport transfer support from Kigali — so you can focus on the Virunga experience.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="rounded-2xl border border-gold-300/30 bg-sand-50/5 px-6 py-4 text-center">
              <p className="font-display text-2xl font-semibold text-gold-300 sm:text-3xl">
                3+ nts
              </p>
              <p className="text-[11px] font-medium uppercase tracking-widest2 text-sand-100/70">
                Permit assistance included
              </p>
            </div>
            <a href="/rooms?package=trekking" className="btn-primary">
              Choose my room & trek
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
