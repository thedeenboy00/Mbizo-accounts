import type { CashBookRow } from "@/types";

function fmt(n: number): string {
  return n.toLocaleString("en-ZW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-ZW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CashBookTable({ rows }: { rows: CashBookRow[] }) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "60px 20px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 13,
        }}
      >
        No entries for this selection.
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
              {["Date", "Reference", "Description", "Debit", "Credit", "Balance"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 16px",
                    textAlign: ["Debit", "Credit", "Balance"].includes(h) ? "right" : "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--navy)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.transactionId}
                style={{
                  borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <td style={{ padding: "11px 16px", fontSize: 13, whiteSpace: "nowrap", color: "var(--text-muted)" }}>
                  {formatDate(row.date)}
                </td>
                <td style={{ padding: "11px 16px", fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
                  {row.reference}
                </td>
                <td style={{ padding: "11px 16px", fontSize: 13, color: "var(--text)" }}>
                  {row.description}
                </td>
                <td style={{ padding: "11px 16px", textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", color: "var(--green)" }}>
                  {row.debit > 0 ? fmt(row.debit) : ""}
                </td>
                <td style={{ padding: "11px 16px", textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", color: "var(--red)" }}>
                  {row.credit > 0 ? fmt(row.credit) : ""}
                </td>
                <td
                  style={{
                    padding: "11px 16px",
                    textAlign: "right",
                    fontSize: 13,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    color: row.balance >= 0 ? "var(--navy)" : "var(--red)",
                  }}
                >
                  {fmt(row.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
