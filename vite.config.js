import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    proxy: {
      "/api/translate": {
        target: "https://translate.googleapis.com",
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/api\/translate/, "/translate_a/single"),
      },
    },
  },
});
