import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Building2,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  HeartPulse,
  Info,
  ShieldCheck,
  Store,
  Trash2,
  X,
} from "lucide-react";
import type { View } from "../types";
import { cn } from "../types";
import { supabase } from "../utils/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export interface NotificationItem {
  id: string;
  title: string;
  summary: string;
  details: string;
  category: "compliance" | "trial" | "onboarding" | "routine" | "activity" | "system";
  severity: "info" | "warning" | "success" | "error";
  timestamp: string;
  actionLabel?: string;
  actionView?: View;
  actionTab?: string;
  actionCallback?: () => void;
  externalLink?: string;
}

export type NotificationRole = "admin" | "brand" | "vendor" | "consumer";

interface NotificationCenterProps {
  role?: NotificationRole;
  currentView?: View;
  setView: (v: View) => void;
  brandProfile?: any;
  customNotifications?: NotificationItem[];
}

export function NotificationCenter({
  role,
  currentView,
  setView,
  brandProfile,
  customNotifications = [],
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isMounted || !user) return;
        setCurrentUser(user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (isMounted && profile) {
          setUserProfile(profile);
        }
      } catch (e) {
        console.warn("NotificationCenter user fetch failed:", e);
      }
    }
    fetchUser();
    return () => {
      isMounted = false;
    };
  }, []);

  // Decisively resolve effective role:
  // 1. Explicit prop passed to NotificationCenter
  // 2. Deduced from currentView
  // 3. Fallback to profile account_type
  const effectiveRole: NotificationRole = useMemo(() => {
    if (role) return role;
    if (currentView === "admin") return "admin";
    if (currentView === "branddashboard" || currentView === "brand" || currentView === "teamdashboard") return "brand";
    if (currentView === "dashboard" || currentView === "catalog") return "vendor";
    if (currentView === "userdashboard") return "consumer";
    if (userProfile?.account_type === "brand") return "brand";
    if (userProfile?.account_type === "vendor" || userProfile?.account_type === "branch") return "vendor";
    if (userProfile?.account_type === "admin") return "admin";
    return "consumer";
  }, [role, currentView, userProfile]);

  const readStorageKey = `anovra_read_notifications_${effectiveRole}_${currentUser?.id || "anon"}`;
  const dismissedStorageKey = `anovra_dismissed_notifications_${effectiveRole}_${currentUser?.id || "anon"}`;

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`anovra_read_notifications_${role || "default"}`);
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`anovra_dismissed_notifications_${role || "default"}`);
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  // Re-synchronize storage keys whenever effectiveRole or user changes
  useEffect(() => {
    try {
      const storedRead = localStorage.getItem(readStorageKey);
      setReadIds(new Set(storedRead ? JSON.parse(storedRead) : []));
    } catch {
      setReadIds(new Set());
    }
    try {
      const storedDismissed = localStorage.getItem(dismissedStorageKey);
      setDismissedIds(new Set(storedDismissed ? JSON.parse(storedDismissed) : []));
    } catch {
      setDismissedIds(new Set());
    }
  }, [readStorageKey, dismissedStorageKey]);

  // Construct contextual notifications based strictly on effectiveRole
  const computedNotifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];
    const profile = brandProfile || userProfile;

    // --- 1. ADMIN NOTIFICATIONS (STRICTLY PLATFORM SUPER ADMIN) ---
    if (effectiveRole === "admin") {
      list.push({
        id: "admin-partner-verification-queue",
        title: "Partner Verification Queue",
        summary: "Review pending CAC certificates and onboarding requests from brands and vendors.",
        details:
          "Corporate registration records and business certificates uploaded by vendors and brands require administrative audit. Once approved, partners are immediately granted live storefront and marketplace visibility.",
        category: "compliance",
        severity: "info",
        timestamp: "Admin Queue",
        actionLabel: "Review Vendors",
        actionView: "admin",
        actionTab: "vendors",
      });

      list.push({
        id: "admin-safety-queue",
        title: "Product Safety & Regulatory Queue",
        summary: "Inspect cosmetic formulations, NAFDAC registrations, and ingredient disclosures.",
        details:
          "Formulations submitted by partner brands undergo ingredient safety analysis against banned cosmetic agents. Items requiring manual audit or verification of active NAFDAC permits are queued here.",
        category: "compliance",
        severity: "warning",
        timestamp: "Safety Audit",
        actionLabel: "Open Safety Queue",
        actionView: "admin",
        actionTab: "safety",
      });

      list.push({
        id: "admin-platform-telemetry",
        title: "Platform Activity & Telemetry",
        summary: "Real-time telemetry across Nigerian vendor networks, AI scan volume, and reviews.",
        details:
          "Monitor platform health, customer scan volume across major cities (Lagos, Abuja, Port Harcourt), active vendor branches, and user review moderation.",
        category: "system",
        severity: "success",
        timestamp: "Platform Status",
        actionLabel: "Control Center",
        actionView: "admin",
        actionTab: "overview",
      });
    }

    // --- 2. BRAND HQ NOTIFICATIONS (STRICTLY BRAND HQ WORKSPACE) ---
    else if (effectiveRole === "brand") {
      const isVerified = Boolean(profile?.is_verified) && (profile?.verification_status ? profile.verification_status === "approved" : true);
      const isPending = !isVerified;
      const trialExpired = profile?.plan === "free"
        && Date.now() > new Date(profile?.created_at || 0).getTime() + 3 * 24 * 60 * 60 * 1000;

      if (isPending) {
        list.push({
          id: "brand-cac-verification",
          title: "CAC Verification In Progress",
          summary: "Your CAC documents and brand credentials are being reviewed by Anovra compliance.",
          details:
            "Your company incorporation and CAC records have been submitted and are under active compliance examination. While in review, you have full access to configure your branches, team members, and catalog in Owner Preview Mode. Public link copying and marketplace listings will automatically activate upon approval.",
          category: "compliance",
          severity: "warning",
          timestamp: "In review",
          actionLabel: "Contact Compliance",
          actionView: "contact",
        });
      } else {
        list.push({
          id: "brand-cac-approved",
          title: "Brand Network Verified",
          summary: "Your brand is CAC verified and authorized on the Anovra skincare network.",
          details:
            "All compliance checks have passed. Your public brand profile, branch storefronts, and AI skin analysis links are active and available across Nigeria.",
          category: "compliance",
          severity: "success",
          timestamp: "Verified",
          actionLabel: "View Public Page",
          actionView: "brand",
        });
      }

      if (trialExpired) {
        list.push({
          id: "brand-trial-expired",
          title: "Brand HQ Trial Ended",
          summary: "Your 3-day Brand HQ trial has expired. Upgrade your plan to maintain branch access.",
          details:
            "Your trial period has concluded. Your reports and branch data remain safely preserved, but branch inventory updates, live storefront scans, and customer recommendations require an active Brand HQ annual plan.",
          category: "trial",
          severity: "error",
          timestamp: "Action needed",
          actionLabel: "Upgrade Plan",
          actionView: "contact",
        });
      } else {
        list.push({
          id: "brand-trial-active",
          title: "Brand HQ Workspace Active",
          summary: "You are currently enjoying full enterprise access during your trial period.",
          details:
            "You can register regional branch outlets, invite team delegates, upload product catalogs, and generate tailored branch storefront URLs and QR codes.",
          category: "trial",
          severity: "info",
          timestamp: "Active",
          actionLabel: "Manage Branches",
          actionView: "branddashboard",
        });
      }

      list.push({
        id: "brand-setup-branches",
        title: "Setup Regional Branch Outlets",
        summary: "Create your branch locations so customers can discover and shop from nearby outlets.",
        details:
          "Anovra allows skincare brands to map state distributors and physical branch stores. Each branch gets its own localized product shop and tailored skin test link attributed directly to their location.",
        category: "onboarding",
        severity: "info",
        timestamp: "Setup",
        actionLabel: "Go to Branches",
        actionView: "branddashboard",
      });
    }

    // --- 3. VENDOR / BRANCH NOTIFICATIONS (STRICTLY VENDOR OUTLETS) ---
    else if (effectiveRole === "vendor") {
      list.push({
        id: "vendor-storefront-ready",
        title: "Branch Storefront Link Active",
        summary: "Your branch storefront is configured and ready to accept customer consultations.",
        details:
          "Customers who visit your branch link or scan your unique QR code receive recommendations mapped directly to your local stock inventory.",
        category: "activity",
        severity: "info",
        timestamp: "Ready",
        actionLabel: "View Storefront",
        actionView: "shop",
      });

      list.push({
        id: "vendor-inventory-sync",
        title: "Product Inventory & Catalog",
        summary: "Keep your product catalogue updated with active shelf stock and prices.",
        details:
          "AI skin analysis matches customers directly with items in your inventory. Keep your products updated to maximize branch sales.",
        category: "compliance",
        severity: "info",
        timestamp: "Inventory",
        actionLabel: "Open Catalogue",
        actionView: "catalog",
      });

      list.push({
        id: "vendor-consultation-scans",
        title: "Dedicated Branch Skin Test",
        summary: "Share your dedicated skin test QR code with in-store or social media shoppers.",
        details:
          "Every skin consultation completed through your branch link automatically prioritizes your inventory for product recommendations.",
        category: "activity",
        severity: "success",
        timestamp: "Consultations",
        actionLabel: "Preview Skin Test",
        actionView: "skintest",
      });
    }

    // --- 4. CONSUMER / INDIVIDUAL NOTIFICATIONS (STRICTLY CUSTOMERS) ---
    else if (effectiveRole === "consumer") {
      list.push({
        id: "consumer-skin-analysis",
        title: "Personalised Skin Health Analysis",
        summary: "Take our instant AI skin test to discover certified products suited for your skin type.",
        details:
          "Anovra analyzes your unique skin concerns, pigmentation balance, sensitivity, and hydration needs. You receive instant personalized routine recommendations vetted for safety and compliance.",
        category: "routine",
        severity: "info",
        timestamp: "Recommended",
        actionLabel: "Start Skin Test",
        actionView: "skintest",
      });

      list.push({
        id: "consumer-marketplace",
        title: "Verified Nigerian Skincare Catalog",
        summary: "Explore NAFDAC-screened and approved formulations in the Anovra Product Shop.",
        details:
          "Every product listed in the Anovra shop undergoes ingredient safety screening and vendor authenticity verification. Discover serums, cleansers, sunscreens, and moisturisers tailored for African skin.",
        category: "activity",
        severity: "info",
        timestamp: "Discover",
        actionLabel: "Browse Product Shop",
        actionView: "shop",
      });

      list.push({
        id: "consumer-account-security",
        title: "Account Security & Profile",
        summary: "Keep your skin preferences, delivery address, and consultation history up to date.",
        details:
          "Your scan history, ingredient allergies, and routine logs are securely saved under your private Anovra account. You can review your previous consultation reports anytime from your portal.",
        category: "system",
        severity: "success",
        timestamp: "Account",
        actionLabel: "View Portal",
        actionView: "userdashboard",
      });
    }

    // Merge custom notifications if any passed from parent
    return [...customNotifications, ...list];
  }, [effectiveRole, brandProfile, userProfile, customNotifications]);

  // Filter out dismissed notifications
  const visibleNotifications = useMemo(() => {
    return computedNotifications.filter((n) => !dismissedIds.has(n.id));
  }, [computedNotifications, dismissedIds]);

  const unreadCount = useMemo(() => {
    return visibleNotifications.filter((n) => !readIds.has(n.id)).length;
  }, [visibleNotifications, readIds]);

  const handleDismissOne = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(dismissedStorageKey, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    if (expandedId === id) {
      setExpandedId(null);
    }
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const allIds = new Set(visibleNotifications.map((n) => n.id));
    setDismissedIds((prev) => {
      const next = new Set([...prev, ...allIds]);
      try {
        localStorage.setItem(dismissedStorageKey, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    setExpandedId(null);
  };

  const handleMarkAllRead = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const allIds = new Set(visibleNotifications.map((n) => n.id));
    setReadIds((prev) => {
      const next = new Set([...prev, ...allIds]);
      try {
        localStorage.setItem(readStorageKey, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const handleToggleExpand = (item: NotificationItem) => {
    // Mark as read when opened
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      try {
        localStorage.setItem(readStorageKey, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    setExpandedId((prev) => (prev === item.id ? null : item.id));
  };

  const handleExecuteAction = (item: NotificationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpen(false);

    if (item.actionCallback) {
      item.actionCallback();
      return;
    }

    if (item.actionView) {
      if (item.actionTab) {
        try {
          if (item.actionView === "admin") {
            sessionStorage.setItem("active_admin_tab", item.actionTab);
            sessionStorage.setItem("admin_active_tab", item.actionTab);
          }
          if (item.actionView === "branddashboard") sessionStorage.setItem("brand_active_tab", item.actionTab);
          if (item.actionView === "dashboard") sessionStorage.setItem("vendor_active_tab", item.actionTab);
        } catch {}
      }
      if (item.actionView === "shop") {
        try {
          sessionStorage.removeItem("active_shop_slug");
          window.location.hash = "#/shop";
        } catch {}
      }
      setView(item.actionView);
    }
  };

  const getCategoryIcon = (category: NotificationItem["category"], severity: NotificationItem["severity"]) => {
    if (category === "compliance") {
      return severity === "success" ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-amber-600" />;
    }
    if (category === "trial") {
      return severity === "error" ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <CreditCard className="w-4 h-4 text-amber-600" />;
    }
    if (category === "routine") {
      return <HeartPulse className="w-4 h-4 text-[#008236]" />;
    }
    if (category === "onboarding") {
      return <Building2 className="w-4 h-4 text-blue-600" />;
    }
    if (category === "activity") {
      return <Store className="w-4 h-4 text-blue-600" />;
    }
    if (category === "system") {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    return <Info className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008236]"
          aria-label={`Notifications (${unreadCount} unread)`}
          title={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="w-4 h-4 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#008236] text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-xs ring-2 ring-background animate-in zoom-in duration-200">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(94vw,420px)] p-0 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header Bar */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-foreground" />
            <span className="text-sm font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Notifications
            </span>
            {unreadCount > 0 ? (
              <span className="text-[10px] font-bold font-mono uppercase bg-[#008236]/15 text-[#008236] border border-[#008236]/30 px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            ) : (
              <span className="text-[10px] font-mono text-muted-foreground">All caught up</span>
            )}
          </div>

          {visibleNotifications.length > 0 && (
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="px-2 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs inline-flex items-center gap-1 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Mark read</span>
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="px-2 py-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors text-xs inline-flex items-center gap-1 cursor-pointer"
                title="Clear all notifications"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Clear all</span>
              </button>
            </div>
          )}
        </div>

        {/* Notification Items List */}
        <div className="p-2 space-y-1.5 max-h-[68vh] overflow-y-auto divide-y divide-border/30">
          {visibleNotifications.length === 0 ? (
            <div className="py-12 text-center px-4">
              <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto mb-2.5 text-muted-foreground">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-xs font-semibold text-foreground">No active notifications</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                You're completely caught up. New updates will appear here.
              </p>
            </div>
          ) : (
            visibleNotifications.map((item) => {
              const isRead = readIds.has(item.id);
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl transition-all pt-1.5 first:pt-0 overflow-hidden",
                    isRead ? "bg-card" : "bg-muted/30"
                  )}
                >
                  {/* Collapsed / Header Row */}
                  <div
                    onClick={() => handleToggleExpand(item)}
                    className={cn(
                      "p-3 rounded-xl border border-transparent hover:border-border/60 transition-all cursor-pointer relative",
                      isExpanded ? "bg-muted/50 border-border/80" : "hover:bg-muted/40",
                      !isRead && !isExpanded && "border-border/40 shadow-2xs"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border",
                          item.severity === "success" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-700",
                          item.severity === "warning" && "bg-amber-500/10 border-amber-500/20 text-amber-700",
                          item.severity === "error" && "bg-rose-500/10 border-rose-500/20 text-rose-700",
                          item.severity === "info" && "bg-blue-500/10 border-blue-500/20 text-blue-700"
                        )}
                      >
                        {getCategoryIcon(item.category, item.severity)}
                      </div>

                      {/* Main Summary */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={cn("text-xs text-foreground truncate", !isRead ? "font-bold" : "font-semibold")}>
                            {item.title}
                          </p>
                          {!isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#008236] shrink-0" />
                          )}
                        </div>

                        {!isExpanded && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {item.summary}
                          </p>
                        )}

                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase font-medium">
                            {item.timestamp}
                          </span>
                          <span className="text-[11px] font-semibold text-foreground/80 inline-flex items-center gap-0.5 hover:text-foreground">
                            {isExpanded ? (
                              <>Collapse <ChevronUp className="w-3 h-3 ml-0.5" /></>
                            ) : (
                              <>Read details <ChevronDown className="w-3 h-3 ml-0.5" /></>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Dismiss One */}
                      <button
                        onClick={(e) => handleDismissOne(item.id, e)}
                        className="absolute top-2.5 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Dismiss notification"
                        aria-label="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Inline Expanded Details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-border/60 animate-in fade-in duration-150">
                        <div className="rounded-lg bg-card/80 border border-border/80 p-3 mb-3">
                          <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                            {item.details}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={(e) => handleDismissOne(item.id, e)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Dismiss</span>
                          </button>

                          {item.actionLabel && (
                            <button
                              onClick={(e) => handleExecuteAction(item, e)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#008236] hover:bg-[#006c2c] text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
                            >
                              <span>{item.actionLabel}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
