# Velura Data Protection Notes

This is an implementation note, not legal advice. Before launch, Velura should review this with a UK data protection adviser if the business will process meaningful customer data at scale.

## Live Database

Local development can use `server/data/dev-db.json`, but production should use MongoDB Atlas:

```bash
DATABASE_DRIVER=mongodb
DATABASE_FALLBACK_TO_FILE=false
MONGO_URI=<your MongoDB Atlas connection string>
AUDIT_LOG_RETENTION_DAYS=2190
```

Use a dedicated database user with the minimum permissions the API needs. Keep the connection string in the hosting provider's environment variables, not in Git.

## Backups And Recovery

Recommended production settings:

- Enable Atlas Cloud Backups.
- Use daily snapshots at minimum.
- Enable point-in-time restore if budget allows.
- Keep monthly snapshots for longer audit/dispute needs.
- Test restoring a backup before relying on it.

## Audit Trail

The app now records `AuditEvent` records for:

- new inquiries from the contact form;
- inquiry status changes;
- booking creation;
- booking status changes and client communication results;
- message read/unread changes;
- manager account creation;
- manager account role/status changes.

Audit events include the action, timestamp, manager identity where available, resource type, resource ID, IP address, user agent, and a short before/after summary where useful. Sensitive fields such as passwords and tokens are redacted.

Managers can view recent audit events in the Dashboard Audit tab.

## Retention

Suggested starting retention schedule:

- Open inquiries: review after 12 months of inactivity.
- Closed inquiries and quote requests: retain for 24 months unless needed for contract, accounting, insurance, or dispute reasons.
- Booking records: retain only as long as needed for service delivery, accounting, complaints, insurance, or dispute handling.
- Accounts: retain while active, then disable or remove when access is no longer needed.
- Audit logs: retain for up to 6 years (`2190` days) unless a shorter period is more appropriate.
- Backups: match the backup policy to the same business/legal need, then delete expired backups.

Do not keep personal data forever just because the database can. UK GDPR expects personal data to be kept no longer than necessary for the purpose.

## Operational Controls

- Keep public signup disabled.
- Create accounts only inside the private manager dashboard.
- Remove manager access immediately when a person no longer needs it.
- Use strong manager passwords.
- Keep Google, email provider, Twilio, database, and JWT secrets in environment variables.
- Add a published privacy notice before launch.
- Keep a record of processing activities and review it when the website workflow changes.
