// One free entry; donation bonuses are consumed by one round only.
export const TICKET_PRICE_MINOR = 5000;
export const MAX_TICKETS = 10;
export const DONATION_URL = "https://donatello.to/general_yogik";

export function ticketsFor(amountMinor: number) {
  return Math.min(MAX_TICKETS, 1 + Math.floor(amountMinor / TICKET_PRICE_MINOR));
}

export function amountInMinor(value: unknown): number | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const match = /^(0|[1-9]\d{0,7})(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) return null;
  const amount = Number(match[1]) * 100 + Number((match[2] || "").padEnd(2, "0"));
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

export type Donation = {
  pubId: string; code: string | null; amountMinor: number; paidAt: number;
};

export function parseDonation(input: unknown, now = Date.now()): Donation | null {
  if (!input || typeof input !== "object") return null;
  const x = input as Record<string, unknown>;
  // Only native Donatello UAH donations. Imported, subscription and FX events
  // must not silently turn into raffle tickets.
  if (x.source !== "donatello" || x.currency !== "UAH" ||
      (x.actualCurrency !== undefined && x.actualCurrency !== "UAH") ||
      (x.isSubscription !== undefined && x.isSubscription !== false)) return null;
  if (typeof x.pubId !== "string" || !/^D\d+-[A-Za-z0-9-]{1,80}$/.test(x.pubId)) return null;
  const amountMinor = amountInMinor(x.amount);
  if (amountMinor === null || !/^\d{10}$/.test(String(x.createdAt))) return null;
  const paidAt = Number(x.createdAt) * 1000;
  if (paidAt > now + 300000 || paidAt < Date.UTC(2020, 0, 1)) return null;
  const matches = typeof x.message === "string"
    ? x.message.toUpperCase().match(/\bPW-[A-F0-9]{32}\b/g) || [] : [];
  const codes = [...new Set(matches)];
  return { pubId: x.pubId, amountMinor, paidAt, code: codes.length === 1 ? codes[0] : null };
}

export async function validCallbackKey(actual: string | null, expected?: string) {
  if (!expected || expected.length < 32 || !actual || actual.length > 512) return false;
  const hash = async (value: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  const [a, b] = await Promise.all([hash(actual), hash(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function donationCode() {
  return "PW-" + crypto.randomUUID().replaceAll("-", "").toUpperCase();
}
