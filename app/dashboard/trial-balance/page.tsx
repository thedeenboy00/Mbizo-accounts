import { getTrialBalance } from "@/lib/transactions";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import TrialBalanceTable from "@/components/TrialBalanceTable";

export default async function TrialBalancePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const rows = await getTrialBalance();
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.001;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
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

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            href="/api/reports/general-ledger"
            download
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", background: "var(--surface)",
              border: "1px solid var(--border)", borderRadius: 7,
              fontSize: 13, fontWeight: 500, color: "var(--navy)",
              whiteSpace: "nowrap", textDecoration: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v13M7 12l5 5 5-5M3 21h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            General Ledger
          </a>
          {rows.length > 0 && (
          <a
            href="/api/reports/trial-balance"
            download
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--navy)",
              whiteSpace: "nowrap",
              textDecoration: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3v13M7 12l5 5 5-5M3 21h18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download Excel
          </a>
          )}
        </div>
      </div>

      <TrialBalanceTable
        rows={rows}
        totalDebit={totalDebit}
        totalCredit={totalCredit}
        balanced={balanced}
      />
    </div>
  );
}
