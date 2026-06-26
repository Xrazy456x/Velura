# Google Reviews Setup For Velura

Velura now supports two Google review routes:

1. **Recommended:** Google Business Profile OAuth sync.
2. **Fallback:** Google Places API, kept only as a backup.

The recommended setup connects the verified Velura Google Business Profile, syncs reviews into MongoDB, and lets the public website display cached reviews without calling Google on every page load.

## Why We Use Business Profile OAuth

Google Business Profile has a Reviews API designed for verified businesses. It uses OAuth, which means a Velura manager signs in with the Google account that owns or manages the business profile.

Once connected, the backend stores encrypted Google tokens in MongoDB and syncs reviews into the existing `reviews` collection.

## 1. Enable Google APIs

In Google Cloud Console:

1. Open the project used for Velura.
2. Go to `APIs & Services > Library`.
3. Enable:
   - `Business Profile APIs`
   - `My Business Account Management API`
   - `My Business Business Information API`
   - `Google My Business API`
4. Go to `APIs & Services > OAuth consent screen`.
5. Configure the app name as `Velura Services`.
6. Add your Velura manager Google account as a test user if Google keeps the app in testing mode.

## 2. Create OAuth Client

1. Go to `APIs & Services > Credentials`.
2. Click `Create credentials`.
3. Choose `OAuth client ID`.
4. Application type: `Web application`.
5. Add this authorised redirect URI:

```text
https://velura-services-api.onrender.com/api/reviews/business/callback
```

6. Save it.
7. Copy the `Client ID` and `Client secret`.

## 3. Add Render Environment Variables

In Render, open the live API service: `velura-services-api`.

Add:

```env
GOOGLE_BUSINESS_CLIENT_ID=your_oauth_client_id
GOOGLE_BUSINESS_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_BUSINESS_REDIRECT_URI=https://velura-services-api.onrender.com/api/reviews/business/callback
GOOGLE_BUSINESS_TOKEN_SECRET=make-a-long-random-secret
```

Optional fallback variables can stay in place:

```env
GOOGLE_PLACES_API_KEY=your_google_places_api_key
GOOGLE_PLACE_ID=your_google_place_id
GOOGLE_REVIEWS_CACHE_TTL_MINUTES=720
```

After saving, redeploy the Render API service.

## 4. Connect In The Manager Portal

1. Open the Velura manager dashboard.
2. Go to `Reviews`.
3. Click `Connect Google`.
4. Sign in with the Google account that manages Velura's verified Business Profile.
5. Allow access.
6. You should be redirected back to the dashboard.
7. Click `Sync reviews`.

Reviews are then cached in MongoDB and shown on the public website from `/api/reviews`.

## 5. Troubleshooting

If Google says the app is not verified, add your Google account as a test user on the OAuth consent screen.

If sync says no locations were found, make sure the Google account you used is a manager or owner of Velura Services LTD in Google Business Profile.

If sync returns a permissions error, confirm the Business Profile APIs are enabled in the same Google Cloud project as the OAuth client.

If the site shows zero reviews after a successful sync, that means Google connected correctly but the Business Profile API did not return any public review records yet.

## Useful Links

- Google Business Profile review data: https://developers.google.com/my-business/content/review-data
- Reviews list endpoint: https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list
- OAuth setup: https://developers.google.com/my-business/content/oauth-setup
