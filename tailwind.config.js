/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border, 214.3 31.8% 91.4%))",
        input: "hsl(var(--input, 214.3 31.8% 91.4%))",
        ring: "hsl(var(--ring, 164 100% 21%))",
        background: "hsl(var(--background, 210 40% 98%))",
        foreground: "hsl(var(--foreground, 222 47% 11%))",
        primary: {
          DEFAULT: "hsl(var(--primary, 164 100% 21%))",
          dark: "hsl(var(--primary-dark, 164 100% 14%))",
          foreground: "hsl(var(--primary-foreground, 0 0% 100%))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary, 43 96% 53%))",
          dark: "hsl(var(--secondary-dark, 34 88% 45%))",
          foreground: "hsl(var(--secondary-foreground, 222 47% 11%))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive, 0 84.2% 60.2%))",
          foreground: "hsl(var(--destructive-foreground, 0 0% 98%))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted, 210 40% 96.1%))",
          foreground: "hsl(var(--muted-foreground, 215.4 16.3% 46.9%))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 164 60% 90%))",
          foreground: "hsl(var(--accent-foreground, 222 47% 11%))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover, 0 0% 100%))",
          foreground: "hsl(var(--popover-foreground, 222 47% 11%))",
        },
        card: {
          DEFAULT: "hsl(var(--card, 0 0% 100%))",
          foreground: "hsl(var(--card-foreground, 222 47% 11%))",
        },
      },
      borderRadius: {
        lg: "var(--radius, 1.25rem)",
        md: "calc(var(--radius, 1.25rem) - 2px)",
        sm: "calc(var(--radius, 1.25rem) - 4px)",
      },
    },
  },
  plugins: [],
};
