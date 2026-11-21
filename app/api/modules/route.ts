import { route } from "@/lib/http";
import { CATEGORIES, listModules } from "@/modules/registry";
import { DOMAINS } from "@/modules/types";

export const GET = route({ auth: false }, async () => ({ categories: CATEGORIES, domains: DOMAINS, modules: await listModules() }));
