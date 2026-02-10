import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";

const usePolling = process.env.VITE_USE_POLLING === "true";

export default defineConfig({
    plugins: [
        laravel({
            input: "resources/js/app.jsx",
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: process.env.VITE_HOST ?? "localhost",
        port: Number(process.env.VITE_PORT ?? 5173),
        strictPort: true,
        hmr: process.env.VITE_HMR_HOST
            ? {
                  host: process.env.VITE_HMR_HOST,
              }
            : undefined,
        watch: usePolling
            ? {
                  usePolling: true,
                  interval: 1000,
              }
            : undefined,
    },
});
