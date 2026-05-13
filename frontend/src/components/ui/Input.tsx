"use client";
import clsx from "clsx";

const base = "w-full rounded border border-token p-2 bg-[var(--color-surface)] text-[var(--color-fg)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(base, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(base, props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(base, props.className)} />;
}
