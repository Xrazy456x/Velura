# Free Deployment Plan: Cloudflare + GitHub + MongoDB Atlas

This project has two deployable parts:

- `client`: React/Vite frontend, hosted on Cloudflare Pages.
- `server`: Node/Express API, hosted on a Node web service such as Render Free.

Cloudflare Pages hosts the website for free, but it does not run this Express/MongoDB API as-is. Keep the frontend on Cloudflare and the backend on a free Node host.

## 1. Push To GitHub

Create a new GitHub repository, then push this project.

```bash
git add .
git commit -m "Prepare Velura for deployment"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/velura.git
git push -u origin main
```

Do not commit `.env` files. They are ignored by `.gitignore`.

## 2. Create MongoDB Atlas Free Cluster

1. Create a free Atlas cluster.
2. Create a database user.
3. Network access:
   - For easiest first deploy, use `0.0.0.0/0`.
   - Tighten this later if your backend host provides stable outbound IPs.
4. Copy the connection string and replace the password.

Example:

```env
MONGO_URI=mongodb+srv://velura-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/velura_crm?retryWrites=true&w=majority
```

## 3. Deploy Backend On Render Free

Create a new Render Web Service from the GitHub repo.

Settings:

```text
Runtime: Node
Root Directory: leave blank
Build Command: npm install
Start Command: npm run start --workspace server
Instance Type: Free
Health Check Path: /api/health
```

Environment variables:

```env
NODE_ENV=production
DATABASE_DRIVER=mongodb
DATABASE_FALLBACK_TO_FILE=false
MONGO_URI=your-mongodb-atlas-uri
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d
ADMIN_EMAILS=lr@veluraservices.com
CLIENT_URL=https://your-cloudflare-pages-url.pages.dev
AUDIT_LOG_RETENTION_DAYS=2190
```

Leave email variables empty for the first live deploy. Render Free blocks outbound SMTP ports, so Google SMTP Relay will not work there on the free tier. We can add email later using an HTTP-based provider or a paid/backend host that allows SMTP.

After deploy, test:

```text
https://your-render-service.onrender.com/api/health
```

Create the first manager account from Render's Shell or a one-off local command pointed at the production `MONGO_URI`:

```bash
ADMIN_SEED_EMAIL=lr@veluraservices.com ADMIN_SEED_NAME="Leonard Rexha" ADMIN_SEED_PASSWORD="change-this-temporary-password" npm run seed:admin --workspace server
```

Sign in with that password, then change it inside `Dashboard > Managers > Change my password`.

## 4. Deploy Frontend On Cloudflare Pages

In Cloudflare:

1. Go to Workers & Pages.
2. Create application.
3. Pages.
4. Connect to Git.
5. Pick the GitHub repo.

Build settings:

```text
Framework preset: Vite
Root directory: client
Build command: npm run build
Build output directory: dist
```

Environment variable:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

Deploy. Cloudflare will give you a URL like:

```text
https://velura.pages.dev
```

## 5. Update Backend CORS

After Cloudflare deploys, copy the Cloudflare Pages URL and update the Render backend environment variable:

```env
CLIENT_URL=https://your-cloudflare-pages-url.pages.dev
```

Redeploy/restart the Render backend.

## 6. Add Custom Domain Later

When the basic site works:

1. Add `veluraservices.com` or `www.veluraservices.com` to Cloudflare Pages.
2. Update Render:

```env
CLIENT_URL=https://veluraservices.com
```

3. Update Cloudflare Pages:

```env
VITE_API_URL=https://your-render-service.onrender.com/api
```

## 7. Email Later

Current Google SMTP Relay config is useful for local testing or hosts that allow SMTP.

For the free Render backend, use one of these later:

- Resend API
- SendGrid API
- Mailgun API
- Postmark API

These use HTTPS instead of SMTP ports, so they work more reliably on free hosts.
