import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * POST /api/scan-logs
 * Saves scan logs from mobile app
 *
 * Expected body:
 * {
 *   "id": "LOG-1234567890",
 *   "ticketId": "TKT001",
 *   "eventName": "Event Name",
 *   "ticketType": "VIP",
 *   "buyerEmail": "buyer@example.com",
 *   "scannedBy": "Staff User",
 *   "scannedAt": "2024-01-25T19:00:00Z",
 *   "status": "valid",
 *   "wasOffline": false
 * }
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const log = await request.json();

    // Validate required fields
    if (!log.ticketId || !log.scannedBy || !log.scannedAt) {
      return json(
        { error: "Missing required fields: ticketId, scannedBy, scannedAt" },
        { status: 400 }
      );
    }

    // Save scan log to database
    // You can create a ScanLog model in Prisma if needed
    // For now, we'll just log it and return success
    console.log("[Mobile Scan Log]", {
      ticketId: log.ticketId,
      scannedBy: log.scannedBy,
      scannedAt: log.scannedAt,
      status: log.status,
      wasOffline: log.wasOffline,
      eventName: log.eventName,
      ticketType: log.ticketType,
      buyerEmail: log.buyerEmail,
    });

    // TODO: If you want to store scan logs in a separate table, create a ScanLog model
    // and save it here:
    // await prisma.scanLog.create({
    //   data: {
    //     id: log.id,
    //     ticketId: log.ticketId,
    //     eventName: log.eventName,
    //     ticketType: log.ticketType,
    //     buyerEmail: log.buyerEmail,
    //     scannedBy: log.scannedBy,
    //     scannedAt: new Date(log.scannedAt),
    //     status: log.status,
    //     wasOffline: log.wasOffline,
    //   },
    // });

    return json({
      success: true,
      message: "Log sincronizado correctamente",
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error saving scan log:", error);
    return json(
      { error: "Failed to save scan log" },
      { status: 500, headers: {
        "Access-Control-Allow-Origin": "*",
      }}
    );
  }
};

// Handle OPTIONS request for CORS
export const options = () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
