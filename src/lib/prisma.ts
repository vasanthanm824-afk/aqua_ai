import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;

  // If environment variable specifies a non-SQLite protocol (e.g. postgresql://), return it directly
  if (envUrl && !envUrl.startsWith("file:")) {
    return envUrl;
  }

  // Resolve absolute paths for SQLite dev.db
  const cwd = process.cwd();
  const prismaDbPath = path.resolve(cwd, "prisma", "dev.db");
  const rootDbPath = path.resolve(cwd, "dev.db");

  let targetPath = prismaDbPath;

  if (fs.existsSync(prismaDbPath)) {
    targetPath = prismaDbPath;
  } else if (fs.existsSync(rootDbPath)) {
    targetPath = rootDbPath;
  } else {
    // Ensure parent folder exists
    const prismaDir = path.resolve(cwd, "prisma");
    if (!fs.existsSync(prismaDir)) {
      fs.mkdirSync(prismaDir, { recursive: true });
    }
    targetPath = prismaDbPath;
  }

  // Standardize Windows path slashes to forward slashes for SQLite connection URI
  const formattedPath = targetPath.replace(/\\/g, "/");
  return `file:${formattedPath}`;
}

const dbUrl = getDatabaseUrl();
process.env.DATABASE_URL = dbUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

