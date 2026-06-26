import mongoose from "mongoose";

const googleBusinessConnectionSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: "google_business_profile",
      unique: true,
      index: true
    },
    accessToken: {
      type: String,
      required: true
    },
    refreshToken: {
      type: String,
      required: true
    },
    tokenType: String,
    scope: String,
    expiresAt: Date,
    accountName: String,
    accountDisplayName: String,
    locationName: String,
    locationTitle: String,
    placeId: String,
    averageRating: Number,
    totalReviewCount: Number,
    lastSyncedAt: Date,
    lastSyncError: String,
    connectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    connectedAt: Date
  },
  { timestamps: true }
);

export default mongoose.model("GoogleBusinessConnection", googleBusinessConnectionSchema);
