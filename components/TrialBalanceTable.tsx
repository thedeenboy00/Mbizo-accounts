import type { TrialBalanceRow } from "@/types";

interface Props {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
}

function fmt(n: number): string {
  return n.toLocaleString("en-ZW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function TrialBalanceTable({
  rows,
  totalDebit,
  totalCredit,
  balanced,
}: Props) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "48px 20px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: 13,
        }}
      >
        No ledger entries yet. Record transactions to populate the trial balance.
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
      {/* Scrollable wrapper — internal scroll only, page never scrolls horizontally */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ minWidth: 380, width: "100%" }}>
          <thead>
            <tr
              style={{
                background: "#f8fafc",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--navy)",
                  whiteSpace: "nowrap",
                }}
              >
                Account
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--navy)",
                  whiteSpace: "nowrap",
                  minWidth: 120,
                }}
              >
                Debit (USD)
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--navy)",
                  whiteSpace: "nowrap",
                  minWidth: 120,
                }}
              >
                Credit (USD)
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.account}
                style={{
                  borderBottom:
                    i < rows.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <td
                  style={{
                    padding: "12px 16px",
                    fontSize: 13,
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.account}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontSize: 13,
                    fontVariantNumeric: "tabular-nums",
                    color: row.debit > 0 ? "var(--green)" : "var(--text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.debit > 0 ? fmt(row.debit) : "—"}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontSize: 13,
                    fontVariantNumeric: "tabular-nums",
                    color:
                      row.credit > 0 ? "var(--red)" : "var(--text-muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.credit > 0 ? fmt(row.credit) : "—"}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr
              style={{
                borderTop: "2px solid var(--navy)",
                background: "#f8fafc",
              }}
            >
              <td style={{ padding: "12px 16px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--navy)",
                    }}
                  >
                    Totals
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: balanced
                        ? "var(--green-bg)"
                        : "var(--red-bg)",
                      color: balanced ? "var(--green)" : "var(--red)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {balanced ? "Balanced" : "Out of balance"}
                  </span>
                </div>
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  fontSize: 13,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--navy)",
                  whiteSpace: "nowrap",
                }}
              >
                {fmt(totalDebit)}
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  fontSize: 13,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--navy)",
                  whiteSpace: "nowrap",
                }}
              >
                {fmt(totalCredit)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
