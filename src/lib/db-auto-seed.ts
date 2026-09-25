import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed-data";

let isSeedingInProgress = false;

/**
 * Ensures that the database contains baseline WASH datasets upon deployment.
 * If the database community count is 0, this automatically seeds the DB in background.
 */
export async function ensureDatabaseSeeded(): Promise<boolean> {
  try {
    const communityCount = await prisma.community.count();
    if (communityCount === 0 && !isSeedingInProgress) {
      isSeedingInProgress = true;
      console.log("🌱 Database is unseeded/empty on deployment. Automatically loading AQUA-LENS baseline dataset...");
      await seedDatabase(prisma);
      isSeedingInProgress = false;
      console.log("✅ Auto-seeding completed successfully!");
      return true;
    }
    return false;
  } catch (error) {
    console.error("⚠️ Auto-seeding check error:", error);
    isSeedingInProgress = false;
    return false;
  }
}
