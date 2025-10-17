import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { validateTicket, updateTicketStatus } from "~/services/ticket.server";

/**
 * API endpoint to validate and scan tickets
 * POST /api/tickets/validate
 * Body: { qrData: string, scannedBy?: string }
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { session } = await authenticate.public.appProxy(request);

    if (!session) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { qrData, scannedBy } = body;

    if (!qrData) {
      return json({ error: "QR data is required" }, { status: 400 });
    }

    // Validate ticket
    const validationResult = await validateTicket(qrData, session.shop);

    if (!validationResult.valid) {
      return json({
        valid: false,
        error: validationResult.error,
        ticket: validationResult.ticket,
      });
    }

    // Mark ticket as scanned
    const updateResult = await updateTicketStatus(
      validationResult.ticket!.id,
      "SCANNED",
      scannedBy
    );

    if (!updateResult.success) {
      return json({ error: updateResult.error }, { status: 500 });
    }

    return json({
      valid: true,
      ticket: updateResult.ticket,
      message: "Ticket scanned successfully",
    });
  } catch (error) {
    console.error("Validation error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Validation failed" },
      { status: 500 }
    );
  }
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
