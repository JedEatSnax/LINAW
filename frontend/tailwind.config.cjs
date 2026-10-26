module.exports = {
  content: [
    "./index.html",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require("shadcn/tailwind")],
  theme: { extend: {} },
  plugins: [],
};
