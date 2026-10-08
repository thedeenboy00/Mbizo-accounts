import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getGeneralLedger } from "@/lib/transactions";
import * as XLSX from "xlsx";

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await getGeneralLedger();
  const date = new Date().toLocaleDateString("en-ZW", { day: "2-digit", month: "long", year: "numeric" });
  const wb = XLSX.utils.book_new();

  const NAVY  = "1A2744";
  const WHITE = "FFFFFF";
  const GREEN = "15803D";
  const RED   = "B91C1C";

  const thinBorder = {
    top:    { style: "thin", color: { rgb: "D1D9E6" } },
    bottom: { style: "thin", color: { rgb: "D1D9E6" } },
    left:   { style: "thin", color: { rgb: "D1D9E6" } },
    right:  { style: "thin", color: { rgb: "D1D9E6" } },
  };

  const numFmt = "#,##0.00";

  for (const acc of accounts) {
    const ws = XLSX.utils.aoa_to_sheet([]);

    function cell(r: number, c: number, v: string | number, s?: Record<string, unknown>) {
      const addr = XLSX.utils.encode_cell({ r, c });
      ws[addr] = { v, t: typeof v === "number" ? "n" : "s", s };
    }

    cell(0, 0, `Account: ${acc.account}`, { font: { name: "Arial", sz: 12, bold: true, color: { rgb: NAVY } } });
    cell(1, 0, `Generated: ${date}`,       { font: { name: "Arial", sz: 10, color: { rgb: "64748B" } } });
    cell(2, 0, "", {});

    const headStyle = {
      font: { name: "Arial", sz: 10, bold: true, color: { rgb: WHITE } },
      fill: { fgColor: { rgb: NAVY } },
      border: thinBorder,
      alignment: { horizontal: "center" as const },
    };

    cell(3, 0, "Date",        { ...headStyle, alignment: { horizontal: "left" as const } });
    cell(3, 1, "Description", { ...headStyle, alignment: { horizontal: "left" as const } });
    cell(3, 2, "Reference",   { ...headStyle, alignment: { horizontal: "left" as const } });
    cell(3, 3, "Debit",       headStyle);
    cell(3, 4, "Credit",      headStyle);
    cell(3, 5, "Balance",     headStyle);

    acc.entries.forEach((e, i) => {
      const r = 4 + i;
      const bg = i % 2 === 0 ? WHITE : "F8FAFC";
      const fill = { fgColor: { rgb: bg } };
      const base = { fill, border: thinBorder };

      cell(r, 0, e.date,        { ...base, font: { name: "Arial", sz: 10, color: { rgb: "64748B" } } });
      cell(r, 1, e.description, { ...base, font: { name: "Arial", sz: 10, color: { rgb: "1E293B" } } });
      cell(r, 2, e.reference,   { ...base, font: { name: "Arial", sz: 10, color: { rgb: "64748B" } } });

      const da = XLSX.utils.encode_cell({ r, c: 3 });
      ws[da] = { v: e.debit,  t: "n", z: numFmt, s: { ...base, font: { name: "Arial", sz: 10, color: { rgb: e.debit  > 0 ? GREEN : "64748B" } }, alignment: { horizontal: "right" as const } } };
      const ca = XLSX.utils.encode_cell({ r, c: 4 });
      ws[ca] = { v: e.credit, t: "n", z: numFmt, s: { ...base, font: { name: "Arial", sz: 10, color: { rgb: e.credit > 0 ? RED   : "64748B" } }, alignment: { horizontal: "right" as const } } };
      const ba = XLSX.utils.encode_cell({ r, c: 5 });
      ws[ba] = { v: e.balance, t: "n", z: numFmt, s: { ...base, font: { name: "Arial", sz: 10, bold: true, color: { rgb: e.balance >= 0 ? NAVY : RED } }, alignment: { horizontal: "right" as const } } };
    });

    const footRow = 4 + acc.entries.length;
    const footStyle = {
      font: { name: "Arial", sz: 10, bold: true, color: { rgb: WHITE } },
      fill: { fgColor: { rgb: NAVY } },
      border: thinBorder,
      alignment: { horizontal: "right" as const },
    };

    cell(footRow, 0, "TOTALS", { ...footStyle, alignment: { horizontal: "left" as const } });
    cell(footRow, 1, "",       { fill: { fgColor: { rgb: NAVY } }, border: thinBorder });
    cell(footRow, 2, "",       { fill: { fgColor: { rgb: NAVY } }, border: thinBorder });
    const fda = XLSX.utils.encode_cell({ r: footRow, c: 3 });
    ws[fda] = { v: acc.totalDebit,  t: "n", z: numFmt, s: footStyle };
    const fca = XLSX.utils.encode_cell({ r: footRow, c: 4 });
    ws[fca] = { v: acc.totalCredit, t: "n", z: numFmt, s: footStyle };
    const fba = XLSX.utils.encode_cell({ r: footRow, c: 5 });
    ws[fba] = { v: acc.closingBalance, t: "n", z: numFmt, s: footStyle };

    ws["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    ws["!rows"] = [{ hpt: 20 }, { hpt: 14 }, { hpt: 8 }, { hpt: 18 }, ...acc.entries.map(() => ({ hpt: 16 }))];
    ws["!ref"]  = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: footRow, c: 5 } });

    const sheetName = acc.account.replace(/[[\]*?:/\\]/g, "").slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  if (accounts.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([["No ledger entries yet."]]);
    XLSX.utils.book_append_sheet(wb, ws, "General Ledger");
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx", cellStyles: true });
  const filename = `general-ledger-${new Date().toISOString().split("T")[0]}.xlsx`;

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
