import { type NextRequest } from "next/server";
import { requireManager } from "@/lib/session";
import { fmtDate, monthLabel, shortLocation } from "@/lib/format";
import { loadMonth, totals } from "@/lib/pay";

const csv = (rows: (string | number | null | undefined)[][]) =>
  rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n") + "\r\n";

export async function GET(request: NextRequest) {
  const { supabase, studio } = await requireManager();
  const month = request.nextUrl.searchParams.get("month") ?? "";
  const kind = request.nextUrl.searchParams.get("kind") === "bank" ? "bank" : "xero";
  if (!/^\d{4}-\d{2}$/.test(month)) return new Response("Bad month", { status: 400 });
  const { rows } = await loadMonth(supabase, studio.id, month);
  const t = totals(rows);
  const ref = `Cover ${monthLabel(month)}`.slice(0, 20);

  let body: string;
  if (kind === "bank") {
    // One line per teacher with the unpaid amount, ready to load into online banking.
    const ids = t.byTeacher.map((g) => g.key);
    const { data: bank } = ids.length
      ? await supabase.from("profile_private").select("profile_id, bank_name, bank_account_number, bank_branch_code").in("profile_id", ids)
      : { data: [] };
    const byId = new Map((bank ?? []).map((b) => [b.profile_id, b]));
    body = csv([
      ["Beneficiary name", "Bank", "Account number", "Branch code", "Amount", "Reference", "Missing details"],
      ...t.byTeacher
        .map((g) => ({ g, owed: g.rows.filter((r) => !r.paid_at).reduce((a, r) => a + r.rate, 0) }))
        .filter(({ owed }) => owed > 0)
        .map(({ g, owed }) => {
          const b = byId.get(g.key);
          return [g.rows[0].profiles?.full_name, b?.bank_name, b?.bank_account_number, b?.bank_branch_code, owed.toFixed(2), ref, b?.bank_account_number ? "" : "No bank details on file"];
        }),
    ]);
  } else {
    // Xero bill import: one bill per teacher, one line per class.
    body = csv([
      ["*ContactName", "*InvoiceNumber", "*InvoiceDate", "*DueDate", "Description", "*Quantity", "*UnitAmount", "*AccountCode", "TaxType"],
      ...t.byTeacher.flatMap((g) =>
        g.rows.map((r) => [
          r.profiles?.full_name,
          `COVER-${month.replace("-", "")}-${g.key.slice(0, 6).toUpperCase()}`,
          fmtDate(new Date().toISOString()),
          fmtDate(new Date(Date.now() + 7 * 864e5).toISOString()),
          `${r.cover_requests.class_name}, ${shortLocation(r.cover_requests.locations?.name ?? "")}, ${fmtDate(r.cover_requests.starts_at)}`,
          1,
          r.rate.toFixed(2),
          "",
          "No VAT",
        ]),
      ),
    ]);
  }
  const name = `${studio.name.replace(/\W+/g, "-").toLowerCase()}-${kind}-${month}.csv`;
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` } });
}
