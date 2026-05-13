"use client";
import clsx from "clsx";

export function PageContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("max-w-6xl mx-auto px-4 sm:px-6 py-6", className)}>{children}</div>;
}

export function SectionHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="sm:self-end">{actions}</div>}
    </div>
  );
}


