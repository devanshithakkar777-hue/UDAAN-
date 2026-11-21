const prod = process.env.NODE_ENV === "production";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable ${name}`);
  return v;
}

export const env = {
  get isProd() { return prod; },
  get appUrl() { return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""); },
  get encKey() {
    const k = Buffer.from(req("DATA_ENCRYPTION_KEY"), "base64");
    if (k.length !== 32) throw new Error("DATA_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
    return k;
  },
  get ipSalt() { return process.env.IP_HASH_SALT ?? "dev-salt"; },
  get cronSecret() { return process.env.CRON_SECRET ?? ""; },
  get aiProvider(): "anthropic" | "mock" {
    const p = process.env.AI_PROVIDER ?? (process.env.ANTHROPIC_API_KEY ? "anthropic" : "mock");
    if (p === "mock" && prod) throw new Error("AI_PROVIDER=mock is not allowed in production");
    return p === "anthropic" ? "anthropic" : "mock";
  },
  get anthropicKey() { return req("ANTHROPIC_API_KEY"); },
  get model() { return process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5"; },
  get classifierModel() { return process.env.ANTHROPIC_CLASSIFIER_MODEL ?? "claude-haiku-5-5"; },
  get adminBootstrapEmail() { return (process.env.ADMIN_BOOTSTRAP_EMAIL ?? "").toLowerCase(); },
  get crisisVerified() { return process.env.CRISIS_RESOURCES_VERIFIED === "true"; },
  get vapid() {
    return { pub: process.env.VAPID_PUBLIC_KEY ?? "", priv: process.env.VAPID_PRIVATE_KEY ?? "", subject: process.env.VAPID_SUBJECT ?? "mailto:support@example.com" };
  },
};
