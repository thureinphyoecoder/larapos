import axios from "axios";
window.axios = axios;

const token = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");

if (token) {
    window.axios.defaults.headers.common["X-CSRF-TOKEN"] = token;
}

import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: "reverb", // 🎯 ဒီနေရာမှာ Reverb လို့ ပြောလိုက်တာနဲ့ Pusher server ကို မသွားတော့ပါဘူး
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? "https") === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: "/broadcasting/auth",
    auth: {
        headers: {
            "X-CSRF-TOKEN": token,
        },
    },
});

window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
