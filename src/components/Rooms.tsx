import { rooms, type Room } from "../data";
import SectionHeading from "./SectionHeading";
import { useReveal } from "../hooks/useReveal";

// The three languages spoken at the resort: English, French, Kinyarwanda.
// "ROOM I" / "CHAMBRE I" / "ICYUMBA I" etc. — the numeral is shared.
function trilingualLabel(numeral: string) {
  return [`ROOM ${numeral}`, `CHAMBRE ${numeral}`, `ICYUMBA ${numeral}`];
}

export default function Rooms() {
  const headingRef = useReveal<HTMLDivElement>();

  return (
    <section id="rooms" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-10">
      <div
        ref={headingRef}
        className="reveal flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
      >
        <SectionHeading
          eyebrow="Every room named for a volcano"
          title="Five rooms, five Virunga peaks"
          description="Muhabura, Gahinga, Sabyinyo, Bisoke and Karisimbi — the five volcanoes visible from Musanze — each lend a room its name and character."
        />
        <a
          href="#contact"
          className="hidden shrink-0 text-sm font-semibold text-tide-700 underline decoration-tide-700/30 underline-offset-4 hover:decoration-tide-700 dark:text-gold-300 dark:decoration-gold-300/40 dark:hover:decoration-gold-300 sm:inline-flex"
        >
          Ask about all five →
        </a>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
        {rooms.map((room, index) => (
          <RoomCard key={room.volcano} room={room} delay={index * 90} />
        ))}
      </div>
    </section>
  );
}

function RoomCard({ room, delay }: { room: Room; delay: number }) {
  const ref = useReveal<HTMLDivElement>();
  const [en, fr, rw] = trilingualLabel(room.numeral);

  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className="reveal card-surface group flex flex-col overflow-hidden rounded-2xl shadow-card transition-transform duration-500 hover:-translate-y-1.5"
    >
      <div className="relative h-52 overflow-hidden sm:h-56">
        <img
          src={room.image}
          alt={`${en} — ${room.volcano}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {room.badge && (
          <span className="absolute left-4 top-4 rounded-full bg-tide-900/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sand-50">
            {room.badge}
          </span>
        )}
       
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-tide-950/85 to-transparent px-5 pb-3 pt-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest2 text-gold-300">
            {en} &middot; {fr} &middot; {rw}
          </p>
          <h3 className="font-display text-2xl font-semibold text-sand-50">{room.volcano}</h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-xs font-medium text-tide-600 dark:text-gold-300">
          {room.elevation} &middot; {room.meaning}
        </p>
        <p className="text-sm leading-relaxed text-ink/70 dark:text-sand-100/70">
          {room.description}
        </p>
        <div className="mt-auto flex items-end justify-between pt-2">
          <p>
            <span className="font-display text-xl font-semibold text-tide-800 dark:text-sand-50">
              ${room.price}
            </span>
            <span className="text-xs text-ink/45 dark:text-sand-100/45"> / night</span>
          </p>
          <a
            href={`/rooms/${room.volcano.toLowerCase()}`}
            className="text-xs font-semibold text-coral-600 underline decoration-coral-500/30 underline-offset-4 hover:decoration-coral-500 dark:text-coral-400 dark:decoration-coral-400/40 dark:hover:decoration-coral-400"
          >
            Book this room
          </a>
        </div>
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#C6A24C">
      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.2l7.1-.6z" />
    </svg>
  );
}
