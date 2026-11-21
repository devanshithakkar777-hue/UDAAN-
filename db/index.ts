import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;
const g = globalThis as unknown as { __udaanSql?: ReturnType<typeof postgres>; __udaanDb?: Db };

export function getSql() {
  if (!g.__udaanSql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    g.__udaanSql = postgres(url, { max: Number(process.env.DB_POOL_MAX ?? 10), idle_timeout: 20, prepare: false });
  }
  return g.__udaanSql;
}

export function getDb(): Db {
  if (!g.__udaanDb) g.__udaanDb = drizzle(getSql(), { schema });
  return g.__udaanDb;
}

export const db = new Proxy({} as Db, { get: (_t, p) => (getDb() as never)[p as never] });
export { schema };
