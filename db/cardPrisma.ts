// db/cardPrisma.ts
import { PrismaClient } from "@prisma/client";

const _cardPrisma = new PrismaClient();
export const cardPrisma = _cardPrisma;
