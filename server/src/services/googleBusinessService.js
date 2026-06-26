import crypto from "crypto";
import jwt from "jsonwebtoken";
import { useFileDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import GoogleBusinessConnection from "../models/GoogleBusinessConnection.js";
import { cacheReviewRecords, readCachedReviews } from "./reviewService.js";

const PROVIDER = "google_business_profile";
const BUSINESS_SCOPE = "https://www.googleapis.com/auth/business.manage";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ACCOUNT_URL = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts";
const BUSINESS_INFO_URL = "https://mybusinessbusinessinformation.googleapis.com/v1";
const REVIEWS_URL = "https://mybusiness.googleapis.com/v4";

const starRatings = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5
};

function createGoogleBusinessError(message, statusCode = 500, googleStatusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.googleStatusCode = googleStatusCode;
  return error;
}

function getOauthCredentials() {
  return env.google.businessProfile;
}

function getEncryptionKey() {
  return crypto.createHash("sha256").update(env.google.businessProfile.tokenSecret || env.jwtSecret).digest();
}

function encryptSecret(value) {
  if (!value) {
    return "";
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

function decryptSecret(value) {
  if (!value) {
    return "";
  }

  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function safeReturnTo(returnTo) {
  const fallback = `${env.clientUrl}/dashboard?tab=reviews`;

  try {
    const parsed = new URL(returnTo || fallback);
    const allowed = env.clientUrls.some((clientUrl) => parsed.origin === new URL(clientUrl).origin);
    return allowed ? parsed.toString() : fallback;
  } catch {
    return fallback;
  }
}

function appendQuery(url, params) {
  const parsed = new URL(url);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      parsed.searchParams.set(key, value);
    }
  }

  return parsed.toString();
}

function getRedirectUri(req) {
  if (env.google.businessProfile.redirectUri) {
    return env.google.businessProfile.redirectUri;
  }

  return `${req.protocol}://${req.get("host")}/api/reviews/business/callback`;
}

function signState(returnTo) {
  return jwt.sign(
    {
      purpose: "google-business-profile-oauth",
      returnTo: safeReturnTo(returnTo)
    },
    env.jwtSecret,
    { expiresIn: "15m" }
  );
}

function verifyState(state) {
  const payload = jwt.verify(state, env.jwtSecret);

  if (payload.purpose !== "google-business-profile-oauth") {
    throw createGoogleBusinessError("Invalid Google connection state.", 400);
  }

  return {
    returnTo: safeReturnTo(payload.returnTo)
  };
}

async function googleJson(url, accessToken, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw createGoogleBusinessError(
      payload.error?.message || payload.error_description || `Google Business Profile request failed with status ${response.status}.`,
      502,
      response.status
    );
  }

  return payload;
}

async function postGoogleToken(body) {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams(body)
  });

  const payload = await response.json();

  if (!response.ok) {
    throw createGoogleBusinessError(
      payload.error_description || payload.error || "Google OAuth token request failed.",
      502,
      response.status
    );
  }

  return payload;
}

function normalizeLocationName(accountName, locationName) {
  if (!accountName || !locationName) {
    return "";
  }

  if (locationName.startsWith(`${accountName}/locations/`)) {
    return locationName;
  }

  if (locationName.startsWith("locations/")) {
    return `${accountName}/${locationName}`;
  }

  return `${accountName}/locations/${locationName}`;
}

function ratingToNumber(value) {
  if (typeof value === "number") {
    return value;
  }

  return starRatings[value] || undefined;
}

function mapBusinessReview(review, connection, fallbackIndex) {
  const placeId = connection.placeId || env.google.placeId || connection.locationName;
  const publishTime = review.createTime ? new Date(review.createTime) : undefined;

  return {
    placeId,
    googleReviewName: review.name || `${connection.locationName}/reviews/${review.reviewId || fallbackIndex}`,
    authorName: review.reviewer?.displayName || "Google user",
    profilePhotoUrl: review.reviewer?.profilePhotoUrl,
    rating: ratingToNumber(review.starRating),
    comment: review.comment || "",
    relativePublishTimeDescription: "Google Business Profile review",
    publishTime,
    googleMapsUri: review.name,
    averageRating: connection.averageRating,
    userRatingCount: connection.totalReviewCount,
    fetchedAt: new Date()
  };
}

