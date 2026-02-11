import { router, usePage } from "@inertiajs/react";

export default function LocaleSwitcher({ compact = false }) {
    const props = usePage().props || {};
    const locale = props.locale || "en";
    const i18n = props.i18n || {};
    const label = i18n.language || "Language";

    const onChangeLocale = (nextLocale) => {
        if (!nextLocale || nextLocale === locale) return;
        router.visit(route("locale.switch", { locale: nextLocale }), {
            method: "get",
            preserveScroll: true,
        });
    };

    return (
        <div className={`flex items-center ${compact ? "gap-2" : "gap-1"}`}>
            {!compact && <span className="hidden text-xs text-slate-500 sm:inline">{label}:</span>}
            <div className="relative">
                <select
                    value={locale}
                    onChange={(e) => onChangeLocale(e.target.value)}
                    className="h-8 appearance-none rounded-md border border-slate-300 bg-white px-2 pr-7 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-slate-400"
                    aria-label={label}
                >
                    <option value="en">English</option>
                    <option value="mm">မြန်မာ</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-slate-500">
                    ▼
                </span>
            </div>
        </div>
    );
}
