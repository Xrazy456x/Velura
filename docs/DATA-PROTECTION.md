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

## Recommended Data Workflow

Velura should use a four-part model:

1. **Current records in MongoDB**: the live quote, booking, invoice, cleaner, account, and client status.
2. **Audit history**: important business actions such as create, update, delete, restore, ownership, and status changes.
3. **Communication logs**: email, phone, SMS, and cleaner brief actions attached to the relevant quote or booking.
4. **Backups and retention**: Atlas backups plus a review process so personal data is not kept forever.

The portal should not try to duplicate every full email thread. Google Workspace remains the source of truth for the full email conversation; Velura stores the business action, timestamp, manager, client, and related reference number.

## Audit Trail

The app now records `AuditEvent` records for:

- new inquiries from the contact form;
- inquiry status changes;
- booking creation;
- booking status changes and client communication results;
- booking delete and restore actions;
- quote review status changes;
- manager ownership changes for quotes and bookings;
- photo request emails;
- cleaner job brief emails;
- manager account creation;
- manager account role/status changes.

Audit events include the action, timestamp, manager identity where available, resource type, resource ID, IP address, user agent, and a short before/after summary where useful. Sensitive fields such as passwords and tokens are redacted.

Managers can view recent audit events in the Dashboard Audit tab. The Dashboard Governance tab shows the current retention policy, record counts, and operational controls.

## Communication Ownership

To avoid two managers emailing the same client at the same time:

- Quotes and bookings have an assigned manager.
- A manager can take or release ownership from the portal.
- Client email actions are blocked if another manager owns the client thread.
- The system records the manager, date/time, and type of client contact.
- Full email replies stay in Google Workspace, but the portal records that the communication happened.

## Retention

Suggested starting retention schedule:

- Active client records: keep while the quote or booking is active.
- Unused quote requests: review after 12-18 months, then delete or anonymise if there is no ongoing client relationship, dispute, or accounting reason.
- Completed bookings and invoices: keep for up to 6 years for accounting, complaints, insurance, and dispute handling.
- Accounts: retain while active, then disable or remove when access is no longer needed.
- Employee/cleaner records: keep while active, then review when the person leaves.
- Marketing lists: keep only people who clearly opted in to marketing.
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
