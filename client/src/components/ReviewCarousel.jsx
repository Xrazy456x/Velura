import { motion } from "framer-motion";
import { Loader2, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiClient, getApiError } from "../api/client.js";

function StarRow({ rating }) {
  const rounded = Math.round(Number(rating) || 0);

  return (
    <div className="flex items-center gap-1 text-gold" aria-label={`${rounded} star rating`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={16} fill={index < rounded ? "currentColor" : "none"} aria-hidden="true" />
      ))}
    </div>
  );
}

export default function ReviewCarousel() {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadReviews() {
      try {
        const { data } = await apiClient.get("/reviews");
        if (!ignore) {
          setReviews(data.reviews || []);
          setMeta(data.meta || null);
          setStatus("ready");
        }
      } catch (requestError) {
        if (!ignore) {
          setError(getApiError(requestError, "Reviews are unavailable right now."));
          setStatus("error");
        }
      }
    }

    loadReviews();

    return () => {
      ignore = true;
    };
  }, []);

  const visibleReviews = useMemo(() => reviews.slice(0, 3), [reviews]);

  return (
    <section className="bg-white">
      <div className="section-shell py-14 sm:py-18">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Reputation</p>
            <h2 className="mt-3 text-3xl font-extrabold text-coal sm:text-4xl">What Velura clients are saying</h2>
          </div>
          {meta?.averageRating ? (
            <div className="rounded-lg border border-stone-200 bg-mist px-4 py-3">
              <p className="text-sm font-semibold text-stone-500">Google rating</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-2xl font-extrabold text-coal">{Number(meta.averageRating).toFixed(1)}</span>
                <StarRow rating={meta.averageRating} />
              </div>
            </div>
          ) : null}
        </div>

        {status === "loading" && (
          <div className="mt-8 flex items-center gap-3 rounded-lg border border-stone-200 bg-mist p-5 text-sm font-semibold text-stone-600">
            <Loader2 className="animate-spin text-coral" size={20} aria-hidden="true" />
            Loading reviews
          </div>
        )}

        {status === "error" && (
          <div className="mt-8 rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        {status === "ready" && visibleReviews.length === 0 && (
          <div className="mt-8 rounded-lg border border-stone-200 bg-mist p-5 text-sm font-semibold text-stone-600">
            Connect Google Places credentials to display live customer reviews.
          </div>
        )}

        {visibleReviews.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {visibleReviews.map((review, index) => (
              <motion.article
                key={review._id || review.googleReviewName || review.authorName}
                className="panel p-5"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.08 }}
              >
                <StarRow rating={review.rating} />
                <p className="mt-4 line-clamp-5 text-sm leading-6 text-stone-700">
                  {review.comment || "Rating submitted without a written comment."}
                </p>
                <div className="mt-5 border-t border-stone-200 pt-4">
                  <p className="font-bold text-coal">{review.authorName || "Google user"}</p>
                  <p className="text-sm text-stone-500">{review.relativePublishTimeDescription || "Google review"}</p>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
