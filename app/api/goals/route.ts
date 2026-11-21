import { listCreate } from "@/lib/crud";
import { goalCfg } from "@/lib/cruds";
export const { GET, POST } = listCreate(goalCfg);
