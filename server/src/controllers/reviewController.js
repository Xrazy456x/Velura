import { getReviews } from "../services/reviewService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listReviews = asyncHandler(async (req, res) => {
  const data = await getReviews();
  return res.json(data);
});

export const refreshReviews = asyncHandler(async (req, res) => {
  const data = await getReviews({ forceRefresh: true });
  return res.json(data);
});
