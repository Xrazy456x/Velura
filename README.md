# Velura Full-Stack Cleaning Website

A modern production-minded starter for Velura, a luxury cleaning company with a React/Tailwind frontend, Express REST API, JWT manager access, MongoDB schemas, inquiry and booking management, client email/SMS communication hooks, contact email delivery, and cached Google Reviews.

## Folder Structure

```text
velura-cleaning-website/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/              # Axios client and API error helpers
│   │   ├── auth/             # Auth context, token storage, profile bootstrapping
│   │   ├── components/       # Layout, nav, review cards, dashboard UI pieces
│   │   ├── config/           # Site content, service cards, nav, font-friendly config
│   │   ├── pages/            # Home, About, Services, Contact, Dashboard, Auth pages
│   │   └── styles/           # Tailwind layers and global design tokens
│   ├── .env.example
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/           # Environment and MongoDB connection
│   │   ├── controllers/      # Request handlers for auth, CRM, reviews
│   │   ├── middleware/       # JWT auth, role guards, validation, errors
│   │   ├── models/           # User, Lead, QuoteRequest, Booking, Review schemas
│   │   ├── routes/           # REST route modules
│   │   ├── services/         # Email/SMS delivery and Google Places review cache
│   │   ├── utils/            # Token and async helpers
│   │   ├── app.js
│   │   └── server.js
│   └── .env.example
├── docs/
│   ├── API.md
│   ├── DATA-PROTECTION.md
│   └── DEPLOYMENT.md
├── package.json
└── README.md
```

## Stack Choice

This uses Node.js, Express, MongoDB, Mongoose, React, Vite, and Tailwind CSS because they match the requested stack and keep the project beginner-friendly. If this becomes a finance-heavy or reporting-heavy CRM, PostgreSQL with Prisma would be a strong next step because relational data and analytics queries become easier to maintain.

## Features

- Public coming-soon landing page with the full Velura site protected behind `/portal`
- Responsive private portal pages: Home, About, Services, Quote, Contact, Dashboard
- Tailwind CSS design system with easy Google Font customization
- Smooth page and card animations with Framer Motion
- JWT authentication with bcrypt password hashing
- Private manager dashboard for account creation, inquiries, quote reviews, bookings, pricing, employees, and audit activity
- Password changes for signed-in accounts and manager-controlled password resets
- Manager-only booking system linked to inquiries, with email/SMS confirmation hooks
- Contact form that stores cleaning inquiries and optionally sends email
- Google Places API review fetching with MongoDB caching
- Security basics: Helmet, CORS, rate limiting, validation, environment variables
- SEO-friendly metadata in `client/index.html`
- Loading states and error states across forms, reviews, and dashboard views

## Local Setup

1. Install Node.js 20+ and MongoDB locally, or create a MongoDB Atlas database.

2. Install dependencies from the repo root:

```bash
npm install
```

3. Create environment files:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

4. Update `server/.env`:

```bash
MONGO_URI=mongodb://127.0.0.1:27017/velura_crm
JWT_SECRET=use-a-long-random-secret-here
CLIENT_URL=http://localhost:5173
ADMIN_EMAILS=you@example.com
```

5. Optional email settings. Resend is recommended for the live Render backend because it sends over HTTPS instead of SMTP ports:

```bash
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM="Velura <bookings@veluraservices.com>"
CONTACT_TO=bookings@veluraservices.com
```

SMTP is still supported as a fallback for local testing or hosts that allow it:

```bash
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-login
SMTP_PASS=your-password
SMTP_FROM="Velura <bookings@veluraservices.com>"
```

6. Optional SMS settings for booking texts:

```bash
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_NUMBER=+447000000000
```

7. Optional Google Reviews settings:

```bash
GOOGLE_PLACES_API_KEY=your-google-places-api-key
GOOGLE_PLACE_ID=your-google-place-id
GOOGLE_REVIEWS_CACHE_TTL_MINUTES=720
```

8. Start both apps:

```bash
npm run dev
```

9. Open:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5001/api/health`

The public homepage is a coming-soon page. The full website is available after login at:

```text
http://localhost:5173/portal
```

The public site does not show account signup. Managers create portal-user or manager accounts inside the private dashboard. For local development or production bootstrapping, seed the first manager account:

```bash
ADMIN_SEED_EMAIL=lr@veluraservices.com ADMIN_SEED_NAME="Leonard Rexha" ADMIN_SEED_PASSWORD="change-this-temporary-password" npm run seed:admin --workspace server
```

Sign in with that temporary password, then change it in `Dashboard > Managers > Change my password`.

### Local database fallback

MongoDB is still the production database path, but local development is forgiving. If MongoDB is not running, the API falls back to a file database at:

```text
server/data/dev-db.json
```

This lets login, accounts, inquiries, quote requests, bookings, and the dashboard work immediately. To force this mode, set:

```bash
DATABASE_DRIVER=file
```

To reset local accounts and inquiries, stop the server and delete `server/data/dev-db.json`. The next backend bootstrap signup will become the manager account again.

## Font Customization

Update the Google Fonts link in `client/index.html`, then change this variable in `client/src/styles/index.css`:

```css
:root {
  --font-primary: "Inter";
}
```

Tailwind reads that variable through `client/tailwind.config.js`.

## Google Reviews

The backend uses Google Places API Place Details (New):

- Endpoint: `https://places.googleapis.com/v1/places/{PLACE_ID}`
- Field mask: `id,displayName,rating,userRatingCount,reviews`
- Cache: reviews are stored in MongoDB and refreshed after `GOOGLE_REVIEWS_CACHE_TTL_MINUTES`

Useful official docs:

- [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details)
- [Place data fields (New)](https://developers.google.com/maps/documentation/places/web-service/data-fields)

## Key Commands

```bash
npm run dev          # Run frontend and backend together
npm run build        # Build frontend for production
npm run check        # Build frontend and syntax-check backend files
npm run start        # Start backend in production mode
```

## Production Notes

- Use a long random `JWT_SECRET`.
- Restrict CORS with the deployed frontend URL.
- Use MongoDB Atlas or a managed MongoDB provider.
- Configure Resend for transactional email, or SMTP on a host that allows outbound SMTP.
- Keep Google API keys server-side only.
- Add centralized logging and monitoring before high-traffic use.
- Add automated tests before shipping business-critical workflows.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for hosting steps.
See [docs/DATA-PROTECTION.md](docs/DATA-PROTECTION.md) for audit, retention, and backup notes.
