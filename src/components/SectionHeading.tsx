interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
}: SectionHeadingProps) {
  const isCenter = align === "center";
  // "light" tone is used on sections that are always dark-surfaced
  // (e.g. the Experiences band), regardless of the site-wide theme.
  const isLight = tone === "light";

  return (
    <div className={`max-w-2xl ${isCenter ? "mx-auto text-center" : ""}`}>
      <span
        className={`eyebrow ${isCenter ? "justify-center" : ""} ${
          isLight ? "!text-gold-300" : ""
        }`}
      >
        <span
          className={`h-px w-8 ${
            isLight ? "bg-gold-300/60" : "bg-tide-600/50 dark:bg-gold-300/50"
          }`}
          aria-hidden="true"
        />
        {eyebrow}
      </span>
      <h2
        className={`mt-4 font-display text-2xl font-medium leading-tight sm:text-3xl lg:text-4xl ${
          isLight ? "text-sand-50" : "text-tide-900 dark:text-sand-50"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base leading-relaxed ${
            isLight ? "text-sand-100/80" : "text-ink/65 dark:text-sand-100/70"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
