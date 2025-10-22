import { type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * Public endpoint to serve QR code images
 * Returns SVG or PNG image based on ticket ID
 */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  try {
    const { ticketId } = params;

    if (!ticketId) {
      return new Response("Missing ticket ID", { status: 400 });
    }

    // Get ticket from database
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { qrCode: true },
    });

    if (!ticket || !ticket.qrCode) {
      return new Response("Ticket not found", { status: 404 });
    }

    // If it's a data URL, extract the data
    if (ticket.qrCode.startsWith('data:image/svg+xml;base64,')) {
      const base64Data = ticket.qrCode.replace('data:image/svg+xml;base64,', '');
      const svgBuffer = Buffer.from(base64Data, 'base64');

      return new Response(svgBuffer, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=31536000", // Cache for 1 year
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // If it's a PNG data URL
    if (ticket.qrCode.startsWith('data:image/png;base64,')) {
      const base64Data = ticket.qrCode.replace('data:image/png;base64,', '');
      const pngBuffer = Buffer.from(base64Data, 'base64');

      return new Response(pngBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // If it's raw SVG
    return new Response(ticket.qrCode, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error serving QR code:", error);
    return new Response("Error serving QR code", { status: 500 });
  }
};
