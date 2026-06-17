import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    placeId: {
      type: String,
      required: true,
      index: true
    },
    googleReviewName: {
      type: String,
      required: true,
      unique: true
    },
    authorName: {
      type: String,
      trim: true,
      default: "Google user"
    },
    profilePhotoUrl: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      trim: true,
      default: ""
    },
    relativePublishTimeDescription: String,
    publishTime: Date,
    googleMapsUri: String,
    averageRating: Number,
    userRatingCount: Number,
    fetchedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

reviewSchema.index({ placeId: 1, fetchedAt: -1 });

export default mongoose.model("Review", reviewSchema);
