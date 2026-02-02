import { prisma } from "@/lib/prisma";

type MailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  centerId?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getEmailOverrideTo(): string | null {
  const raw = process.env.EMAIL_OVERRIDE_TO?.trim();
  if (!raw) return null;
  return normalizeEmail(raw);
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim();

  const port = portRaw ? Number(portRaw) : undefined;
  const secure = port === 465;

  return { host, port, secure, user, pass, from };
}

async function getTransport() {
  const nodemailer = await import("nodemailer");
  const cfg = getSmtpConfig();

  // Dev fallback: no SMTP configured → JSON transport (no real sending)
  if (!cfg.host || !cfg.port || !cfg.user || !cfg.pass) {
    return { transport: nodemailer.createTransport({ jsonTransport: true }), isJson: true };
  }

  return {
    transport: nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    }),
    isJson: false,
  };
}

export async function sendEmail(payload: MailPayload): Promise<void> {
  const cfg = getSmtpConfig();
  const from = cfg.from || `EviDive <no-reply@${cfg.host || "localhost"}>`;

  const originalTo = normalizeEmail(payload.to);
  const overrideTo = getEmailOverrideTo();
  const to = overrideTo ?? originalTo;
  const { transport, isJson } = await getTransport();

  try {
    const info = await transport.sendMail({
      from,
      to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });

    if (isJson) {
      // Useful in local/dev when no SMTP is configured
      console.info("[mailer] JSON transport (no SMTP). Email captured:", {
        to,
        subject: payload.subject,
        messageId: info.messageId,
      });
    }

    try {
      await prisma.emailLog.create({
        data: {
          toEmail: to,
          template: payload.template,
          subject: payload.subject,
          status: "SENT",
          userId: payload.userId ?? null,
          centerId: payload.centerId ?? null,
          metadata: {
            ...(payload.metadata ?? {}),
            originalTo: originalTo !== to ? originalTo : undefined,
            overridden: Boolean(overrideTo),
          },
        },
      });
    } catch {
      // best-effort logging
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown mail error";
    try {
      await prisma.emailLog.create({
        data: {
          toEmail: to,
          template: payload.template,
          subject: payload.subject,
          status: "FAILED",
          errorMessage: message,
          userId: payload.userId ?? null,
          centerId: payload.centerId ?? null,
          metadata: {
            ...(payload.metadata ?? {}),
            originalTo: originalTo !== to ? originalTo : undefined,
            overridden: Boolean(overrideTo),
          },
        },
      });
    } catch {
      // best-effort logging
    }
    throw error;
  }
}

