import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [
        laravel({
            input: "resources/js/app.jsx",
            refresh: true,
        }),
        react(),
    ],
    // 👇 ဒီအပိုင်းလေးက Docker အတွက် အသက်ပဲဗျ
    server: {
        host: "0.0.0.0", // Docker ကနေ အပြင်ကို လှမ်းထုတ်ပေးဖို့
        port: 5173,
        strictPort: true,
        hmr: {
            host: "localhost", // Browser ကနေ ပြန်နားထောင်ဖို့
        },
        watch: {
            usePolling: true, // Docker ထဲမှာ ဖိုင်ပြောင်းလဲမှုကို အမြဲစောင့်ကြည့်ဖို့
        },
    },
});
