import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Building2,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Info,
  Package,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
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

interface NotificationCenterProps {
  role?: "admin" | "vendor" | "consumer";
  currentView?: View;
  setView: (v: View) => void;
  brandProfile?: any;
  customNotifications?: NotificationItem[];
}

export function NotificationCenter({
  role = "consumer",
  currentView,
  setView,
  brandProfile,
  customNotifications = [],
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("anovra_read_notifications");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("anovra_dismissed_notifications");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

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

  // Construct contextual notifications based on role and account state
  const computedNotifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];
    const profile = brandProfile || userProfile;

    // --- BRAND HQ / VENDOR NOTIFICATIONS ---
    if (role === "admin" || profile?.account_type === "brand") {
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
            "You can register unlimited regional branch outlets, invite team delegates, upload product catalogs, and generate tailored branch storefront URLs and QR codes.",
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
        timestamp: "Tip",
        actionLabel: "Go to Branches",
        actionView: "branddashboard",
      });
    }

    // --- CONSUMER / INDIVIDUAL NOTIFICATIONS ---
    if (role === "consumer" || (!profile?.account_type || profile?.account_type === "consumer")) {
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

    // --- VENDOR / BRANCH NOTIFICATIONS ---
    if (role === "vendor" || profile?.account_type === "branch") {
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
    }

    // Merge custom notifications if any passed from parent
    return [...customNotifications, ...list];
  }, [role, brandProfile, userProfile, customNotifications]);

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
        localStorage.setItem("anovra_dismissed_notifications", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

    if (activeNotification?.id === id) {
      setActiveNotification(null);
    }
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const allIds = new Set(visibleNotifications.map((n) => n.id));
    setDismissedIds((prev) => {
      const next = new Set([...prev, ...allIds]);
      try {
        localStorage.setItem("anovra_dismissed_notifications", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    setActiveNotification(null);
  };

  const handleMarkAllRead = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const allIds = new Set(visibleNotifications.map((n) => n.id));
    setReadIds((prev) => {
      const next = new Set([...prev, ...allIds]);
      try {
        localStorage.setItem("anovra_read_notifications", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const handleOpenNotificationDetails = (item: NotificationItem) => {
    // Mark as read
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      try {
        localStorage.setItem("anovra_read_notifications", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    setActiveNotification(item);
  };

  const handleExecuteAction = (item: NotificationItem) => {
    setActiveNotification(null);
    setOpen(false);

    if (item.actionCallback) {
      item.actionCallback();
      return;
    }

    if (item.actionView) {
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
      return severity === "error" ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <Sparkles className="w-4 h-4 text-amber-600" />;
    }
    if (category === "routine") {
      return <Sparkles className="w-4 h-4 text-[#008236]" />;
    }
    if (category === "onboarding" || category === "activity") {
      return <Store className="w-4 h-4 text-blue-600" />;
    }
    return <Info className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            aria-label={`Notifications (${unreadCount} unread)`}
            title={`Notifications (${unreadCount} unread)`}
          >
            <Bell className="w-4 h-4 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-xs ring-2 ring-background animate-in zoom-in duration-200">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-[min(92vw,400px)] p-0 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header Bar */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Notifications
              </span>
              {unreadCount > 0 ? (
                <span className="text-[10px] font-bold font-mono uppercase bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25 px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              ) : (
                <span className="text-[10px] font-mono text-muted-foreground">Caught up</span>
              )}
            </div>

            {visibleNotifications.length > 0 && (
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs inline-flex items-center gap-1 cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] hidden sm:inline">Mark read</span>
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors text-xs inline-flex items-center gap-1 cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-[11px] hidden sm:inline">Clear all</span>
                </button>
              </div>
            )}
          </div>

          {/* Notification Items List */}
          <div className="p-3 space-y-2 max-h-[65vh] overflow-y-auto divide-y divide-border/40">
            {visibleNotifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-xs font-semibold text-foreground">All caught up</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  You have cleared all active notifications.
                </p>
              </div>
            ) : (
              visibleNotifications.map((item) => {
                const isRead = readIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleOpenNotificationDetails(item)}
                    className={cn(
                      "group relative p-3 rounded-xl transition-all cursor-pointer pt-3 first:pt-0",
                      isRead ? "bg-card hover:bg-muted/40" : "bg-muted/30 hover:bg-muted/60 border border-border/60 shadow-2xs"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Category Icon Badge */}
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

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={cn("text-xs font-semibold text-foreground truncate", !isRead && "font-bold")}>
                            {item.title}
                          </p>
                          {!isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          )}
                        </div>

                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {item.summary}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold">
                            {item.timestamp}
                          </span>
                          <span className="text-[11px] font-semibold text-accent inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            Details <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>

                      {/* Dismiss Single Notification Button */}
                      <button
                        onClick={(e) => handleDismissOne(item.id, e)}
                        className="absolute top-2.5 right-2 p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors opacity-70 hover:opacity-100 cursor-pointer"
                        title="Dismiss notification"
                        aria-label="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Full Notification Detail Modal */}
      {activeNotification && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setActiveNotification(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveNotification(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3.5 mb-4 pr-8">
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border",
                  activeNotification.severity === "success" && "bg-emerald-500/15 border-emerald-500/30 text-emerald-700",
                  activeNotification.severity === "warning" && "bg-amber-500/15 border-amber-500/30 text-amber-700",
                  activeNotification.severity === "error" && "bg-rose-500/15 border-rose-500/30 text-rose-700",
                  activeNotification.severity === "info" && "bg-blue-500/15 border-blue-500/30 text-blue-700"
                )}
              >
                {getCategoryIcon(activeNotification.category, activeNotification.severity)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-muted border border-border text-foreground">
                    {activeNotification.category}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {activeNotification.timestamp}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground leading-snug">
                  {activeNotification.title}
                </h3>
              </div>
            </div>

            {/* Modal Body / Detailed Content */}
            <div className="rounded-xl bg-muted/30 border border-border/80 p-4 mb-5">
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                {activeNotification.details}
              </p>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border">
              <button
                onClick={() => handleDismissOne(activeNotification.id)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Dismiss notification</span>
              </button>

              {activeNotification.actionLabel && (
                <button
                  onClick={() => handleExecuteAction(activeNotification)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#008236] hover:bg-[#006c2c] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <span>{activeNotification.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
