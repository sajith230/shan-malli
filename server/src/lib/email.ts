import { Resend } from "resend";

type ApplicationConfirmationEmailInput = {
  to: string;
  name: string;
  position: string;
  skills?: string;
  message?: string;
};

let resendClient: Resend | null | undefined;
let missingApiKeyWarned = false;

function getResendClient() {
  if (resendClient !== undefined) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;
  resendClient = apiKey ? new Resend(apiKey) : null;
  return resendClient;
}

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL ?? "Campus AI <onboarding@resend.dev>";
}

function getToAddress(originalTo: string) {
  return process.env.RESEND_TEST_TO_EMAIL ?? originalTo;
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

function formatHtmlLine(label: string, value?: string) {
  if (!value) {
    return "";
  }

  return `<p><strong>${label}:</strong> ${escapeHtml(value).replace(/\n/g, "<br />")}</p>`;
}

function buildApplicationConfirmationHtml(input: ApplicationConfirmationEmailInput) {
  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="color: #0f766e;">Application received</h2>
      <p>Hi ${escapeHtml(input.name)},</p>
      <p>Thanks for applying for <strong>${escapeHtml(input.position)}</strong>. We received your application and our team will review it soon.</p>
      ${formatHtmlLine("Skills", input.skills)}
      ${formatHtmlLine("Message", input.message)}
      <p>Regards,<br />Campus AI Careers</p>
    </div>
  `;
}

function buildApplicationConfirmationText(input: ApplicationConfirmationEmailInput) {
  return [
    `Hi ${input.name},`,
    "",
    `Thanks for applying for ${input.position}. We received your application and our team will review it soon.`,
    input.skills ? `Skills: ${input.skills}` : "",
    input.message ? `Message: ${input.message}` : "",
    "",
    "Regards,",
    "Campus AI Careers",
  ]
    .filter(Boolean)
    .join("\n");
}

function getResendErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Unknown Resend error";
}

export async function sendApplicationConfirmationEmail(input: ApplicationConfirmationEmailInput) {
  const resend = getResendClient();
  if (!resend) {
    if (!missingApiKeyWarned) {
      console.warn("RESEND_API_KEY is not set; skipping application confirmation emails.");
      missingApiKeyWarned = true;
    }
    return false;
  }

  const to = getToAddress(input.to);

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: `Application received: ${input.position}`,
    html: buildApplicationConfirmationHtml(input),
    text: buildApplicationConfirmationText(input),
  });

  if (error) {
    throw new Error(getResendErrorMessage(error));
  }

  return true;
}
