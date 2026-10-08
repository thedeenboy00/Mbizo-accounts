import type { Student } from "@/types";

function fmt(n: number) {
  return n.toLocaleString("en-ZW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function StudentTable({ students }: { students: Student[] }) {
  if (students.length === 0) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "48px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
        No students found. Add students manually or import from a file.
      </div>
    );
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ minWidth: 560 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border)" }}>
              {["Student ID", "Name", "Form", "Term Fee", "Paid", "Balance", "Status"].map((h) => (
                <th key={h} style={{ padding: "11px 14px", textAlign: ["Term Fee","Paid","Balance"].includes(h) ? "right" : "left", fontSize: 12, fontWeight: 600, color: "var(--navy)", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => {
              const statusLabel = s.balance <= 0 ? "Paid" : s.totalPaid > 0 ? "Partial" : "Unpaid";
              const statusColor = s.balance <= 0 ? "var(--green)" : s.totalPaid > 0 ? "var(--amber)" : "var(--red)";
              const statusBg    = s.balance <= 0 ? "var(--green-bg)" : s.totalPaid > 0 ? "var(--amber-bg)" : "var(--red-bg)";

              return (
                <tr key={s.id} style={{ borderBottom: i < students.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: "monospace", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {s.studentId}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <a href={`/dashboard/students/${s.id}`} style={{ fontSize: 13, fontWeight: 500, color: "var(--navy)", textDecoration: "none" }}>
                      {s.firstName} {s.lastName}
                    </a>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.class}</div>
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--text)", whiteSpace: "nowrap" }}>{s.form}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {fmt(s.termFee)}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 13, fontVariantNumeric: "tabular-nums", color: "var(--green)", whiteSpace: "nowrap" }}>
                    {fmt(s.totalPaid)}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: s.balance > 0 ? "var(--red)" : "var(--green)", whiteSpace: "nowrap" }}>
                    {s.balance > 0 ? fmt(s.balance) : "0.00"}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 4, background: statusBg, color: statusColor, whiteSpace: "nowrap" }}>
                      {statusLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
