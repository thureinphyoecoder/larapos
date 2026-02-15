import { router, usePage } from "@inertiajs/react";

export default function LocaleSwitcher({ compact = false }) {
    const props = usePage().props || {};
    const locale = props.locale || "en";
    const i18n = props.i18n || {};
    const label = i18n.language || "Language";
    const enLabel = i18n.locale_en || "EN";
    const mmLabel = i18n.locale_mm || "MM";

    const onChangeLocale = (nextLocale) => {
        if (!nextLocale || nextLocale === locale) return;
        router.visit(route("locale.switch", { locale: nextLocale }), {
            method: "get",
            preserveScroll: true,
        });
    };

    if (compact) {
        return (
            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white/95 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
                <button
                    type="button"
                    onClick={() => onChangeLocale("en")}
                    className={`rounded-md px-2 py-1 text-[11px] font-bold transition ${
                        locale === "en"
                            ? "bg-orange-500 text-white"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                    aria-label={i18n.switch_to_english || "Switch to English"}
                >
                    {enLabel}
                </button>
                <button
                    type="button"
                    onClick={() => onChangeLocale("mm")}
                    className={`rounded-md px-2 py-1 text-[11px] font-bold transition ${
                        locale === "mm"
                            ? "bg-orange-500 text-white"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                    aria-label={i18n.switch_to_myanmar || "Switch to Myanmar"}
                >
                    {mmLabel}
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <span className="hidden text-xs text-slate-500 sm:inline">{label}:</span>
            <div className="relative">
                <select
                    value={locale}
                    onChange={(e) => onChangeLocale(e.target.value)}
                    className="h-8 rounded-md border border-slate-300 bg-white pl-2 pr-8 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                    aria-label={label}
                >
                    <option value="en">{i18n.english || "English"}</option>
                    <option value="mm">{i18n.myanmar || "မြန်မာ"}</option>
                </select>
            </div>
        </div>
    );
}
