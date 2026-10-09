import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { updateFeeType, deleteFeeType } from "@/lib/feeTypes";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as {
    name?: string; amount?: unknown; description?: string; active?: boolean;
  };

  const data: { name?: string; amount?: number; description?: string; active?: boolean } = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.description !== undefined) data.description = body.description;
  if (body.active !== undefined) data.active = body.active;
  if (body.amount !== undefined) {
    const n = Number(body.amount);
    if (isNaN(n) || n < 0) return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    data.amount = n;
  }

  await updateFeeType(id, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { id } = await params;
  try {
    await deleteFeeType(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Cannot delete — fee type is in use." }, { status: 409 });
  }
}
