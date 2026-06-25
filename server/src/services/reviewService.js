import { useFileDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import Review from "../models/Review.js";
import * as fileStore from "./fileStore.js";

const FIELD_MASK = "id,displayName,rating,userRatingCount,reviews";

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
  const { placeId, placesApiKey } = env.google;

  if (!placeId || !placesApiKey) {
    return readCachedReviews(placeId);
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": placesApiKey,
      "X-Goog-FieldMask": FIELD_MASK
    }
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Google Places request failed with status ${response.status}: ${detail}`);
    error.statusCode = 502;
    error.googleStatusCode = response.status;
    throw error;
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

  if (useFileDatabase()) {
    await fileStore.upsertReviews(records);
  } else {
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
