import { listCreate } from "@/lib/crud";
import { contactCfg } from "@/lib/cruds";
export const { GET, POST } = listCreate(contactCfg);
