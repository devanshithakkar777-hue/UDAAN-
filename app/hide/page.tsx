"use client";
import { useState } from "react";
import Link from "next/link";

/** A neutral screen for when someone might look over your shoulder. Double-tap the title to go back. */
export default function Hide() {
  const [t, setT] = useState("");
  return (
    <main className="mx-auto min-h-dvh max-w-2xl bg-white p-6 text-gray-800">
      <h1 onDoubleClick={() => { window.location.href = "/talk"; }} className="mb-4 font-sans text-2xl font-semibold" style={{ fontFamily: "system-ui" }}>Notes</h1>
      <textarea value={t} onChange={(e) => setT(e.target.value)} placeholder="Shopping list, ideas…" className="h-[60dvh] w-full resize-none rounded-lg border border-gray-200 p-3 outline-none" style={{ fontFamily: "system-ui" }} />
      <p className="mt-4 text-xs text-gray-400">Not saved. <Link href="/talk" className="underline">Return</Link></p>
    </main>
  );
}
