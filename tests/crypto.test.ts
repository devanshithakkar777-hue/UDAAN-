import { describe, expect, it } from "vitest";
import { decrypt, encrypt } from "@/lib/crypto";

describe("field encryption", () => {
  it("round-trips and is non-deterministic", () => {
    const a = encrypt("u1", "hello"), b = encrypt("u1", "hello");
    expect(a).not.toEqual(b);
    expect(decrypt("u1", a)).toBe("hello");
  });
  it("cannot be read with another user's key", () => {
    expect(() => decrypt("u2", encrypt("u1", "secret"))).toThrow();
  });
  it("detects tampering", () => {
    const parts = encrypt("u1", "secret").split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(() => decrypt("u1", parts.join("."))).toThrow();
  });
  it("handles unicode", () => {
    expect(decrypt("u1", encrypt("u1", "मैं ठीक हूँ 🙂"))).toBe("मैं ठीक हूँ 🙂");
  });
});
