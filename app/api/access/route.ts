import { accessRole, cookie, makeAccessToken, roleForPassword } from "../../access";

export async function GET(request: Request) { return Response.json({ role: await accessRole(request) }); }
export async function POST(request: Request) {
  const { password } = await request.json() as { password?: string };
  const role = roleForPassword(password ?? "");
  if (!role) return Response.json({ error: "密码不正确" }, { status: 401 });
  return Response.json({ role }, { headers: { "Set-Cookie": cookie(await makeAccessToken(role)) } });
}
export function DELETE() { return Response.json({ ok: true }, { headers: { "Set-Cookie": "bread_ledger_access=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" } }); }
