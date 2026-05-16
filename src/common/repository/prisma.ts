import { PrismaClient } from "prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Use a singleton pattern for PrismaClient to prevent too many connections
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const datasourceUrl = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: datasourceUrl });
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

