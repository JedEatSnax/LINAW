import type { AppEnv } from "../../config/env.js";
import { EmailService } from "../../shared/email/email.service.js";
import { MailgunEmailProvider } from "../../shared/email/mailgun.provider.js";

export interface PasswordResetNotificationInput {
  email: string;
  resetLink: string;
}

export interface AuthNotifier {
  sendPasswordResetEmail(input: PasswordResetNotificationInput): Promise<void>;
}

export class NoopAuthNotifier implements AuthNotifier {
  async sendPasswordResetEmail(): Promise<void> {
    return;
  }
}

export class MailgunAuthNotifier implements AuthNotifier {
  private readonly emailService: EmailService;

  constructor(env: AppEnv) {
    this.emailService = new EmailService(new MailgunEmailProvider(env));
  }

  async sendPasswordResetEmail(
    input: PasswordResetNotificationInput,
  ): Promise<void> {
    await this.emailService.send({
      to: input.email,
      subject: "Reset your LINAW password",
      text: [
        "Hello,",
        "",
        "Use the link below to reset your LINAW password:",
        input.resetLink,
        "",
        "This link expires in 1 hour.",
        "If you did not request a password reset, you can safely ignore this email.",
      ].join("\n"),
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
                    <h2>Reset your LINAW password</h2>
                    <p>Use the button below to choose a new password.</p>
                    <p style="margin: 32px 0;">
                        <a href="${input.resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px;">
                            Reset password
                        </a>
                    </p>
                    <p>This link expires in 1 hour.</p>
                    <p>If you did not request a password reset, you can safely ignore this email.</p>
                </div>
            `,
    });
  }
}
