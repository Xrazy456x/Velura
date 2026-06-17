import { Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { site } from "../config/site.js";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const isManager = user?.role === "admin";

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive ? "bg-coal text-white" : "text-stone-700 hover:bg-white hover:text-coal"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-mist/90 backdrop-blur-xl">
      <nav className="section-shell flex h-16 items-center justify-between gap-3">
        <Link to={isAuthenticated ? "/portal" : "/"} className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-lg bg-coal ring-1 ring-coral/25">
            <img className="h-10 w-10 object-contain" src={site.mark} alt="" />
          </span>
          <span className="leading-none">
            <span className="block text-base font-extrabold uppercase tracking-[0.18em] text-coal sm:text-lg">
              {site.name}
            </span>
            <span className="hidden text-[11px] font-bold text-berry sm:block">{site.tagline}</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {isAuthenticated &&
            site.nav.map((item) => (
              <NavLink key={item.href} to={item.href} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {isAuthenticated ? (
            <>
              <span className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">
                <UserRound size={16} aria-hidden="true" />
                {user?.name}
              </span>
              {isManager && (
                <Link className="button-primary px-4 py-2" to="/dashboard">
                  Manager portal
                </Link>
              )}
              <button className="button-secondary px-4 py-2" onClick={logout} type="button">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link className="button-primary px-4 py-2" to="/login">
                Portal login
              </Link>
            </>
          )}
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-stone-300 bg-white text-coal lg:hidden"
          onClick={() => setIsOpen((value) => !value)}
          type="button"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-stone-200 bg-white lg:hidden">
          <div className="section-shell flex flex-col gap-2 py-4">
            {isAuthenticated &&
              site.nav.map((item) => (
                <NavLink key={item.href} to={item.href} className={linkClass} onClick={() => setIsOpen(false)}>
                  {item.label}
                </NavLink>
              ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {isAuthenticated ? (
                <>
                  {isManager && (
                    <Link className="button-primary" to="/dashboard" onClick={() => setIsOpen(false)}>
                      Manager portal
                    </Link>
                  )}
                  <button
                    className={isManager ? "button-secondary" : "button-secondary col-span-2"}
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    type="button"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link className="button-primary col-span-2" to="/login" onClick={() => setIsOpen(false)}>
                  Portal login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
