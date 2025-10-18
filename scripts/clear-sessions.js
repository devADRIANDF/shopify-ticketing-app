import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearSessions() {
  try {
    console.log('Deleting all sessions to force token regeneration...');
    const result = await prisma.session.deleteMany({});
    console.log(`Deleted ${result.count} sessions successfully`);
    console.log('Sessions cleared! The app will generate new tokens with write_orders scope on next request.');
  } catch (error) {
    console.error('Error clearing sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSessions();
