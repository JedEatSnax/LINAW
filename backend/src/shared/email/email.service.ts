import type { EmailMessage, EmailProvider } from "./email.types";

export class EmailService {
  constructor(private readonly provider: EmailProvider) {}

  async send(message: EmailMessage): Promise<void> {
    await this.provider.send(message);
  }
}
