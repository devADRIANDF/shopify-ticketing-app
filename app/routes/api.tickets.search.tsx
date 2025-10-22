import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * GET /api/tickets/search
 * Search tickets by buyer email or name
 *
 * Query params:
 * - email: buyer email to search for
 * - name: buyer name to search for (optional)
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const emailParam = url.searchParams.get("email");
    const nameParam = url.searchParams.get("name");

    if (!emailParam && !nameParam) {
      return json(
        { error: "Email or name parameter required" },
        { status: 400 }
      );
    }

    // Build search query
    const where: any = {
      OR: [],
    };

    if (emailParam) {
      where.OR.push({
        buyerEmail: {
          contains: emailParam,
          mode: 'insensitive',
        },
      });
    }

    if (nameParam) {
      where.OR.push({
        buyerName: {
          contains: nameParam,
          mode: 'insensitive',
        },
      });
    }

    // Search tickets
    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        productTitle: true,
        status: true,
        buyerEmail: true,
        buyerName: true,
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
      buyerName: ticket.buyerName,
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
    console.error("Error searching tickets:", error);
    return json(
      { error: "Failed to search tickets" },
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
