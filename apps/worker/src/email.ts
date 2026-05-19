import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_FROM = process.env.EMAIL_FROM || "SalesAgent <noreply@salesagent.ai>";

let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY environment variable is required for email actions");
    resend = new Resend(RESEND_API_KEY);
  }
  return resend;
}

// Resolve {{variable}} placeholders against context
function resolveTemplate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{([\w.]+)\}\}/g, (_match, path: string) => {
    const keys = path.split(".");
    let value: unknown = context;
    for (const key of keys) {
      if (value && typeof value === "object") {
        value = (value as Record<string, unknown>)[key];
      } else {
        return `{{${path}}}`;
      }
    }
    return value !== undefined && value !== null ? String(value) : `{{${path}}}`;
  });
}

interface SendEmailConfig {
  action: "send_email";
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export async function sendEmail(
  config: SendEmailConfig,
  context: Record<string, unknown>,
): Promise<{ messageId: string; to: string }> {
  const r = getResend();

  const to = resolveTemplate(config.to, context);
  const subject = resolveTemplate(config.subject, context);
  const body = resolveTemplate(config.body, context);
  const from = config.from ? resolveTemplate(config.from, context) : DEFAULT_FROM;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await r.emails.send({
    from,
    to: [to],
    subject,
    text: body,
    trackOpens: true,
    trackClicks: true,
  } as any);

  if (error) throw new Error(`Email send failed: ${error.message}`);

  return { messageId: data!.id, to };
}
