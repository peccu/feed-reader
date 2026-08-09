import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  root: "src/client",
  build: {
    outDir: "../../dist/client",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: ["zimaboard.jay-tegu.ts.net"],
    proxy: {
      "/api/v1": "http://localhost:3000",
    },
  },
});
