"use client";
import clsx from "clsx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
};

export function Button({ variant = "primary", size = "md", className, leftIcon, children, ...props }: Props) {
  const base = "inline-flex items-center justify-center gap-2 rounded transition-transform transition-colors disabled:opacity-50 active:scale-[0.98] shadow-sm";
  const variants = {
    primary: "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]",
    outline: "border border-token hover:bg-[var(--color-surface)]",
    ghost: "hover:bg-[var(--color-surface)]",
    danger: "bg-red-600 text-white hover:bg-red-700",
  } as const;
  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-12 px-5 text-lg",
  } as const;
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props}>
      {leftIcon}
      {children}
    </button>
  );
}
