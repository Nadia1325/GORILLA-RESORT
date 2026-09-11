import SearchWidget from "./SearchWidget";

// Hero landscape: Esme Stewart, Wikimedia Commons, CC BY-SA 4.0.
// https://commons.wikimedia.org/wiki/File:1-Virunga_Lodge_Aerila_ViewSinamatella_-_Rwanda_-_Virunga_-_20180915_-_1054.jpg

export default function Hero() {
  return (
    <section id="top" className="relative">
      <div className="relative h-[100svh] min-h-[560px] w-full overflow-hidden sm:h-[92vh] sm:min-h-[640px]">
        <img
          src="/gorilla.jpg"
          alt="Mount Sabyinyo and the Volcanoes National Park landscape in Rwanda"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-tide-950/90 via-tide-900/40 to-tide-900/60 dark:from-tide-950 dark:via-tide-950/55 dark:to-tide-950/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-tide-900/40 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-5 pb-32 pt-24 sm:px-6 sm:pb-28 lg:px-10">
          <span className="eyebrow text-sand-100/90">
            <span className="h-px w-8 bg-sand-100/60" aria-hidden="true" />
            Kinigi, Musanze &middot; gateway to Volcanoes National Park
          </span>

          <h1 className="mt-6 max-w-2xl font-display text-4xl font-medium leading-[1.08] text-sand-50 sm:text-6xl lg:text-7xl">
            Gorilla Recreational
            <br />
            <span className="italic text-gold-300">resort.</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-sand-100/85 sm:text-lg">
            Gorilla Recreational Resort sits at the foot of the Virunga range in
            Musanze, Rwanda — five rooms, each named for the volcano it looks
            toward.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a href="#rooms" className="btn-primary">
              View our rooms
            </a>
            <a
              href="#experiences"
              className="inline-flex items-center gap-2 text-sm font-semibold text-sand-50/90 underline decoration-sand-50/30 underline-offset-4 transition hover:decoration-sand-50"
            >
              Plan a gorilla trek
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-20 mx-auto -mt-16 max-w-7xl px-4 sm:-mt-14 sm:px-6 lg:px-10">
        <SearchWidget />
      </div>
    </section>
  );
}
