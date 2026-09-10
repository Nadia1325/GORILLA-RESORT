import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { rooms } from "../data";
import { api } from "../api";

const gallery = [
  "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "https://images.pexels.com/photos/237371/pexels-photo-237371.jpeg?auto=compress&cs=tinysrgb&w=1200",
];

export default function RoomDetailPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const room = rooms.find(r => r.volcano.toLowerCase() === slug);

  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const today = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  })();

  const initial = useMemo(
    () => ({
      checkIn: params.get("checkIn") || "",
      checkOut: params.get("checkOut") || "",
      guests: params.get("guests") || "2 adults",
      packageName:
        params.get("package") === "trekking"
          ? "Trekking season package"
          : "",
    }),
    [params]
  );

  if (!room) {
    return (
      <main className="min-h-screen bg-sand-50 p-10 pt-32">
        <p>Room not found.</p>
        <Link to="/rooms">View all rooms</Link>
      </main>
    );
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Save the form element before the async operation.
    // e.currentTarget can become null after await.
    const formElement = e.currentTarget;

    setSending(true);
    setStatus("");

    const form = new FormData(formElement);

    try {
      const result = await api.book(
        Object.fromEntries(form.entries()) as Record<string, string>
      );

      setStatus(
        `${result.message} Request number: ${result.bookingId}.`
      );

      const guestEmail = String(form.get("email") || "");
      const guestName = String(form.get("name") || "");
      const roomName = `Room ${room.numeral} · ${room.volcano}`;

      // Reset using the saved form reference.
      formElement.reset();

      navigate(
        `/booking-success?id=${encodeURIComponent(
          result.bookingId
        )}&email=${encodeURIComponent(
          guestEmail
        )}&name=${encodeURIComponent(
          guestName
        )}&room=${encodeURIComponent(roomName)}`
      );
    } catch (err) {
      setStatus(
        err instanceof Error
          ? err.message
          : "Booking could not be sent."
      );
    } finally {
      setSending(false);
    }
  };

  const photos = [room.image, ...gallery];

  return (
    <main className="min-h-screen bg-sand-50 pb-20 pt-24 dark:bg-tide-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <Link
          to="/rooms"
          className="text-sm font-semibold text-tide-700 dark:text-gold-300"
        >
          ← All rooms
        </Link>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <img
            src={photos[0]}
            alt={`${room.volcano} main room view`}
            className="h-[430px] w-full rounded-3xl object-cover"
          />

          <div className="grid grid-cols-2 gap-4">
            {photos.slice(1).map((photo, i) => (
              <img
                key={photo}
                src={photo}
                alt={`${room.volcano} interior ${i + 1}`}
                className="h-[207px] w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <section>
            <span className="eyebrow">
              Room {room.numeral} · {room.elevation}
            </span>

            <h1 className="mt-3 font-display text-4xl text-tide-900 dark:text-sand-50 sm:text-5xl">
              {room.volcano}
            </h1>

            <p className="mt-3 font-medium text-tide-600 dark:text-gold-300">
              {room.meaning}
            </p>

            <p className="mt-5 max-w-2xl leading-7 text-ink/70 dark:text-sand-100/70">
              {room.description} Designed for quiet evenings after a day in
              Volcanoes National Park, with a private sleeping area, warm
              shower, comfortable seating and space to prepare for an
              early-morning trek.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[
                "Private bathroom",
                "Breakfast included",
                "Wi-Fi",
                "Mountain atmosphere",
              ].map(x => (
                <span
                  key={x}
                  className="rounded-xl bg-sand-100 p-3 text-center dark:bg-tide-900"
                >
                  {x}
                </span>
              ))}
            </div>

            <p className="mt-8 font-display text-3xl font-semibold text-tide-900 dark:text-sand-50">
              ${room.price.toLocaleString()}
              <span className="text-sm font-normal opacity-60">
                {" "}
                per night
              </span>
            </p>
          </section>

          <form
            onSubmit={submit}
            className="card-surface rounded-3xl p-6 shadow-card sm:p-8"
          >
            <h2 className="font-display text-2xl text-tide-900 dark:text-sand-50">
              Request this room
            </h2>

            <p className="mt-2 text-sm text-ink/60 dark:text-sand-100/60">
              Send your details. The manager reviews the request and your
              approved booking ticket is sent to your email.
            </p>

            <input
              type="hidden"
              name="room"
              value={`Room ${room.numeral} · ${room.volcano}`}
            />

            <input
              type="hidden"
              name="packageName"
              value={initial.packageName}
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                [
                  "Full name",
                  "name",
                  "text",
                  "Your full name",
                  "",
                ],
                [
                  "Email",
                  "email",
                  "email",
                  "you@example.com",
                  "",
                ],
                [
                  "Phone",
                  "phone",
                  "tel",
                  "+250 ...",
                  "",
                ],
                [
                  "Location",
                  "location",
                  "text",
                  "City, country",
                  "",
                ],
                [
                  "Check in",
                  "checkIn",
                  "date",
                  "",
                  initial.checkIn,
                ],
                [
                  "Check out",
                  "checkOut",
                  "date",
                  "",
                  initial.checkOut,
                ],
              ].map(
                ([
                  label,
                  name,
                  type,
                  placeholder,
                  defaultValue,
                ]) => (
                  <label
                    key={name}
                    className="text-xs font-semibold uppercase tracking-wide text-ink/55 dark:text-sand-100/55"
                  >
                    {label}

                    <input
                      required
                      name={name}
                      type={type}
                      placeholder={placeholder}
                      defaultValue={defaultValue}
                      min={type === "date" ? (name === "checkOut" && initial.checkIn ? initial.checkIn : today) : undefined}
                      className="mt-2 w-full rounded-xl border border-tide-700/15 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal outline-none focus:border-tide-600 dark:bg-tide-950"
                    />
                  </label>
                )
              )}
            </div>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink/55 dark:text-sand-100/55">
              Guests

              <select
                name="guests"
                defaultValue={initial.guests}
                className="mt-2 w-full rounded-xl border border-tide-700/15 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal dark:bg-tide-950"
              >
                <option>1 adult</option>
                <option>2 adults</option>
                <option>2 adults, 1 child</option>
                <option>3–4 adults</option>
              </select>
            </label>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink/55 dark:text-sand-100/55">
              Special requests

              <textarea
                name="specialRequests"
                rows={4}
                placeholder="Airport transfer, trekking assistance, arrival time..."
                className="mt-2 w-full rounded-xl border border-tide-700/15 bg-white px-4 py-3 text-sm font-normal normal-case tracking-normal dark:bg-tide-950"
              />
            </label>

            <button
              disabled={sending}
              className="btn-primary mt-5 w-full"
            >
              {sending ? "Sending request..." : "Send booking request"}
            </button>

            {status && (
              <p className="mt-4 text-sm font-medium text-tide-700 dark:text-gold-300">
                {status}
              </p>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}