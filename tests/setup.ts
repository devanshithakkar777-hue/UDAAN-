import { config } from "dotenv";
import { beforeAll } from "vitest";
config({ path: ".env.local" });
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
process.env.AI_PROVIDER = "mock";
process.env.DATA_ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString("base64");

beforeAll(async () => {
  const { runMigrations } = await import("../db/migrate");
  await runMigrations(process.env.DATABASE_URL);
});
