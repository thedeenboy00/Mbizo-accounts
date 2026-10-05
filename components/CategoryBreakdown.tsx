const CATEGORY_COLORS: Record<string, string> = {
  BEAM: "#2563eb",
  PLAN: "#7c3aed",
  HIGHERLIFE: "#059669",
  CAMFED: "#d97706",
  CHILDCARE: "#dc2626",
  SELF: "#0891b2",
};

interface CategoryBreakdownProps {
  data: { category: string; total: number }[];
}

export default function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 24,
      }}
    >
      <h2
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--navy)",
          marginBottom: 20,
        }}
      >
        Receipts by Category
      </h2>

      {data.length === 0 && (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          No transactions recorded yet.
        </p>
      )}

      {data.map((item) => (
        <div key={item.category} style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
              {item.category}
            </span>
            <span
              style={{
                fontSize: 13,
                fontVariantNumeric: "tabular-nums",
                color: "var(--text-muted)",
              }}
            >
              USD {item.total.toLocaleString("en-ZW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "var(--border)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(item.total / max) * 100}%`,
                background: CATEGORY_COLORS[item.category] ?? "var(--accent)",
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
