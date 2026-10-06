import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTrialBalance } from "@/lib/transactions";
import * as XLSX from "xlsx";

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getTrialBalance();
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.001;
  const date = new Date().toLocaleDateString("en-ZW", {
    day: "2-digit", month: "long", year: "numeric",
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  function cell(
    r: number,
    c: number,
    value: string | number,
    style?: Record<string, unknown>
  ): void {
    const addr = XLSX.utils.encode_cell({ r, c });
    ws[addr] = { v: value, t: typeof value === "number" ? "n" : "s", s: style };
  }

  const NAVY    = "1A2744";
  const GREEN   = "15803D";
  const RED     = "B91C1C";
  const BORDER  = "D1D9E6";
  const BG_HEAD = "F0F4FA";
  const BG_FOOT = "E8EDF5";
  const WHITE   = "FFFFFF";
  const AMBER   = "92400E";

  const headerFont  = { name: "Arial", sz: 11, bold: true, color: { rgb: WHITE } };
  const titleFont   = { name: "Arial", sz: 14, bold: true, color: { rgb: NAVY } };
  const subFont     = { name: "Arial", sz: 10, color: { rgb: "64748B" } };
  const bodyFont    = { name: "Arial", sz: 10, color: { rgb: "1E293B" } };
  const greenFont   = { name: "Arial", sz: 10, color: { rgb: GREEN } };
  const redFont     = { name: "Arial", sz: 10, color: { rgb: RED } };
  const footFont    = { name: "Arial", sz: 10, bold: true, color: { rgb: NAVY } };
  const mutedFont   = { name: "Arial", sz: 10, color: { rgb: "64748B" } };

  const thinBorder = {
    top:    { style: "thin", color: { rgb: BORDER } },
    bottom: { style: "thin", color: { rgb: BORDER } },
    left:   { style: "thin", color: { rgb: BORDER } },
    right:  { style: "thin", color: { rgb: BORDER } },
  };

  const numFmt = '#,##0.00';

  // ── Row 0: Title ─────────────────────────────────────────────────────────
  cell(0, 0, "Mbizo High School", { font: titleFont, fill: { fgColor: { rgb: WHITE } } });
  cell(0, 1, "", {}); cell(0, 2, "", {});

  // ── Row 1: Subtitle ──────────────────────────────────────────────────────
  cell(1, 0, "Trial Balance", { font: { name: "Arial", sz: 11, bold: true, color: { rgb: NAVY } } });

  // ── Row 2: Date ──────────────────────────────────────────────────────────
  cell(2, 0, `Generated: ${date}`, { font: subFont });

  // ── Row 3: blank spacer ──────────────────────────────────────────────────
  cell(3, 0, "", {});

  // ── Row 4: Column headers ────────────────────────────────────────────────
  const headStyle = {
    font: headerFont,
    fill: { fgColor: { rgb: NAVY } },
    alignment: { horizontal: "center" as const, vertical: "center" as const },
    border: thinBorder,
  };
  cell(4, 0, "Account",      { ...headStyle, alignment: { horizontal: "left" as const, vertical: "center" as const } });
  cell(4, 1, "Debit (USD)",  headStyle);
  cell(4, 2, "Credit (USD)", headStyle);

  // ── Rows 5+: Data ────────────────────────────────────────────────────────
  rows.forEach((row, i) => {
    const r = 5 + i;
    const bgFill = i % 2 === 0
      ? { fgColor: { rgb: WHITE } }
      : { fgColor: { rgb: BG_HEAD } };

    cell(r, 0, row.account, {
      font: bodyFont,
      fill: bgFill,
      border: thinBorder,
      alignment: { vertical: "center" as const },
    });

    if (row.debit > 0) {
      const addr = XLSX.utils.encode_cell({ r, c: 1 });
      ws[addr] = { v: row.debit, t: "n", z: numFmt, s: { font: greenFont, fill: bgFill, border: thinBorder, alignment: { horizontal: "right" as const } } };
    } else {
      cell(r, 1, "—", { font: mutedFont, fill: bgFill, border: thinBorder, alignment: { horizontal: "center" as const } });
    }

    if (row.credit > 0) {
      const addr = XLSX.utils.encode_cell({ r, c: 2 });
      ws[addr] = { v: row.credit, t: "n", z: numFmt, s: { font: redFont, fill: bgFill, border: thinBorder, alignment: { horizontal: "right" as const } } };
    } else {
      cell(r, 2, "—", { font: mutedFont, fill: bgFill, border: thinBorder, alignment: { horizontal: "center" as const } });
    }
  });

  // ── Totals row ───────────────────────────────────────────────────────────
  const totalsRow = 5 + rows.length;

  const thickTop = {
    top:    { style: "medium", color: { rgb: NAVY } },
    bottom: { style: "thin",   color: { rgb: BORDER } },
    left:   { style: "thin",   color: { rgb: BORDER } },
    right:  { style: "thin",   color: { rgb: BORDER } },
  };

  cell(totalsRow, 0, "TOTALS", {
    font: footFont,
    fill: { fgColor: { rgb: BG_FOOT } },
    border: thickTop,
    alignment: { vertical: "center" as const },
  });

  const debitAddr = XLSX.utils.encode_cell({ r: totalsRow, c: 1 });
  ws[debitAddr] = { v: totalDebit, t: "n", z: numFmt, s: { font: footFont, fill: { fgColor: { rgb: BG_FOOT } }, border: thickTop, alignment: { horizontal: "right" as const } } };

  const creditAddr = XLSX.utils.encode_cell({ r: totalsRow, c: 2 });
  ws[creditAddr] = { v: totalCredit, t: "n", z: numFmt, s: { font: footFont, fill: { fgColor: { rgb: BG_FOOT } }, border: thickTop, alignment: { horizontal: "right" as const } } };

  // ── Status row ───────────────────────────────────────────────────────────
  const statusRow = totalsRow + 1;
  const statusColor = balanced ? GREEN : RED;
  const statusBg    = balanced ? "F0FDF4" : "FEF2F2";
  const statusText  = balanced ? "✓ Balanced" : "✗ Out of balance";

  cell(statusRow, 0, statusText, {
    font: { name: "Arial", sz: 10, bold: true, color: { rgb: statusColor } },
    fill: { fgColor: { rgb: statusBg } },
    border: thinBorder,
    alignment: { horizontal: "left" as const },
  });
  cell(statusRow, 1, "", { fill: { fgColor: { rgb: statusBg } }, border: thinBorder });
  cell(statusRow, 2, "", { fill: { fgColor: { rgb: statusBg } }, border: thinBorder });

  // ── Blank row + footer note ───────────────────────────────────────────────
  const noteRow = statusRow + 2;
  cell(noteRow, 0, "This document is system-generated by the Mbizo High School Accounts System.", {
    font: { name: "Arial", sz: 9, italic: true, color: { rgb: AMBER } },
  });

  // ── Column widths ─────────────────────────────────────────────────────────
  ws["!cols"] = [
    { wch: 28 }, // Account
    { wch: 16 }, // Debit
    { wch: 16 }, // Credit
  ];

  // ── Row heights ───────────────────────────────────────────────────────────
  ws["!rows"] = [
    { hpt: 24 }, // title
    { hpt: 16 },
    { hpt: 14 },
    { hpt: 8  }, // spacer
    { hpt: 20 }, // header
    ...rows.map(() => ({ hpt: 18 })),
    { hpt: 20 }, // totals
    { hpt: 18 }, // status
  ];

  // ── Sheet range ───────────────────────────────────────────────────────────
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: noteRow, c: 2 },
  });

  XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");

  const buf = XLSX.write(wb, {
    type: "buffer",
    bookType: "xlsx",
    cellStyles: true,
  });

  const filename = `trial-balance-${new Date().toISOString().split("T")[0]}.xlsx`;

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
