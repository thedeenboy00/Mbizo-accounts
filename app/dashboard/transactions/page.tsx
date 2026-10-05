import { initDb } from "@/lib/db";
import { getTransactions } from "@/lib/transactions";
import TransactionTable from "@/components/TransactionTable";
import NewTransactionForm from "@/components/NewTransactionForm";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TransactionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  initDb();
  const transactions = getTransactions();

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--navy)",
              letterSpacing: "-0.4px",
            }}
          >
            Transactions
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 13 }}>
            {transactions.length} records across all categories
          </p>
        </div>
        <NewTransactionForm />
      </div>

      <TransactionTable transactions={transactions} />
    </div>
  );
}
