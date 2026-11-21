import { listCreate } from "@/lib/crud";
import { moodCfg } from "@/lib/cruds";
export const { GET, POST } = listCreate(moodCfg);
