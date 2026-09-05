import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "pokecell-shopify-cart";
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

function encryptionKey(): Buffer {
  const encoded = process.env.SHOPIFY_CART_COOKIE_SECRET?.trim();
  if (!encoded) throw new Error("SHOPIFY_CART_COOKIE_SECRET is required.");

  const key = Buffer.from(encoded, "base64url");
  if (key.length !== 32) {
    throw new Error("SHOPIFY_CART_COOKIE_SECRET must decode to exactly 32 bytes.");
  }
  return key;
}

function encryptCartId(cartId: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(COOKIE_NAME));
  const ciphertext = Buffer.concat([cipher.update(cartId, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64url");
}

function decryptCartId(value: string): string | null {
  try {
    const encrypted = Buffer.from(value, "base64url");
    if (encrypted.length <= IV_BYTES + AUTH_TAG_BYTES) return null;
    const iv = encrypted.subarray(0, IV_BYTES);
    const tag = encrypted.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
    const ciphertext = encrypted.subarray(IV_BYTES + AUTH_TAG_BYTES);
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAAD(Buffer.from(COOKIE_NAME));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export async function readCartId(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  return value ? decryptCartId(value) : null;
}

export async function writeCartId(cartId: string): Promise<void> {
  (await cookies()).set(COOKIE_NAME, encryptCartId(cartId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearCartId(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
