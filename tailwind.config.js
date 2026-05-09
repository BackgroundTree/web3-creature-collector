/** @type {import('tailwindcss').Config} */
export default {
  content: ["./frontend/src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [     function ({ addUtilities }) {
       addUtilities({
         '.pixel-border': { 'image-rendering': 'pixelated' },
         '.image-rendering-pixelated': { 'image-rendering': 'pixelated' },
       });
      },
  ],
}