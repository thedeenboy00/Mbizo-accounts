import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStudents, createStudent } from "@/lib/students";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") ?? undefined;
  const students = await getStudents({ search });
  return NextResponse.json(students);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json() as {
      studentId?: string; firstName?: string; lastName?: string;
      form?: string; class?: string; termFee?: unknown; term?: string;
    };

    const { studentId, firstName, lastName, form, termFee, term } = body;
    const cls = body.class;

    if (!studentId || !firstName || !lastName || !form || !cls || !term) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const parsedFee = Number(termFee ?? 0);
    if (isNaN(parsedFee) || parsedFee < 0) {
      return NextResponse.json({ error: "Term fee must be a valid number." }, { status: 400 });
    }

    const id = await createStudent({
      studentId: studentId.trim().toUpperCase(),
      firstName: firstName.trim(), lastName: lastName.trim(),
      form: form.trim(), class: cls.trim(),
      termFee: parsedFee, term: term.trim(),
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create student.";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Student ID already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
