import { listCreate } from "@/lib/crud";
import { strengthCfg } from "@/lib/cruds";
export const { GET, POST } = listCreate(strengthCfg);
