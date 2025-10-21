import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * Debug endpoint to see all recent tickets
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const tickets = await prisma.ticket.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        shopifyOrderId: true,
        shopifyOrderName: true,
        productTitle: true,
        status: true,
        createdAt: true,
      },
    });

    return json({
      count: tickets.length,
      tickets: tickets.map(t => ({
        id: t.id.substring(0, 8),
        shopifyOrderId: t.shopifyOrderId,
        shopifyOrderName: t.shopifyOrderName,
        productTitle: t.productTitle,
        status: t.status,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
};
