import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { site } from "../config/site.js";

export default function ComingSoon() {
  return (
    <section className="relative isolate overflow-hidden bg-coal text-white">
      <img
        className="absolute inset-0 h-full w-full object-cover"
        src={site.heroImage}
        alt="Bright luxury interior prepared for Velura cleaning"
      />
      <div className="absolute inset-0 bg-coal/82" aria-hidden="true" />
      <div className="section-shell relative grid min-h-[calc(100vh-4rem)] items-center py-16">
        <div className="max-w-3xl">
          <img className="w-64 max-w-full drop-shadow-[0_18px_45px_rgba(0,0,0,0.45)] sm:w-80" src={site.logo} alt="Velura logo" />
          <p className="mt-8 inline-flex rounded-full border border-coral/45 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-coral">
            Coming soon
          </p>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-6xl">
            Velura is preparing a quieter kind of luxury cleaning.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-100">
            Our public website is almost ready. Account holders can access the private Velura portal while we finish
            preparing the full launch.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="button-primary bg-white text-coal hover:bg-stone-100" to="/login">
              Portal login
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a className="button-secondary border-white/35 bg-white/10 text-white hover:bg-white hover:text-coal" href={`mailto:${site.contactEmail}`}>
              <Mail size={18} aria-hidden="true" />
              {site.contactEmail}
            </a>
          </div>
          <div className="mt-10 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-stone-100">
            <ShieldCheck size={18} className="text-coral" aria-hidden="true" />
            Private portal access is available for approved Velura accounts.
          </div>
        </div>
      </div>
    </section>
  );
}
