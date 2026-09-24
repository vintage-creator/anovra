import { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, Eye, Store, Shield, Check, Copy,
  CheckCircle, AlertTriangle, Home, Menu, User
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
  onMenuClick?: () => void;
  menuLabel?: string;
  onProfileClick?: () => void;
  profileName?: string;
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
  onMenuClick,
  menuLabel = "Menu",
  onProfileClick,
  profileName,
}: UnifiedDashboardHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [brandSlug, setBrandSlug] = useState("your-brand");

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
    { id: "catalog", label: "Product Catalogue", icon: Package },
    { id: "skintest", label: "Preview Test", icon: Eye },
    { id: "shop", label: "View Storefront", icon: Store },
  ];

  const consumerLinks: { id: View; label: string; icon: React.ElementType }[] = [];

  const adminLinks: { id: View; label: string; icon: React.ElementType }[] = [
    { id: "landing", label: "Home", icon: Home },
  ];

  const links = role === "consumer" ? consumerLinks : role === "admin" ? adminLinks : vendorLinks;
  const avatarInitials = (profileName || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-xs mb-6 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main single-row navbar: Always items-center justify-between */}
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          
          {/* Left: Brand Logo & Compact Context Pill */}
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <button
              onClick={() => setView("landing")}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008236] rounded-xl transition-transform hover:scale-105 active:scale-95 shrink-0"
              aria-label="Anovra Home"
            >
              <img src="/logo.png" alt="Anovra Logo" className="h-10 sm:h-12 md:h-13 w-auto object-contain transition-transform group-hover:scale-105" />
            </button>

            {/* Subtle Divider (Desktop/Tablet) */}
            <div className="hidden sm:block h-5 w-px bg-border/80 shrink-0" />

            {/* Workspace Context Badge (Clean & Compact) */}
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate max-w-[160px] md:max-w-[220px]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {title}
              </span>
              {badgeText && role !== "consumer" && (
                <span className="text-[10px] uppercase font-bold font-mono bg-[#008236]/10 text-[#008236] border border-[#008236]/20 px-2 py-0.5 rounded-full shrink-0">
                  {badgeText}
                </span>
              )}
              {role === "vendor" && (
                onToggleVerify ? (
                  <button
                    onClick={onToggleVerify}
                    title="Click to toggle verification status"
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all shrink-0 ${
                      isVerified
                        ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/25"
                        : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25"
                    }`}
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Verified
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-500" /> Pending
                      </>
                    )}
                  </button>
                ) : (
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${
                      isVerified
                        ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/25"
                        : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/25"
                    }`}
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Verified
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 text-amber-500" /> Pending
                      </>
                    )}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Right: Actions, Nav Links, Profile, and Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Storefront Link if showShopLink (Desktop only, subtle & clean) */}
            {showShopLink && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-muted/60 border border-border/80 rounded-lg text-xs font-mono text-muted-foreground">
                <span className="truncate max-w-[140px]">{shopLink.replace("https://", "")}</span>
                <button onClick={copyLink} className="p-0.5 hover:text-foreground transition-colors cursor-pointer" title="Copy shop link">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Desktop Navigation Links */}
            {links.length > 0 && (
              <nav className="hidden lg:flex items-center gap-1.5">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = currentView === link.id;
                  return (
                    <button
                      key={link.id}
                      onClick={() => {
                        if (role === "consumer" && link.id === "shop") {
                          sessionStorage.removeItem("active_shop_slug");
                        }
                        setView(link.id);
                      }}
                      className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl transition-all whitespace-nowrap font-semibold cursor-pointer ${
                        isActive
                          ? "bg-[#008236] text-white shadow-xs"
                          : "bg-secondary/70 text-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{link.label}</span>
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Consumer Profile Avatar Button */}
            {role === "consumer" && onProfileClick && (
              <button
                onClick={onProfileClick}
                className="w-9 h-9 rounded-full border border-border bg-[#008236]/10 text-[#008236] hover:bg-[#008236] hover:text-white transition-colors flex items-center justify-center text-xs font-bold shadow-2xs cursor-pointer"
                aria-label="User Profile"
                title="User Profile"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {avatarInitials}
              </button>
            )}

            {/* Mobile/Tablet Hamburger Menu Button - ALWAYS PINNED ON THE RIGHT */}
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden flex items-center justify-center gap-1.5 h-9 sm:h-10 px-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer shrink-0 shadow-2xs"
                aria-label={menuLabel}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Menu className="w-4 h-4 text-foreground" />
                <span className="text-xs font-semibold">{menuLabel}</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
