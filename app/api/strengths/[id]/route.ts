import { patchDelete } from "@/lib/crud";
import { strengthCfg } from "@/lib/cruds";
export const { PATCH, DELETE } = patchDelete(strengthCfg);
