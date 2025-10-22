import QRCode from "qrcode";
import { encryptQRData, type QRData } from "~/lib/encryption.server";

export interface GenerateQROptions {
  entryId: string;
  shopifyOrder: string;
  buyer: string;
  ticketType: string;
}

/**
 * Generates a QR code image data URL and SVG string
 */
export async function generateQRCode(options: GenerateQROptions): Promise<{
  qrCodeDataUrl: string;
  qrCodeSvg: string;
  encryptedData: string;
}> {
  const qrData: QRData = {
    entry_id: options.entryId,
    shopify_order: options.shopifyOrder,
    buyer: options.buyer,
    ticket_type: options.ticketType,
    valid: true,
    used: false,
    timestamp: new Date().toISOString(),
  };

  // Encrypt the data
  const encryptedData = encryptQRData(qrData);

  const qrOptions = {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 256, // Reduced from 512 for better display in checkout
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  };

  // Generate QR code as data URL (for email)
  const qrCodeDataUrl = await QRCode.toDataURL(encryptedData, qrOptions);

  // Generate QR code as SVG string (for web display)
  const qrCodeSvg = await QRCode.toString(encryptedData, {
    ...qrOptions,
    type: 'svg',
  });

  // Convert SVG to data URL for better compatibility with Image components
  const qrCodeSvgDataUrl = `data:image/svg+xml;base64,${Buffer.from(qrCodeSvg).toString('base64')}`;

  return {
    qrCodeDataUrl,
    qrCodeSvg: qrCodeSvgDataUrl,
    encryptedData,
  };
}

/**
 * Validates a QR code by decrypting and checking the data
 */
export async function validateQRCode(encryptedData: string): Promise<{
  valid: boolean;
  data?: QRData;
  error?: string;
}> {
  try {
    const { decryptQRData } = await import("~/lib/encryption.server");
    const data = decryptQRData(encryptedData);

    if (!data.valid) {
      return { valid: false, error: "Ticket marked as invalid" };
    }

    if (data.used) {
      return { valid: false, error: "Ticket already used", data };
    }

    return { valid: true, data };
  } catch (error) {
    return { valid: false, error: "Invalid QR code format" };
  }
}
