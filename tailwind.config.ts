import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // "ink" / "sand" / "tide" / "coral" / "gold" are kept as the
        // internal token names (used throughout components) but re-themed
        // here for the Gorilla Recreational Resort brand: deep Virunga
        // forest green + aged bronze + brass, echoing the resort medallion.
        ink: "#1C1508",
        sand: {
          50: "#FBF6EC",
          100: "#F4EAD3",
          200: "#E9D9B0",
          300: "#DCC48A",
        },
        tide: {
          50: "#EDF3EC",
          100: "#D3E4D0",
          200: "#A8CBA1",
          300: "#7DB073",
          400: "#4F8C48",
          500: "#2F6B2A",
          600: "#245420",
          700: "#1B4118",
          800: "#122C10",
          900: "#0B1D0A",
          950: "#071304",
        },
        coral: {
          300: "#E3B37B",
          400: "#CE8F4E",
          500: "#B36B2E",
          600: "#8F5322",
          700: "#6E3F1A",
        },
        gold: {
          300: "#EAD9A0",
          400: "#D9BE72",
          500: "#C6A24C",
        },
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        body: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.28em",
      },
      boxShadow: {
        card: "0 20px 45px -20px rgba(11, 29, 10, 0.4)",
        float: "0 30px 60px -25px rgba(11, 29, 10, 0.5)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        mist: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        drift: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.9s cubic-bezier(0.22,1,0.36,1) both",
        mist: "mist 14s linear infinite",
        drift: "drift 6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
