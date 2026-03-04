/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          900: "#0d0d0d",
          800: "#111111",
          700: "#1a1a1a",
          600: "#1e293b",
        },
        entity: {
          ldu: "#f59e0b",
          ldg: "#10b981",
          sldg: "#3b82f6",
          lacounty: "#8b5cf6",
          bigkika: "#ec4899",
        },
      },
    },
  },
  plugins: [],
};
