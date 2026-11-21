import { patchDelete } from "@/lib/crud";
import { contactCfg } from "@/lib/cruds";
export const { PATCH, DELETE } = patchDelete(contactCfg);
