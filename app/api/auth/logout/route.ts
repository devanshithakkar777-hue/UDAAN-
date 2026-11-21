import { route } from "@/lib/http";
import { destroySession } from "@/lib/auth";
export const POST = route({ auth: false }, async () => { await destroySession(); return { ok: true }; });
