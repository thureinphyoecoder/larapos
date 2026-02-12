import { cn } from "@/lib/utils";

const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-sky-100 text-sky-700",
    danger: "bg-rose-100 text-rose-700",
};

export function Badge({ className, variant = "default", ...props }) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                variants[variant] || variants.default,
                className,
            )}
            {...props}
        />
    );
}
