/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { navy: "#111b3d", ink: "#172033", orange: "#ff7a45", cream: "#f6f7fb" },
      boxShadow: { card: "0 16px 40px rgba(17, 27, 61, .08)" }
    }
  },
  plugins: []
};
