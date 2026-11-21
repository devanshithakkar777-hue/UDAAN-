"use client";
import { useState } from "react";
import Link from "next/link";
import { Chat } from "@/components/chat";
import { Empty, Sheet, Spinner, useAsync } from "@/components/ui";
import { api } from "@/lib/client";
import { useApp } from "@/components/providers";

export default function Talk() {
  const { t } = useApp(); const [hist, setHist] = useState(false); const [k, setK] = useState(0);
  return (
    <>
      <div className="flex items-center justify-between px-4"><button className="btn btn-ghost !px-2 text-sm" onClick={() => setHist(true)}>History</button><button className="btn btn-ghost !px-2 text-sm" onClick={() => setK(k + 1)}>+ {t("talk.new")}</button></div>
      <div className="min-h-0 flex-1"><Chat key={k} /></div>
      <History open={hist} onClose={() => setHist(false)} />
    </>
  );
}

export function History({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, loading, reload } = useAsync(() => (open ? api<{ conversations: { id: string; mode: string; title: string; updatedAt: string }[] }>("/api/conversations") : Promise.resolve(null)), [open]);
  return (
    <Sheet open={open} onClose={onClose} title="Your conversations">
      {loading && <Spinner />}
      {data && !data.conversations.length && <Empty>Nothing here yet.</Empty>}
      <ul className="space-y-2">{data?.conversations.map((c) => (
        <li key={c.id} className="card flex items-center justify-between gap-2 p-3">
          <Link href={`/talk/${c.id}`} onClick={onClose} className="min-w-0 flex-1"><span className="block truncate font-semibold text-brown">{c.title}</span><span className="text-xs text-brown-soft">{new Date(c.updatedAt).toLocaleDateString()}</span></Link>
          <button className="btn btn-ghost !min-h-9 text-sm" aria-label={`Delete ${c.title}`} onClick={async () => { if (confirm("Delete this conversation permanently?")) { await api(`/api/conversations/${c.id}`, { method: "DELETE" }); reload(); } }}>Delete</button>
        </li>))}</ul>
    </Sheet>
  );
}
