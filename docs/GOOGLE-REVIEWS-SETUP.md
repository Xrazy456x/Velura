# Google Reviews Setup For Velura

Velura already has Google Reviews integration in the backend. The public site calls `/api/reviews`, and the manager dashboard has a Reviews tab where you can check connection status and refresh the cached reviews.

The backend uses Google Places API Place Details, requests the `reviews`, `rating`, and `userRatingCount` fields, then stores the latest available reviews in MongoDB.

## What You Need

- A Google Cloud project with billing enabled.
- Google Places API enabled.
- A Google Maps Place ID for Velura.
- Render environment variables added to the live API service.

## 1. Enable Google Places API

1. Open Google Cloud Console.
2. Go to `APIs & Services > Library`.
3. Search for `Places API`.
4. Enable the Places API for the project.
5. Go to `APIs & Services > Credentials`.
6. Create an API key.
7. Restrict the key to the Places API.

Because this key is used by the backend on Render, do not put it in Cloudflare Pages or any frontend `VITE_` variable.

## 2. Find The Velura Place ID

Use Google's Place ID finder or Google Maps Platform tools to find the Place ID for the Velura Business Profile.

The value should look like this:

```text
ChIJxxxxxxxxxxxxxxxxxxxx
```

Do not paste the full `places/ChIJ...` path into Render. Use only the Place ID itself.

## 3. Add Render Environment Variables

In Render, open the live API service, then go to `Environment`.

Add:

```env
GOOGLE_PLACES_API_KEY=your_google_places_api_key
GOOGLE_PLACE_ID=your_google_place_id
GOOGLE_REVIEWS_CACHE_TTL_MINUTES=720
```

`720` means the site can reuse cached reviews for 12 hours before refreshing from Google. This keeps API usage controlled.

Save the variables and redeploy the API service.

## 4. Test In The Manager Portal

1. Open the manager dashboard.
2. Go to `Reviews`.
3. Check that status says `Connected`.
4. Click `Refresh reviews`.
5. Confirm the rating and cached review cards appear.

The public home page review section will then display the cached Google review cards.

## Useful Links

- Google Places API Place Details: https://developers.google.com/maps/documentation/places/web-service/place-details
- Google Place IDs: https://developers.google.com/maps/documentation/places/web-service/place-id
- Google API key security best practices: https://developers.google.com/maps/api-security-best-practices
