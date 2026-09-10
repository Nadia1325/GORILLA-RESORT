# Gorilla Recreational Resort — Musanze, Rwanda

A resort website for a real single property: **Gorilla Recreational Resort**
(Musanganya Faustin Ese), at the foot of Volcanoes National Park in Musanze,
Rwanda. Built with **React 18 + TypeScript + Tailwind CSS** (via Vite).

The resort's five rooms are each named for one of the five Virunga volcanoes
visible from Musanze — Muhabura, Gahinga, Sabyinyo, Bisoke and Karisimbi —
labelled trilingually (English / French / Kinyarwanda) to match the resort's
own signage: **ROOM I / CHAMBRE I / ICYUMBA I**, and so on.

## Run it locally

```bash
npm install
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

To create a production build:

```bash
npm run build
npm run preview
```

## What's inside

- `src/App.tsx` — page composition
- `src/components/`
  - `Navbar` — resort crest logo, name, light/dark toggle
  - `Hero` — Virunga mountain landscape hero image + booking widget
  - `SearchWidget` — room / check-in / check-out / guests booking form
  - `TrustBar` — quick resort stats
  - `Rooms` — the five volcano-named rooms (trilingual labels, elevation,
    meaning of each Kinyarwanda name, price, photo)
  - `MistDivider` — the brand's signature animated section divider,
    evoking the mist over the Virunga range
  - `Experiences` — gorilla trekking, golden monkey tracking, Iby'Iwacu
    cultural village, Twin Lakes, with a photo gallery
  - `OfferBanner` — trekking-season stay package
  - `Testimonials`, `Newsletter`, `Footer`
  - `ThemeToggle` / `hooks/useTheme.ts` — light/dark mode, persisted in
    `localStorage`, respects the system preference by default, and applies
    before first paint (no flash of the wrong theme)
- `src/data.ts` — typed content for rooms, experiences and testimonials —
  edit this file to update real pricing, descriptions or add more rooms
- `src/hooks/useReveal.ts` — IntersectionObserver scroll-reveal hook. It is
  built so content is **never permanently invisible**: reveals default to
  visible, JS only adds a decorative fade-in, a fallback timer forces
  visibility if the observer never fires, and a `<noscript>` rule in
  `index.html` covers browsers with JavaScript disabled entirely
- `public/logo.jpg` — the resort's bronze medallion crest, used as the
  navbar logo, footer logo, and browser favicon
- `tailwind.config.ts` — the brand's color, type and animation tokens
  (`darkMode: "class"` is enabled here)

## Light & dark mode

The toggle button (sun/moon icon) sits in the navbar on both desktop and
mobile. The choice is saved to `localStorage` and re-applied instantly on
return visits; first-time visitors get whatever their OS/browser prefers.
Every section in the site has explicit `dark:` styling — this isn't just an
inverted filter, backgrounds, borders, and text colors are hand-tuned for
both modes.

## Responsiveness

The layout is mobile-first throughout: the navbar collapses to a hamburger
menu, the hero and search widget resize for short/narrow viewports (using
`100svh` so mobile browser toolbars don't clip content), the room and
experience grids collapse from 3/4 columns down to 1 column, and font sizes
scale down a step on small screens. Test it by resizing the browser or using
your browser's device toolbar (Chrome/Firefox DevTools → Toggle device mode).

## Customizing

- **Logo**: replace `public/logo.jpg` with a new file of the same name (or
  update the `src="/logo.jpg"` references in `Navbar.tsx`, `Footer.tsx`, and
  `index.html`).
- **Rooms / pricing**: edit `rooms` in `src/data.ts`.
- **Photos**: all imagery currently loads from Pexels (free-to-use stock
  photography) by URL for the demo — swap the `image` / `src` fields in
  `src/data.ts` and `Hero.tsx` / `Experiences.tsx` for your own resort
  photography once you have it.
- **Colors**: edit the `tide` (forest green), `coral` (bronze), `gold`
  (brass) and `sand` (parchment) palettes in `tailwind.config.ts` — every
  component is themed from these tokens, so a palette change here updates
  the whole site including dark mode.
- **Booking flow**: the search page filters rooms by dates, each room has a detail/gallery page, and booking requests are emailed to the manager for approval.
- **Subscription flow**: a successful subscription emails both the manager and subscriber, then takes the subscriber to the message/comment page.

## Booking and Gmail notifications

The project now includes a small Express/Nodemailer API for room booking approval, newsletter subscriptions, and guest messages.

1. Run `npm install`.
2. Copy `.env.example` to `.env`.
3. In the Google account `nadiaumumararungu12@gmail.com`, enable 2-Step Verification and create a Google App Password.
4. Put that 16-character App Password in `.env` as `GMAIL_APP_PASSWORD` (never put the normal Gmail password in code).
5. Keep `GMAIL_USER` and `MANAGER_EMAIL` as `nadiaumumararungu12@gmail.com`.
6. Run both frontend and API together with `npm run dev:all`.

Booking flow: guest searches dates -> sees available rooms -> opens room details -> submits booking -> manager receives approval email -> manager clicks Approve -> guest receives approved booking ticket by email.

Subscription flow: visitor subscribes -> manager receives subscriber notification -> visitor receives welcome email -> visitor is taken to the message/comment page -> messages are emailed directly to the manager.


## Hero image attribution

The landing-page hero uses a Virunga mountain landscape photograph by Esme Stewart from Wikimedia Commons, licensed under CC BY-SA 4.0. The image page is documented here: https://commons.wikimedia.org/wiki/File:1-Virunga_Lodge_Aerila_ViewSinamatella_-_Rwanda_-_Virunga_-_20180915_-_1054.jpg


## Manager dashboard
Open `/manager` for the private manager dashboard. Authentication uses the manager email plus a password hash stored in environment variables; the password itself is never stored in the frontend. The dashboard shows bookings, statuses, messages/comments, subscribers, website-generated email activity and an audit trail.

The manager can delete a booking from the dashboard; deleted bookings no longer block room availability, while the deletion itself remains in the audit log. Booking emails contain separate approve and reject actions. Rejected bookings also release their dates.

Weekly reports are scheduled for Monday at 08:00 Africa/Kigali time and are sent to the configured manager email while the Node server is running.

Before production, run `npm install`, configure `.env`, and generate the manager password hash/salt with the same Node `crypto.scryptSync` approach used by the server.
