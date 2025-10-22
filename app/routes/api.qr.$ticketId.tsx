import { type LoaderFunctionArgs } from "@remix-run/node";
import { prisma } from "~/lib/db.server";

/**
 * Public endpoint to serve QR code images
 * Returns SVG or PNG image based on ticket ID
 * Query params: ?size=200 (optional, defaults to original size)
 */
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  try {
    const { ticketId } = params;

    if (!ticketId) {
      return new Response("Missing ticket ID", { status: 400 });
    }

    // Get size parameter from query string
    const url = new URL(request.url);
    const requestedSize = url.searchParams.get("size");
    const targetSize = requestedSize ? parseInt(requestedSize) : null;

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
      let svgContent = Buffer.from(base64Data, 'base64').toString('utf-8');

      // If size is requested, modify the SVG dimensions
      if (targetSize) {
        // Remove existing width and height attributes, then add new ones
        svgContent = svgContent.replace(
          /<svg([^>]*)>/,
          (match, attrs) => {
            // Remove any existing width/height attributes
            let cleanAttrs = attrs.replace(/\s*width="[^"]*"/g, '').replace(/\s*height="[^"]*"/g, '');
            return `<svg${cleanAttrs} width="${targetSize}" height="${targetSize}">`;
          }
        );
      }

      return new Response(svgContent, {
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
