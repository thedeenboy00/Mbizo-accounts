import { getStudents, getStudentSummaryStats } from "@/lib/students";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentTable from "@/components/StudentTable";
import AddStudentButton from "@/components/AddStudentButton";
import ImportStudentsButton from "@/components/ImportStudentsButton";

function fmt(n: number) {
  return n.toLocaleString("en-ZW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const search = params.search ?? "";
  const [students, stats] = await Promise.all([getStudents(search), getStudentSummaryStats()]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", letterSpacing: "-0.4px" }}>
            Students
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 13 }}>
            {stats.total} students · USD {fmt(stats.totalCollected)} collected · USD {fmt(stats.outstanding)} outstanding
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <ImportStudentsButton />
          <AddStudentButton />
        </div>
      </div>

      {/* Summary stats */}
      <div className="stat-grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: "Fully Paid",      value: stats.fullyPaid,       color: "var(--green)",  bg: "var(--green-bg)" },
          { label: "Partial Payment", value: stats.partiallyPaid,   color: "var(--amber)",  bg: "var(--amber-bg)" },
          { label: "Unpaid",          value: stats.unpaid,          color: "var(--red)",    bg: "var(--red-bg)" },
        ].map((s) => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.color, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <form method="GET" style={{ marginBottom: 16 }}>
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name, ID or form…"
          style={{
            width: "100%",
            padding: "9px 12px",
            border: "1px solid var(--border)",
            borderRadius: 7,
            background: "var(--surface)",
            fontSize: 13,
            color: "var(--text)",
            outline: "none",
          }}
        />
      </form>

      <StudentTable students={students} />

      <style>{`
        .stat-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 480px) {
          .stat-grid-3 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
