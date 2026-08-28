import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#152B2B",
        cream: "#F6F2E9",
        paper: "#FFFDF8",
        saffron: "#E8793B",
        teal: "#0F766E",
        moss: "#DDE9DF",
        mist: "#E7EFEC",
        saffronSoft: "#FCE9DC",
        tealSoft: "#D7ECE9",
        coral: "#F2603C",
        leaf: "#2F9E6E",
        inkSoft: "#3A4F4F",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 24px rgba(21, 43, 43, 0.06)",
        lift: "0 12px 32px rgba(21, 43, 43, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