function publicConnection(connection) {
  if (!connection) {
    return null;
  }

  return {
    connected: true,
    accountName: connection.accountName,
    accountDisplayName: connection.accountDisplayName,
    locationName: connection.locationName,
    locationTitle: connection.locationTitle,
    placeId: connection.placeId,
    averageRating: connection.averageRating,
    totalReviewCount: connection.totalReviewCount,
    lastSyncedAt: connection.lastSyncedAt,
    lastSyncError: connection.lastSyncError,
    connectedAt: connection.connectedAt
  };
}

async function findConnection() {
  if (useFileDatabase()) {
    return null;
  }

  return GoogleBusinessConnection.findOne({ provider: PROVIDER });
}

async function saveTokenPayload(tokenPayload, existingConnection, metadata = {}) {
  const refreshToken = tokenPayload.refresh_token || (existingConnection ? decryptSecret(existingConnection.refreshToken) : "");

  if (!refreshToken) {
    throw createGoogleBusinessError("Google did not return a refresh token. Reconnect and allow offline access.", 400);
  }

  const expiresAt = tokenPayload.expires_in ? new Date(Date.now() + tokenPayload.expires_in * 1000) : existingConnection?.expiresAt;

  return GoogleBusinessConnection.findOneAndUpdate(
    { provider: PROVIDER },
    {
      provider: PROVIDER,
      accessToken: encryptSecret(tokenPayload.access_token),
      refreshToken: encryptSecret(refreshToken),
      tokenType: tokenPayload.token_type || existingConnection?.tokenType,
      scope: tokenPayload.scope || existingConnection?.scope,
      expiresAt,
      ...metadata
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function getAccessToken(connection) {
  if (!connection) {
    throw createGoogleBusinessError("Google Business Profile is not connected.", 400);
  }

  if (connection.accessToken && connection.expiresAt && new Date(connection.expiresAt).getTime() > Date.now() + 120000) {
    return decryptSecret(connection.accessToken);
  }

  const credentials = getOauthCredentials();

  if (!credentials.clientId || !credentials.clientSecret) {
    throw createGoogleBusinessError("Google Business Profile OAuth credentials are not configured.", 400);
  }

  const tokenPayload = await postGoogleToken({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: decryptSecret(connection.refreshToken),
    grant_type: "refresh_token"
  });

  const updated = await saveTokenPayload(tokenPayload, connection);
  return decryptSecret(updated.accessToken);
}

async function discoverLocation(accessToken) {
  const accountsPayload = await googleJson(ACCOUNT_URL, accessToken);
  const accounts = accountsPayload.accounts || [];

  if (accounts.length === 0) {
    throw createGoogleBusinessError("No Google Business Profile accounts were found for this Google login.", 400);
  }

  for (const account of accounts) {
    const url = new URL(`${BUSINESS_INFO_URL}/${account.name}/locations`);
    url.searchParams.set("readMask", "name,title,metadata");
    url.searchParams.set("pageSize", "100");

    const locationsPayload = await googleJson(url, accessToken);
    const locations = locationsPayload.locations || [];
    const preferred =
      locations.find((location) => env.google.placeId && location.metadata?.placeId === env.google.placeId) ||
      locations.find((location) => /velura/i.test(location.title || "")) ||
      locations[0];

    if (preferred) {
      return {
        accountName: account.name,
        accountDisplayName: account.accountName || account.name,
        locationName: normalizeLocationName(account.name, preferred.name),
        locationTitle: preferred.title || "Google Business Profile location",
        placeId: preferred.metadata?.placeId || env.google.placeId
      };
    }
  }

  throw createGoogleBusinessError("No Google Business Profile locations were found for this Google login.", 400);
}

export function isGoogleBusinessConfigured() {
  const credentials = getOauthCredentials();
  return Boolean(credentials.clientId && credentials.clientSecret);
}

export function createGoogleBusinessAuthUrl(req, returnTo) {
  const credentials = getOauthCredentials();

  if (!isGoogleBusinessConfigured()) {
    throw createGoogleBusinessError("Add Google Business Profile OAuth credentials in Render first.", 400);
  }

  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", credentials.clientId);
  url.searchParams.set("redirect_uri", getRedirectUri(req));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", BUSINESS_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", signState(returnTo));

  return url.toString();
}

export async function getGoogleBusinessStatus() {
  const connection = await findConnection();

  return {
    configured: isGoogleBusinessConfigured(),
    connected: Boolean(connection),
    connection: publicConnection(connection)
  };
}

export async function handleGoogleBusinessCallback(req) {
  const { code, error, state } = req.query;

  if (error) {
    const { returnTo } = state ? verifyState(state) : { returnTo: `${env.clientUrl}/dashboard?tab=reviews` };
    return appendQuery(returnTo, { googleReviews: "error", reason: error });
  }

  if (!code || !state) {
    throw createGoogleBusinessError("Google did not return the information needed to connect the profile.", 400);
  }

  const { returnTo } = verifyState(state);
  const credentials = getOauthCredentials();
  const existingConnection = await findConnection();
  const tokenPayload = await postGoogleToken({
    code,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    redirect_uri: getRedirectUri(req),
    grant_type: "authorization_code"
  });

  let connection = await saveTokenPayload(tokenPayload, existingConnection, {
    connectedAt: existingConnection?.connectedAt || new Date()
  });

  const accessToken = decryptSecret(connection.accessToken);
  const location = await discoverLocation(accessToken);

  connection = await GoogleBusinessConnection.findOneAndUpdate(
    { provider: PROVIDER },
    {
      ...location,
      lastSyncError: ""
    },
    { new: true }
  );

  try {
    await syncGoogleBusinessReviews();
  } catch (syncError) {
    console.warn("Google Business Profile connected, but initial review sync failed", {
      locationName: connection.locationName,
      message: syncError.message,
      googleStatusCode: syncError.googleStatusCode
    });
  }

  return appendQuery(returnTo, { tab: "reviews", googleReviews: "connected" });
}

export async function syncGoogleBusinessReviews() {
  if (useFileDatabase()) {
    throw createGoogleBusinessError("Google Business Profile sync requires MongoDB storage.", 400);
  }

  const connection = await findConnection();

  if (!connection) {
    return null;
  }

  try {
    const accessToken = await getAccessToken(connection);
    const url = new URL(`${REVIEWS_URL}/${connection.locationName}/reviews`);
    url.searchParams.set("pageSize", "50");
    url.searchParams.set("orderBy", "updateTime desc");

    const payload = await googleJson(url, accessToken);
    const updatedConnection = await GoogleBusinessConnection.findOneAndUpdate(
      { provider: PROVIDER },
      {
        averageRating: payload.averageRating,
        totalReviewCount: payload.totalReviewCount,
        lastSyncedAt: new Date(),
        lastSyncError: ""
      },
      { new: true }
    );
    const records = (payload.reviews || [])
      .map((review, index) => mapBusinessReview(review, updatedConnection, index))
      .filter((review) => review.rating);

    await cacheReviewRecords(records);

    const cached = await readCachedReviews(updatedConnection.placeId || env.google.placeId || updatedConnection.locationName);

    return {
      ...cached,
      meta: {
        ...cached.meta,
        source: "google-business-profile",
        placeName: updatedConnection.locationTitle,
        averageRating: updatedConnection.averageRating,
        userRatingCount: updatedConnection.totalReviewCount,
        fetchedAt: updatedConnection.lastSyncedAt,
        businessProfile: publicConnection(updatedConnection)
      }
    };
  } catch (error) {
    await GoogleBusinessConnection.findOneAndUpdate(
      { provider: PROVIDER },
      {
        lastSyncError: error.message
      }
    );

    throw error;
  }
}

export async function disconnectGoogleBusiness() {
  if (useFileDatabase()) {
    return null;
  }

  return GoogleBusinessConnection.findOneAndDelete({ provider: PROVIDER });
}
