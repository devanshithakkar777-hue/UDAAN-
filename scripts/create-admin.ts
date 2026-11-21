import postgres from "postgres";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

/** Usage: npm run admin:create -- you@example.com 'a-strong-password'  (prints a recovery code once) */
async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 10) { console.error("Usage: npm run admin:create -- <email> <password (10+ chars)>"); process.exit(1); }
  const url = process.env.DATABASE_URL; if (!url) throw new Error("DATABASE_URL is not set");
  const sql = postgres(url, { max: 1 });
  const rec = randomBytes(12).toString("base64url").replace(/[-_]/g, "").toUpperCase().slice(0, 16);
  const hash = await bcrypt.hash(password, 12);
  const [u] = await sql`INSERT INTO users (email, email_lower, password_hash, recovery_hash, role)
    VALUES (${email}, ${email.toLowerCase()}, ${hash}, ${createHash("sha256").update(rec).digest("hex")}, 'admin')
    ON CONFLICT (email_lower) DO UPDATE SET role = 'admin', password_hash = ${hash} RETURNING id`;
  await sql`INSERT INTO profiles (user_id) VALUES (${u.id}) ON CONFLICT DO NOTHING`;
  console.log(`Admin ready: ${email}\nRecovery code (store it safely, shown once): ${rec.match(/.{4}/g)!.join("-")}`);
  await sql.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
