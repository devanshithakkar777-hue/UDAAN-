"use client";
import { use } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { Chat } from "@/components/chat";
import { Flow } from "@/components/flow";
import { Tool, Overload } from "@/components/tools";
import { Notice, Spinner, useAsync } from "@/components/ui";
import type { ModuleDef } from "@/modules/types";

type Pub = Omit<ModuleDef, "instructions">;

export default function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading } = useAsync(() => api<{ modules: Pub[] }>("/api/modules"), []);
  if (loading) return <Spinner />;
  const m = data?.modules.find((x) => x.id === id);
  if (!m) return <div className="space-y-3 pt-6"><Notice tone="warn">That isn't available.</Notice><Link href="/grow" className="btn btn-soft">Back to Grow</Link></div>;
  if (m.kind === "tool" && m.tool === "overload") return <Overload />;
  return (
    <div className="space-y-4">
      <div><Link href="/grow" className="text-sm text-brown-soft">← Grow</Link><h1 className="mt-1 flex items-center gap-2 text-3xl text-brown"><span aria-hidden>{m.icon}</span>{m.title}</h1><p className="text-brown-soft">{m.blurb}</p></div>
      {m.sensitive && <Notice>This touches on a sensitive area. Go at your own pace. If it gets to be too much, tap Safe at the top, or stop any time.</Notice>}
      {m.kind === "tool" && m.tool && <Tool id={m.tool} />}
      {m.kind === "flow" && <Flow m={m} />}
      {m.kind === "chat" && <div className="card -mx-1 flex h-[70dvh] flex-col overflow-hidden"><Chat moduleId={m.id} opener={m.opener} starters={m.starters} /></div>}
    </div>
  );
}
