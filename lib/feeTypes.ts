import { prisma } from "./db";

interface DecimalLike { toNumber(): number }
function toNum(v: DecimalLike | number | string | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v);
  return v.toNumber();
}

export interface FeeType {
  id: string;
  name: string;
  amount: number;
  description: string | null;
  active: boolean;
  createdAt: string;
}

interface FeeTypeRow {
  id: string;
  name: string;
  amount: DecimalLike | number;
  description: string | null;
  active: boolean;
  createdAt: Date;
}

function mapFeeType(r: FeeTypeRow): FeeType {
  return {
    id: r.id,
    name: r.name,
    amount: toNum(r.amount),
    description: r.description,
    active: r.active,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function getFeeTypes(activeOnly = false): Promise<FeeType[]> {
  const rows = (await prisma.feeType.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { name: "asc" },
  })) as unknown as FeeTypeRow[];
  return rows.map(mapFeeType);
}

export async function getFeeType(id: string): Promise<FeeType | null> {
  const r = (await prisma.feeType.findUnique({
    where: { id },
  })) as unknown as FeeTypeRow | null;
  return r ? mapFeeType(r) : null;
}

export async function createFeeType(data: {
  name: string;
  amount: number;
  description?: string;
}): Promise<string> {
  const ft = await prisma.feeType.create({ data });
  return (ft as { id: string }).id;
}

export async function updateFeeType(
  id: string,
  data: { name?: string; amount?: number; description?: string; active?: boolean }
): Promise<void> {
  await prisma.feeType.update({ where: { id }, data });
}

export async function deleteFeeType(id: string): Promise<void> {
  await prisma.feeType.delete({ where: { id } });
}
