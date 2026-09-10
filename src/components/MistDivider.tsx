interface MistDividerProps {
  className?: string;
  from?: string;
  to?: string;
  flip?: boolean;
}

/**
 * The brand signature: a low drifting mist-line that recurs between every
 * major section instead of a plain border, evoking the mist that settles
 * over the Virunga volcanoes at dawn. The gradient drifts gently (see the
 * `animate-mist` keyframe) rather than depicting literal motion.
 */
export default function MistDivider({
  className = "",
  from = "#0B1D0A",
  to = "#B36B2E",
  flip = false,
}: MistDividerProps) {
  const gradientId = `mist-gradient-${from.replace("#", "")}-${to.replace("#", "")}`;

  return (
    <div
      className={`relative h-10 w-full overflow-hidden ${flip ? "rotate-180" : ""} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        className="h-full w-[200%] animate-mist"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={from} stopOpacity="0.55" />
            <stop offset="50%" stopColor={to} stopOpacity="0.35" />
            <stop offset="100%" stopColor={from} stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <path
          d="M0,30 C150,60 300,0 450,30 C600,60 750,0 900,30 C1050,60 1200,0 1200,30 L1200,60 L0,60 Z M1200,30 C1350,60 1500,0 1650,30 C1800,60 1950,0 2100,30 C2250,60 2400,0 2400,30 L2400,60 L1200,60 Z"
          fill={`url(#${gradientId})`}
        />
      </svg>
    </div>
  );
}
