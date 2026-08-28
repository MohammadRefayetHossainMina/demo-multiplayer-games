import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  root: "src",
  publicDir: false,
  base: command === "build" ? "./" : "/",
  server: {
    port: 5173,
    strictPort: true,
    host: "127.0.0.1",
  },
  build: {
    outDir: "../dist/play",
    emptyOutDir: true,
    sourcemap: false,
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) return "three";
        },
      },
    },
  },
}));
