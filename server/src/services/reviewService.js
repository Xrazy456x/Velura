import { useFileDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import Review from "../models/Review.js";
import * as fileStore from "./fileStore.js";

const FIELD_MASK = "id,displayName,rating,userRatingCount,reviews";
const PROFILE_FIELD_MASK = "id,displayName,rating,userRatingCount,googleMapsUri";
const LEGACY_FIELDS = "name,rating,user_ratings_total,reviews,url";

function getGoogleConfigDiagnostics() {
  const key = env.google.placesApiKey || "";

  return {
    placeId: env.google.placeId || null,
    placeIdLength: env.google.placeId?.length || 0,
    apiKeyPresent: Boolean(key),
    apiKeyLength: key.length,
    apiKeyPrefix: key ? key.slice(0, 6) : null,
    apiKeySuffix: key ? key.slice(-4) : null,
    apiKeyContainsWhitespace: /\s/.test(key),
    cacheTtlMinutes: env.google.reviewsCacheTtlMinutes
  };
}

function getCacheCutoff() {
  return new Date(Date.now() - env.google.reviewsCacheTtlMinutes * 60 * 1000);
}

function toPublicReview(review) {
  return {
    _id: review._id,
    authorName: review.authorName,
    profilePhotoUrl: review.profilePhotoUrl,
    rating: review.rating,
    comment: review.comment,
    relativePublishTimeDescription: review.relativePublishTimeDescription,
    publishTime: review.publishTime,
    googleMapsUri: review.googleMapsUri,
    googleReviewName: review.googleReviewName
  };
}

async function readCachedReviews(placeId = env.google.placeId) {
  if (!placeId) {
    return { reviews: [], meta: { configured: false, source: "empty" } };
  }

  const reviews = useFileDatabase()
    ? await fileStore.listReviews(placeId)
    : await Review.find({ placeId }).sort({ publishTime: -1, createdAt: -1 }).limit(5);
  const latest = reviews[0];

  return {
    reviews: reviews.map(toPublicReview),
    meta: {
      configured: Boolean(env.google.placesApiKey && env.google.placeId),
      source: "cache",
      averageRating: latest?.averageRating,
      userRatingCount: latest?.userRatingCount,
      fetchedAt: latest?.fetchedAt
    }
  };
}

function shouldRefresh(latest) {
  if (!latest) {
    return true;
  }

  return new Date(latest.fetchedAt) < getCacheCutoff();
}

async function cacheReviewRecords(records) {
  if (records.length === 0) {
    return;
  }

  if (useFileDatabase()) {
    await fileStore.upsertReviews(records);
    return;
  }

  await Promise.all(
    records.map((record) =>
      Review.findOneAndUpdate(
        {
          googleReviewName: record.googleReviewName
        },
        record,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );
}

function createGoogleError(source, response, detail) {
  const error = new Error(`${source} request failed with status ${response.status}: ${detail}`);
  error.statusCode = 502;
  error.googleStatusCode = response.status;
  return error;
}

function createGoogleApiError(source, status, detail) {
  const error = new Error(`${source} request failed with Google status ${status}: ${detail || "No detail provided."}`);
  error.statusCode = 502;
  error.googleStatusCode = status;
  return error;
}

export async function getReviews({ forceRefresh = false } = {}) {
  const { placeId, placesApiKey } = env.google;

  if (!placeId || !placesApiKey) {
    return readCachedReviews(placeId);
  }

  const latest = useFileDatabase()
    ? await fileStore.findLatestReview(placeId)
    : await Review.findOne({ placeId }).sort({ fetchedAt: -1 });

  if (!forceRefresh && !shouldRefresh(latest)) {
    return readCachedReviews(placeId);
  }

  try {
    return await fetchAndCacheReviews();
  } catch (error) {
    console.warn("Google reviews refresh failed", {
      ...getGoogleConfigDiagnostics(),
      statusCode: error.statusCode,
      googleStatusCode: error.googleStatusCode,
      message: error.message
    });

    const cached = await readCachedReviews(placeId);

    return {
      ...cached,
      meta: {
        ...cached.meta,
        source: "cache",
        refreshError: "Google reviews are temporarily unavailable.",
        refreshStatusCode: error.googleStatusCode || error.statusCode || 500
      }
    };
  }
}

export async function fetchAndCacheReviews() {
  try {
    return await fetchAndCacheReviewsFromPlacesNew();
  } catch (error) {
    console.warn("Google Places New reviews request failed, trying legacy Place Details", {
      ...getGoogleConfigDiagnostics(),
      statusCode: error.statusCode,
      googleStatusCode: error.googleStatusCode,
      message: error.message
    });

    try {
      return await fetchPlaceProfileFromPlacesNew(error);
    } catch (profileError) {
      console.warn("Google Places New profile request failed, trying legacy Place Details", {
        ...getGoogleConfigDiagnostics(),
        statusCode: profileError.statusCode,
        googleStatusCode: profileError.googleStatusCode,
        message: profileError.message
      });

      return fetchAndCacheReviewsFromLegacyPlaces();
    }
  }
}

async function fetchAndCacheReviewsFromPlacesNew() {
  const { placeId, placesApiKey } = env.google;

  if (!placeId || !placesApiKey) {
    return readCachedReviews(placeId);
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  url.searchParams.set("key", placesApiKey);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Goog-Api-Key": placesApiKey,
      "X-Goog-FieldMask": FIELD_MASK
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw createGoogleError("Google Places New", response, detail);
  }

  const place = await response.json();
  const fetchedAt = new Date();
  const reviews = place.reviews || [];
  const records = reviews.map((review, index) => ({
    placeId,
    googleReviewName: review.name || `${placeId}-${review.publishTime || index}`,
    authorName: review.authorAttribution?.displayName || "Google user",
    profilePhotoUrl: review.authorAttribution?.photoUri,
    rating: review.rating,
    comment: review.text?.text || review.originalText?.text || "",
    relativePublishTimeDescription: review.relativePublishTimeDescription,
    publishTime: review.publishTime ? new Date(review.publishTime) : undefined,
    googleMapsUri: review.googleMapsUri,
    averageRating: place.rating,
    userRatingCount: place.userRatingCount,
    fetchedAt
  }));

  await cacheReviewRecords(records);

  const cached = await readCachedReviews(placeId);
  return {
    ...cached,
    meta: {
      ...cached.meta,
      source: "google",
      placeName: place.displayName?.text,
      averageRating: place.rating,
      userRatingCount: place.userRatingCount,
      fetchedAt
    }
  };
}

async function fetchPlaceProfileFromPlacesNew(originalError) {
  const { placeId, placesApiKey } = env.google;

  if (!placeId || !placesApiKey) {
    return readCachedReviews(placeId);
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  url.searchParams.set("fields", PROFILE_FIELD_MASK);
  url.searchParams.set("key", placesApiKey);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw createGoogleError("Google Places New profile", response, detail);
  }

  const place = await response.json();
  const fetchedAt = new Date();
  const cached = await readCachedReviews(placeId);

  return {
    ...cached,
    meta: {
      ...cached.meta,
      source: "google-profile",
      placeName: place.displayName?.text,
      averageRating: place.rating,
      userRatingCount: place.userRatingCount,
      googleMapsUri: place.googleMapsUri,
      fetchedAt,
      refreshNotice: "Google profile connected. Public review comments are not available from Google yet.",
      refreshStatusCode: originalError.googleStatusCode || originalError.statusCode
    }
  };
}

async function fetchAndCacheReviewsFromLegacyPlaces() {
  const { placeId, placesApiKey } = env.google;

  if (!placeId || !placesApiKey) {
    return readCachedReviews(placeId);
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", LEGACY_FIELDS);
  url.searchParams.set("key", placesApiKey);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    throw createGoogleError("Google Place Details legacy", response, detail);
  }

  const payload = await response.json();

  if (payload.status && payload.status !== "OK" && payload.status !== "ZERO_RESULTS") {
    throw createGoogleApiError("Google Place Details legacy", payload.status, payload.error_message);
  }

  const place = payload.result || {};
  const fetchedAt = new Date();
  const reviews = place.reviews || [];
  const records = reviews.map((review, index) => ({
    placeId,
    googleReviewName: `${placeId}-${review.time || index}`,
    authorName: review.author_name || "Google user",
    profilePhotoUrl: review.profile_photo_url,
    rating: review.rating,
    comment: review.text || "",
    relativePublishTimeDescription: review.relative_time_description,
    publishTime: review.time ? new Date(review.time * 1000) : undefined,
    googleMapsUri: review.author_url || place.url,
    averageRating: place.rating,
    userRatingCount: place.user_ratings_total,
    fetchedAt
  }));

  await cacheReviewRecords(records);

  const cached = await readCachedReviews(placeId);
  return {
    ...cached,
    meta: {
      ...cached.meta,
      source: "google-legacy",
      placeName: place.name,
      averageRating: place.rating,
      userRatingCount: place.user_ratings_total,
      fetchedAt
    }
  };
}
