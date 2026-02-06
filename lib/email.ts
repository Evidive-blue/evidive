import nodemailer from "nodemailer";

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || "EviDive <no-reply@evidive.blue>";
const EMAIL_OVERRIDE_TO = process.env.EMAIL_OVERRIDE_TO || "";

// Base URL for links in emails
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Check if email is configured
export function isEmailConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

// Create transporter (lazy initialization)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!isEmailConfigured()) {
    console.warn("[Email] SMTP not configured. Emails will be logged to console.");
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
}

// Email templates
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function getVerificationEmailTemplate(firstName: string, verificationUrl: string): EmailTemplate {
  return {
    subject: "Verify your EviDive account",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(6, 182, 212, 0.2);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #06b6d4; font-size: 28px; font-weight: 700;">EviDive</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px; font-weight: 600;">Welcome aboard, ${firstName}!</h2>
              <p style="margin: 0 0 24px; color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6;">
                Thank you for joining EviDive! To complete your registration and start exploring the best diving centers worldwide, please verify your email address.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #06b6d4 0%, #0284c7 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                      Verify My Email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; color: rgba(255, 255, 255, 0.5); font-size: 14px; line-height: 1.6;">
                If you didn't create an account on EviDive, you can safely ignore this email.
              </p>
              <p style="margin: 16px 0 0; color: rgba(255, 255, 255, 0.4); font-size: 12px;">
                This link will expire in 24 hours.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 0; color: rgba(255, 255, 255, 0.4); font-size: 12px; text-align: center;">
                &copy; ${new Date().getFullYear()} EviDive. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `
Welcome to EviDive, ${firstName}!

Thank you for joining EviDive! To complete your registration and start exploring the best diving centers worldwide, please verify your email address by clicking the link below:

${verificationUrl}

If you didn't create an account on EviDive, you can safely ignore this email.

This link will expire in 24 hours.

© ${new Date().getFullYear()} EviDive. All rights reserved.
    `.trim(),
  };
}

function getPasswordResetEmailTemplate(firstName: string, resetUrl: string): EmailTemplate {
  return {
    subject: "Reset your EviDive password",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(6, 182, 212, 0.2);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #06b6d4; font-size: 28px; font-weight: 700;">EviDive</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px; font-weight: 600;">Reset your password</h2>
              <p style="margin: 0 0 24px; color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6;">
                Hi ${firstName}, we received a request to reset your password. Click the button below to choose a new password.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #06b6d4 0%, #0284c7 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0; color: rgba(255, 255, 255, 0.5); font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              <p style="margin: 16px 0 0; color: rgba(255, 255, 255, 0.4); font-size: 12px;">
                This link will expire in 1 hour.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 0; color: rgba(255, 255, 255, 0.4); font-size: 12px; text-align: center;">
                &copy; ${new Date().getFullYear()} EviDive. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `
Reset your EviDive password

Hi ${firstName}, we received a request to reset your password. Click the link below to choose a new password:

${resetUrl}

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

This link will expire in 1 hour.

© ${new Date().getFullYear()} EviDive. All rights reserved.
    `.trim(),
  };
}

