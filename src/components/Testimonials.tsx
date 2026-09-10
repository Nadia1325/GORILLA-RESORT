import { testimonials, type Testimonial } from "../data";
import SectionHeading from "./SectionHeading";
import { useReveal } from "../hooks/useReveal";

export default function Testimonials() {
  const headingRef = useReveal<HTMLDivElement>();

  return (
    <section id="journal" className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
      <div ref={headingRef} className="reveal">
        <SectionHeading
          eyebrow="From the guest book"
          title="What guests remember isn't just the gorillas"
          align="center"
        />
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <TestimonialCard key={testimonial.name} testimonial={testimonial} delay={index * 100} />
        ))}
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  delay,
}: {
  testimonial: Testimonial;
  delay: number;
}) {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className="reveal flex h-full flex-col rounded-2xl border border-tide-700/10 bg-white/60 p-7 dark:border-sand-100/10 dark:bg-tide-900/60"
    >
      <svg width="28" height="22" viewBox="0 0 28 22" fill="none" className="text-coral-400">
        <path
          d="M11.5 0C6 1.5 2 6 2 12.5 2 17.5 5 21 9.5 21c3.5 0 6-2.5 6-6 0-3-2-5-4.5-5-.5 0-1 .1-1.5.2C10 6.5 12.5 3 16.5 1.5L11.5 0zM24.5 0C19 1.5 15 6 15 12.5c0 5 3 8.5 7.5 8.5 3.5 0 6-2.5 6-6 0-3-2-5-4.5-5-.5 0-1 .1-1.5.2C23 6.5 25.5 3 29.5 1.5L24.5 0z"
          fill="currentColor"
          opacity="0.7"
        />
      </svg>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-ink/75 dark:text-sand-100/75">{testimonial.quote}</p>
      <div className="mt-6 border-t border-tide-700/10 pt-4 dark:border-sand-100/10">
        <p className="font-display text-base font-medium text-tide-800 dark:text-sand-50">{testimonial.name}</p>
        <p className="text-xs text-ink/45 dark:text-sand-100/50">{testimonial.detail}</p>
      </div>
    </div>
  );
}
