# Deployment Guide

This project is split into a static frontend and a Node API. The free-first production path is Cloudflare Pages for the frontend, Render Free for the backend, and MongoDB Atlas for the database. See `docs/FREE-CLOUDFLARE-GITHUB-DEPLOYMENT.md` for the step-by-step checklist.

## Option A: Cloudflare Pages + Render + MongoDB Atlas

### 1. MongoDB Atlas

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Add your backend host IP allowlist, or use `0.0.0.0/0` only if you understand the risk.
4. Copy the connection string into `MONGO_URI`.

### 2. Backend on Render

1. Create a new Render Blueprint from the GitHub repository.
2. Use `render.yaml` from the repository root.
3. The Blueprint creates a free Node web service called `velura-services-api`.
4. If creating the service manually instead, use build command:

```bash
npm install
```

5. Start command:

```bash
npm run start --workspace server
```

6. Add the secret environment variables:

```env
MONGO_URI=your-mongodb-atlas-uri
CLIENT_URL=https://your-cloudflare-or-custom-domain
```

7. Deploy and verify `https://your-api.onrender.com/api/health`.

### 3. Frontend on Cloudflare Pages

1. Create a new Cloudflare Pages project from GitHub.
2. Set the root directory to `client`.
3. Build command:

```bash
npm run build
```

4. Output directory:

```bash
dist
```

5. Add:

```bash
VITE_API_URL=https://your-api.onrender.com/api
```

6. Deploy.

For single-page app routing, `client/public/_redirects` is included so direct visits to routes such as `/quote` and `/dashboard` work correctly.

## Option B: AWS

Use S3 + CloudFront for the frontend, ECS/Fargate or Elastic Beanstalk for the API, MongoDB Atlas for data, and AWS SES for transactional email.

## Option C: One Platform

Render can host both the frontend as a static site and the API as a web service. This is convenient for small teams that want one deployment dashboard.

## Production Checklist

- Use `NODE_ENV=production`.
- Use a long random `JWT_SECRET`.
- Restrict `CLIENT_URL` to the deployed frontend origin.
- Keep `GOOGLE_PLACES_API_KEY` only on the backend.
- Configure SMTP with a real provider such as SendGrid, Postmark, Resend SMTP, Mailgun, or AWS SES.
- Configure Twilio environment variables if managers will send booking confirmations by text.
- Enable database backups.
- Add tests for auth, inquiry creation, booking creation, dashboard permissions, and status updates.
- Add logging/monitoring such as Render logs, Sentry, Logtail, or OpenTelemetry.
