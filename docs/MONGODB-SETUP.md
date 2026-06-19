# MongoDB Atlas Setup For Velura

Velura should use MongoDB Atlas as the permanent database. Cloudflare Pages only hosts the frontend, so the Express backend must run on a Node host such as Render, Railway, Fly.io, or AWS.

## How Velura Stores Data

MongoDB stores data in **collections**. Think of collections like spreadsheet tabs or database tables. Each record inside a collection is a document.

Velura uses these collections:

```text
users        Account logins, manager/user roles, hashed passwords
leads        Contact form inquiries and customer enquiry details
quoteRequests Quote review records linked to submitted instant quotes
bookings     Calendar jobs, client details, address, access notes, parking notes, assigned cleaners, status, communication log
invoices     Invoice numbers, booking snapshots, line items, VAT totals, PDF download data, payment status
employees    Cleaner/team profiles, skills, availability notes
reviews      Cached Google reviews
auditevents  Manager actions and operational audit history
```

Passwords are never stored as real passwords. The backend stores bcrypt password hashes.

## Create The Atlas Database

1. Go to MongoDB Atlas and create/open your account.
2. Create a project called `Velura`.
3. Create a free cluster for first launch.
4. Pick a UK/EU region if available.
5. Create a database user.

Recommended values:

```text
Database username: velura_app
Database password: generate a strong password
Database name: velura_crm
```

Use a password manager for the database password. Do not commit it to GitHub.

## Network Access

Atlas requires trusted IP addresses before anything can connect.

For local testing:

```text
Network Access > Add IP Address > Add Current IP Address
```

For a free backend host without a stable outbound IP, the beginner-friendly first-launch option is:

```text
0.0.0.0/0
```

That allows the backend to connect from anywhere. This is convenient, but less locked down. Keep the database password strong, keep the app user limited, and tighten network access later if your host gives you static outbound IPs.

## Get The Connection String

In Atlas:

```text
Database > Connect > Drivers > Node.js
```

Copy the `mongodb+srv://...` connection string and insert the database name after the host:

```env
MONGO_URI=mongodb+srv://velura_app:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/velura_crm?retryWrites=true&w=majority
```

If your password contains symbols like `@`, `/`, `?`, `#`, or `:`, URL-encode the password or generate a simpler strong password without those characters.

## Local Backend Setup

Update `server/.env`:

```env
NODE_ENV=development
DATABASE_DRIVER=mongodb
DATABASE_FALLBACK_TO_FILE=false
MONGO_URI=mongodb+srv://velura_app:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/velura_crm?retryWrites=true&w=majority
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d
ADMIN_EMAILS=lr@veluraservices.com
CLIENT_URL=http://localhost:5173
AUDIT_LOG_RETENTION_DAYS=2190
```

Restart the local app:

```bash
npm run dev
```

The backend should print something like:

```text
MongoDB connected: velura_crm
```

## Seed The First Manager Account

Once MongoDB is connected, create/update the manager account in MongoDB:

```bash
ADMIN_SEED_EMAIL=lr@veluraservices.com ADMIN_SEED_NAME="Leonard Rexha" ADMIN_SEED_PASSWORD="change-this-temporary-password" npm run seed:admin --workspace server
```

Then log in and immediately change the password inside:

```text
Dashboard > Accounts > Change my password
```

## Migrate Local Test Data Into MongoDB

If you have been using the local file database and want to copy that data into Atlas, first make sure `server/.env` points to MongoDB and has:

```env
DATABASE_DRIVER=mongodb
DATABASE_FALLBACK_TO_FILE=false
```

Then run:

```bash
npm run migrate:file-to-mongo --workspace server
```

This imports local `server/data/dev-db.json` records into MongoDB collections.

## Production Backend Environment

On your backend host, set:

```env
NODE_ENV=production
DATABASE_DRIVER=mongodb
DATABASE_FALLBACK_TO_FILE=false
MONGO_URI=mongodb+srv://velura_app:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/velura_crm?retryWrites=true&w=majority
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d
ADMIN_EMAILS=lr@veluraservices.com
CLIENT_URL=https://veluraservices.com
AUDIT_LOG_RETENTION_DAYS=2190
```

After the backend is live, set this in Cloudflare Pages:

```env
VITE_API_URL=https://your-backend-url.com/api
```

Redeploy Cloudflare Pages after changing frontend environment variables.

## Data Protection Notes

- Use account access carefully. Only managers should have dashboard access.
- Keep explicit marketing consent before using customers for marketing emails.
- Use booking/enquiry data for operational purposes.
- Keep audit logs for legitimate business records, but avoid collecting unnecessary data.
- Free Atlas clusters are fine for launch, but paid tiers offer stronger backup options.
