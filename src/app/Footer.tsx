import type { View } from "./types";

export function Footer({ setView }: { setView: (v: View) => void }) {
  return (
    <footer className="bg-foreground text-primary-foreground mt-auto">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
        {/* Brand column */}
        <div className="col-span-2 lg:col-span-2">
          <div className="mb-4">
            <img src="/logo.png" alt="Anovra Logo" className="h-14 sm:h-20 w-auto object-contain brightness-0 invert" />
          </div>
          <p
            className="text-sm text-white/50 leading-relaxed max-w-xs"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            AI-powered skincare intelligence built for African skin. Connecting consumers to products that actually work, and giving vendors the engine to make it happen.
          </p>
          <div className="flex gap-3 mt-6">
            {["Instagram", "Twitter", "LinkedIn", "TikTok"].map((s) => (
              <button
                key={s}
                className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/15 transition-colors flex items-center justify-center text-white/40 hover:text-white/70 text-xs font-mono"
                style={{ background: "rgba(255,255,255,0.07)" }}
                title={s}
              >
                {s[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div>
          <p
            className="text-xs text-white/30 uppercase tracking-widest mb-4"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Platform
          </p>
          <ul className="space-y-2.5">
            {[
              { label: "Home", view: "landing" as View },
              { label: "Skin Test", view: "skintest" as View },
              { label: "My Skin Dashboard", view: "userdashboard" as View },
              { label: "Vendor Dashboard", view: "dashboard" as View },
              { label: "Product Catalog", view: "catalog" as View },
              { label: "About Anovra", view: "about" as View },
            ].map((l) => (
              <li key={l.label}>
                <button
                  onClick={() => setView(l.view)}
                  className="text-sm text-white/50 hover:text-white/90 transition-colors text-left"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* For vendors */}
        <div>
          <p
            className="text-xs text-white/30 uppercase tracking-widest mb-4"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Vendors
          </p>
          <ul className="space-y-2.5">
            {[
              { label: "Join as a vendor", view: "signup" as View },
              { label: "Sign in", view: "signin" as View },
              { label: "View a sample shop", view: "shop" as View },
              { label: "Admin login", view: "adminlogin" as View },
            ].map((l) => (
              <li key={l.label}>
                <button
                  onClick={() => setView(l.view)}
                  className="text-sm text-white/50 hover:text-white/90 transition-colors text-left"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p
            className="text-xs text-white/30 uppercase tracking-widest mb-4"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Contact
          </p>
          <ul className="space-y-2.5">
            {[
              { label: "Contact us", view: "contact" as View },
            ].map((l) => (
              <li key={l.label}>
                <button
                  onClick={() => setView(l.view)}
                  className="text-sm text-white/50 hover:text-white/90 transition-colors text-left"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {l.label}
                </button>
              </li>
            ))}
            {[
              { label: "hello@anovra.africa" },
              { label: "vendors@anovra.africa" },
              { label: "+234 800 ANOVRA" },
              { label: "Lagos · Abuja" },
            ].map((c) => (
              <li key={c.label}>
                <span
                  className="text-sm text-white/35"
                  style={{ fontFamily: "'DM Mono', monospace", fontSize: 11 }}
                >
                  {c.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="border-t border-white/8" />
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p
          className="text-xs text-white/25"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          © {new Date().getFullYear()} Anovra Africa Ltd. All rights reserved.
        </p>
        <div className="flex items-center gap-5">
          {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((t) => (
            <button
              key={t}
              className="text-xs text-white/25 hover:text-white/50 transition-colors"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {t}
            </button>
          ))}
        </div>
        <p
          className="text-xs text-white/15"
          style={{ fontFamily: "'DM Mono', monospace" }}
        >
          v2.1.0 · Lagos, Nigeria 🇳🇬
        </p>
      </div>
    </footer>
  );
}
