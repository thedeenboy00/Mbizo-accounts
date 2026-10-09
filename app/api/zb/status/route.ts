import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pollZBStatus } from "@/lib/zbPay";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const zbRef = req.nextUrl.searchParams.get("ref");
  if (!zbRef) return NextResponse.json({ error: "ref is required." }, { status: 400 });

  try {
    const result = await pollZBStatus(zbRef);

    // Sync status to DB
    await prisma.zBPayment.updateMany({
      where: { zbReference: zbRef },
      data: { status: result.status, updatedAt: new Date() },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("ZB status poll error:", err);
    return NextResponse.json({ error: "Failed to check status." }, { status: 500 });
  }
}
