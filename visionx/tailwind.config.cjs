module.exports = {
  content: ["./src/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        vision: {
          cream: "#f7f3ea",
          ink: "#12263a",
          teal: "#0f766e",
          sea: "#d9f3ef",
          sand: "#f0e3c6",
          coral: "#ef7d57"
        }
      },
      boxShadow: {
        soft: "0 18px 48px rgba(18, 38, 58, 0.12)"
      }
    }
  },
  plugins: []
};
