import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-change-this-immediately";

export interface QRData {
  entry_id: string;
  shopify_order: string;
  buyer: string;
  ticket_type: string;
  valid: boolean;
  used: boolean;
  timestamp: string;
}

/**
 * Encrypts QR data using AES encryption
 */
export function encryptQRData(data: QRData): string {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt QR data");
  }
}

/**
 * Decrypts QR data
 */
export function decryptQRData(encryptedData: string): QRData {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString) as QRData;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt QR data");
  }
}

/**
 * Generates a unique ticket ID
 */
export function generateTicketId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `TKT-${timestamp}-${randomPart}`.toUpperCase();
}
