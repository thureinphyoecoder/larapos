import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import LocaleSwitcher from "@/Components/LocaleSwitcher";

export default function AuthTopbar() {
    const { props } = usePage();
    const i18n = props?.i18n || {};
    const t = (key, fallback) => i18n?.[key] || fallback;

    const [themeMode, setThemeMode] = useState("system");

    useEffect(() => {
        const saved =
            window.localStorage.getItem("larapee_theme_mode") ||
            window.localStorage.getItem("larapee_user_theme_mode") ||
            window.localStorage.getItem("larapee_admin_theme_mode");
        if (saved === "light" || saved === "dark" || saved === "system") {
            setThemeMode(saved);
        }
    }, []);

    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const applyTheme = () => {
            const nextTheme = themeMode === "system" ? (media.matches ? "dark" : "light") : themeMode;
            document.documentElement.dataset.theme = nextTheme;
            document.documentElement.classList.toggle("dark", nextTheme === "dark");
        };

        applyTheme();
        media.addEventListener("change", applyTheme);
        return () => media.removeEventListener("change", applyTheme);
    }, [themeMode]);

    useEffect(() => {
        window.localStorage.setItem("larapee_theme_mode", themeMode);
        window.localStorage.setItem("larapee_user_theme_mode", themeMode);
    }, [themeMode]);

    const themeButtonClass = (value) =>
        `rounded-md px-2 py-1 text-[11px] font-bold transition ${
            themeMode === value
                ? "bg-orange-500 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }`;

    return (
        <div className="fixed right-4 top-4 z-40 flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 p-2 shadow-md backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80">
            <LocaleSwitcher compact />
            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white/95 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
                <button
                    type="button"
                    onClick={() => setThemeMode("light")}
                    className={themeButtonClass("light")}
                    title={t("theme_light", "Light")}
                    aria-label={t("theme_light", "Light")}
                >
                    L
                </button>
                <button
                    type="button"
                    onClick={() => setThemeMode("dark")}
                    className={themeButtonClass("dark")}
                    title={t("theme_dark", "Dark")}
                    aria-label={t("theme_dark", "Dark")}
                >
                    D
                </button>
                <button
                    type="button"
                    onClick={() => setThemeMode("system")}
                    className={themeButtonClass("system")}
                    title={t("theme_system", "System")}
                    aria-label={t("theme_system", "System")}
                >
                    S
                </button>
            </div>
        </div>
    );
}
