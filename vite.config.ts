import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { localDemoPlugin } from "./scripts/local-demo-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 8080,
    strictPort: true,
  },
  plugins: [
    react(),
    mode === "development" && localDemoPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
