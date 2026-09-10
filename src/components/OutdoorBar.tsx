import { useReveal } from "../hooks/useReveal";

interface MenuItem {
  title: string;
  tag: string;
  text: string;
  image: string;
}

// Real photography for each menu item — swap these for your own bar/kitchen
// photos whenever you have them; the layout doesn't need to change.
const menu: MenuItem[] = [
  {
    title: "Coffee & Tea Corner",
    tag: "Slow mornings",
    text: "Rwandan coffee and hand-picked tea, served on the terrace as the mist clears over the hills.",
    image:
      "https://images.pexels.com/photos/17205573/pexels-photo-17205573.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "Fresh Juices",
    tag: "Made to order",
    text: "Passion fruit, mango and tree tomato, pressed fresh each morning from local produce.",
    image:
      "https://images.pexels.com/photos/12954679/pexels-photo-12954679.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "Mocktails & Refreshments",
    tag: "After the trail",
    text: "Cool down after a trek with a mint-lime cooler or a ginger spritz on the open-air deck.",
    image:
      "https://images.pexels.com/photos/5668200/pexels-photo-5668200.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "Bar Snacks & Platters",
    tag: "Light bites",
    text: "Cheese, nuts and seasonal fruit — easy sharing plates for a slow evening under the trees.",
    image:
      "https://images.pexels.com/photos/4873730/pexels-photo-4873730.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
];

const services = [
  {
    title: "Evening bonfire",
    text: "Music, board games and quiet conversation around a small fire.",
    icon: "🔥",
  },
  {
    title: "Slow mornings",
    text: "Coffee, a book, and an unhurried start before the next trek.",
    icon: "🌿",
  },
];

export default function OutdoorBar() {
  const heroRef = useReveal<HTMLDivElement>();
  const menuRef = useReveal<HTMLDivElement>();

  return (
    <section id="outdoor-bar" className="bg-sand-50 py-16 dark:bg-tide-950 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* Hero band */}
        <div
          ref={heroRef}
          className="reveal relative overflow-hidden rounded-[2rem] shadow-card"
        >
          <div className="relative h-[360px] sm:h-[420px]">
            <img
              src="/outdoor.jpeg"
              alt="Gorilla Recreational Resort's open-air forest terrace bar in the evening"
              className="obar-kenburns absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-tide-950/95 via-tide-950/45 to-tide-950/10" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <span className="eyebrow !text-gold-300">Open daily · 7am – 10pm</span>
              <h2 className="mt-3 max-w-lg font-display text-3xl text-sand-50 sm:text-4xl lg:text-5xl">
                The Forest Terrace Bar
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-sand-100/85 sm:text-base">
                An open-air bar tucked under the trees — coffee at sunrise,
                cold drinks after the trail, and a fire once it gets dark.
              </p>
            </div>
          </div>
        </div>

        {/* Self-contained motion for the hero photo: a slow, looping
            Ken-Burns zoom/pan. Scoped with its own class name so it doesn't
            depend on any keyframes already defined elsewhere in the app,
            and switched off for anyone who prefers reduced motion. */}
        <style>{`
          .obar-kenburns {
            transform-origin: 55% 45%;
            animation: obarKenBurns 16s ease-in-out infinite alternate;
            will-change: transform;
          }
          @keyframes obarKenBurns {
            0% { transform: scale(1) translate3d(0, 0, 0); }
            100% { transform: scale(1.12) translate3d(-1.5%, -1%, 0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .obar-kenburns { animation: none; }
          }
        `}</style>

        {/* Menu grid */}
        <div ref={menuRef} className="reveal mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {menu.map((item) => (
            <article
              key={item.title}
              className="group overflow-hidden rounded-2xl bg-tide-900 shadow-card ring-1 ring-tide-700/10 transition duration-300 hover:-translate-y-1.5"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-tide-950/80 via-transparent to-transparent" />
                <p className="absolute bottom-2 left-4 text-[10px] font-semibold uppercase tracking-widest2 text-gold-300">
                  {item.tag}
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg text-sand-50">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-sand-100/70">{item.text}</p>
              </div>
            </article>
          ))}
        </div>

        {/* Services strip + CTA */}
        <div className="mt-10 flex flex-col gap-6 rounded-2xl border border-tide-700/10 bg-white/60 p-6 dark:border-sand-100/10 dark:bg-tide-900/60 sm:mt-12 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <ul className="grid flex-1 gap-5 sm:grid-cols-2">
            {services.map((service) => (
              <li key={service.title} className="flex gap-3">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-400/10 text-xl ring-1 ring-gold-400/25"
                  aria-hidden="true"
                >
                  {service.icon}
                </span>
                <div>
                  <p className="font-display text-base text-tide-900 dark:text-sand-50">
                    {service.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink/60 dark:text-sand-100/60">
                    {service.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <a href="/contact-message" className="btn-primary shrink-0">
            Ask the team
          </a>
        </div>
      </div>
    </section>
  );
}