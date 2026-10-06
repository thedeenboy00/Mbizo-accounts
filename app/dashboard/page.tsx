import { getDashboardStats } from "@/lib/transactions";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import StatCard from "@/components/StatCard";
import CategoryBreakdown from "@/components/CategoryBreakdown";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const stats = await getDashboardStats();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", letterSpacing: "-0.4px" }}>
          Overview
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 13 }}>
          Financial summary across all payment categories
        </p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Total Receipts" value={stats.totalReceipts} currency color="green" />
        <StatCard label="Total Payments" value={stats.totalPayments} currency color="red" />
        <StatCard label="Net Balance" value={stats.balance} currency color={stats.balance >= 0 ? "green" : "red"} />
        <StatCard label="Transactions" value={stats.transactionCount} color="blue" />
      </div>

      <CategoryBreakdown data={stats.byCategory} />

      <style>{`
        .stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (min-width: 768px) {
          .stat-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
