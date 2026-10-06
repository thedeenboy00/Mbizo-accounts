import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

/**
 * One-time setup endpoint.
 * Protected by SETUP_SECRET env var — must be passed as ?secret=<value>
 * Safe to call multiple times — will not overwrite an existing admin user.
 * Remove or disable this route after initial setup is confirmed.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  // Guard: require a secret token so random people can't trigger this
  const secret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.SETUP_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "SETUP_SECRET environment variable is not set." },
      { status: 500 }
    );
  }

  if (!secret || secret !== expectedSecret) {
    return NextResponse.json(
      { error: "Invalid or missing secret." },
      { status: 401 }
    );
  }

  try {
    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { username: "admin" },
    });

    if (existing) {
      return NextResponse.json({
        ok: true,
        message: "Admin user already exists. No changes made.",
        username: "admin",
      });
    }

    // Create admin user
    const hash = await hashPassword("admin123");
    await prisma.user.create({
      data: {
        username: "admin",
        passwordHash: hash,
        role: "admin",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Admin user created successfully.",
      username: "admin",
      password: "admin123",
      warning: "Change this password immediately after logging in.",
    });
  } catch (err) {
    console.error("Setup error:", err);
    return NextResponse.json(
      { error: "Setup failed. Check your DATABASE_URL and run migrations first." },
      { status: 500 }
    );
  }
}
