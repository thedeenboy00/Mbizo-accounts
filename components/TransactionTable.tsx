import type { Transaction } from "@/types";

const CATEGORY_COLOR: Record<string, string> = {
  BEAM: "#2563eb",
  PLAN: "#7c3aed",
  HIGHERLIFE: "#059669",
  CAMFED: "#d97706",
  CHILDCARE: "#dc2626",
  SELF: "#0891b2",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-ZW", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmt(n: number): string {
  return n.toLocaleString("en-ZW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "48px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
        No transactions recorded yet. Use the button above to record the first one.
      </div>
    );
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ minWidth: 760 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
              {["Date", "Ref", "Student", "Term", "Description", "Category", "Debit", "Credit"].map((h) => (
                <th key={h} style={{ padding: "11px 14px", textAlign: ["Debit","Credit"].includes(h) ? "right" : "left", fontSize: 12, fontWeight: 600, color: "var(--navy)", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => (
              <tr key={tx.id} style={{ borderBottom: i < transactions.length - 1 ? "1px solid var(--border)" : "none" }}>
                <td style={{ padding: "10px 14px", fontSize: 12, whiteSpace: "nowrap", color: "var(--text-muted)" }}>
                  {formatDate(tx.date)}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                  {tx.reference}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--navy)", fontWeight: 500, whiteSpace: "nowrap", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {tx.studentName ?? "—"}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {tx.term ?? "—"}
                </td>
                <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--text)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tx.description}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: `${CATEGORY_COLOR[tx.category] ?? "#64748b"}18`, color: CATEGORY_COLOR[tx.category] ?? "#64748b", whiteSpace: "nowrap" }}>
                    {tx.category}
                  </span>
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", color: "var(--green)", whiteSpace: "nowrap" }}>
                  {tx.type === "DEBIT" ? fmt(tx.amount) : ""}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", color: "var(--red)", whiteSpace: "nowrap" }}>
                  {tx.type === "CREDIT" ? fmt(tx.amount) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
