import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";

export default function ContactMessagePage() {
  const [params] = useSearchParams();

  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Save the form reference BEFORE the async request.
    const form = e.currentTarget;

    setSending(true);
    setStatus("");
    setIsSuccess(false);

    const formData = new FormData(form);

    try {
      const response = await api.contact(
        Object.fromEntries(formData.entries()) as Record<string, string>
      );

      // Message was successfully saved/sent.
      setIsSuccess(true);
      setStatus(
        response.message ||
          "Your message was sent successfully to the resort manager."
      );

      // Reset the saved form reference safely.
      form.reset();
    } catch (err) {
      setIsSuccess(false);

      setStatus(
        err instanceof Error
          ? err.message
          : "Could not send your message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-sand-50 px-4 pb-20 pt-28 dark:bg-tide-950 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/"
          className="text-sm font-semibold text-tide-700 dark:text-gold-300"
        >
          ← Back to resort
        </Link>

        <div className="mt-8 card-surface rounded-3xl p-7 shadow-card sm:p-10">
          <span className="eyebrow">Talk to our resort team</span>

          <h1 className="mt-3 font-display text-4xl text-tide-900 dark:text-sand-50">
            Send a message or comment
          </h1>

          <p className="mt-3 text-sm text-ink/65 dark:text-sand-100/65">
            Questions about rooms, trekking, transfers or your stay? Send them
            directly to the manager.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <input
              required
              name="name"
              placeholder="Your full name"
              className="w-full rounded-xl border p-3 dark:bg-tide-950"
            />

            <input
              required
              name="email"
              type="email"
              defaultValue={params.get("email") || ""}
              placeholder="Email address"
              className="w-full rounded-xl border p-3 dark:bg-tide-950"
            />

            <input
              name="phone"
              placeholder="Phone number (optional)"
              className="w-full rounded-xl border p-3 dark:bg-tide-950"
            />

            <textarea
              required
              name="message"
              rows={6}
              placeholder="Write your message or comment..."
              className="w-full rounded-xl border p-3 dark:bg-tide-950"
            />

            <button
              type="submit"
              disabled={sending}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send to manager"}
            </button>

            {status && (
              <div
                role="status"
                aria-live="polite"
                className={`rounded-xl p-4 text-sm font-medium ${
                  isSuccess
                    ? "border border-green-500/20 bg-green-500/10 dark:text-red-300 dark:text-red-300"
                    : "border border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-bold ${
                      isSuccess
                        ? "dark:text-red-300 dark:text-red-300 dark:text-red-300"
                        : "bg-red-500/15 text-red-600 dark:text-red-300"
                    }`}
                  >
                    {isSuccess ? "✓" : "!"}
                  </span>

                  <div>
                    <p className="font-semibold">
                      {isSuccess
                        ? "Message sent successfully"
                        : "Message could not be sent"}
                    </p>

                    <p className="mt-1 opacity-80">{status}</p>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}