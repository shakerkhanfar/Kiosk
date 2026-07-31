import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@styles": path.resolve(__dirname, "./src/styles"),
    },
  },
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5000,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – allowedHosts exists at runtime in Vite 5.4+ but is missing from older type stubs
    allowedHosts: true,
  },
});
