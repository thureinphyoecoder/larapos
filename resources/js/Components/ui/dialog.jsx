import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export function Dialog({ open, onOpenChange, children }) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                onOpenChange(false);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onOpenChange]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-slate-950/50" onClick={() => onOpenChange(false)} />
            {children}
        </div>,
        document.body,
    );
}

export function DialogContent({ className, children }) {
    return (
        <div className={cn("relative z-10 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl", className)}>
            {children}
        </div>
    );
}

export function DialogHeader({ className, ...props }) {
    return <div className={cn("mb-4", className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
    return <h4 className={cn("text-base font-black text-slate-900", className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
    return <p className={cn("mt-1 text-xs text-slate-500", className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
    return <div className={cn("mt-4 flex items-center justify-end gap-2", className)} {...props} />;
}
