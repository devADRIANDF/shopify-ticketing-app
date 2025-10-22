import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * GET /api/tickets
 * Returns all tickets for offline sync in mobile app
 *
 * Query params:
 * - limit: number of tickets to return (default: all)
 * - status: filter by status (valid, used, cancelled)
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const statusParam = url.searchParams.get("status");

    const limit = limitParam ? parseInt(limitParam) : undefined;

    // Build query
    const where: any = {};
    if (statusParam) {
      where.status = statusParam;
    }

    // Fetch tickets
    const tickets = await prisma.ticket.findMany({
      where,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        productTitle: true,
        status: true,
        buyerEmail: true,
        createdAt: true,
        qrData: true,
        usedAt: true,
      },
    });

    // Format for mobile app
    const formattedTickets = tickets.map((ticket) => ({
      id: ticket.id,
      eventName: ticket.productTitle,
      ticketType: ticket.productTitle,
      status: ticket.status,
      buyerEmail: ticket.buyerEmail,
      purchaseDate: ticket.createdAt.toISOString(),
      qrCode: ticket.qrData || "",
      scannedAt: ticket.usedAt?.toISOString(),
      scannedBy: ticket.usedAt ? "Staff" : undefined,
    }));

    return json(formattedTickets, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
};

// Handle OPTIONS request for CORS
export const options = () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
