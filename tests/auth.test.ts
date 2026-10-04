import { describe, expect, it } from "vitest";
import {
  createSessionToken,
  hashPassword,
  initialFromEmail,
  verifyPassword,
  verifySessionToken,
} from "@/lib/auth";

// Auth seams: scrypt password hashing + HMAC session tokens.
// These are pure crypto functions — no DB, no cookies — so they unit test
// without mocking next/headers.

describe("password hashing (scrypt)", () => {
  it("round-trips a password", () => {
    const stored = hashPassword("demo1234");
    expect(stored).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
    expect(verifyPassword("demo1234", stored)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const stored = hashPassword("demo1234");
    expect(verifyPassword("wrong", stored)).toBe(false);
  });

  it("salts every hash (same password → different hashes)", () => {
    expect(hashPassword("demo1234")).not.toBe(hashPassword("demo1234"));
  });

  it("rejects malformed stored hashes", () => {
    expect(verifyPassword("demo1234", "garbage")).toBe(false);
    expect(verifyPassword("demo1234", "a:b:c")).toBe(false);
  });
});

describe("session tokens (HMAC)", () => {
  it("round-trips a user id", () => {
    const token = createSessionToken("user-123");
    expect(verifySessionToken(token)).toBe("user-123");
  });

  it("rejects tampered payloads", () => {
    const token = createSessionToken("user-123");
    const parts = token.split(".");
    parts[0] = "user-456"; // swap the user id, keep the mac
    expect(verifySessionToken(parts.join("."))).toBeNull();
  });

  it("rejects garbage shapes", () => {
    expect(verifySessionToken("no-dots")).toBeNull();
    expect(verifySessionToken("a.b.c")).toBeNull();
    expect(verifySessionToken("")).toBeNull();
  });
});

describe("initialFromEmail", () => {
  it("uppercases the first character of the local part", () => {
    expect(initialFromEmail("demo@flowschedule.app")).toBe("D");
    expect(initialFromEmail("sepnetflix2023@outlook.com")).toBe("S");
  });
});
