"use client";
import clsx from "clsx";

export function Card({ className, children, onClick }: { className?: string; children: React.ReactNode; onClick?: React.MouseEventHandler<HTMLDivElement> }) {
  return <div className={clsx("w-full rounded-lg border border-token surface p-4 shadow-sm", className)} onClick={onClick}>{children}</div>;
}

export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-md bg-[var(--color-accent)]/20 text-[var(--color-secondary)] px-2 py-0.5 text-xs font-medium">{children}</span>;
}


