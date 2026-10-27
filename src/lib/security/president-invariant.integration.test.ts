import "dotenv/config";

import { describe, expect, it } from "vitest";

import { OfficerPosition, Role } from "@/generated/prisma/browser";
import { prisma } from "@/lib/infra/prisma";

let dbAvailable = false;
if (process.env.DATABASE_URL) {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

describe.skipIf(!dbAvailable)("global President invariant", () => {
  it("rejects a raw second President and rolls the transaction back", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.user.updateMany({
          where: { officerPosition: OfficerPosition.PRESIDENT },
          data: { officerPosition: null },
        });

        const first = await tx.user.create({
          data: {
            email: `president-a-${suffix}@acdeducation.com`,
            name: "President A",
            role: Role.OFFICER,
          },
        });
        const second = await tx.user.create({
          data: {
            email: `president-b-${suffix}@acdeducation.com`,
            name: "President B",
            role: Role.OFFICER,
          },
        });

        await tx.user.update({
          where: { id: first.id },
          data: { officerPosition: OfficerPosition.PRESIDENT },
        });
        await tx.user.update({
          where: { id: second.id },
          data: { officerPosition: OfficerPosition.PRESIDENT },
        });
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });
});
