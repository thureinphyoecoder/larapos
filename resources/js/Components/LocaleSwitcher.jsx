import { Link, usePage } from "@inertiajs/react";

export default function LocaleSwitcher({ compact = false }) {
    const props = usePage().props || {};
    const locale = props.locale || "en";
    const i18n = props.i18n || {};
    const label = i18n.language || "Language";

    return (
        <div className="flex items-center gap-1">
            {!compact && <span className="hidden text-xs text-slate-500 sm:inline">{label}:</span>}
            <Link
                href={route("locale.switch", { locale: "en" })}
                className={`rounded px-2 py-1 text-xs font-bold ${locale === "en" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
            >
                EN
            </Link>
            <Link
                href={route("locale.switch", { locale: "mm" })}
                className={`rounded px-2 py-1 text-xs font-bold ${locale === "mm" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
            >
                MM
            </Link>
        </div>
    );
}

