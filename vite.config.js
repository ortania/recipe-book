import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function imageProxyPlugin() {
  return {
    name: "image-proxy",
    configureServer(server) {
      server.middlewares.use("/img-proxy", async (req, res) => {
        const urlParam = new URL(req.url, "http://localhost").searchParams.get(
          "url",
        );
        if (!urlParam) {
          res.statusCode = 400;
          return res.end("Missing url param");
        }
        try {
          const response = await fetch(urlParam);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const buffer = await response.arrayBuffer();
          res.setHeader(
            "Content-Type",
            response.headers.get("content-type") || "image/jpeg",
          );
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", "public, max-age=86400");
          res.end(Buffer.from(buffer));
        } catch (e) {
          res.statusCode = 502;
          res.end("Proxy error: " + e.message);
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), imageProxyPlugin()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          firebase: [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/storage",
          ],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
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
      "/firebase-storage": {
        target: "https://firebasestorage.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/firebase-storage/, ""),
      },
    },
  },
});
