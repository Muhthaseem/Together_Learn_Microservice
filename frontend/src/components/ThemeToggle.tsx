"use client";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@heroicons/react/24/solid";
import dynamic from "next/dynamic";

function ThemeToggleInner() {
  const { theme, setTheme, systemTheme } = useTheme();
  const current = theme === "system" ? systemTheme : theme;
  const next = current === "dark" ? "light" : "dark";
  const pressed: boolean = current === "dark";
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(next || "light")}
      className="h-9 w-9 rounded-full border border-token bg-[var(--color-surface)] shadow-sm flex items-center justify-center hover:bg-[var(--color-accent)]/20 transition-colors"
      title={current === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {current === "dark" ? (
        <SunIcon className="h-4 w-4 text-[var(--color-secondary)]" />
      ) : (
        <MoonIcon className="h-4 w-4 text-[var(--color-secondary)]" />
      )}
    </button>
  );
}

export const ThemeToggle = dynamic(() => Promise.resolve(ThemeToggleInner), { ssr: false });
