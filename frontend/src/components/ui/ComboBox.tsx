"use client";
import { Fragment, useMemo, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/solid";

export function ComboBox({ options, value, onChange, placeholder, onSearch, className }: { options: string[]; value: string; onChange: (v: string) => void; placeholder?: string; onSearch?: (q: string) => void; className?: string }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    if (onSearch) return options; // when backend searching, show options as-is
    if (!query) return options;
    return options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  }, [options, query, onSearch]);

  return (
    <Combobox value={value} onChange={(v: string | null) => onChange(v ?? "") }>
      <div className={`relative ${className || ''}`}>
        <div className="relative w-full cursor-default overflow-hidden rounded border border-token bg-[var(--color-surface)] text-left focus-within:ring-2 focus-within:ring-[var(--color-secondary)]">
          <Combobox.Input
            className="w-full border-none py-2 pl-3 pr-10 text-sm bg-transparent text-[var(--color-fg)] placeholder-[var(--color-muted)] focus:outline-none"
            displayValue={(v: string) => v}
            onChange={(event) => { const q = event.target.value; setQuery(q); onSearch?.(q); }}
            placeholder={placeholder || "Search..."}
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-4 w-4 text-[var(--color-muted)]" aria-hidden="true" />
          </Combobox.Button>
        </div>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setQuery("") }>
          <Combobox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-token bg-[var(--color-surface)] py-1 text-sm shadow-lg focus:outline-none">
            {filtered.length === 0 ? (
              <div className="relative cursor-default select-none px-3 py-2 text-[var(--color-muted)]">No results</div>
            ) : (
              filtered.map((option) => (
                <Combobox.Option key={option} className={({ active }) => `relative cursor-pointer select-none py-2 pl-8 pr-3 ${active ? 'bg-[var(--color-accent)]/20' : ''}`} value={option}>
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option}</span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-[var(--color-secondary)]">
                          <CheckIcon className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}


