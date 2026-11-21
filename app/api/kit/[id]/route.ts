import { patchDelete } from "@/lib/crud";
import { kitCfg } from "@/lib/cruds";
export const { PATCH, DELETE } = patchDelete(kitCfg);
