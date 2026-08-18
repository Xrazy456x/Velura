import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../api/client.js";

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
      } catch {
        if (!ignore) {
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

  if (status !== "ready" || visibleReviews.length === 0) {
    return null;
  }

  return (
    <section className="bg-coal text-white">
      <div className="section-shell py-14 sm:py-18">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-gold">Google Reviews</p>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">What Velura clients are saying</h2>
          </div>
          {meta?.averageRating ? (
            <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-stone-300">Google rating</p>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-2xl font-extrabold text-white">{Number(meta.averageRating).toFixed(1)}</span>
                <StarRow rating={meta.averageRating} />
                {meta.userRatingCount ? <span className="text-sm font-semibold text-stone-300">{meta.userRatingCount} reviews</span> : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {visibleReviews.map((review, index) => (
            <motion.article
              key={review._id || review.googleReviewName || review.authorName}
              className="rounded-xl border border-white/15 bg-white/10 p-5"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.08 }}
            >
              <StarRow rating={review.rating} />
              <p className="mt-4 line-clamp-5 text-sm leading-6 text-stone-100">
                {review.comment || "Rating submitted without a written comment."}
              </p>
              <div className="mt-5 border-t border-white/15 pt-4">
                <p className="font-bold text-white">{review.authorName || "Google user"}</p>
                <p className="text-sm text-stone-300">{review.relativePublishTimeDescription || "Google review"}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
