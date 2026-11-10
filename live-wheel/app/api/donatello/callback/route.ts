import { env } from "cloudflare:workers";
import { db, json } from "@/lib/show";
import { parseDonation, validCallbackKey } from "@/lib/tickets";

export async function POST(request: Request) {
  if (!env.DONATELLO_CALLBACK_KEY || env.DONATELLO_CALLBACK_KEY.length < 32)
    return json({ error: "Інтеграцію не налаштовано." }, 503);
  if (!await validCallbackKey(request.headers.get("X-Key"), env.DONATELLO_CALLBACK_KEY))
    return json({ error: "Недозволений запит." }, 401);
  if (Number(request.headers.get("Content-Length")) > 16384)
    return json({ error: "Надто довгий запит." }, 413);
  let input: unknown;
  try {
    const body = await request.text();
    if (body.length > 16384) return json({ error: "Надто довгий запит." }, 413);
    input = JSON.parse(body);
  } catch { return json({ error: "Некоректний JSON." }, 400); }
  const donation = parseDonation(input);
  // Non-eligible legitimate provider notifications are acknowledged, avoiding
  // automatic disabling of callbacks after repeated provider delivery errors.
  if (!donation) return json({ ok: true, credited: false, reason: "unsupported_event" });
  try {
    const receivedAt = Date.now();
    const result = await db().prepare(`INSERT INTO donations
      (pub_id, player_id, round, amount_minor, paid_at, received_at)
      SELECT ?, (SELECT id FROM players WHERE donation_code = ? AND created_at <= ?),
        COALESCE((SELECT MAX(round) + 1 FROM draws), 1), ?, ?, ?
      ON CONFLICT(pub_id) DO NOTHING`)
      .bind(donation.pubId, donation.code, donation.paidAt + 999,
        donation.amountMinor, donation.paidAt, receivedAt).run();
    return json({ ok: true, duplicate: result.meta.changes === 0 });
  } catch {
    // Do not log payment messages, keys or raw provider payloads.
    return json({ error: "Не вдалося зберегти донат. Повторіть запит." }, 503);
  }
}
