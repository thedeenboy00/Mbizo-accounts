import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFeeTypes } from "@/lib/feeTypes";
import FeeTypesManager from "@/components/FeeTypesManager";

export default async function FeeTypesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard");

  const feeTypes = await getFeeTypes();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <a href="/dashboard/settings" style={{ fontSize: 13, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Settings
        </a>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", letterSpacing: "-0.4px" }}>
          Fee Types
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 13 }}>
          Configure fee categories and their amounts. These appear in the transaction form.
        </p>
      </div>
      <FeeTypesManager initialFeeTypes={feeTypes} />
    </div>
  );
}
