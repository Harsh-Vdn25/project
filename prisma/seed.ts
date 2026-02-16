import { PrismaClient,Prisma } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
require('dotenv').config();

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
})

export const prisma = new PrismaClient({
    adapter,
})
