import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
};

export function StatusBadge({ children, tone = "neutral" }: Props) {
  const className = {
    neutral: "badge badge-neutral",
    success: "badge badge-success",
    warning: "badge badge-warning",
    danger: "badge badge-danger",
  }[tone];

  return <span className={className}>{children}</span>;
}
