import { cn } from "@/lib/utils";

export function Label({ className, ...props }) {
    return <label className={cn("text-[11px] font-bold uppercase tracking-wider text-slate-500", className)} {...props} />;
}
