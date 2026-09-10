import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../hooks/useTheme";

const links = [
  { label: "Rooms", href: "/rooms" },
  { label: "Experiences", href: "/#experiences" },
  { label: "Outdoor Bar", href: "/#outdoor-bar" },
  { label: "Journal", href: "/#journal" },
  { label: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Once scrolled (or the mobile menu is open) the page underneath is
  // always a light/dark surface, not the hero photo — so text follows the
  // theme rather than the "over hero image" transparent state.
  const solid = location.pathname !== "/" || scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid
          ? "bg-sand-50/90 shadow-[0_1px_0_rgba(11,29,10,0.08)] backdrop-blur-md dark:bg-tide-950/90 dark:shadow-[0_1px_0_rgba(248,243,233,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <a href="/" className="flex min-w-0 shrink-0 items-center gap-3">
          <img
            src="/logo.jpg"
            alt="Gorilla Recreational Resort crest"
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-gold-400/70"
          />
          <span className="flex min-w-0 flex-col leading-tight">
            <span
              className={`truncate font-display text-base font-semibold tracking-wide sm:text-lg ${
                solid ? "text-tide-800 dark:text-sand-50" : "text-sand-50"
              }`}
            >
              Gorilla Recreational Resort
            </span>
            <span
              className={`text-[10px] font-medium uppercase tracking-widest2 ${
                solid ? "text-ink/45 dark:text-sand-100/50" : "text-sand-100/75"
              }`}
            >
              Musanze &middot; Rwanda
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                solid
                  ? "text-ink/70 hover:text-tide-700 dark:text-sand-100/70 dark:hover:text-sand-50"
                  : "text-sand-50/85 hover:text-sand-50"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle
            theme={theme}
            onToggle={toggleTheme}
            className={
              solid
                ? "border-tide-700/20 text-tide-700 hover:border-tide-700 dark:border-sand-100/25 dark:text-sand-100 dark:hover:border-sand-100"
                : "border-sand-50/40 text-sand-50 hover:border-sand-50"
            }
          />
          <a href="/rooms" className="btn-primary">
            Check Availability
          </a>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle
            theme={theme}
            onToggle={toggleTheme}
            className={
              solid
                ? "border-tide-700/20 text-tide-700 dark:border-sand-100/25 dark:text-sand-100"
                : "border-sand-50/40 text-sand-50"
            }
          />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle menu"
            className={`grid h-10 w-10 place-items-center rounded-full border ${
              solid
                ? "border-tide-700/30 text-tide-700 dark:border-sand-100/30 dark:text-sand-100"
                : "border-sand-50/50 text-sand-50"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              {open ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-tide-700/10 bg-sand-50 px-6 py-5 dark:border-sand-100/10 dark:bg-tide-950 lg:hidden">
          <nav className="flex flex-col gap-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-ink/80 dark:text-sand-100/80"
              >
                {link.label}
              </a>
            ))}
            <a href="/rooms" onClick={() => setOpen(false)} className="btn-primary mt-2 w-full">
              Check Availability
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
