import { getReviews } from "../services/reviewService.js";
import {
  createGoogleBusinessAuthUrl,
  disconnectGoogleBusiness,
  getGoogleBusinessStatus,
  handleGoogleBusinessCallback,
  syncGoogleBusinessReviews
} from "../services/googleBusinessService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listReviews = asyncHandler(async (req, res) => {
  const data = await getReviews();
  return res.json(data);
});

export const refreshReviews = asyncHandler(async (req, res) => {
  const businessStatus = await getGoogleBusinessStatus();
  const data = businessStatus.connected ? await syncGoogleBusinessReviews() : await getReviews({ forceRefresh: true });
  return res.json(data);
});

export const googleBusinessStatus = asyncHandler(async (req, res) => {
  const status = await getGoogleBusinessStatus();
  return res.json(status);
});

export const startGoogleBusinessConnection = asyncHandler(async (req, res) => {
  const authUrl = createGoogleBusinessAuthUrl(req, req.query.returnTo);
  return res.json({ authUrl });
});

export const completeGoogleBusinessConnection = asyncHandler(async (req, res) => {
  const returnTo = await handleGoogleBusinessCallback(req);

  return res
    .type("html")
    .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0;url=${returnTo}" />
    <title>Velura Google Reviews Connected</title>
  </head>
  <body>
    <p>Google Reviews connected. Redirecting back to Velura...</p>
    <script>window.location.replace(${JSON.stringify(returnTo)});</script>
  </body>
</html>`);
});

export const syncGoogleBusiness = asyncHandler(async (req, res) => {
  const data = await syncGoogleBusinessReviews();
  return res.json(data || (await getReviews()));
});

export const disconnectGoogleBusinessConnection = asyncHandler(async (req, res) => {
  await disconnectGoogleBusiness();
  return res.json({ message: "Google Business Profile disconnected." });
});
