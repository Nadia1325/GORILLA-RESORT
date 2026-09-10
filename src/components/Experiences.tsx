import { ReactElement, useState } from "react";
import { experiences, type Experience } from "../data";
import SectionHeading from "./SectionHeading";
import { useReveal } from "../hooks/useReveal";

const gallery = [
  {
    src: "https://images.pexels.com/photos/38294689/pexels-photo-38294689.jpeg?auto=compress&cs=tinysrgb&w=1400",
    caption: "Face to face with a mountain gorilla",
  },
  {
    src: "https://images.pexels.com/photos/37585247/pexels-photo-37585247.jpeg?auto=compress&cs=tinysrgb&w=1400",
    caption: "Golden monkeys in the bamboo",
  },
  {
    src: "https://images.pexels.com/photos/31523716/pexels-photo-31523716.jpeg?auto=compress&cs=tinysrgb&w=1400",
    caption: "Drumming at Iby'Iwacu village",
  },
  {
    src: "https://images.pexels.com/photos/19755751/pexels-photo-19755751.jpeg?auto=compress&cs=tinysrgb&w=1400",
    caption: "Morning mist over Lake Burera",
  },
];

const icons: Record<string, ReactElement> = {
  gorilla: (
    <path
      d="M12 3c-3 0-5 2-5 5 0 1 .3 1.8.8 2.5C6.7 11.5 6 13 6 15c0 3.3 2.7 6 6 6s6-2.7 6-6c0-2-.7-3.5-1.8-4.5.5-.7.8-1.5.8-2.5 0-3-2-5-5-5z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  ),
  monkey: (
    <path
      d="M12 4a4 4 0 00-4 4c0 1 .3 1.9.9 2.6C7.7 11.4 7 13 7 15a5 5 0 0010 0c0-2-.7-3.6-1.9-4.4.6-.7.9-1.6.9-2.6a4 4 0 00-4-4zM4 13l3 1M20 13l-3 1"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  drum: (
    <path
      d="M5 8c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zm0 0v8c0 1.7 3.1 3 7 3s7-1.3 7-3V8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  trail: (
    <path
      d="M4 21c3-6 3-10 0-16M20 21c-3-6-3-10 0-16M9 21c1.5-5 1.5-11 0-18M15 21c-1.5-5-1.5-11 0-18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  ),
};

export default function Experiences() {
  const [active, setActive] = useState(0);
  const headingRef = useReveal<HTMLDivElement>();
  const panelRef = useReveal<HTMLDivElement>();

  return (
    <section id="experiences" className="bg-tide-900 py-24 text-sand-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div ref={headingRef} className="reveal">
          <SectionHeading
            eyebrow="A day from the resort"
            title="Volcanoes National Park is fifteen minutes away"
            description="We help arrange gorilla and golden monkey permits, guides, and transport — most days start early and end with a hot shower and a view."
            tone="light"
          />
        </div>

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {experiences.map((experience, index) => (
              <ExperienceItem key={experience.title} experience={experience} delay={index * 90} />
            ))}
          </ul>

          <div ref={panelRef} className="reveal">
            <div className="relative overflow-hidden rounded-3xl">
              <img
                src={gallery[active].src}
                alt={gallery[active].caption}
                className="h-[420px] w-full object-cover transition-opacity duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-tide-900/70 via-transparent to-transparent" />
              <p className="absolute bottom-5 left-6 font-display text-lg text-sand-50">
                {gallery[active].caption}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3">
              {gallery.map((item, index) => (
                <button
                  key={item.caption}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Show ${item.caption}`}
                  aria-pressed={active === index}
                  className={`overflow-hidden rounded-xl border-2 transition-all ${
                    active === index
                      ? "border-gold-400"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={item.src} alt="" className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperienceItem({ experience, delay }: { experience: Experience; delay: number }) {
  const ref = useReveal<HTMLLIElement>();

  return (
    <li
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className="reveal flex gap-4 border-b border-sand-50/10 pb-6 last:border-b-0"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold-400/40 text-gold-300">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          {icons[experience.icon]}
        </svg>
      </span>
      <div>
        <h3 className="font-display text-lg font-medium text-sand-50">{experience.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-sand-100/70">{experience.description}</p>
      </div>
    </li>
  );
}
