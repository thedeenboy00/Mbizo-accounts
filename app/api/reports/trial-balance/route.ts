import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTrialBalance } from "@/lib/transactions";

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getTrialBalance();
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

  const fmt = (n: number) =>
    n.toLocaleString("en-ZW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const date = new Date().toISOString().split("T")[0] ?? "";

  const lines: string[] = [
    `"Mbizo High School - Trial Balance"`,
    `"Generated:","${date}"`,
    `""`,
    `"Account","Debit (USD)","Credit (USD)"`,
    ...rows.map(
      (r) =>
        `"${r.account}","${r.debit > 0 ? fmt(r.debit) : ""}","${r.credit > 0 ? fmt(r.credit) : ""}"`
    ),
    `""`,
    `"TOTALS","${fmt(totalDebit)}","${fmt(totalCredit)}"`,
    `"Balanced","${Math.abs(totalDebit - totalCredit) < 0.001 ? "Yes" : "No"}",""`,
  ];

  const csv = lines.join("\r\n");
  const filename = `trial-balance-${date}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
