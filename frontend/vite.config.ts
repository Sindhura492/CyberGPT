import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
      "@components": "/src/components",
      "@api": "/src/api",
      "@lib": "/src/lib",
      "@store": "/src/store",
      "@pages": "/src/pages",
      "@types": "/src/types",
      "@hooks": "/src/hooks",
    },
  },
  server: {
    host: true,
    port: 3000,
    fs: {
      allow: [".."],
    },
    cors: {
      origin: ["https://appcybergpt.vercel.app", "https://cybergpt-sable.vercel.app"],
    },
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  define: {
    "process.env": process.env,
  },
});
