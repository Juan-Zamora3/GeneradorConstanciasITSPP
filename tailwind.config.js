// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      backgroundImage: {
        app: "url('/src/assets/FondoAPP.png')",
      }
    },
  },
  plugins: [],
}
