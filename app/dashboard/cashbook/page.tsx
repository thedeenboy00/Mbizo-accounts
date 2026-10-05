import { getCashBook } from "@/lib/transactions";
import CashBookTable from "@/components/CashBookTable";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { PaymentCategory } from "@/types";

const CATEGORIES: PaymentCategory[] = [
  "BEAM", "PLAN", "HIGHERLIFE", "CAMFED", "CHILDCARE", "SELF",
];

export default async function CashBookPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const rawCategory = params.category;
  const selectedCategory =
    rawCategory && CATEGORIES.includes(rawCategory as PaymentCategory)
      ? (rawCategory as PaymentCategory)
      : undefined;

  const rows = await getCashBook(selectedCategory);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--navy)", letterSpacing: "-0.4px" }}>
          Cash Book
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 13 }}>
          Running balance by payment category
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <a href="/dashboard/cashbook" style={{ padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, background: !selectedCategory ? "var(--navy)" : "var(--surface)", color: !selectedCategory ? "white" : "var(--text-muted)", border: `1px solid ${!selectedCategory ? "var(--navy)" : "var(--border)"}` }}>
          All
        </a>
        {CATEGORIES.map((cat) => (
          <a key={cat} href={`/dashboard/cashbook?category=${cat}`} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, background: selectedCategory === cat ? "var(--navy)" : "var(--surface)", color: selectedCategory === cat ? "white" : "var(--text-muted)", border: `1px solid ${selectedCategory === cat ? "var(--navy)" : "var(--border)"}` }}>
            {cat}
          </a>
        ))}
      </div>

      <CashBookTable rows={rows} />
    </div>
  );
}
