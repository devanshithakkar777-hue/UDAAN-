"use client";
import { useEffect, useRef, useState } from "react";

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

export function Spinner({ label = "Loading" }: { label?: string }) {
  return <div role="status" aria-label={label} className="flex justify-center py-10 text-brown-soft"><span className="dot-pulse text-2xl">●</span></div>;
}

export function Card({ children, className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("card p-4", className)} {...p}>{children}</div>;
}

export function Section({ title, hint, children, action }: { title: string; hint?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div><h2 className="text-xl text-brown">{title}</h2>{hint && <p className="text-sm text-brown-soft">{hint}</p>}</div>{action}
      </div>
      {children}
    </section>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "ok"; children: React.ReactNode }) {
  const c = tone === "warn" ? "bg-[#fdeede] border-[#f0c9a0]" : tone === "ok" ? "bg-[#eef4ea] border-[#cbdcc3]" : "bg-peach border-peach-deep";
  return <div role="note" className={cx("rounded-2xl border px-4 py-3 text-sm text-brown", c)}>{children}</div>;
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); ref.current?.focus();
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-brown/40 sm:items-center" onClick={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="fade-in max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream p-5 safe-b sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-2xl text-brown">{title}</h2><button className="btn btn-ghost" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  );
}

export function Scale({ value, onChange, min = 1, max = 5, labels, label }: { value: number | null; onChange: (n: number) => void; min?: number; max?: number; labels?: [string, string]; label: string }) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div role="radiogroup" aria-label={label}>
      <div className="flex gap-2">
        {nums.map((n) => (
          <button key={n} role="radio" aria-checked={value === n} onClick={() => onChange(n)} className={cx("btn min-h-12 flex-1 !px-0", value === n ? "btn-primary" : "btn-soft")}>{n}</button>
        ))}
      </div>
      {labels && <div className="mt-1 flex justify-between text-xs text-brown-soft"><span>{labels[0]}</span><span>{labels[1]}</span></div>}
    </div>
  );
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true; setLoading(true);
    fn().then((d) => live && (setData(d), setError(null))).catch((e) => live && setError(e.message)).finally(() => live && setLoading(false));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, error, loading, reload: () => setTick((t) => t + 1), setData };
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-brown-soft">{children}</p>;
}