function getBookingConfirmationEmailTemplate(
  firstName: string,
  bookingDetails: {
    centerName: string;
    serviceName: string;
    date: string;
    time: string;
    participants: number;
    totalPrice: string;
    reference: string;
  }
): EmailTemplate {
  return {
    subject: `Booking Confirmed - ${bookingDetails.centerName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(16, 185, 129, 0.3);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #06b6d4; font-size: 28px; font-weight: 700;">EviDive</h1>
            </td>
          </tr>
          <!-- Success Badge -->
          <tr>
            <td style="padding: 0 40px 20px; text-align: center;">
              <span style="display: inline-block; padding: 8px 16px; background: rgba(16, 185, 129, 0.2); color: #10b981; font-size: 14px; font-weight: 600; border-radius: 20px;">
                ✓ Booking Confirmed
              </span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px; font-weight: 600;">Your dive is booked!</h2>
              <p style="margin: 0 0 24px; color: rgba(255, 255, 255, 0.7); font-size: 16px; line-height: 1.6;">
                Hi ${firstName}, your booking has been confirmed. Here are your details:
              </p>
              
              <!-- Booking Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <span style="color: rgba(255, 255, 255, 0.5); font-size: 12px;">CENTER</span><br>
                    <span style="color: #ffffff; font-size: 16px; font-weight: 600;">${bookingDetails.centerName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <span style="color: rgba(255, 255, 255, 0.5); font-size: 12px;">SERVICE</span><br>
                    <span style="color: #ffffff; font-size: 16px;">${bookingDetails.serviceName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <span style="color: rgba(255, 255, 255, 0.5); font-size: 12px;">DATE & TIME</span><br>
                    <span style="color: #ffffff; font-size: 16px;">${bookingDetails.date} at ${bookingDetails.time}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <span style="color: rgba(255, 255, 255, 0.5); font-size: 12px;">PARTICIPANTS</span><br>
                    <span style="color: #ffffff; font-size: 16px;">${bookingDetails.participants}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px;">
                    <span style="color: rgba(255, 255, 255, 0.5); font-size: 12px;">TOTAL</span><br>
                    <span style="color: #10b981; font-size: 20px; font-weight: 700;">${bookingDetails.totalPrice}</span>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; color: rgba(255, 255, 255, 0.5); font-size: 14px;">
                Reference: <strong style="color: #06b6d4;">${bookingDetails.reference}</strong>
              </p>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${BASE_URL}/dashboard" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #06b6d4 0%, #0284c7 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px;">
                      View My Bookings
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 0; color: rgba(255, 255, 255, 0.4); font-size: 12px; text-align: center;">
                &copy; ${new Date().getFullYear()} EviDive. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
    text: `
Your dive is booked!

Hi ${firstName}, your booking has been confirmed. Here are your details:

CENTER: ${bookingDetails.centerName}
SERVICE: ${bookingDetails.serviceName}
DATE & TIME: ${bookingDetails.date} at ${bookingDetails.time}
PARTICIPANTS: ${bookingDetails.participants}
TOTAL: ${bookingDetails.totalPrice}

Reference: ${bookingDetails.reference}

View your bookings at: ${BASE_URL}/dashboard

© ${new Date().getFullYear()} EviDive. All rights reserved.
    `.trim(),
  };
}

// Send email function
async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<{ success: boolean; error?: string }> {
  // Override recipient in dev mode
  const recipient = EMAIL_OVERRIDE_TO || to;

  const mailer = getTransporter();

  if (!mailer) {
    // Log email to console when SMTP is not configured
    console.log("\n========== EMAIL (SMTP NOT CONFIGURED) ==========");
    console.log(`To: ${recipient}`);
    console.log(`Subject: ${template.subject}`);
    console.log(`\n--- TEXT VERSION ---\n${template.text}`);
    console.log("==================================================\n");
    return { success: true };
  }

  try {
    await mailer.sendMail({
      from: SMTP_FROM,
      to: recipient,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    console.log(`[Email] Sent "${template.subject}" to ${recipient}`);
    return { success: true };
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Public API
export async function sendVerificationEmail(
  email: string,
  firstName: string,
  verificationToken: string
): Promise<{ success: boolean; error?: string }> {
  const verificationUrl = `${BASE_URL}/verify-email?token=${verificationToken}`;
  const template = getVerificationEmailTemplate(firstName || "there", verificationUrl);
  return sendEmail(email, template);
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${BASE_URL}/reset-password?token=${resetToken}`;
  const template = getPasswordResetEmailTemplate(firstName || "there", resetUrl);
  return sendEmail(email, template);
}

export async function sendBookingConfirmationEmail(
  email: string,
  firstName: string,
  bookingDetails: {
    centerName: string;
    serviceName: string;
    date: string;
    time: string;
    participants: number;
    totalPrice: string;
    reference: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const template = getBookingConfirmationEmailTemplate(firstName || "there", bookingDetails);
  return sendEmail(email, template);
}
