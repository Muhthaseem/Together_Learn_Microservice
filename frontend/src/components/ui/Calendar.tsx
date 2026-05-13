"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "./Button";
import { AcademicCapIcon, UserGroupIcon } from "@heroicons/react/24/solid";

type CalendarEvent = {
  date: string; // ISO yyyy-mm-dd
  title: string;
  time?: string;
  kind?: "group" | "class" | "other";
  href?: string;
};

function pad2(n: number): string { return String(n).padStart(2, '0'); }
function toYmdLocal(d: Date): string { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function parseYmdLocal(s: string): Date { const [y, m, d] = s.split('-').map((v) => parseInt(v, 10)); return new Date(y, (m || 1) - 1, d || 1); }

function toDateOnly(dateStr: string): string {
  if (!dateStr) return "";
  // Keep yyyy-mm-dd if present; otherwise try to parse and format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  // Format using LOCAL date to avoid UTC off-by-one
  return toYmdLocal(d);
}

export function Calendar({ events, showLegend = true }: { events: CalendarEvent[]; showLegend?: boolean }) {
  const normalized = useMemo(() => events.map(e => ({ ...e, date: toDateOnly(e.date) })).filter(e => e.date), [events]);
  const byDate = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of normalized) {
      const arr = m.get(e.date) || [];
      arr.push(e);
      m.set(e.date, arr);
    }
    return m;
  }, [normalized]);
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(toYmdLocal(today));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const startWeekday = monthStart.getDay(); // 0=Sun
  const daysInMonth = monthEnd.getDate();

  const days: Array<{ key: string; label: number; dateStr: string; hasEvent: boolean } | null> = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toYmdLocal(new Date(year, month, d));
    const hasEvent = byDate.has(dateStr);
    days.push({ key: dateStr, label: d, dateStr, hasEvent });
  }

  const selectedEvents = normalized.filter(e => e.date === selected);
  const todayIso = toYmdLocal(today);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">
          {cursor.toLocaleString(undefined, { month: "long" })} {year}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date(year, month - 1, 1))}>Prev</Button>
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</Button>
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date(year, month + 1, 1))}>Next</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-muted mb-1">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((cell, idx) => (
          cell ? (
            <button
              key={cell.key}
              onClick={() => setSelected(cell.dateStr)}
              className={`rounded-lg h-16 border border-token px-2 py-2 text-sm text-left transition-colors ${selected === cell.dateStr ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'bg-surface hover:bg-surface-2'} ${(() => { const dow = parseYmdLocal(cell.dateStr).getDay(); return dow===0 || dow===6 ? 'bg-[var(--color-accent)]/5' : ''; })()} ${cell.dateStr===todayIso && selected!==cell.dateStr ? 'ring-1 ring-[var(--color-primary)]' : ''}`}
              title={(() => {
                const evs = byDate.get(cell.dateStr) || [];
                return evs.length ? `${evs.length} event(s)` : '';
              })()}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{cell.label}</span>
                {cell.hasEvent && (
                  <span
                    className={`h-2 w-2 rounded-full inline-block ${(() => {
                      const evs = byDate.get(cell.dateStr) || [];
                      return evs.some(e => e.kind === 'class')
                        ? 'bg-[var(--color-primary)]'
                        : evs.some(e => e.kind === 'group')
                        ? 'bg-[var(--color-secondary)]'
                        : 'bg-[var(--color-accent)]';
                    })()}`}
                  />
                )}
              </div>
            </button>
          ) : (
            <div key={`empty-${idx}`} />
          )
        ))}
      </div>
      <div className="mt-3">
        {showLegend && (
          <div className="mb-2 flex items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--color-secondary)] inline-block" /> Group</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--color-primary)] inline-block" /> Class</span>
          </div>
        )}
        <div className="text-sm text-muted mb-1">{parseYmdLocal(selected).toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'short',day:'2-digit'})}</div>
        <div className="space-y-2">
          {selectedEvents.map((e, i) => {
            const content = (
              <div className={`text-sm rounded-md border border-border bg-surface px-3 py-2 flex items-center justify-between hover:bg-surface-2 transition-colors ${e.kind==='class' ? 'border-l-4 border-l-[var(--color-primary)]' : 'border-l-4 border-l-[var(--color-secondary)]'}`} title={`${e.title}${e.time ? ' • '+e.time : ''}`}>
                <div className="inline-flex items-center gap-2">
                  {e.kind === 'class' ? (
                    <AcademicCapIcon className="h-4 w-4 text-[var(--color-primary)]" />
                  ) : (
                    <UserGroupIcon className="h-4 w-4 text-[var(--color-secondary)]" />
                  )}
                  <div className="font-medium">{e.title}</div>
                </div>
                {e.time && <div className="text-muted">{e.time}</div>}
              </div>
            );
            return e.href ? (
              <Link prefetch key={i} href={e.href} className="block">{content}</Link>
            ) : (
              <div key={i}>{content}</div>
            );
          })}
          {selectedEvents.length === 0 && (
            <div className="text-sm text-muted">No events.</div>
          )}
        </div>
      </div>
    </div>
  );
}


