import "server-only";

import { isIP } from "node:net";
import { headers } from "next/headers";

function publicIp(value: string | null): string | undefined {
  const ip = value?.split(",")[0]?.trim();
  if (!ip || !isIP(ip)) return undefined;
  if (
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  ) {
    return undefined;
  }
  return ip;
}

export async function getBuyerIp(): Promise<string | undefined> {
  const requestHeaders = await headers();
  return publicIp(
    requestHeaders.get("x-vercel-forwarded-for") ??
      requestHeaders.get("x-forwarded-for") ??
      requestHeaders.get("x-real-ip"),
  );
}
