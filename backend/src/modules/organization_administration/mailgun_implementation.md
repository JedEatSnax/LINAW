# Mailgun + Hono + Cloudflare Workers Implementation Guide

## Purpose

This document records the exact setup used to test **Mailgun email delivery from a Hono application running on Cloudflare Workers**.

The test was intentionally kept separate from LINAW so the following could be verified independently before integrating email functionality into the thesis backend:

- Mailgun account/API
- Sending domain
- DNS configuration
- Mailgun authentication
- Hono
- Cloudflare Workers
- Wrangler
- Worker-compatible HTTP requests
- Outbound HTTPS/TLS
- Actual email delivery

The final test stack:

- Hono
- Cloudflare Workers
- Wrangler
- Mailgun HTTP API
- `wii.qd.je` sending domain
- NixOS development environment
- pnpm

The implementation uses the **Mailgun HTTP API directly with `fetch()`** instead of `mailgun.js`, because Cloudflare Workers is not a traditional Node.js runtime.

---

# 1. Architecture

The final request flow is:

```text
HTTP request
    │
    ▼
Hono route
    │
    ▼
Cloudflare Worker / workerd
    │
    │ HTTPS POST
    ▼
Mailgun HTTP API
    │
    ▼
Mailgun
    │
    ├── Queue
    └── Delivery
         │
         ▼
Recipient mailbox
```

The Worker does not use SMTP.

It sends an HTTPS request to:

```text
https://api.mailgun.net/v3/<MAILGUN_DOMAIN>/messages
```

Mailgun handles the actual email delivery.

---

# 2. Prerequisites

Required:

- Node.js
- pnpm
- Hono
- Wrangler
- Mailgun account
- Verified Mailgun sending domain
- DNS access for the sending domain

For this test, the sending domain was:

```text
wii.qd.je
```

The sender address was:

```text
noreply@wii.qd.je
```

The domain was obtained through DigitalPlat as a free development/test domain.

---

# 3. Create a Standalone Worker Project

The Mailgun test was intentionally kept separate from LINAW.

Example location:

```text
~/Linaw_migration/New_LINAW/mail_gun_test
```

Create the project:

```bash
mkdir -p ~/Linaw_migration/New_LINAW/mail_gun_test
cd ~/Linaw_migration/New_LINAW/mail_gun_test
```

Initialize the project:

```bash
pnpm init
```

Install Hono:

```bash
pnpm add hono
```

Install Wrangler and TypeScript:

```bash
pnpm add -D wrangler typescript
```

The Worker uses Hono directly. No Express server is required.

---

# 4. Project Structure

The minimal project structure was:

```text
mail_gun_test/
├── .dev.vars
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── wrangler.jsonc
└── src/
    └── index.ts
```

A `.wrangler/` directory may also appear after Wrangler is run.

---

# 5. Configure Wrangler

Create:

```text
wrangler.jsonc
```

Contents:

```json
{
  "name": "mailgun-worker-test",
  "main": "src/index.ts",
  "compatibility_date": "2026-09-27"
}
```

The important setting is:

```json
"main": "src/index.ts"
```

This tells Wrangler to use the Hono Worker entry point.

---

# 6. Configure the Mailgun Sending Domain

The sending domain must be added to Mailgun before sending email.

For this test:

```text
wii.qd.je
```

was added as the Mailgun sending domain.

Mailgun provides DNS records that must be added to the domain's DNS provider.

The DNS provider used for this test was DigitalPlat.

The Mailgun DNS records were added through the DigitalPlat DNS management interface.

The general flow is:

```text
Mailgun
    │
    ├── DKIM record
    ├── SPF record
    └── Other required DNS records
          │
          ▼
     DigitalPlat DNS
          │
          ▼
       wii.qd.je
```

After the records propagate, Mailgun can verify the sending domain.

The sender used in the test was:

```text
LINAW Test <noreply@wii.qd.je>
```

For LINAW, use the actual verified sending domain and sender address.

---

# 7. Configure `.dev.vars`

Create:

```text
.dev.vars
```

Example:

```dotenv
MAILGUN_API_KEY="YOUR_MAILGUN_API_KEY"
MAILGUN_DOMAIN="wii.qd.je"
MAILGUN_FROM="LINAW Test <noreply@wii.qd.je>"
MAILGUN_TO="YOUR_TEST_EMAIL@example.com"
```

Do not commit this file to Git.

Add it to `.gitignore`:

```gitignore
.dev.vars
```

Wrangler automatically loads `.dev.vars` when running local development.

Inside the Worker, these values are accessed through:

```ts
c.env;
```

---

# 8. Implement the Hono Worker

Create:

