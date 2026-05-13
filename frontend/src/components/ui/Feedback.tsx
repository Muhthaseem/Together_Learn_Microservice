"use client";

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      {label || "Loading..."}
    </div>
  );
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded border p-6 text-center text-sm text-[var(--color-muted)]">
      {icon && <div className="flex justify-center mb-2 text-[var(--color-secondary)]">{icon}</div>}
      <div className="font-medium text-[var(--color-fg)] mb-1">{title}</div>
      {description && <div className="text-[var(--color-muted)]">{description}</div>}
    </div>
  );
}
