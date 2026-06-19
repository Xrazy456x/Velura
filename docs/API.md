# API Reference

Base URL in development: `http://localhost:5001/api`

Protected manager routes require:

```http
Authorization: Bearer <jwt>
```

## Health

`GET /health`

Returns API status and timestamp.

## Auth

`POST /auth/signup`

Backend bootstrap endpoint. It is not linked from the public site; accounts should normally be created from `POST /users` inside the manager dashboard.

```json
{
  "name": "Jane Manager",
  "email": "jane@example.com",
  "password": "password123"
}
```

`POST /auth/login`

```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

`GET /auth/me`

Returns the authenticated user.

`PATCH /auth/password`

Signed-in account password change. Requires the current password.

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-temporary-password"
}
```

## Users

Manager only.

`GET /users`

Returns all manager/team accounts.

`POST /users`

Manager only. Creates a new portal account. Use `role: "admin"` only for managers who need dashboard access.

```json
{
  "name": "Velura Client",
  "email": "client@example.com",
  "password": "temporary-password",
  "role": "user"
}
```

`PATCH /users/:id`

```json
{
  "role": "admin",
  "status": "active"
}
```

`PATCH /users/:id/password`

Manager only. Resets any account password, including the signed-in manager account.

```json
{
  "password": "new-temporary-password"
}
```

`DELETE /users/:id`

Manager only. Deletes another manager account. The signed-in manager cannot delete their own account.

## Leads

`POST /leads`

Public contact form endpoint. Creates both a lead and a message.

```json
{
  "name": "Alex Customer",
  "email": "alex@example.com",
  "phone": "+1 555 123 4567",
  "company": "Kensington townhouse",
  "service": "Signature Home Cleaning",
  "message": "I would like a regular luxury cleaning visit for a three-bedroom home."
}
```

`GET /leads`

Manager only. Returns all inquiries.

`PATCH /leads/:id/status`

Manager only.

```json
{
  "status": "contacted"
}
```

Allowed statuses: `new`, `contacted`, `closed`.

## Quotes

`POST /quote/calculate`

Public instant quote endpoint. It returns only the calculated estimate for the options provided, not the full internal price list.

```json
{
  "serviceType": "eot",
  "propertyType": "flat",
  "bedrooms": 2,
  "bathrooms": 2,
  "condition": "good",
  "urgency": "standard",
  "frequency": "one_off",
  "addOns": ["oven_deep"],
  "carpetRooms": 1,
  "linenSets": 1,
  "addOnAreas": 1
}
```

Allowed service types: `eot`, `deep_clean`, `regular`, `turnover`, `office`, `commercial`, `emergency`, `student`.

Allowed property types: `studio`, `flat`, `house`, `office`.

`GET /quote/pricing`

Manager only. Returns Velura's full internal pricing matrix, add-ons, multipliers, and inspection rules for the dashboard Pricing tab.

## Bookings

Manager only.

`GET /bookings`

Returns active bookings. Recently deleted bookings are excluded from the calendar.

`GET /bookings/deleted`

Returns recently deleted bookings for the manager recovery section.

`POST /bookings`

Creates a booking. `leadId` is optional, so managers can create a booking from an inquiry or manually.

```json
{
  "leadId": "optional-lead-id",
  "clientName": "Alex Customer",
  "email": "alex@example.com",
  "phone": "+447000000000",
  "service": "Signature Home Cleaning",
  "address": "12 Example Street, London",
  "scheduledFor": "2026-06-20T10:00",
  "durationMinutes": 120,
  "communicationPreference": "email",
  "assignedEmployeeIds": ["cleaner-id"],
  "accessInstructions": "Use side entrance.",
  "parkingNotes": "Permit bay outside.",
  "notes": "Client prefers eco products.",
  "sendConfirmation": true
}
```

The API generates `bookingNumber` automatically, for example `VEL-2026-0001`. Managers do not enter this manually.

Allowed communication preferences: `email`, `sms`, `phone`.

Email uses Resend when `RESEND_API_KEY` is configured, with SMTP as a fallback. SMS uses Twilio settings. Phone-call follow-up is logged for manual action.

`PATCH /bookings/:id/status`

Updates booking status and attempts a client update when `sendClientUpdate` is true.

```json
{
  "status": "completed",
  "sendClientUpdate": true
}
```

Allowed statuses: `scheduled`, `confirmed`, `completed`, `cancelled`.

`PATCH /bookings/:id`

Manager only. Edits an existing booking after creation.

```json
{
  "leadId": "",
  "clientName": "Alex Customer",
  "email": "alex@example.com",
  "phone": "+447000000000",
  "service": "Signature Home Cleaning",
  "address": "12 Example Street, London",
  "scheduledFor": "2026-06-20T10:00",
  "durationMinutes": 120,
  "communicationPreference": "phone",
  "assignedEmployeeIds": ["cleaner-id"],
  "accessInstructions": "Use side entrance.",
  "parkingNotes": "Permit bay outside.",
  "notes": "Updated notes."
}
```

`DELETE /bookings/:id`

Manager only. Moves a booking to Recently deleted and records the action in the audit log.

`POST /bookings/:id/restore`

Manager only. Restores a recently deleted booking to the active booking calendar.

## Employees

Manager only.

`GET /employees`

Returns all cleaner profiles.

`POST /employees`

```json
{
  "name": "Sam Cleaner",
  "email": "sam@example.com",
  "phone": "+447000000000",
  "role": "Cleaner",
  "status": "active",
  "skills": ["Deep clean", "Commercial"],
  "availabilityNotes": "Monday to Thursday, prefers commercial jobs."
}
```

`PATCH /employees/:id`

Updates a cleaner profile.

`DELETE /employees/:id`

Deletes a cleaner profile and removes them from assigned jobs.

`POST /bookings/:id/email-confirmation`

Manager only. Sends or attempts a client email confirmation and records the result on the booking communication log.

`POST /bookings/:id/phone-confirmation`

Manager only. Records that a manager completed phone confirmation and marks the booking as `confirmed`.

```json
{
  "detail": "Phone confirmation completed by manager."
}
```

## Messages

Manager only.

`GET /messages`

Returns all client inquiry messages.

`PATCH /messages/:id`

```json
{
  "isRead": true
}
```

## Reviews

`GET /reviews`

Returns cached reviews. If Google credentials are configured and the cache is stale, the API refreshes from Google Places.

`POST /reviews/refresh`

Manager only. Forces a Google Places refresh.
