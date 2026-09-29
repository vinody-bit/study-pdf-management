export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 25px rgba(56, 189, 248, 0.3)",
        steel: "0 20px 50px rgba(15, 23, 42, 0.7)"
      },
      colors: {
        space: {
          950: "#040816",
          900: "#091326",
          800: "#0f172a",
          700: "#1e293b"
        }
      },
      animation: {
        float: "float 10s ease-in-out infinite",
        glow: "glow 2.4s ease-in-out infinite",
        drift: "drift 18s ease-in-out infinite alternate",
        pulseSlow: "pulseSlow 5s ease-in-out infinite",
        beam: "beam 5s ease-in-out infinite alternate"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" }
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(14, 165, 233, 0.2)" },
          "50%": { boxShadow: "0 0 28px rgba(14, 165, 233, 0.5)" }
        },
        drift: {
          "0%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "100%": { transform: "translate3d(30px, -20px, 0) scale(1.08)" }
        },
        pulseSlow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" }
        },
        beam: {
          "0%": { transform: "scaleX(0.8) translateX(-15%)", opacity: "0.3" },
          "100%": { transform: "scaleX(1.1) translateX(15%)", opacity: "0.9" }
        }
      }
    }
  },
  plugins: []
};
