import { env } from "cloudflare:workers";
import { cookie, db, json, settleActive, type Draw } from "@/lib/show";
import { PLAYERS_SQL, ticketSnapshot, type TicketPlayer } from "@/lib/raffle";
import { DONATION_URL, MAX_TICKETS, TICKET_PRICE_MINOR, donationCode, ticketsFor } from "@/lib/tickets";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await settleActive();
    // D1 batch gives a consistent ledger/round snapshot during concurrent draws.
    const [players, draws, settings, ownRows, activeRows, roundRows] = await db().batch([
      db().prepare(PLAYERS_SQL),
      db().prepare("SELECT * FROM draws WHERE finished_at IS NOT NULL ORDER BY id DESC LIMIT 50"),
      db().prepare("SELECT registration_open, video_id FROM settings WHERE id=1"),
      db().prepare("SELECT id, donation_code FROM players WHERE device_id=?").bind(cookie(request, "show_device")),
      db().prepare("SELECT * FROM draws WHERE finished_at IS NULL ORDER BY id DESC LIMIT 1"),
      db().prepare("SELECT COALESCE(MAX(round),0)+1 AS round FROM draws"),
    ]);
    const people = (players.results as TicketPlayer[]).map(p => ({
      id: p.id, nickname: p.nickname, createdAt: p.created_at, tickets: ticketsFor(p.amount_minor),
    }));
    const own = ownRows.results[0] as { id: number; donation_code: string } | undefined;
    if (own && !own.donation_code) {
      // Provision a code for a returning legacy participant, one bounded row.
      await db().prepare("UPDATE players SET donation_code=? WHERE id=? AND donation_code IS NULL")
        .bind(donationCode(), own.id).run();
      const saved = await db().prepare("SELECT donation_code FROM players WHERE id=?")
        .bind(own.id).first<{ donation_code: string }>();
      own.donation_code = saved?.donation_code || "";
    }
    const active = activeRows.results[0] as Draw | undefined;
    const describe = (d: Draw) => {
      const entries = JSON.parse(d.entries) as string[];
      const winner = entries[d.winner_index];
      const weights = d.weights ? JSON.parse(d.weights) as number[] : entries.map(() => 1);
      return { id: d.id, round: d.round, name: winner, count: new Set(entries).size,
        ticketCount: weights.reduce((a,b)=>a+b,0), winnerTickets: weights[d.winner_index], weights,
        entries, winnerIndex: d.winner_index, finishedAt: d.finished_at };
    };
    const activeEntries = active ? JSON.parse(active.entries) as string[] : [];
    const activeWeights = active?.weights ? JSON.parse(active.weights) as number[] : activeEntries.map(()=>1);
    return json({
      players: people,
      entries: ticketSnapshot(players.results as TicketPlayer[]).entries,
      totalTickets: people.reduce((sum, p) => sum + p.tickets, 0),
      nextRound: (roundRows.results[0] as { round: number }).round,
      history: (draws.results as Draw[]).map(describe),
      active: active ? { round: active.round, startedAt: active.started_at,
        entries: activeEntries, weights: activeWeights, count: new Set(activeEntries).size, ticketCount: activeWeights.reduce((a,b)=>a+b,0) } : null,
      registrationOpen: (settings.results[0] as { registration_open: number } | undefined)?.registration_open !== 0 && !active,
      streamVideoId: (settings.results[0] as { video_id: string | null } | undefined)?.video_id ?? null,
      myPlayerId: own?.id ?? null,
      donation: { enabled: (env.DONATELLO_CALLBACK_KEY?.length ?? 0) >= 32,
        url: DONATION_URL, code: own?.donation_code ?? null,
        priceUAH: TICKET_PRICE_MINOR / 100, maxTickets: MAX_TICKETS },
      serverNow: Date.now(),
    });
  } catch (e) {
    console.error("state error", e);
    return json({ error: "Тимчасово немає зв’язку з розіграшем." }, 503);
  }
}
