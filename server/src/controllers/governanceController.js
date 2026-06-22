import { getGovernanceSummary } from "../services/governanceService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getGovernance = asyncHandler(async (req, res) => {
  const governance = await getGovernanceSummary();

  return res.json({ governance });
});
