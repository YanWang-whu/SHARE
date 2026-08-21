import { env } from "cloudflare:workers";

export type AccessRole = "admin" | "viewer";
const encoder = new TextEncoder();
const decode = new TextDecoder();
const runtime = () => env as unknown as Record<string, string | undefined>;
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
const unb64 = (value: string) => Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (char) => char.charCodeAt(0));

async function signature(payload: string) {
  const secret = runtime().SESSION_SECRET;
  if (!secret) throw new Error("站点访问密码尚未配置");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload))));
}

export async function makeAccessToken(role: AccessRole) {
  const payload = b64(encoder.encode(JSON.stringify({ role, expires: Date.now() + 1000 * 60 * 60 * 24 * 30 })));
  return `${payload}.${await signature(payload)}`;
}

export async function accessRole(request: Request): Promise<AccessRole | null> {
  const token = request.headers.get("cookie")?.match(/(?:^|;\s*)bread_ledger_access=([^;]+)/)?.[1];
  if (!token) return null;
  const [payload, received] = token.split(".");
  if (!payload || !received || received !== await signature(payload)) return null;
  try { const value = JSON.parse(decode.decode(unb64(payload))); return (value.expires > Date.now() && (value.role === "admin" || value.role === "viewer")) ? value.role : null; } catch { return null; }
}

export function roleForPassword(password: string): AccessRole | null {
  const values = runtime();
  if (password === values.ADMIN_PASSWORD) return "admin";
  if (password === values.VIEWER_PASSWORD) return "viewer";
  return null;
}

export function cookie(token: string) { return `bread_ledger_access=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`; }