```text
src/index.ts
```

Use:

```ts
import { Hono } from "hono";

type Bindings = {
  MAILGUN_API_KEY: string;
  MAILGUN_DOMAIN: string;
  MAILGUN_FROM: string;
  MAILGUN_TO: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM, MAILGUN_TO } = c.env;

  const body = new FormData();

  body.append("from", MAILGUN_FROM);
  body.append("to", MAILGUN_TO);
  body.append("subject", "Mailgun + Hono + Workers Test");

  body.append(
    "text",
    "This email was sent from a Cloudflare Worker using Hono and Mailgun.",
  );

  body.append(
    "html",
    `
      <h1>Mailgun Test</h1>
      <p>This email was sent from a Cloudflare Worker using Hono.</p>
      <p>Mailgun + Hono + Workers is working.</p>
    `,
  );

  const credentials = btoa(`api:${MAILGUN_API_KEY}`);

  const response = await fetch(
    `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      body,
    },
  );

  const result = await response.text();

  if (!response.ok) {
    return c.json(
      {
        success: false,
        status: response.status,
        error: result,
      },
      500,
    );
  }

  return c.json({
    success: true,
    mailgun: result,
  });
});

export default app;
```

---

# 9. Why `fetch()` Was Used Instead of `mailgun.js`

The Worker should not automatically use the Mailgun Node.js SDK.

Cloudflare Workers uses the Workers runtime rather than a traditional Node.js server environment.

The Mailgun HTTP API can be called directly using the standard:

```ts
fetch();
```

The API endpoint is:

```text
POST https://api.mailgun.net/v3/<domain>/messages
```

Mailgun uses HTTP Basic authentication:

```text
username = api
password = MAILGUN_API_KEY
```

The Worker creates the Basic authentication value with:

```ts
const credentials = btoa(`api:${MAILGUN_API_KEY}`);
```

Then:

```ts
headers: {
  Authorization: `Basic ${credentials}`,
}
```

This keeps the implementation compatible with the Worker runtime and avoids introducing a Node-specific SDK.

---

# 10. Start Wrangler

Before starting Wrangler on NixOS, there was one additional environment requirement discovered during testing.

Set:

```bash
export SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
export NIX_SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
```

Then start Wrangler:

```bash
pnpm wrangler dev
```

Wrangler normally exposes the Worker at:

```text
http://localhost:8787
```

---

# 11. Test the Worker

From another terminal:

```bash
curl http://localhost:8787/
```

A successful response looked like:

```json
{
  "success": true,
  "mailgun": "{\"id\":\"<20260927150600.0b6e4f84050f8e88@wii.qd.je>\",\"message\":\"Queued. Thank you.\"}\n"
}
```

The important Mailgun response is:

```text
Queued. Thank you.
```

This means Mailgun accepted the request and queued the email.

It does not by itself guarantee that the recipient mailbox has received the message.

---

# 12. Verify Actual Delivery

There are three levels of verification.

## 12.1 Worker Response

The Worker should return:

```text
success: true
```

and Mailgun should respond with:

```text
Queued. Thank you.
```

This proves:

```text
Worker → Mailgun
```

is working.

## 12.2 Recipient Mailbox

Check the destination mailbox.

If the message arrives, the complete delivery path is working.

Also check spam/junk if necessary.

## 12.3 Mailgun Events / Logs

Mailgun Events/Logs can be used to determine whether Mailgun actually delivered the message.

This provides stronger confirmation than only receiving the `Queued` response.

---

# 13. NixOS / Workerd TLS Problem

This was the main issue encountered during implementation.

Initially, the Worker returned an internal error.

Wrangler reported:

```text
TLS peer's certificate is not trusted;
reason = self signed certificate in certificate chain
```

Later the error appeared as:

```text
TLS peer's certificate is not trusted;
reason = unable to get local issuer certificate
```

The stack trace pointed to:

```text
@cloudflare/workerd-linux-64
```

and Miniflare/workerd.

At first, this could have looked like a Mailgun TLS problem.

It was not.

---

# 14. Prove That System TLS Works

Run:

```bash
curl -v https://api.mailgun.net
```

The successful output included:

```text
SSL certificate verified via OpenSSL.
```

and:

```text
HTTP/2 200
```

with:

```text
Mailgun Magnificent API
```

The certificate was issued by DigiCert and successfully validated by OpenSSL.

Therefore:

```text
NixOS → Mailgun HTTPS
```

was working correctly.

The problem was specifically occurring inside the Worker development runtime.

---

# 15. Check NixOS CA Configuration

Check:

```bash
echo "$SSL_CERT_FILE"
echo "$NIX_SSL_CERT_FILE"
```

Initially both were empty.

Check the system CA bundle:

```bash
ls -l /etc/ssl/certs/ca-bundle.crt
```

The result was:

```text
/etc/ssl/certs/ca-bundle.crt -> /etc/static/ssl/certs/ca-bundle.crt
```

Also check:

```bash
ls -l /etc/ssl/certs/ca-certificates.crt
```

which resolved to:

```text
/etc/static/ssl/certs/ca-certificates.crt
```

This confirmed that the system had CA certificates installed.

---

# 16. Confirm the Nix CA Bundle

Run:

```bash
nix-shell -p cacert --run 'echo "$NIX_SSL_CERT_FILE"; ls -l "$NIX_SSL_CERT_FILE"'
```

This produced a valid Nix CA bundle path similar to:

```text
/nix/store/...-nss-cacert-3.126/etc/ssl/certs/ca-bundle.crt
```

Therefore, the Nix environment had a valid CA bundle.

---

# 17. Fix the Local Workerd TLS Issue

The solution was to explicitly expose the system CA bundle to the Worker development process.

Run:

```bash
export SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
export NIX_SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
```

Verify:

```bash
echo "$SSL_CERT_FILE"
echo "$NIX_SSL_CERT_FILE"
```

Expected:

```text
/etc/ssl/certs/ca-bundle.crt
/etc/ssl/certs/ca-bundle.crt
```

Then restart Wrangler:

```bash
pnpm wrangler dev
```

Test again:

```bash
curl http://localhost:8787/
```

The Worker then successfully returned:

```json
{
  "success": true,
  "mailgun": "{\"id\":\"<...@wii.qd.je>\",\"message\":\"Queued. Thank you.\"}\n"
}
```

Therefore, the local Worker runtime could now successfully verify Mailgun's TLS certificate.

---

# 18. Important `.dev.vars` Detail

One confusing issue during troubleshooting was the difference between `.dev.vars` and normal shell environment variables.

Wrangler successfully loaded:

```text
.dev.vars
```

and reported:

```text
Using secrets defined in .dev.vars
```

However, `.dev.vars` variables are provided to the Worker by Wrangler.

They are not automatically exported into the shell.

For example, running:

```bash
curl --user "api:$MAILGUN_API_KEY" \
  "https://api.mailgun.net/v3/$MAILGUN_DOMAIN/messages"
