import { listCreate } from "@/lib/crud";
import { journalCfg } from "@/lib/cruds";
export const { GET, POST } = listCreate(journalCfg);
