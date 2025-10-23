import { prisma } from "~/lib/db.server";
import { generateTicketId } from "~/lib/encryption.server";
import { generateQRCode } from "./qr.server";
import { sendTicketEmail } from "./email.server";
import type { TicketStatus } from "@prisma/client";

export interface CreateTicketOptions {
  shopifyOrderId: string;
  shopifyOrderName: string;
  lineItemId: string;
  productId: string;
  variantId: string;
  productTitle: string;
  variantTitle?: string;
  quantity: number;
  buyerEmail: string;
  buyerName?: string;
  buyerPhone?: string;
  ticketType: string;
  shop: string;
  eventDate?: Date;
  eventName?: string;
  affiliateId?: string;
  price?: number;
}

/**
 * Creates tickets for an order line item
 */
export async function createTicketsForLineItem(
  options: CreateTicketOptions
): Promise<{ success: boolean; tickets: any[]; error?: string }> {
  const tickets = [];

  try {
    // Check if tickets already exist for this line item (prevent duplicates)
    const existingTickets = await prisma.ticket.findMany({
      where: {
        shopifyOrderId: options.shopifyOrderId,
        lineItemId: options.lineItemId,
        shop: options.shop,
      },
    });

    if (existingTickets.length > 0) {
      console.log(`[Ticket Service] Tickets already exist for line item ${options.lineItemId}, skipping creation`);
      return { success: true, tickets: existingTickets };
    }

    // Generate tickets based on quantity
    for (let i = 0; i < options.quantity; i++) {
      const ticketId = generateTicketId();

      // Generate QR code
      const { qrCodeDataUrl, qrCodeSvg, encryptedData } = await generateQRCode({
        entryId: ticketId,
        shopifyOrder: options.shopifyOrderName,
        buyer: options.buyerEmail,
        ticketType: options.ticketType,
      });

      // Create ticket in database
      const ticket = await prisma.ticket.create({
        data: {
          id: ticketId,
          shopifyOrderId: options.shopifyOrderId,
          shopifyOrderName: options.shopifyOrderName,
          lineItemId: options.lineItemId,
          productId: options.productId,
          variantId: options.variantId,
          productTitle: options.productTitle,
          variantTitle: options.variantTitle,
          quantity: 1,
          buyerEmail: options.buyerEmail,
          buyerName: options.buyerName,
          buyerPhone: options.buyerPhone,
          ticketType: options.ticketType,
          qrCode: qrCodeSvg, // Save SVG instead of PNG for better compatibility
          qrData: encryptedData,
          status: "VALID",
          shop: options.shop,
          eventDate: options.eventDate,
          eventName: options.eventName,
          affiliateId: options.affiliateId,
          price: options.price,
        },
      });

      tickets.push(ticket);
    }

    return { success: true, tickets };
  } catch (error) {
    console.error("Error creating tickets:", error);
    return {
      success: false,
      tickets: [],
      error: error instanceof Error ? error.message : "Failed to create tickets",
    };
  }
}

/**
 * Sends ticket email to customer
 */
export async function sendTicketsEmail(
  shop: string,
  orderName: string,
  tickets: any[]
): Promise<{ success: boolean; error?: string }> {
  if (tickets.length === 0) {
    return { success: false, error: "No tickets to send" };
  }

  try {
    // Get app settings for branding
    const settings = await prisma.appSettings.findUnique({
      where: { shop },
    });

    // Group tickets by buyer email
    const ticketsByEmail = tickets.reduce((acc, ticket) => {
      if (!acc[ticket.buyerEmail]) {
        acc[ticket.buyerEmail] = [];
      }
      acc[ticket.buyerEmail].push(ticket);
      return acc;
    }, {} as Record<string, any[]>);

    // Send email for each buyer
    for (const [email, ticketsValue] of Object.entries(ticketsByEmail)) {
      const buyerTickets = ticketsValue as any[];
      const emailTickets = buyerTickets.map((t) => ({
        ticketType: t.ticketType,
        qrCodeDataUrl: t.qrCode,
        ticketId: t.id,
      }));

      await sendTicketEmail({
        to: email,
        buyerName: buyerTickets[0].buyerName || "Customer",
        orderNumber: orderName,
        tickets: emailTickets,
        eventName: buyerTickets[0].eventName || "Your Event",
        eventDate: buyerTickets[0].eventDate
          ? new Date(buyerTickets[0].eventDate).toLocaleDateString()
          : "TBD",
        brandLogo: settings?.brandLogo || undefined,
        brandColor: settings?.brandColor || "#5C6AC4",
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending ticket emails:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send emails",
    };
  }
}

/**
 * Gets tickets for a specific order
 */
export async function getTicketsByOrder(
  shop: string,
  shopifyOrderId: string
): Promise<any[]> {
  return prisma.ticket.findMany({
    where: {
      shop,
      shopifyOrderId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Gets all tickets for a shop
 */
export async function getTicketsByShop(
  shop: string,
  options?: {
    status?: TicketStatus;
    limit?: number;
    offset?: number;
  }
): Promise<{ tickets: any[]; total: number }> {
  const where = {
    shop,
    ...(options?.status && { status: options.status }),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.ticket.count({ where }),
  ]);

  return { tickets, total };
}

/**
 * Updates ticket status (used when scanning)
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  scannedBy?: string
): Promise<{ success: boolean; ticket?: any; error?: string }> {
  try {
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        scannedAt: status === "SCANNED" ? new Date() : undefined,
        scannedBy,
      },
    });

    return { success: true, ticket };
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update ticket",
    };
  }
}

/**
 * Validates a ticket by QR data
 */
export async function validateTicket(
  encryptedData: string,
  shop: string
): Promise<{ valid: boolean; ticket?: any; error?: string }> {
  try {
    const ticket = await prisma.ticket.findFirst({
      where: {
        qrData: encryptedData,
        shop,
      },
    });

    if (!ticket) {
      return { valid: false, error: "Ticket not found" };
    }

    if (ticket.status === "SCANNED") {
      return {
        valid: false,
        error: "Ticket already scanned",
        ticket,
      };
    }

    if (ticket.status === "INVALID" || ticket.status === "CANCELLED") {
      return {
        valid: false,
        error: "Ticket is invalid",
        ticket,
      };
    }

    return { valid: true, ticket };
  } catch (error) {
    console.error("Error validating ticket:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Validation failed",
    };
  }
}

/**
 * Export tickets to CSV
 */
export async function exportTicketsToCSV(
  shop: string,
  filters?: {
    status?: TicketStatus;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<string> {
  const where: any = { shop };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  // Generate CSV
  const headers = [
    "Ticket ID",
    "Order",
    "Product",
    "Variant",
    "Type",
    "Buyer Email",
    "Buyer Name",
    "Status",
    "Created At",
    "Scanned At",
    "Scanned By",
  ];

  const rows = tickets.map((t) => [
    t.id,
    t.shopifyOrderName,
    t.productTitle,
    t.variantTitle || "",
    t.ticketType,
    t.buyerEmail,
    t.buyerName || "",
    t.status,
    t.createdAt.toISOString(),
    t.scannedAt?.toISOString() || "",
    t.scannedBy || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  return csvContent;
}
