import dotenv from "dotenv";

dotenv.config();

function normalizeEmailFrom(value) {
  const sender = (value || "Velura Services <bookings@veluraservices.com>").trim();

  return sender.replace(/^"?Velura"?\s*</i, "Velura Services <");
}

function cleanOptionalEnv(value) {
  return value ? value.trim() : value;
}

const requiredInProduction = ["MONGO_URI", "JWT_SECRET"];

if (process.env.NODE_ENV === "production") {
  const missing = requiredInProduction.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

function getClientUrls() {
  const configured = process.env.CLIENT_URLS || process.env.CLIENT_URL;
  const fallback = process.env.NODE_ENV === "production" ? "http://localhost:5173" : "http://localhost:5173,http://localhost:5174,http://localhost:5175";

  const urls = (configured || fallback)
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV !== "production") {
    for (const localUrl of ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"]) {
      if (!urls.includes(localUrl)) {
        urls.push(localUrl);
      }
    }
  }

  return urls;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5001),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  clientUrls: getClientUrls(),
  databaseDriver: process.env.DATABASE_DRIVER || "mongodb",
  databaseFallbackToFile: process.env.DATABASE_FALLBACK_TO_FILE !== "false",
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/velura_crm",
  jwtSecret: process.env.JWT_SECRET || "dev-only-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  adminEmails: (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    requireTls: process.env.SMTP_REQUIRE_TLS !== "false",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: normalizeEmailFrom(process.env.EMAIL_FROM || process.env.SMTP_FROM),
    contactTo: process.env.CONTACT_TO || process.env.SMTP_USER || "bookings@veluraservices.com"
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER
  },
  google: {
    placesApiKey: cleanOptionalEnv(process.env.GOOGLE_PLACES_API_KEY),
    placeId: cleanOptionalEnv(process.env.GOOGLE_PLACE_ID),
    reviewsCacheTtlMinutes: Number(process.env.GOOGLE_REVIEWS_CACHE_TTL_MINUTES || 720),
    businessProfile: {
      clientId: cleanOptionalEnv(process.env.GOOGLE_BUSINESS_CLIENT_ID),
      clientSecret: cleanOptionalEnv(process.env.GOOGLE_BUSINESS_CLIENT_SECRET),
      redirectUri: cleanOptionalEnv(process.env.GOOGLE_BUSINESS_REDIRECT_URI),
      tokenSecret: cleanOptionalEnv(process.env.GOOGLE_BUSINESS_TOKEN_SECRET)
    }
  },
  auditLogRetentionDays: Number(process.env.AUDIT_LOG_RETENTION_DAYS || 2190)
};
