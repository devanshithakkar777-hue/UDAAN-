import { listCreate } from "@/lib/crud";
import { kitCfg } from "@/lib/cruds";
export const { GET, POST } = listCreate(kitCfg);
