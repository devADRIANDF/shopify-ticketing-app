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
    console.log("Checking tables...");
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log("Tables in database:", result);
    
    // Check if Session table exists
    const sessions = await prisma.session.findMany({ take: 1 });
    console.log("✓ Session table exists");
    
    const tickets = await prisma.ticket.findMany({ take: 1 });
    console.log("✓ Ticket table exists");
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