```

from the shell resulted in an empty API key and empty domain because those variables were not exported in that shell.

The resulting URL became:

```text
https://api.mailgun.net/v3//messages
```

and authentication became effectively:

```text
api:
```

This resulted in:

```text
HTTP/2 404
```

This was not a Mailgun domain configuration failure.

The variables were available inside Wrangler, not the shell.

---

# 19. Do Not Disable TLS Verification

Do not use insecure TLS bypasses to solve this problem.

Do not use:

```bash
curl --insecure
```

as the actual solution.

Do not disable certificate verification in the Worker.

The correct solution was to provide the correct CA bundle to the local development runtime.

---

# 20. Reproducing the Working Setup

On the same NixOS development machine:

```bash
cd ~/Linaw_migration/New_LINAW/mail_gun_test
```

Set the CA environment:

```bash
export SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
export NIX_SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
```

Start Wrangler:

```bash
pnpm wrangler dev
```

Then:

```bash
curl http://localhost:8787/
```

Expected:

```text
Queued. Thank you.
```

---

# 21. LINAW Integration

The standalone test should not be copied into LINAW as one giant email implementation.

The useful part to bring into LINAW is the Mailgun HTTP API interaction.

The desired architecture is:

```text
LINAW Feature
     │
     ▼
Email Service / Email Infrastructure
     │
     ▼
