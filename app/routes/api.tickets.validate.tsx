import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { validateTicket, updateTicketStatus } from "~/services/ticket.server";
import { prisma } from "~/lib/db.server";
import { decryptQRData } from "~/lib/encryption.server";

/**
 * API endpoint to validate and scan tickets
 * POST /api/tickets/validate
 * Body: { qrData: string, qrCode: string, scannedBy?: string, userId?: string }
 *
 * Supports both Shopify app proxy auth and mobile app (public) access
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  console.log('[Validate] Request received');

  try {
    const body = await request.json();
    console.log('[Validate] Body:', JSON.stringify(body).substring(0, 200));

    const { qrData, qrCode, scannedBy, userId } = body;

    // Support both qrData (old) and qrCode (mobile app) parameters
    const qrInput = qrCode || qrData;

    if (!qrInput) {
      console.log('[Validate] Missing QR input');
      return json({
        success: false,
        status: "invalid",
        message: "QR data is required"
      }, {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    console.log('[Validate] QR input received, length:', qrInput.length);

    // Mobile app flow - decrypt and validate QR code
    let qrDecrypted;
    try {
      console.log('[Validate] Attempting to decrypt QR');
      qrDecrypted = decryptQRData(qrInput);
      console.log('[Validate] QR decrypted successfully, entry_id:', qrDecrypted.entry_id);
    } catch (error) {
      console.error('[Validate] Decryption failed:', error);
      return json({
        success: false,
        status: "invalid",
        message: "Código QR no válido o corrupto",
      }, {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    // Validate QR data structure
    if (!qrDecrypted.entry_id || !qrDecrypted.valid) {
      return json({
        success: false,
        status: "invalid",
        message: "Código QR inválido",
      });
    }

    // Find ticket in database
    const ticket = await prisma.ticket.findUnique({
      where: { id: qrDecrypted.entry_id },
    });

    if (!ticket) {
      return json({
        success: false,
        status: "invalid",
        message: "Entrada no encontrada en el sistema",
      });
    }

    // Check if ticket was already marked as used
    if (ticket.status === "SCANNED") {
      return json({
        success: false,
        ticket: {
          id: ticket.id,
          eventName: ticket.productTitle,
          ticketType: ticket.productTitle,
          status: "used",
          buyerEmail: ticket.buyerEmail,
          purchaseDate: ticket.createdAt.toISOString(),
          qrCode: ticket.qrData || "",
          scannedAt: ticket.usedAt?.toISOString(),
          scannedBy: scannedBy || "Staff",
        },
        status: "used",
        message: `Entrada ya utilizada${ticket.usedAt ? ` el ${ticket.usedAt.toLocaleString('es-ES')}` : ''}`,
      }, {
        headers: {
          "Access-Control-Allow-Origin": "*",
        }
      });
    }

    // Mark ticket as used
    console.log('[Validate] Marking ticket as SCANNED');
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "SCANNED",
        usedAt: new Date(),
      },
    });
    console.log('[Validate] Ticket marked as SCANNED successfully');

    return json({
      success: true,
      ticket: {
        id: updatedTicket.id,
        eventName: updatedTicket.productTitle,
        ticketType: updatedTicket.productTitle,
        status: "valid",
        buyerEmail: updatedTicket.buyerEmail,
        purchaseDate: updatedTicket.createdAt.toISOString(),
        qrCode: updatedTicket.qrData || "",
      },
      status: "valid",
      message: "Entrada válida - Acceso permitido",
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Validation error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Validation failed" },
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
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

/**
 * GET endpoint to check ticket status without scanning
 */
export const loader = async ({ request }: ActionFunctionArgs) => {
  try {
    const { session } = await authenticate.public.appProxy(request);

    if (!session) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const qrData = url.searchParams.get("qrData");

    if (!qrData) {
      return json({ error: "QR data is required" }, { status: 400 });
    }

    const validationResult = await validateTicket(qrData, session.shop);

    return json({
      valid: validationResult.valid,
      ticket: validationResult.ticket,
      error: validationResult.error,
    });
  } catch (error) {
    console.error("Validation error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Validation failed" },
      { status: 500 }
    );
  }
};
