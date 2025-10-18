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
    const shop = url.searchParams.get("shop");

    if (!orderId || !shop) {
      return json(
        { error: "Missing orderId or shop parameter" },
        { status: 400 }
      );
    }

    // Get tickets for this order
    const tickets = await prisma.ticket.findMany({
      where: {
        shopifyOrderId: orderId,
        shop: shop,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Return tickets with QR codes
    return json(
      {
        tickets: tickets.map((ticket) => ({
          id: ticket.id,
          productTitle: ticket.productTitle,
          shopifyOrderName: ticket.shopifyOrderName,
          qrCodeDataUrl: ticket.qrCodeDataUrl,
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
