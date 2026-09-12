import { ReactNode, useMemo } from "react";
import { ArrowDown, ArrowUp, Clock, DollarSign, Minus, ShieldCheck, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getPeriodBounds, isWithin, type CustomRange, type DateRangeKey } from "@/lib/date-range";

type Booking = Record<string, any>;

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  tone: "amber" | "green" | "red" | "gold";
  delta?: { direction: "up" | "down" | "flat"; text: string };
  highlight?: boolean;
  featured?: boolean;
}

const TONE_CLASSES: Record<StatCardProps["tone"], string> = {
  amber: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-300",
  green: "bg-tide-500/10 text-tide-600 ring-tide-500/20 dark:text-tide-300",
  red: "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-300",
  gold: "bg-gold-400/15 text-gold-600 ring-gold-400/25 dark:text-gold-300",
};

function StatCard({ label, value, icon, tone, delta, highlight, featured }: StatCardProps) {
  return (
    <Card
      className={cn(
        highlight && "ring-1 ring-amber-500/40",
        featured && "border-none bg-gradient-to-br from-tide-900 to-tide-700 text-sand-50 shadow-float"
      )}
    >
      <CardContent className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-widest2",
              featured ? "text-gold-300" : "text-muted-foreground"
            )}
          >
            {label}
          </p>
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-full ring-1",
              featured ? "bg-gold-400/20 text-gold-300 ring-gold-300/30" : TONE_CLASSES[tone]
            )}
          >
            {icon}
          </span>
        </div>
        <p className={cn("mt-4 text-4xl font-semibold", featured ? "text-sand-50" : "text-tide-900 dark:text-sand-50")}>
          {value}
        </p>
        {delta && (
          <p
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 text-xs font-medium",
              featured
                ? delta.direction === "down"
                  ? "text-red-300"
                  : delta.direction === "flat"
                    ? "text-sand-100/60"
                    : "text-gold-300"
                : delta.direction === "up"
                  ? "text-tide-600 dark:text-tide-300"
                  : delta.direction === "down"
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
            )}
          >
            {delta.direction === "up" && <ArrowUp className="h-3.5 w-3.5" />}
            {delta.direction === "down" && <ArrowDown className="h-3.5 w-3.5" />}
            {delta.direction === "flat" && <Minus className="h-3.5 w-3.5" />}
            {delta.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function formatDelta(current: number, previous: number, periodLabel: string, unit: (n: number) => string) {
  const diff = current - previous;
  if (diff === 0) return { direction: "flat" as const, text: `No change ${periodLabel}` };
  const direction = diff > 0 ? ("up" as const) : ("down" as const);
  return { direction, text: `${diff > 0 ? "+" : ""}${unit(diff)} ${periodLabel}` };
}

interface OverviewSectionProps {
  bookings: Booking[];
  rooms: any[];
  dateRange: DateRangeKey;
  customRange: CustomRange;
}

export function OverviewSection({ bookings, rooms, dateRange, customRange }: OverviewSectionProps) {
  const stats = useMemo(() => {
    const bounds = getPeriodBounds(dateRange, new Date(), customRange);

    const currentBookings = bounds ? bookings.filter((b) => isWithin(b.createdAt, bounds.start, bounds.end)) : bookings;
    const previousBookings = bounds
      ? bookings.filter((b) => isWithin(b.createdAt, bounds.previousStart, bounds.previousEnd))
      : [];

    const count = (list: Booking[], predicate: (b: Booking) => boolean) => list.filter(predicate).length;
    const sumValue = (list: Booking[]) =>
      list
        .filter((b) => b.status === "confirmed" || b.status === "approved")
        .reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);

    const isPending = (b: Booking) => b.status === "pending";
    const isConfirmed = (b: Booking) => b.status === "confirmed" || b.status === "approved";
    const isRejected = (b: Booking) => b.status === "rejected";

    const pending = count(currentBookings, isPending);
    const confirmed = count(currentBookings, isConfirmed);
    const rejected = count(currentBookings, isRejected);
    const value = sumValue(currentBookings);

    if (!bounds) {
      return { pending, confirmed, rejected, value, deltas: null };
    }

    const prevPending = count(previousBookings, isPending);
    const prevConfirmed = count(previousBookings, isConfirmed);
    const prevRejected = count(previousBookings, isRejected);
    const prevValue = sumValue(previousBookings);

    return {
      pending,
      confirmed,
      rejected,
      value,
      deltas: {
        pending: formatDelta(pending, prevPending, bounds.label, (n) => `${Math.abs(n)}`),
        confirmed: formatDelta(confirmed, prevConfirmed, bounds.label, (n) => `${Math.abs(n)}`),
        rejected: formatDelta(rejected, prevRejected, bounds.label, (n) => `${Math.abs(n)}`),
        value: formatDelta(value, prevValue, bounds.label, (n) => `$${Math.abs(n).toLocaleString()}`),
      },
    };
  }, [bookings, dateRange, customRange]);

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending requests"
          value={String(stats.pending)}
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
          delta={stats.deltas?.pending}
          highlight={stats.pending > 0}
        />
        <StatCard
          label="Confirmed bookings"
          value={String(stats.confirmed)}
          icon={<ShieldCheck className="h-5 w-5" />}
          tone="green"
          delta={stats.deltas?.confirmed}
        />
        <StatCard
          label="Rejected"
          value={String(stats.rejected)}
          icon={<XCircle className="h-5 w-5" />}
          tone="red"
          delta={stats.deltas?.rejected}
        />
        <StatCard
          label="Confirmed value"
          value={`$${stats.value.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          tone="gold"
          delta={stats.deltas?.value}
          featured
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <span className="eyebrow">Inventory & pricing</span>
            <CardTitle className="mt-1">Room rates</CardTitle>
          </div>
          <p className="text-xs opacity-60">VIP Room I: $350/night · All other rooms: $200/night</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {rooms.map((r: any) => (
              <div key={r.room} className="rounded-2xl bg-secondary p-4">
                <p className="text-xs uppercase tracking-widest2 opacity-50">{r.tier}</p>
                <p className="mt-1 font-semibold">{r.room}</p>
                <p className="mt-2 text-lg font-semibold">
                  ${r.nightlyPrice}
                  <span className="text-xs font-normal opacity-50"> / night</span>
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-3xl bg-tide-900 p-6 text-sand-50 shadow-card sm:p-8">
        <span className="eyebrow !text-gold-300">Automatic reporting</span>
        <h2 className="mt-2 font-display text-2xl">Weekly report to the manager</h2>
        <p className="mt-2 max-w-2xl text-sm text-sand-100/70">
          The server automatically emails a weekly activity report every Monday at 8:00 AM Rwanda time with
          requests, confirmations, rejections, messages, subscribers, email activity and confirmed booking value.
        </p>
      </div>
    </div>
  );
}
