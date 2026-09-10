import { Link, useSearchParams } from "react-router-dom";

export default function BookingSuccessPage() {
  const [params] = useSearchParams();
  const id = params.get("id") || "";
  const name = params.get("name") || "Guest";
  const room = params.get("room") || "Selected room";
  const email = params.get("email") || "your email";

  return (
    <main className="min-h-screen bg-sand-50 px-4 pb-20 pt-28 dark:bg-tide-950 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="card-surface overflow-hidden rounded-3xl shadow-card">
          <div className="bg-tide-900 px-7 py-10 text-center text-sand-50 sm:px-10">
            <Link
              to="/manager"
              aria-label="Open manager login"
              title="Manager login"
              className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold-300/40 bg-gold-300/10 text-2xl text-gold-300 transition hover:scale-105 hover:bg-gold-300/20 focus:outline-none focus:ring-2 focus:ring-gold-300/60"
            >
              ✓
            </Link>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">Request sent successfully</p>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl">Your stay request is on its way</h1>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-sand-100/75">Thank you, {name}. We sent your booking request to our manager. A copy has been sent to {email}, and you will receive your confirmed reservation ticket by email after approval.</p>
          </div>
          <div className="p-7 sm:p-10">
            <div className="rounded-2xl border border-tide-700/10 bg-sand-100 p-5 dark:border-sand-50/10 dark:bg-tide-900">
              <p className="text-xs font-semibold uppercase tracking-widest2 text-tide-600 dark:text-gold-300">Booking request ticket</p>
              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div><p className="text-ink/45 dark:text-sand-100/45">Request number</p><p className="mt-1 font-semibold text-tide-900 dark:text-sand-50">{id}</p></div>
                <div><p className="text-ink/45 dark:text-sand-100/45">Room</p><p className="mt-1 font-semibold text-tide-900 dark:text-sand-50">{room}</p></div>
                <div className="sm:col-span-2"><p className="text-ink/45 dark:text-sand-100/45">Status</p><p className="mt-1 font-semibold text-gold-700 dark:text-gold-300">Pending manager approval</p></div>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/rooms" className="btn-primary flex-1 text-center">Explore other rooms</Link>
              <Link to="/" className="flex-1 rounded-full border border-tide-700/20 px-5 py-3 text-center text-sm font-semibold text-tide-800 transition hover:bg-sand-100 dark:border-sand-50/20 dark:text-sand-50 dark:hover:bg-tide-900">Back to resort</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
