import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * Public API endpoint to get tickets for an order
 * Used by the order status page extension to display QR codes
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const requestTime = new Date().toISOString();
    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");
    const orderNumber = url.searchParams.get("orderNumber");

    if (!orderId && !orderNumber) {
      return json(
        { error: "Missing orderId or orderNumber parameter" },
        { status: 400 }
      );
    }

    console.log(`[API] [${requestTime}] Fetching tickets for order:`, { orderId, orderNumber });

    // Get tickets for this order - search by both ID and order number
    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          orderId ? { shopifyOrderId: orderId } : {},
          orderNumber ? { shopifyOrderName: orderNumber } : {},
        ].filter(obj => Object.keys(obj).length > 0),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`[API] Found ${tickets.length} tickets for order ${orderId || orderNumber}`);

    // Return tickets with QR code URLs
    // Use public endpoint URL instead of data URL for better compatibility with Shopify extensions
    const baseUrl = new URL(request.url).origin.replace('http://', 'https://');

    return json(
      {
        tickets: tickets.map((ticket) => ({
          id: ticket.id,
          productTitle: ticket.productTitle,
          shopifyOrderName: ticket.shopifyOrderName,
          qrCodeDataUrl: `${baseUrl}/api/qr/${ticket.id}`, // Public URL to QR code image
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
