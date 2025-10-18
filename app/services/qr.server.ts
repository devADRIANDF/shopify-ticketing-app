import QRCode from "qrcode";
import { encryptQRData, type QRData } from "~/lib/encryption.server";

export interface GenerateQROptions {
  entryId: string;
  shopifyOrder: string;
  buyer: string;
  ticketType: string;
}

/**
 * Generates a QR code image data URL
 */
export async function generateQRCode(options: GenerateQROptions): Promise<{
  qrCodeDataUrl: string;
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

  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(encryptedData, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 512,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  return {
    qrCodeDataUrl,
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
