import { Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="section-shell grid min-h-[60vh] place-items-center py-16 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-4xl font-extrabold text-coal">Page not found</h1>
        <p className="mt-4 text-stone-600">The page you requested does not exist.</p>
        <Link className="button-primary mt-8" to="/">
          <Home size={18} aria-hidden="true" />
          Back home
        </Link>
      </div>
    </section>
  );
}
