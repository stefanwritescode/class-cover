// ManyChat Page API (https://api.manychat.com/swagger). WhatsApp messages outside the
// 24-hour window must be an approved template, so we trigger a ManyChat automation
// whose first step is that template, after filling in the custom fields it reads.
const BASE = "https://api.manychat.com";

export const manychatConfigured = () => !!process.env.MANYCHAT_API_KEY && !!process.env.MANYCHAT_COVER_FLOW_NS;

async function call(path: string, init: { method?: string; body?: unknown; query?: Record<string, string> } = {}) {
  const url = new URL(BASE + path);
  Object.entries(init.query ?? {}).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    method: init.method ?? "POST",
    headers: { Authorization: `Bearer ${process.env.MANYCHAT_API_KEY}`, "Content-Type": "application/json", Accept: "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { status?: string; data?: unknown; message?: string };
  if (!res.ok || json.status === "error") throw new Error(`ManyChat ${path}: ${json.message ?? res.status}`);
  return json.data;
}

/** South African numbers in international format: "082 123 4567" -> "+27821234567". */
export function toE164(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("27")) return `+${digits}`;
  if (digits.startsWith("0")) return `+27${digits.slice(1)}`;
  return `+27${digits}`;
}

/** Find the teacher's ManyChat contact by phone, or create one with their WhatsApp number. */
export async function ensureSubscriber(phone: string, fullName: string): Promise<string> {
  const e164 = toE164(phone);
  try {
    const found = (await call("/fb/subscriber/findBySystemField", { method: "GET", query: { phone: e164 } })) as { id?: string | number } | null;
    if (found?.id) return String(found.id);
  } catch {
    // Not found falls through to create.
  }
  const [first, ...rest] = fullName.trim().split(/\s+/);
  const created = (await call("/fb/subscriber/createSubscriber", {
    body: { first_name: first, last_name: rest.join(" ") || undefined, whatsapp_phone: e164 },
  })) as { id: string | number };
  return String(created.id);
}

export async function sendCoverAlert(subscriberId: string, fields: Record<string, string>) {
  const id = Number(subscriberId);
  // Fill the fields the WhatsApp template reads, one at a time, then send the automation.
  for (const [field_name, field_value] of Object.entries(fields)) {
    await call("/fb/subscriber/setCustomFieldByName", { body: { subscriber_id: id, field_name, field_value } });
  }
  await call("/fb/sending/sendFlow", { body: { subscriber_id: id, flow_ns: process.env.MANYCHAT_COVER_FLOW_NS } });
}
