import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {children}
    </div>
  );
}