Mailgun HTTP API
```

The business logic should not directly know about:

```text
MAILGUN_API_KEY
MAILGUN_DOMAIN
Authorization: Basic ...
api.mailgun.net
FormData
```

Those details belong to the email infrastructure/provider implementation.

---

# 22. Suggested Email Abstraction

A simple abstraction could eventually look like:

```ts
interface EmailMessage {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
```

Then Mailgun can implement the provider:

```text
EmailProvider
      │
      ▼
MailgunEmailProvider
      │
      ▼
Mailgun HTTP API
```

This keeps the rest of LINAW independent from Mailgun.

If Mailgun is replaced later, the application does not need to know about the provider change.

---

# 23. LINAW Invitation Flow

For the member invitation feature, the intended flow can be:

```text
Admin
  │
  ▼
Invite Member Endpoint
  │
  ▼
Controller
  │
  ▼
Service
  │
  ├── Create invitation
  │
  └── Trigger invitation email
          │
          ▼
      Email Service
          │
          ▼
       Mailgun
          │
          ▼
    Invitation Email
```

The invitation service should primarily care about:

- recipient
- tenant
- invitation token
- invitation expiration
- invitation state

The email service should care about:

- sender
- recipient
- subject
- text
- HTML
- provider authentication
- Mailgun API communication

---

# 24. Event Bus Consideration

LINAW already has an event bus.

A future architecture can separate the business operation from email delivery:

```text
Business Service
      │
      ▼
 Publish Event
      │
      ▼
 Event Bus
      │
      ▼
 Email Handler
      │
      ▼
 Email Service
      │
      ▼
 Mailgun
```

For example:

```text
member.invited
```

could eventually trigger:

```text
sendMemberInvitationEmail()
```

However, this does not need to be implemented immediately.

For the initial LINAW implementation, directly calling the email service is acceptable if it keeps development simple.

The important architectural rule is:

> Keep Mailgun-specific implementation isolated from the business logic.

The event bus can be introduced later without rewriting the Mailgun provider.

---

# 25. LINAW Environment Variables

The standalone test used:

```text
MAILGUN_API_KEY
MAILGUN_DOMAIN
MAILGUN_FROM
MAILGUN_TO
```

LINAW should use:

```text
MAILGUN_API_KEY
MAILGUN_DOMAIN
MAILGUN_FROM
```

`MAILGUN_TO` was only required by the standalone test because it used a fixed recipient.

LINAW should receive the recipient dynamically:

```ts
await emailService.send({
  to: recipientEmail,
  subject,
  html,
});
```

---

# 26. Security Requirements

Never:

- hard-code the Mailgun API key
- commit `.dev.vars`
- put the Mailgun API key in frontend code
- return the API key in API responses
- log the API key
- disable TLS verification

Keep the Mailgun API key in the Worker secret/environment configuration.

---

# 27. Troubleshooting

## TLS error

If Wrangler reports:

```text
TLS peer's certificate is not trusted
```

first test:

```bash
curl -v https://api.mailgun.net
```

If curl successfully verifies the certificate but the Worker does not, check the local Worker runtime's CA environment.

For this NixOS environment:

```bash
export SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
export NIX_SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
```

Then restart Wrangler.

---

## Mailgun returns 404

Check the URL.

It should look like:

```text
https://api.mailgun.net/v3/wii.qd.je/messages
```

It should not look like:

```text
https://api.mailgun.net/v3//messages
```

An empty domain usually means the environment variable is missing.

---

## Authentication failure

Mailgun API authentication uses:

```text
username: api
password: MAILGUN_API_KEY
```

The account email/password is not used for this API request.

---

## Email is queued but not received

Check:

1. Mailgun Events/Logs
2. recipient spam/junk folder
3. sender address
4. sending-domain verification
5. DNS records
6. Mailgun account/domain restrictions

Remember:

```text
Queued
```

means Mailgun accepted the request.

It does not necessarily mean the recipient mailbox has accepted the message.

---

# 28. Final Known-Good Configuration

## `.dev.vars`

```dotenv
MAILGUN_API_KEY="YOUR_MAILGUN_API_KEY"
MAILGUN_DOMAIN="wii.qd.je"
MAILGUN_FROM="LINAW Test <noreply@wii.qd.je>"
MAILGUN_TO="YOUR_TEST_EMAIL@example.com"
```

## `wrangler.jsonc`

```json
{
  "name": "mailgun-worker-test",
  "main": "src/index.ts",
  "compatibility_date": "2026-09-27"
}
```

## NixOS TLS environment

```bash
export SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
export NIX_SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
```

## Start

```bash
pnpm wrangler dev
```

## Test

```bash
curl http://localhost:8787/
```

## Expected Mailgun response

```text
Queued. Thank you.
```

---

# 29. What Was Proven

The standalone test successfully proved:

```text
Hono
  ↓
Cloudflare Workers-compatible fetch()
  ↓
Mailgun HTTP API
  ↓
wii.qd.je sending domain
  ↓
Mailgun queue
```

The major problem encountered was **not**:

- Mailgun
- the Mailgun API key
- the sending domain
- DNS
- Hono
- the `fetch()` implementation
- NixOS system networking
- NixOS OpenSSL

The problem was the local Cloudflare `workerd` development runtime not automatically using the NixOS CA bundle.

The working fix was:

```bash
export SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
export NIX_SSL_CERT_FILE=/etc/ssl/certs/ca-bundle.crt
```

After setting those variables, the Hono Worker successfully sent an email through Mailgun.

This standalone project can therefore serve as the reference implementation for the LINAW email integration.
