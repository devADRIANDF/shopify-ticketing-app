import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * Public API endpoint to get tickets for an order
 * Used by the order status page extension to display QR codes
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");

    if (!orderId) {
      return json(
        { error: "Missing orderId parameter" },
        { status: 400 }
      );
    }

    console.log("[API] Fetching tickets for order:", orderId);

    // Get tickets for this order (we don't need shop since orderId is unique)
    const tickets = await prisma.ticket.findMany({
      where: {
        shopifyOrderId: orderId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`[API] Found ${tickets.length} tickets for order ${orderId}`);

    // Return tickets with QR codes
    return json(
      {
        tickets: tickets.map((ticket) => ({
          id: ticket.id,
          productTitle: ticket.productTitle,
          shopifyOrderName: ticket.shopifyOrderName,
          qrCodeDataUrl: ticket.qrCode, // qrCode field contains the base64 data URL
          status: ticket.status,
        })),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching tickets by order:", error);
    return json(
      { error: "Failed to fetch tickets", tickets: [] },
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
