import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { rooms } from "../data";
import { api } from "../api";

export default function RoomsPage() {
  const [params] = useSearchParams();

  const requested =
    params.get("room")?.toUpperCase() || "";

  const checkIn =
    params.get("checkIn") || "";

  const checkOut =
    params.get("checkOut") || "";

  const guests =
    params.get("guests") || "";

  const packageName =
    params.get("package") || "";

  const [unavailable, setUnavailable] =
    useState<string[]>([]);

  const [availabilityNote, setAvailabilityNote] =
    useState("");


  useEffect(() => {
    if (!checkIn || !checkOut) return;

    api
      .availability(checkIn, checkOut)
      .then((r) => {
        setUnavailable(r.unavailable);
        setAvailabilityNote("");
      })
      .catch((err) => {
        setAvailabilityNote(
          err instanceof Error
            ? err.message
            : "Could not verify live availability."
        );
      });
  }, [checkIn, checkOut]);


  const filtered = useMemo(
    () =>
      rooms.filter((room) => {
        const matchesRequested =
          !requested ||
          requested === "ANY AVAILABLE ROOM" ||
          requested.includes(room.volcano);

        const roomLabel =
          `Room ${room.numeral} · ${room.volcano}`;

        return (
          matchesRequested &&
          !unavailable.includes(roomLabel)
        );
      }),
    [requested, unavailable]
  );


  return (
    <main className="min-h-screen bg-sand-50 px-4 pb-20 pt-28 dark:bg-tide-950 sm:px-6 lg:px-10">

      <div className="mx-auto max-w-7xl">

        <Link
          to="/"
          className="text-sm font-semibold text-tide-700 dark:text-gold-300"
        >
          ← Back to resort
        </Link>


        <div className="mt-8 max-w-3xl">

          <span className="eyebrow">
            Choose your Virunga stay
          </span>


          <h1 className="mt-3 font-display text-4xl text-tide-900 dark:text-sand-50 sm:text-5xl">
            Rooms available for your Musanze escape
          </h1>


          <p className="mt-4 text-ink/65 dark:text-sand-100/65">
            Explore each room, see interior details and photos,
            then send your booking request directly to our manager.
          </p>


          {(checkIn ||
            checkOut ||
            guests ||
            packageName) && (
            <p className="mt-4 rounded-2xl bg-sand-100 p-4 text-sm text-ink/70 dark:bg-tide-900 dark:text-sand-100/70">

              Your search:{" "}

              {checkIn ||
                "flexible date"}

              {" → "}

              {checkOut ||
                "flexible date"}

              {guests
                ? ` · ${guests}`
                : ""}

              {packageName
                ? " · Trekking season package"
                : ""}

            </p>
          )}


          {availabilityNote && (
            <p className="mt-3 text-sm text-coral-600">
              {availabilityNote}
            </p>
          )}

        </div>


        {filtered.length === 0 ? (

          <div className="mt-10 rounded-3xl bg-sand-100 p-8 dark:bg-tide-900">

            <h2 className="font-display text-2xl text-tide-900 dark:text-sand-50">
              No matching room is currently available for those dates.
            </h2>

            <p className="mt-2 text-sm opacity-70">
              Try different dates or view all rooms with flexible dates.
            </p>

            <Link
              to="/rooms"
              className="btn-primary mt-5"
            >
              View all rooms
            </Link>

          </div>

        ) : (

          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">

            {filtered.map((room) => (

              <article
                key={room.volcano}
                className="card-surface overflow-hidden rounded-2xl shadow-card"
              >

                <img
                  src={room.image}
                  alt={`${room.volcano} room`}
                  className="h-60 w-full object-cover"
                />


                <div className="p-6">

                  <p className="text-xs font-semibold uppercase tracking-widest2 text-tide-600 dark:text-gold-300">
                    Room {room.numeral} · {room.elevation}
                  </p>


                  <h2 className="mt-2 font-display text-2xl font-semibold text-tide-900 dark:text-sand-50">
                    {room.volcano}
                  </h2>


                  <p className="mt-3 text-sm leading-relaxed text-ink/65 dark:text-sand-100/65">
                    {room.description}
                  </p>


                  <div className="mt-5 flex items-center justify-between">

                    <span className="font-display text-xl font-semibold text-tide-800 dark:text-sand-50">
                      ${room.price.toLocaleString()}

                      <small className="text-xs font-normal opacity-60">
                        {" "}
                        / night
                      </small>
                    </span>


                    <Link
                      className="btn-primary"
                      to={`/rooms/${room.volcano.toLowerCase()}?${params.toString()}`}
                    >
                      View & book
                    </Link>

                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

      </div>

    </main>
  );
}