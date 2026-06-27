import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { site } from "../config/site.js";

export default function Footer() {
  const { isAuthenticated, user } = useAuth();
  const isManager = user?.role === "admin";

  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="section-shell grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg bg-coal ring-1 ring-coral/25">
              <img className="h-11 w-11 object-contain" src={site.mark} alt="" />
            </span>
            <span>
              <span className="block text-lg font-extrabold uppercase tracking-[0.18em] text-coal">{site.name}</span>
              <span className="block text-xs font-bold text-berry">{site.tagline}</span>
            </span>
          </Link>
          <p className="mt-3 max-w-md text-sm leading-6 text-stone-600">
            Gentle luxury cleaning for considered homes, polished handovers, and refined workspaces.
          </p>
        </div>
        <div>
          <p className="text-sm font-bold text-coal">Pages</p>
          <div className="mt-3 grid gap-2 text-sm text-stone-600">
            {site.nav.map((item) => (
              <Link key={item.href} className="hover:text-berry" to={item.href}>
                {item.label}
              </Link>
            ))}
            <Link className="hover:text-berry" to="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-berry" to="/terms">
              Terms
            </Link>
            {isAuthenticated && isManager ? (
              <Link className="hover:text-berry" to="/dashboard">
                Manager portal
              </Link>
            ) : (
              <Link className="hover:text-berry" to="/login">
                Portal login
              </Link>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-coal">Contact</p>
          <a className="mt-3 block text-sm text-stone-600 hover:text-berry" href={`mailto:${site.contactEmail}`}>
            {site.contactEmail}
          </a>
        </div>
      </div>
      <div className="section-shell border-t border-stone-200 py-5 text-xs font-medium text-stone-500">
        © {new Date().getFullYear()} {site.name}. All rights reserved.
      </div>
    </footer>
  );
}
