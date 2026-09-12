import { Bus, Mountain, Plane } from "lucide-react";
import { useReveal } from "../hooks/useReveal";
import SectionHeading from "./SectionHeading";

const routes = [
  {
    title: "Airport transfers",
    text: "Direct pickup and drop-off between Kigali International Airport and the resort.",
    icon: Plane,
  },
  {
    title: "Trekking & park transfers",
    text: "Early-morning rides to Kinigi Park HQ for your gorilla or golden monkey trek.",
    icon: Mountain,
  },
  {
    title: "City & village tours",
    text: "Musanze town, Iby'Iwacu cultural village, Lake Burera and beyond — wherever you'd like to go.",
    icon: Bus,
  },
];

export default function Transport() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="transport" className="bg-sand-50 py-16 dark:bg-tide-950 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div
          ref={ref}
          className="reveal flex flex-col gap-8 rounded-[2rem] bg-white/60 p-6 shadow-card ring-1 ring-tide-700/5 dark:bg-tide-900/60 dark:ring-sand-50/10 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12"
        >
          <div className="max-w-xl">
            <SectionHeading
              eyebrow="Getting around"
              title="We'll drive you there — anywhere"
              description="Our private bus and driver service takes guests wherever they need to go: the airport, the park, town, or a day trip further afield. Just ask and we'll arrange it."
            />
            <a href="/contact-message" className="btn-primary mt-6 inline-flex">
              Ask about transport
            </a>
          </div>

          <ul className="grid flex-1 gap-5 sm:grid-cols-3 lg:max-w-xl">
            {routes.map((route) => {
              const Icon = route.icon;
              return (
                <li key={route.title} className="flex flex-col gap-3 rounded-2xl bg-sand-100/70 p-5 dark:bg-tide-950/50">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold-400/10 text-gold-600 ring-1 ring-gold-400/25 dark:text-gold-300"
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-display text-base text-tide-900 dark:text-sand-50">{route.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink/60 dark:text-sand-100/60">{route.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
