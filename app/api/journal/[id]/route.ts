import { patchDelete } from "@/lib/crud";
import { journalCfg } from "@/lib/cruds";
export const { PATCH, DELETE } = patchDelete(journalCfg);
