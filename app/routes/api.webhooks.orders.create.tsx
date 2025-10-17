import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { createTicketsForLineItem, sendTicketsEmail } from "~/services/ticket.server";
import { prisma } from "~/lib/db.server";

/**
 * Webhook handler for orders/create
 * This is triggered every time a new order is created in Shopify
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, payload } = await authenticate.webhook(request);

    console.log(`[Webhook] Orders/Create received for shop: ${shop}`);

    // Get app settings to check ticket tag
    const settings = await prisma.appSettings.findUnique({
      where: { shop },
    });

    const ticketTag = settings?.ticketTag || "ticket";
    const autoEmailEnabled = settings?.autoEmailEnabled ?? true;

    // Extract order data
    const order = payload as any;
    const {
      id: orderId,
      name: orderName,
      email: buyerEmail,
      customer,
      line_items,
    } = order;

    if (!buyerEmail) {
      console.log("[Webhook] No buyer email found, skipping");
      return new Response("No buyer email", { status: 200 });
    }

    const buyerName = customer
      ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
      : undefined;

    // Process each line item
    const allTickets = [];

    for (const lineItem of line_items) {
      // Check if product has ticket tag
      const productTags = lineItem.properties?.find(
        (prop: any) => prop.name === "_tags"
      )?.value || "";

      const isTicket =
        productTags.toLowerCase().includes(ticketTag.toLowerCase()) ||
        lineItem.title.toLowerCase().includes(ticketTag.toLowerCase()) ||
        lineItem.title.toLowerCase().includes("entrada") ||
        lineItem.title.toLowerCase().includes("entry");

      if (!isTicket) {
        console.log(`[Webhook] Line item ${lineItem.id} is not a ticket, skipping`);
        continue;
      }

      console.log(`[Webhook] Processing ticket line item: ${lineItem.title}`);

      // Extract event info from product properties
      const eventName =
        lineItem.properties?.find((prop: any) => prop.name === "Event Name")?.value ||
        lineItem.title;

      const eventDateStr = lineItem.properties?.find(
        (prop: any) => prop.name === "Event Date"
      )?.value;

      const eventDate = eventDateStr ? new Date(eventDateStr) : undefined;

      // Create tickets
      const result = await createTicketsForLineItem({
        shopifyOrderId: String(orderId),
        shopifyOrderName: orderName,
        lineItemId: String(lineItem.id),
        productId: String(lineItem.product_id),
        variantId: String(lineItem.variant_id),
        productTitle: lineItem.title,
        variantTitle: lineItem.variant_title,
        quantity: lineItem.quantity,
        buyerEmail,
        buyerName,
        ticketType: lineItem.variant_title || lineItem.title,
        shop,
        eventDate,
        eventName,
      });

      if (result.success) {
        console.log(
          `[Webhook] Created ${result.tickets.length} tickets for line item ${lineItem.id}`
        );
        allTickets.push(...result.tickets);
      } else {
        console.error(`[Webhook] Failed to create tickets: ${result.error}`);
      }
    }

    // Send email if tickets were created
    if (allTickets.length > 0 && autoEmailEnabled) {
      console.log(`[Webhook] Sending email for ${allTickets.length} tickets`);

      const emailResult = await sendTicketsEmail(shop, orderName, allTickets);

      if (emailResult.success) {
        console.log("[Webhook] Email sent successfully");
      } else {
        console.error(`[Webhook] Failed to send email: ${emailResult.error}`);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("[Webhook] Error processing order:", error);
    return new Response("Error", { status: 500 });
  }
};
