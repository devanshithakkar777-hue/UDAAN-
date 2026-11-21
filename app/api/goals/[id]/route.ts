import { patchDelete } from "@/lib/crud";
import { goalCfg } from "@/lib/cruds";
export const { PATCH, DELETE } = patchDelete(goalCfg);
