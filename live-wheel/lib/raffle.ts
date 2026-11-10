import { MAX_TICKETS, TICKET_PRICE_MINOR, ticketsFor } from "./tickets";

export type TicketPlayer = {
  id: number; nickname: string; created_at: number; amount_minor: number;
};

// Both the public count and the immutable draw use this same ledger query.
export const PLAYERS_SQL = `SELECT p.id, p.nickname, p.created_at,
  COALESCE(SUM(d.amount_minor), 0) AS amount_minor
  FROM players p LEFT JOIN donations d ON d.player_id = p.id
    AND d.round = (SELECT COALESCE(MAX(round), 0) + 1 FROM draws)
  GROUP BY p.id ORDER BY p.id`;

export function ticketSnapshot(players: TicketPlayer[]) {
  return { entries: players.map(p => p.nickname), weights: players.map(p => ticketsFor(p.amount_minor)) };
}

// Compare both names and ticket counts inside the atomic INSERT. A concurrent
// donation or registration invalidates stale odds instead of losing a ticket.
export const START_DRAW_SQL = `WITH weighted AS (${PLAYERS_SQL})
INSERT INTO draws(round, entries, weights, winner_index, started_at)
SELECT COALESCE((SELECT MAX(round) + 1 FROM draws), 1), ?, ?, ?, ?
WHERE NOT EXISTS (SELECT 1 FROM draws WHERE finished_at IS NULL)
  AND (SELECT COUNT(*) FROM players) >= 2
  AND ? = (SELECT json_group_array(nickname) FROM (SELECT nickname FROM weighted ORDER BY id))
  AND ? = (SELECT json_group_array(tickets) FROM (
    SELECT MIN(${MAX_TICKETS}, 1 + CAST(amount_minor / ${TICKET_PRICE_MINOR} AS INTEGER)) AS tickets
    FROM weighted ORDER BY id))`;

export function randomIndex(n: number) {
  if (!Number.isSafeInteger(n) || n < 1 || n > 1000) throw Error("Invalid ticket count");
  const x = new Uint32Array(1), limit = Math.floor(0x100000000 / n) * n;
  do { crypto.getRandomValues(x); } while (x[0] >= limit);
  return x[0] % n;
}
