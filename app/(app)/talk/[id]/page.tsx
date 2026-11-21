"use client";
import { use } from "react";
import Link from "next/link";
import { Chat } from "@/components/chat";

export default function TalkOne({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (<><div className="px-4"><Link href="/talk" className="text-sm text-brown-soft">← New conversation</Link></div><div className="min-h-0 flex-1"><Chat conversationId={id} /></div></>);
}
