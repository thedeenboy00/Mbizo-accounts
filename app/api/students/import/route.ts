import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { bulkCreateStudents } from "@/lib/students";
import type { CreateStudentInput } from "@/lib/students";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json() as { rows?: unknown[] };

    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json({ error: "No rows provided." }, { status: 400 });
    }

    const inputs: CreateStudentInput[] = [];
    const errors: string[] = [];

    for (let i = 0; i < body.rows.length; i++) {
      const row = body.rows[i] as Record<string, unknown>;
      const studentId = String(row.studentId ?? row["Student ID"] ?? row["student_id"] ?? "").trim().toUpperCase();
      const firstName = String(row.firstName ?? row["First Name"] ?? row["first_name"] ?? "").trim();
      const lastName  = String(row.lastName  ?? row["Last Name"]  ?? row["last_name"]  ?? "").trim();
      const form      = String(row.form      ?? row["Form"]        ?? "").trim();
      const cls       = String(row.class     ?? row["Class"]       ?? "").trim();
      const termFee   = Number(row.termFee   ?? row["Term Fee"]    ?? row["term_fee"]  ?? 0);

      if (!studentId || !firstName || !lastName || !form || !cls) {
        errors.push(`Row ${i + 1}: missing required field(s).`);
        continue;
      }
      if (isNaN(termFee) || termFee < 0) {
        errors.push(`Row ${i + 1}: invalid term fee.`);
        continue;
      }

      inputs.push({ studentId, firstName, lastName, form, class: cls, termFee });
    }

    if (inputs.length === 0) {
      return NextResponse.json({ error: "No valid rows to import.", errors }, { status: 400 });
    }

    const result = await bulkCreateStudents(inputs);
    return NextResponse.json({ ...result, errors });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Import failed." }, { status: 500 });
  }
}
