import nodemailer from "nodemailer";

export interface EmailTicket {
  ticketType: string;
  qrCodeDataUrl: string;
  ticketId: string;
}

export interface SendTicketEmailOptions {
  to: string;
  buyerName: string;
  orderNumber: string;
  tickets: EmailTicket[];
  eventName?: string;
  eventDate?: string;
  brandLogo?: string;
  brandColor?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Generates HTML email template for tickets
 */
function generateTicketEmailHTML(options: SendTicketEmailOptions): string {
  const {
    buyerName,
    orderNumber,
    tickets,
    eventName = "Your Event",
    eventDate = "TBD",
    brandLogo = "",
    brandColor = "#5C6AC4",
  } = options;

  const ticketHTML = tickets
    .map(
      (ticket, index) => `
    <div style="margin: 30px 0; padding: 20px; border: 2px dashed ${brandColor}; border-radius: 12px; background-color: #f9f9f9;">
      <h3 style="color: ${brandColor}; margin-top: 0;">Ticket ${index + 1}: ${ticket.ticketType}</h3>
      <p style="font-size: 14px; color: #666; margin: 10px 0;">Ticket ID: <strong>${ticket.ticketId}</strong></p>
      <div style="text-align: center; margin: 20px 0;">
        <img src="${ticket.qrCodeDataUrl}" alt="QR Code" style="max-width: 300px; height: auto; border-radius: 8px;" />
      </div>
      <p style="font-size: 12px; color: #999; text-align: center; margin-top: 15px;">
        Show this QR code at the event entrance
      </p>
    </div>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Tickets - ${eventName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${brandColor}; padding: 40px 30px; text-align: center;">
              ${brandLogo ? `<img src="${brandLogo}" alt="Logo" style="max-width: 200px; height: auto; margin-bottom: 20px;" />` : ""}
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Your Tickets Are Ready!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333; margin-top: 0;">
                Hi ${buyerName || "there"},
              </p>
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Thank you for your purchase! Your tickets for <strong>${eventName}</strong> are attached below.
              </p>

              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 5px 0; color: #666;"><strong>Order Number:</strong> ${orderNumber}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Event:</strong> ${eventName}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${eventDate}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Tickets:</strong> ${tickets.length}</p>
              </div>

              ${ticketHTML}

              <div style="margin-top: 40px; padding: 20px; background-color: #fffbf0; border-left: 4px solid #ffa500; border-radius: 4px;">
                <p style="margin: 0; color: #666; font-size: 14px;">
                  <strong>Important:</strong> Please save this email or download your tickets. You'll need to present the QR code(s) at the event entrance.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                Powered by <strong>Validiam</strong>
              </p>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
                Need help? Contact us at support@validiam.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Sends ticket email to customer
 */
export async function sendTicketEmail(
  options: SendTicketEmailOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = generateTicketEmailHTML(options);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "Validiam <noreply@validiam.com>",
      to: options.to,
      subject: `Your Tickets for ${options.eventName || "Your Event"} - Order ${options.orderNumber}`,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Verifies email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("Email verification failed:", error);
    return false;
  }
}
