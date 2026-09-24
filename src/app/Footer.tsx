import type { View } from "./types";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { SocialLinks } from "./SocialLinks";

export function Footer({ setView }: { setView: (v: View) => void }) {
  return (
    <footer className="bg-[#008236] text-white mt-auto border-t border-emerald-700/40">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand column */}
        <div className="sm:col-span-2 lg:col-span-2 space-y-4">
          <div>
            <button
              onClick={() => setView("landing")}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-xl transition-transform hover:scale-105 active:scale-95 text-left inline-block"
              aria-label="Anovra Home"
            >
              <img
                src="/logo.png"
                alt="Anovra"
                className="h-10 sm:h-12 w-auto object-contain brightness-0 invert"
              />
            </button>
          </div>
          <p
            className="text-sm text-emerald-100/75 leading-relaxed max-w-sm"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            AI-powered skincare intelligence built specifically for African skin tones and concerns. Connecting consumers to formulations that truly work, and empowering vendors with intelligent commerce.
          </p>
          <div className="pt-2 text-emerald-50">
            <SocialLinks compact />
          </div>
        </div>

        {/* Platform */}
        <div>
          <p
            className="text-xs font-bold text-white uppercase tracking-widest mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Platform
          </p>
          <ul className="space-y-2.5">
            {[
              { label: "Home", view: "landing" as View },
              { label: "Skin Test", view: "skintest" as View },
              { label: "Product Shop", view: "shop" as View },
              { label: "About Anovra", view: "about" as View },
              { label: "FAQs", view: "faq" as View },
            ].map((l) => (
              <li key={l.label}>
                <button
                  onClick={() => setView(l.view)}
                  className="text-sm text-emerald-100/80 hover:text-white transition-all duration-150 text-left flex items-center gap-1.5 group cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <span className="group-hover:translate-x-1 transition-transform duration-150">{l.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* For vendors */}
        <div>
          <p
            className="text-xs font-bold text-white uppercase tracking-widest mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Vendors & Brands
          </p>
          <ul className="space-y-2.5">
            {[
              { label: "Join as a Vendor", view: "signup" as View },
              { label: "Vendor Sign In", view: "vendorlogin" as View },
              { label: "Browse Partner Shops", view: "shop" as View },
              { label: "Admin Portal", view: "adminlogin" as View },
            ].map((l) => (
              <li key={l.label}>
                <button
                  onClick={() => setView(l.view)}
                  className="text-sm text-emerald-100/80 hover:text-white transition-all duration-150 text-left flex items-center gap-1.5 group cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <span className="group-hover:translate-x-1 transition-transform duration-150">{l.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p
            className="text-xs font-bold text-white uppercase tracking-widest mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Contact
          </p>
          <ul className="space-y-3">
            <li>
              <button
                onClick={() => setView("contact")}
                className="text-sm font-medium text-white hover:text-emerald-200 transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <span>Contact Support Page</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </button>
            </li>
            <li>
              <a
                href="mailto:hello@anovra.africa"
                className="text-sm text-emerald-100/80 hover:text-white transition-colors flex items-center gap-2 group"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Mail className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="group-hover:underline underline-offset-2">hello@anovra.africa</span>
              </a>
            </li>
            <li>
              <a
                href="mailto:vendors@anovra.africa"
                className="text-sm text-emerald-100/80 hover:text-white transition-colors flex items-center gap-2 group"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Mail className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="group-hover:underline underline-offset-2">vendors@anovra.africa</span>
              </a>
            </li>
            <li>
              <a
                href="tel:+2349167664619"
                className="text-sm text-emerald-100/80 hover:text-white transition-colors flex items-center gap-2 group"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="group-hover:underline underline-offset-2">+234 916 766 4619</span>
              </a>
            </li>
          </ul>

          {/* Differentiated Non-Clickable HQ Address & Operations */}
          <div className="mt-5 pt-3.5 border-t border-white/10 flex items-start gap-2 text-xs text-emerald-100/60">
            <MapPin className="w-3.5 h-3.5 text-emerald-300/80 shrink-0 mt-0.5" />
            <div>
              <span className="block font-medium text-emerald-100/85">Headquarters</span>
              <span>Abuja, Nigeria</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="border-t border-white/15" />
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <p
          className="text-xs text-emerald-100/60 text-center sm:text-left"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          © {new Date().getFullYear()} Anovra Africa Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
