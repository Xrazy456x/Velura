/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-primary)", "Inter", "ui-sans-serif", "system-ui"]
      },
      colors: {
        ink: "#241f1a",
        coal: "#16110e",
        mist: "#f8f3e8",
        leaf: "#77856e",
        coral: "#c8a35f",
        berry: "#8f6a52",
        gold: "#dec06f"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(56, 42, 26, 0.12)",
        lift: "0 18px 45px rgba(36, 31, 26, 0.16)"
      },
      keyframes: {
        floatIn: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" }
        }
      },
      animation: {
        floatIn: "floatIn 720ms ease-out both",
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
