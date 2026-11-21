import { route } from "@/lib/http";
import { RESOURCES } from "@/safety/resources";
import { env } from "@/lib/env";

/** Public and unauthenticated: crisis information is always reachable and free. */
export const GET = route({ auth: false }, async () => ({ resources: RESOURCES.map(({ verified: _v, ...r }) => r), verified: env.crisisVerified }));
