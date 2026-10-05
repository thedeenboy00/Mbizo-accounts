import { initDb } from "@/lib/db";
import { getTrialBalance } from "@/lib/transactions";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

function formatAmount(n: number): string {
  return n.toLocaleString("en-ZW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function TrialBalancePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  initDb();
  const rows = getTrialBalance();

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.001;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--navy)",
            letterSpacing: "-0.4px",
          }}
        >
          Trial Balance
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 13 }}>
          Auto-generated from ledger entries
        </p>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border)",
            background: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>
            Account
          </span>
          <div style={{ display: "flex", gap: 80 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", width: 120, textAlign: "right" }}>
              Debit (USD)
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", width: 120, textAlign: "right" }}>
              Credit (USD)
            </span>
          </div>
        </div>

        {rows.length === 0 && (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: 13,
            }}
          >
            No ledger entries yet. Record transactions to populate the trial balance.
          </div>
        )}

        {rows.map((row, i) => (
          <div
            key={row.account}
            style={{
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--text)" }}>{row.account}</span>
            <div style={{ display: "flex", gap: 80 }}>
              <span
                style={{
                  fontSize: 13,
                  fontVariantNumeric: "tabular-nums",
                  color: row.debit > 0 ? "var(--green)" : "var(--text-muted)",
                  width: 120,
                  textAlign: "right",
                }}
              >
                {row.debit > 0 ? formatAmount(row.debit) : "—"}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontVariantNumeric: "tabular-nums",
                  color: row.credit > 0 ? "var(--red)" : "var(--text-muted)",
                  width: 120,
                  textAlign: "right",
                }}
              >
                {row.credit > 0 ? formatAmount(row.credit) : "—"}
              </span>
            </div>
          </div>
        ))}

        {rows.length > 0 && (
          <div
            style={{
              padding: "14px 20px",
              borderTop: "2px solid var(--navy)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#f8fafc",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>
                Totals
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: balanced ? "var(--green-bg)" : "var(--red-bg)",
                  color: balanced ? "var(--green)" : "var(--red)",
                }}
              >
                {balanced ? "Balanced" : "Out of balance"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 80 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--navy)",
                  width: 120,
                  textAlign: "right",
                }}
              >
                {formatAmount(totalDebit)}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--navy)",
                  width: 120,
                  textAlign: "right",
                }}
              >
                {formatAmount(totalCredit)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
