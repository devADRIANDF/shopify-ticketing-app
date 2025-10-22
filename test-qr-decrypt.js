// Test script to verify QR data structure
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQRData() {
  try {
    const tickets = await prisma.ticket.findMany({
      take: 1,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        qrData: true,
        qrCode: true,
      }
    });

    if (tickets.length === 0) {
      console.log('No tickets found');
      return;
    }

    const ticket = tickets[0];
    console.log('Ticket ID:', ticket.id);
    console.log('qrData (encrypted):', ticket.qrData ? ticket.qrData.substring(0, 50) + '...' : 'NULL');
    console.log('qrCode (SVG):', ticket.qrCode ? 'EXISTS (length: ' + ticket.qrCode.length + ')' : 'NULL');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testQRData();
