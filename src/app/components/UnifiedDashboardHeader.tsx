import { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, Eye, Store, User, Shield, Check, Copy,
  CheckCircle, AlertTriangle, Home
} from "lucide-react";
import type { View } from "../types";
import { supabase } from "../utils/supabase";

export type HeaderRole = "vendor" | "consumer" | "admin";

interface UnifiedDashboardHeaderProps {
  currentView: View;
  setView: (v: View) => void;
  title: string;
  subtitle?: string;
  badgeText?: string;
  role?: HeaderRole;
  showShopLink?: boolean;
  isVerified?: boolean;
  onToggleVerify?: () => void;
}

export function UnifiedDashboardHeader({
  currentView,
  setView,
  title,
  subtitle,
  badgeText,
  role = "vendor",
  showShopLink = true,
  isVerified = true,
  onToggleVerify,
}: UnifiedDashboardHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [brandSlug, setBrandSlug] = useState("my-brand");

  useEffect(() => {
    const fetchUserSlug = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata?.business_name) {
          const slug = user.user_metadata.business_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          setBrandSlug(slug);
        }
      } catch (err) {
        console.warn("Failed to retrieve user meta in header:", err);
      }
    };
    fetchUserSlug();
  }, []);

  const shopLink = `https://anovra.africa/#/shop/${brandSlug}`;

  function copyLink() {
    navigator.clipboard.writeText(shopLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Strictly role-segregated navigation links
  const vendorLinks: { id: View; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "catalog", label: "Product Catalog", icon: Package },
    { id: "skintest", label: "Preview Test", icon: Eye },
    { id: "shop", label: "View Storefront", icon: Store },
  ];

  const consumerLinks: { id: View; label: string; icon: React.ElementType }[] = [
    { id: "userdashboard", label: "My Skin Overview", icon: User },
    { id: "skintest", label: "Take Skin Test", icon: Eye },
    { id: "shop", label: "Product Shop", icon: Store },
    { id: "landing", label: "Home", icon: Home },
  ];

  const adminLinks: { id: View; label: string; icon: React.ElementType }[] = [
    { id: "admin", label: "Platform Control", icon: Shield },
    { id: "dashboard", label: "Vendor Portal", icon: LayoutDashboard },
    { id: "landing", label: "Home", icon: Home },
  ];

  const links = role === "consumer" ? consumerLinks : role === "admin" ? adminLinks : vendorLinks;

  return (
    <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border shadow-xs mb-6 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* Top bar: Brand + Role-Specific Quick Nav + Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setView("landing")}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008236] rounded-xl transition-transform hover:scale-105 active:scale-95 shrink-0"
              aria-label="Anovra Home"
            >
              <img src="/logo.png" alt="Anovra Logo" className="h-14 sm:h-16 md:h-18 w-auto object-contain transition-transform group-hover:scale-105" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  {title}
                </h1>
                {badgeText && (
                  <span className="text-[10px] uppercase font-bold font-mono bg-accent/15 text-accent px-2 py-0.5 rounded-full">
                    {badgeText}
                  </span>
                )}
                {onToggleVerify ? (
                  <button
                    onClick={onToggleVerify}
                    title="Click to toggle verification status"
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 transition-all ${
                      isVerified
                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> VERIFIED VENDOR
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-500" /> PENDING VERIFICATION
                      </>
                    )}
                  </button>
                ) : (
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                      isVerified
                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30"
                    }`}
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> VERIFIED VENDOR
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-500" /> PENDING VERIFICATION
                      </>
                    )}
                  </span>
                )}
              </div>

              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {subtitle}
                </p>
              )}

              {showShopLink && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[220px] sm:max-w-none">
                    {shopLink}
                  </span>
                  <button
                    onClick={copyLink}
                    className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-emerald-600 transition-colors"
                    title="Copy unique shop URL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Role-Specific Quick Nav Links */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap overflow-x-auto pb-1 sm:pb-0">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setView(link.id)}
                  className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg transition-all whitespace-nowrap font-medium ${
                    isActive
                      ? "bg-accent text-white font-semibold shadow-xs"
                      : "bg-secondary/80 text-foreground hover:bg-muted"
                  }`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
