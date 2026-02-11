import { PrismaClient } from "../generated/prisma/client";

type PrismaInstance = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma: PrismaInstance };

export const prisma =
  globalForPrisma.prisma || (new (PrismaClient as any)() as PrismaInstance);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
