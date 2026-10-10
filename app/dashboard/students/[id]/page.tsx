import { getStudent, getStudentPayments } from "@/lib/students";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import RecordPaymentButton from "@/components/RecordPaymentButton";

function fmt(n: number) {
  return n.toLocaleString("en-ZW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-ZW", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function StudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const [student, payments] = await Promise.all([getStudent(id), getStudentPayments(id)]);
  if (!student) notFound();

  const balanceColor = student.balance <= 0 ? "var(--green)" : student.balance < student.termFee ? "var(--amber)" : "var(--red)";
  const balanceBg    = student.balance <= 0 ? "var(--green-bg)" : student.balance < student.termFee ? "var(--amber-bg)" : "var(--red-bg)";
  const statusLabel  = student.balance <= 0 ? "Fully Paid" : student.totalPaid > 0 ? "Partial" : "Unpaid";

  return (
    <div>
      {/* Back */}
      <Link href="/dashboard/students" style={{ fontSize: 13, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        All students
      </Link>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)" }}>
              {student.firstName} {student.lastName}
            </h1>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 4, background: balanceBg, color: balanceColor }}>
              {statusLabel}
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 13 }}>
            {student.studentId} · {student.form} {student.class}
          </p>
        </div>
        <RecordPaymentButton studentId={student.id} studentName={`${student.firstName} ${student.lastName}`} />
      </div>

      {/* Outstanding carry-forward banner */}
      {student.carryForward > 0 && (
        <div style={{ padding: "12px 16px", borderRadius: 8, background: "var(--amber-bg)", border: "1px solid #fbbf2430", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span style={{ fontSize: 13, color: "var(--amber)" }}>
            <strong>USD {fmt(student.carryForward)}</strong> outstanding from previous term has been added to this term&apos;s balance.
          </span>
        </div>
      )}

      {/* Finance summary */}
      <div className="student-stat-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Term Fee",          value: `USD ${fmt(student.termFee)}`,                    color: "var(--navy)" },
          { label: "Carry Forward",     value: student.carryForward > 0 ? `USD ${fmt(student.carryForward)}` : "None", color: student.carryForward > 0 ? "var(--amber)" : "var(--text-muted)" },
          { label: "Total Paid",        value: `USD ${fmt(student.totalPaid)}`,                  color: "var(--green)" },
          { label: "Balance Owing",     value: `USD ${fmt(Math.max(0, student.balance))}`,       color: balanceColor },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color, letterSpacing: "-0.3px" }}>{s.value}</div>
            {s.label === "Balance Owing" && student.lastPayment && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                Last paid: {fmtDate(student.lastPayment)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Payment history */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Payment History</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{payments.length} payment{payments.length !== 1 ? "s" : ""}</span>
        </div>

        {payments.length === 0 ? (
          <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No payments recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ minWidth: 500 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
                  {["Date", "Reference", "Term", "Method", "Amount"].map((h) => (
                    <th key={h} style={{ padding: "11px 14px", textAlign: h === "Amount" ? "right" : "left", fontSize: 12, fontWeight: 600, color: "var(--navy)", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < payments.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(p.createdAt)}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: "monospace", color: "var(--text-muted)" }}>{p.reference}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--text)" }}>{p.term}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: p.method === "Bank" ? "#eff6ff" : "var(--green-bg)", color: p.method === "Bank" ? "var(--accent)" : "var(--green)" }}>
                        {p.method === "Bank" ? "🏦 Bank" : "💵 Cash"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--green)", fontVariantNumeric: "tabular-nums" }}>
                      USD {fmt(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .student-stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .student-stat-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </div>
  );
}
