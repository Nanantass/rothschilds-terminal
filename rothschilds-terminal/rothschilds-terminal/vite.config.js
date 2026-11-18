import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from project root — ANTHROPIC_API_KEY lives in .env
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    server: {
      port: 5173,
      proxy: {
        /**
         * All requests to /api/* are proxied to api.anthropic.com.
         * The API key is injected server-side so it is never exposed
         * to the browser bundle.
         *
         * Frontend calls:  fetch("/api/v1/messages", ...)
         * Proxy forwards:  https://api.anthropic.com/v1/messages
         *                  + headers: x-api-key, anthropic-version
         */
        "/api": {
          target: "https://api.anthropic.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          headers: {
            "x-api-key":          env.ANTHROPIC_API_KEY,
            "anthropic-version":  "2023-06-01",
          },
        },
      },
    },

    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});
