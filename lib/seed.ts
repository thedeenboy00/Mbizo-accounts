import { prisma } from "./db";
import { hashPassword } from "./auth";

async function seed(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (!existing) {
    const hash = await hashPassword("admin123");
    await prisma.user.create({
      data: { username: "admin", passwordHash: hash, role: "admin" },
    });
    console.log("Seeded admin user: admin / admin123");
  } else {
    console.log("Admin user already exists");
  }
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
