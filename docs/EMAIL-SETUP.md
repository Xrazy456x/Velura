# Velura Email Setup

Velura sends inquiry alerts, internal booking alerts, booking confirmations, and booking status updates from the backend.

## Recommended Live Setup: Resend

Use Resend for the live Render backend because it sends email through HTTPS. This avoids the SMTP port problems that free hosting providers often have.

1. Create a Resend account.
2. In Resend, add and verify your sending domain. Use `veluraservices.com` if you want to send from `bookings@veluraservices.com`.
3. Copy the DNS records Resend gives you.
4. In Cloudflare, open `veluraservices.com > DNS > Records`.
5. Add each Resend DNS record exactly as shown in Resend.
6. Wait until Resend shows the domain as verified.
7. In Resend, create an API key.
8. In Render, open `velura-services-api > Environment`.
9. Add or update these variables:

```env
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=Velura Services <bookings@veluraservices.com>
CONTACT_TO=bookings@veluraservices.com
```

10. Save the variables and redeploy the Render service.
11. Test from the manager dashboard by creating a booking with email confirmation enabled, or by clicking the booking email confirmation button.

## What Each Variable Does

`RESEND_API_KEY` is the private Resend API key. Never put this in Cloudflare Pages or frontend variables.

`EMAIL_FROM` is the sender clients will see. In Render's variable value field, enter `Velura Services <bookings@veluraservices.com>` without extra quote marks.

`CONTACT_TO` is the internal Velura inbox for contact forms and manager booking alerts.

## Local Or Alternative SMTP

SMTP remains supported for local testing or hosts that allow outbound SMTP:

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_REQUIRE_TLS=true
SMTP_USER=your-login
SMTP_PASS=your-password
SMTP_FROM=Velura Services <bookings@veluraservices.com>
CONTACT_TO=bookings@veluraservices.com
```

If both Resend and SMTP are configured, Velura uses Resend first.
