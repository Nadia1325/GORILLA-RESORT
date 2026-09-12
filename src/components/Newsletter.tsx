import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useReveal } from "../hooks/useReveal";
import { api } from "../api";

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tide-800 text-sand-50 shadow-sm dark:bg-sand-50 dark:text-tide-900">
      {children}
    </span>
  );
}

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const ref = useReveal<HTMLDivElement>();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    setSending(true);
    setStatus("");
    try {
      const result = await api.subscribe(email);
      setStatus(result.message);
      const next = email;
      setEmail("");
      setTimeout(() => navigate(`/contact-message?email=${encodeURIComponent(next)}`), 700);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Subscription failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="relative overflow-hidden bg-sand-50 py-20 dark:bg-tide-950 sm:py-24">
      <div className="pointer-events-none absolute inset-0 opacity-[0.045] dark:opacity-[0.08]" aria-hidden="true">
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full border-[45px] border-tide-800" />
        <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full border-[55px] border-tide-800" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div ref={ref} className="reveal grid items-center gap-10 lg:grid-cols-[1fr_minmax(360px,470px)_1fr] lg:gap-8">
          {/* Contact details */}
          <div className="order-2 lg:order-1">
            <span className="eyebrow">
              <span className="h-px w-8 bg-tide-600/50" aria-hidden="true" />
              Visit & connect
            </span>
            <h2 className="mt-3 max-w-md font-display text-3xl font-medium text-tide-900 dark:text-sand-50 sm:text-4xl">
              We&apos;d love to hear from you
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-ink/65 dark:text-sand-100/65">
              Questions about rooms, gorilla trekking, transfers or your stay? Our team is ready to help you plan a memorable visit.
            </p>

            <div className="mt-8 space-y-5">
              <div className="flex gap-4">
                <Icon>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"/><circle cx="12" cy="9" r="2.2"/></svg>
                </Icon>
                <div>
                  <h3 className="font-display text-lg font-semibold text-tide-900 dark:text-sand-50">Our Location</h3>
                  <p className="mt-1 text-sm leading-6 text-ink/65 dark:text-sand-100/65">Kigali – Rwanda<br />Near KINIGI, along the main road</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Icon>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6.6 3.8 9 3l2 4.8-1.8 1.7a15 15 0 0 0 5.3 5.3l1.7-1.8 4.8 2-0.8 2.4a2.4 2.4 0 0 1-2.5 1.6C10.7 18.1 5.9 13.3 4.9 6.3a2.4 2.4 0 0 1 1.7-2.5Z"/></svg>
                </Icon>
                <div>
                  <h3 className="font-display text-lg font-semibold text-tide-900 dark:text-sand-50">Phone</h3>
                  <p className="mt-1 text-sm leading-6 text-ink/65 dark:text-sand-100/65">+250 786 227 645<br />+250  798 290 445</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Icon>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>
                </Icon>
                <div>
                  <h3 className="font-display text-lg font-semibold text-tide-900 dark:text-sand-50">Email</h3>
                  <p className="mt-1 text-sm leading-6 text-ink/65 dark:text-sand-100/65">gorillarecrationalresort@gmail.com<br />resortgorilla@gmail.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Image-backed circular subscription */}
          <div className="order-1 flex justify-center lg:order-2">
            <div className="relative h-[340px] w-[340px] sm:h-[390px] sm:w-[390px] lg:h-[420px] lg:w-[420px]">
              <div className="absolute inset-0 rounded-full border-[7px] border-sand-50 shadow-[0_18px_55px_rgba(11,79,74,0.22)] dark:border-tide-900" />
              <div className="absolute inset-[7px] overflow-hidden rounded-full bg-tide-950">
                <img
                  src="/contact-resort.jpg"
                  alt="Gorilla Recreational Resort building"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-tide-950/70" />
                <div className="absolute inset-0 bg-gradient-to-b from-tide-950/35 via-tide-950/55 to-tide-950/90" />
                <div className="relative flex h-full flex-col items-center justify-center px-8 text-center text-sand-50 sm:px-12">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-400 text-tide-950 shadow-lg ring-4 ring-lime-300/20">
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>
                  </span>
                  <span className="mt-4 eyebrow !text-lime-300">The Musanze dispatch</span>
                  <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Subscribe<br /><span className="text-lime-300">for Updates</span></h2>
                  <p className="mt-3 max-w-xs text-xs leading-5 text-sand-100/80 sm:text-sm">
                    Get the latest offers, events and news from Gorilla Recreational Resort.
                  </p>
                  <form onSubmit={handleSubmit} className="mt-5 flex w-full max-w-[290px] items-center rounded-full bg-sand-50 p-1.5 shadow-xl">
                    <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                    <input id="newsletter-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs text-ink outline-none placeholder:text-ink/45" />
                    <button disabled={sending} type="submit" aria-label="Subscribe" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tide-800 text-sand-50 transition hover:bg-tide-700 disabled:opacity-60">
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 12 16-7-5 14-3.5-6.5L4 12Z"/><path d="m11.5 12.5 5-4"/></svg>
                      )}
                    </button>
                  </form>
                  <p role="status" className="mt-2 min-h-4 max-w-xs text-[10px] font-medium text-lime-300">{status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Message prompt */}
          <div className="order-3 lg:pl-4">
            <span className="eyebrow !text-tide-700 dark:!text-lime-300">Talk to us</span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-tide-900 dark:text-sand-50 sm:text-4xl">Send us a message</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-ink/65 dark:text-sand-100/65">
              After subscribing, you can send questions, comments or special requests directly to our resort team.
            </p>
            <button type="button" onClick={() => navigate(`/contact-message${email ? `?email=${encodeURIComponent(email)}` : ""}`)} className="btn-primary mt-6 w-full sm:w-auto">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 5 16 7-16 7 3-7-3-7Z"/><path d="M7 12h8"/></svg>
              Send a Message
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
