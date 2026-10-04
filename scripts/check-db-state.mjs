import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";
import path from "path";

// Quick DB state probe — prints row counts for the three models.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient({
  datasources: {
    db: { url: "file:" + path.resolve(__dirname, "../db/custom.db") },
  },
});

const users = await prisma.user.count();
const tasks = await prisma.task.count();
const notes = await prisma.note.count();
console.log(`users=${users} tasks=${tasks} notes=${notes}`);
await prisma.$disconnect();
