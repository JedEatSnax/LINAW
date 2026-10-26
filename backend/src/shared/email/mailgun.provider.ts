import type { AppEnv } from "../../config/env";
import type { EmailMessage, EmailProvider } from "./email.types";

export class MailgunEmailProvider implements EmailProvider {
  constructor(private readonly env: AppEnv) {}

  async send(message: EmailMessage): Promise<void> {
    const body = new FormData();

    body.append("from", this.env.MAILGUN_FROM);
    body.append("to", message.to);
    body.append("subject", message.subject);

    if (message.text) {
      body.append("text", message.text);
    }

    if (message.html) {
      body.append("html", message.html);
    }

    const credentials = btoa(`api:${this.env.MAILGUN_API_KEY}`);

    const response = await fetch(
      `https://api.mailgun.net/v3/${this.env.MAILGUN_DOMAIN}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        body,
      },
    );

    if (!response.ok) {
      const error = await response.text();

      throw new Error(`Mailgun email failed (${response.status}): ${error}`);
    }
  }
}
