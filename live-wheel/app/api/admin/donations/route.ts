import { db, fail, isHost, json } from "@/lib/show";

export async function GET(request: Request) {
  if (!await isHost(request)) return fail("Увійди як ведучий.", 401);
  const rows = await db().prepare(`SELECT d.pub_id, d.amount_minor, d.round,
    d.received_at, p.nickname FROM donations d
    LEFT JOIN players p ON p.id = d.player_id
    ORDER BY d.received_at DESC, d.pub_id DESC LIMIT 50`).all();
  return json({ donations: rows.results });
}
