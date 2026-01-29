import { type ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning";

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700",
  success:
    "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  warning:
    "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
