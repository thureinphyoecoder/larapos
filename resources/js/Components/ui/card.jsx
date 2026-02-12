import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
    return <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
    return <div className={cn("px-5 py-4 border-b border-slate-100", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
    return <h3 className={cn("text-base font-black text-slate-900", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
    return <p className={cn("text-xs text-slate-500 mt-1", className)} {...props} />;
}

export function CardContent({ className, ...props }) {
    return <div className={cn("p-5", className)} {...props} />;
}
