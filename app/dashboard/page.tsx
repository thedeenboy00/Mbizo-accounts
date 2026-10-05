import { initDb } from "@/lib/db";
import { getDashboardStats } from "@/lib/transactions";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import StatCard from "@/components/StatCard";
import CategoryBreakdown from "@/components/CategoryBreakdown";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  initDb();
  const stats = getDashboardStats();

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--navy)",
            letterSpacing: "-0.4px",
          }}
        >
          Overview
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 13 }}>
          Financial summary across all payment categories
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="Total Receipts"
          value={stats.totalReceipts}
          currency
          color="green"
        />
        <StatCard
          label="Total Payments"
          value={stats.totalPayments}
          currency
          color="red"
        />
        <StatCard
          label="Net Balance"
          value={stats.balance}
          currency
          color={stats.balance >= 0 ? "green" : "red"}
        />
        <StatCard
          label="Transactions"
          value={stats.transactionCount}
          color="blue"
        />
      </div>

      <CategoryBreakdown data={stats.byCategory} />
    </div>
  );
}
