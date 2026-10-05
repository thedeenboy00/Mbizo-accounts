interface StatCardProps {
  label: string;
  value: number;
  currency?: boolean;
  color: "green" | "red" | "blue";
}

const COLOR_MAP = {
  green: { bg: "var(--green-bg)", text: "var(--green)" },
  red: { bg: "var(--red-bg)", text: "var(--red)" },
  blue: { bg: "#eff6ff", text: "var(--accent)" },
};

function formatValue(value: number, currency: boolean): string {
  if (currency) {
    return value.toLocaleString("en-ZW", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return value.toLocaleString();
}

export default function StatCard({ label, value, currency = false, color }: StatCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "20px 20px",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, marginBottom: 8 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: colors.text,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.5px",
        }}
      >
        {currency && (
          <span style={{ fontSize: 14, fontWeight: 500, marginRight: 2, opacity: 0.7 }}>
            USD
          </span>
        )}
        {formatValue(value, false)}
        {currency && (
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            .{String(Math.round((value % 1) * 100)).padStart(2, "0")}
          </span>
        )}
      </div>
    </div>
  );
}
