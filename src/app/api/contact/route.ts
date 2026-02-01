import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminEmail } from "@/lib/admin";
import { sendEmail } from "@/lib/mailer";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
  try {
    const adminEmail = getAdminEmail();
    if (!adminEmail) {
      return NextResponse.json(
        { error: "ADMIN_EMAIL is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;

    const text = [
      `Nouveau message depuis la page Contact`,
      ``,
      `Nom: ${name}`,
      `Email: ${email}`,
      `Sujet: ${subject}`,
      ``,
      message,
    ].join("\n");

    const html = `
      <h2>Nouveau message depuis la page Contact</h2>
      <p><strong>Nom:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Sujet:</strong> ${escapeHtml(subject)}</p>
      <hr />
      <pre style="white-space:pre-wrap;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${escapeHtml(message)}</pre>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `[Contact] ${subject}`,
      text,
      html,
      template: "contact_form",
      metadata: { fromName: name, fromEmail: email },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

