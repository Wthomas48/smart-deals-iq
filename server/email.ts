import nodemailer from "nodemailer";

// Zoho SMTP configuration
// Required env vars: ZOHO_EMAIL, ZOHO_PASSWORD (or ZOHO_APP_PASSWORD)
const ZOHO_EMAIL = process.env.ZOHO_EMAIL || "info@smartdealsiq.com";
const ZOHO_PASSWORD = process.env.ZOHO_APP_PASSWORD || process.env.ZOHO_PASSWORD || "";

// Create transporter (lazy initialization)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  if (!ZOHO_PASSWORD) {
    console.warn("[Email] No ZOHO_PASSWORD or ZOHO_APP_PASSWORD set — emails will be logged to console only.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true,
    auth: {
      user: ZOHO_EMAIL,
      pass: ZOHO_PASSWORD,
    },
  });

  console.log(`[Email] Zoho SMTP configured with ${ZOHO_EMAIL}`);
  return transporter;
}

/**
 * Send a password reset code email.
 * Falls back to console.log if SMTP is not configured.
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  code: string
): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    // Fallback: log to console in development
    console.log(`[Email] (no SMTP) Password reset code for ${toEmail}: ${code}`);
    return true; // Return true so the flow continues
  }

  try {
    await transport.sendMail({
      from: `"SmartDealsIQ" <${ZOHO_EMAIL}>`,
      to: toEmail,
      subject: "SmartDealsIQ - Password Reset Code",
      text: `Your password reset verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.\n\n— SmartDealsIQ Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #333; font-size: 24px; margin: 0;">SmartDealsIQ</h1>
          </div>
          <h2 style="color: #333; font-size: 20px;">Password Reset</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            You requested a password reset. Use the verification code below:
          </p>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #333;">${code}</span>
          </div>
          <p style="color: #999; font-size: 14px; line-height: 1.5;">
            This code expires in 15 minutes. If you did not request this reset, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #bbb; font-size: 12px; text-align: center;">
            SmartDealsIQ &mdash; Discover amazing deals from local businesses
          </p>
        </div>
      `,
    });

    console.log(`[Email] Password reset code sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send reset code to ${toEmail}:`, error);
    return false;
  }
}
