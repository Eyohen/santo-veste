/** @type {import('tailwindcss').Config} */
// Palette and type follow the Santo Veste brand guideline:
// Onyx/Charcoal/Stone/Sand/White, Taupe/Olive/Espresso as supporting tones,
// Gold as an accent used with intention. `signal` is a functional colour for
// errors and sale prices only, and is not part of the brand palette.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        asphalt: '#0B0B0B', // Onyx: text, primary buttons, dark sections
        charcoal: '#2E2E2E',
        stone: '#C9BDA7',
        chalk: '#E8DCC6', // Sand: image placeholders, panels
        paper: '#F8F7F2', // White (bone): page background
        taupe: '#9B8F7F',
        olive: '#4A4F3D',
        espresso: '#3A2E24',
        gold: '#D4A84A',
        muted: '#625A4F',
        signal: '#9A3B2B',
      },
      fontFamily: {
        // Syncopate Bold stands in for Microgramma D Extended Bold,
        // Kumbh Sans for Minomu, until the licensed fonts are supplied.
        display: ['Syncopate', '"Microgramma D"', 'Impact', 'sans-serif'],
        body: ['"Kumbh Sans"', 'Minomu', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
