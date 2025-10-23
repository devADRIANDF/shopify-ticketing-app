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
    const webhookStartTime = new Date().toISOString();
    console.log(`[Webhook] [${webhookStartTime}] Incoming orders/create webhook request`);
    const { shop, payload, session, admin } = await authenticate.webhook(request);

    console.log(`[Webhook] [${webhookStartTime}] Orders/Create received for shop: ${shop}`);
    console.log(`[Webhook] Session:`, session ? "exists" : "undefined");
    console.log(`[Webhook] Admin:`, admin ? "exists" : "undefined");
    console.log(`[Webhook] Order details:`, {
      id: (payload as any).id,
      name: (payload as any).name,
      email: (payload as any).email,
      line_items_count: (payload as any).line_items?.length || 0
    });

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

    const buyerPhone = customer?.phone || order.phone || undefined;

    // Check for affiliate discount codes
    let affiliateId: string | null = null;
    let affiliateCommissionPercent = 0;

    if (order.discount_codes && order.discount_codes.length > 0) {
      const discountCode = order.discount_codes[0].code; // Usar el primer código
      console.log(`[Webhook] Discount code detected: ${discountCode}`);

      // Buscar afiliado por código de descuento
      const affiliate = await prisma.affiliates.findFirst({
        where: {
          OR: [
            { shopify_discount_code: discountCode },
            { unique_code: discountCode },
          ],
        },
      });

      if (affiliate) {
        affiliateId = affiliate.id;
        if (affiliate.commission_type === 'percentage') {
          affiliateCommissionPercent = Number(affiliate.commission_value);
        }
        console.log(`[Webhook] Affiliate found: ${affiliate.name} (${affiliateCommissionPercent}% commission)`);
      }
    }

    // Process each line item
    const allTickets = [];
    let totalCommissionAmount = 0;

    for (const lineItem of line_items) {
      console.log(`[Webhook] Processing line item:`, {
        id: lineItem.id,
        title: lineItem.title,
        product_id: lineItem.product_id,
        price: lineItem.price,
        quantity: lineItem.quantity,
        tags: lineItem.tags || 'no tags field'
      });

      // Check if product has ticket tag
      const productTags = lineItem.tags || "";

      const titleLower = lineItem.title.toLowerCase();
      const tagsLower = productTags.toLowerCase();
      const ticketTagLower = ticketTag.toLowerCase();

      const isTicket =
        tagsLower.includes(ticketTagLower) ||
        titleLower.includes(ticketTagLower) ||
        titleLower.includes("entrada") ||
        titleLower.includes("entry");

      console.log(`[Webhook] Ticket detection:`, {
        productTags,
        ticketTag,
        titleContainsTicket: titleLower.includes(ticketTagLower),
        tagsContainTicket: tagsLower.includes(ticketTagLower),
        isTicket
      });

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

      // Get ticket price (price per unit)
      const ticketPrice = parseFloat(lineItem.price) || 0;

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
        buyerPhone,
        ticketType: lineItem.variant_title || lineItem.title,
        shop,
        eventDate,
        eventName,
        affiliateId: affiliateId || undefined,
        price: ticketPrice,
      });

      if (result.success) {
        const ticketCreatedTime = new Date().toISOString();
        console.log(
          `[Webhook] [${ticketCreatedTime}] ✅ Created ${result.tickets.length} tickets for line item ${lineItem.id}`
        );
        allTickets.push(...result.tickets);

        // Calculate commission for this line item if affiliate exists
        if (affiliateId && affiliateCommissionPercent > 0) {
          const lineItemTotal = ticketPrice * lineItem.quantity;
          const commissionForLineItem = (lineItemTotal * affiliateCommissionPercent) / 100;
          totalCommissionAmount += commissionForLineItem;
          console.log(`[Webhook] Commission for line item: $${commissionForLineItem.toFixed(2)} (${affiliateCommissionPercent}% of $${lineItemTotal.toFixed(2)})`);
        }
      } else {
        console.error(`[Webhook] Failed to create tickets: ${result.error}`);
      }
    }

    // Update affiliate statistics if commission was earned
    if (affiliateId && totalCommissionAmount > 0 && allTickets.length > 0) {
      try {
        console.log(`[Webhook] Updating affiliate ${affiliateId} with ${allTickets.length} sales and $${totalCommissionAmount.toFixed(2)} commission`);

        await prisma.affiliates.update({
          where: { id: affiliateId },
          data: {
            total_sales: { increment: allTickets.length },
            total_commission: { increment: totalCommissionAmount },
          },
        });

        console.log(`[Webhook] ✅ Affiliate statistics updated successfully`);
      } catch (error) {
        console.error(`[Webhook] ❌ Error updating affiliate statistics:`, error);
      }
    }

    // Save tickets to order metafields so the thank you page extension can display them
    if (allTickets.length > 0) {
      console.log(`[Webhook] Saving ${allTickets.length} tickets to order metafields`);

      if (!admin) {
        console.error("[Webhook] ❌ CRITICAL: admin is undefined - cannot save metafields");
        console.log("[Webhook] This is a known limitation - webhooks don't have admin GraphQL access");
        console.log("[Webhook] Tickets created in DB but won't show on thank you page");
      } else {
        try {
          const ticketsData = allTickets.map(ticket => ({
            id: ticket.id,
            productTitle: ticket.productTitle,
            shopifyOrderName: ticket.shopifyOrderName,
            qrCodeDataUrl: ticket.qrCode,
            status: ticket.status,
          }));

          const ticketsDataString = JSON.stringify(ticketsData);
          console.log("[Webhook] Tickets data to save:", ticketsDataString.substring(0, 200) + "...");

          // Use metafieldsSet mutation instead of orderUpdate
          const metafieldMutation = `
            mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
              metafieldsSet(metafields: $metafields) {
                metafields {
                  id
                  namespace
                  key
                  value
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;

          const response = await admin.graphql(metafieldMutation, {
            variables: {
              metafields: [
                {
                  ownerId: `gid://shopify/Order/${orderId}`,
                  namespace: "validiam",
                  key: "tickets",
                  type: "json",
                  value: ticketsDataString,
                },
              ],
            },
          });

          console.log("[Webhook] GraphQL response status:", response.status);
          const result = await response.json();
          console.log("[Webhook] GraphQL result:", JSON.stringify(result, null, 2));

          if (result.data?.metafieldsSet?.userErrors?.length > 0) {
            console.error("[Webhook] ❌ Error saving metafield:", result.data.metafieldsSet.userErrors);
          } else if (result.data?.metafieldsSet?.metafields?.length > 0) {
            console.log("[Webhook] ✅ Tickets saved to order metafields successfully!");
            console.log("[Webhook] Metafield ID:", result.data.metafieldsSet.metafields[0].id);
          } else {
            console.error("[Webhook] ❌ Unexpected response - no metafields or errors:", result);
          }
        } catch (error) {
          console.error("[Webhook] ❌ CRITICAL ERROR saving tickets to metafields:", error);
          console.error("[Webhook] Error type:", error?.constructor?.name);
          console.error("[Webhook] Error message:", error instanceof Error ? error.message : String(error));
        }
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
