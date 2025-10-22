import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.pbddvlgjallejkczsizt:Validiam123!@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"
    }
  }
});

async function main() {
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        table_name,
        CASE 
          WHEN table_name = 'Session' THEN 'Capital S'
          WHEN table_name = 'session' THEN 'lowercase s'
          ELSE 'other'
        END as case_check
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name ILIKE 'session'
      ORDER BY table_name;
    `;
    console.log("Session table case:", result);
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
