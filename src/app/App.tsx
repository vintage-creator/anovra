import { useState, useEffect } from "react";
import {
  Menu,
  ChevronDown,
  User,
  Store,
  ShieldCheck,
  Users,
  ShoppingBag,
  TestTube,
  Home,
  Info,
  Mail,
  CircleHelp,
  ArrowRight,
  ArrowUp,
  Scan,
} from "lucide-react";
import { type View, cn } from "./types";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { LandingView } from "./LandingView";
import { ShopView } from "./ShopView";
import { DashboardView } from "./DashboardView";
import { CatalogView } from "./CatalogView";
import { SkinTestView } from "./SkinTestView";
import { SignUpView, CustomerSignUpView, SignInView, EmailVerificationPendingView, ForgotPasswordView, ResetPasswordView } from "./AuthViews";
import { TeamLoginView, TeamDashboardView } from "./TeamViews";
import { supabase } from "./utils/supabase";
import { AboutView, ContactView, FAQView } from "./ContentViews";
import { AdminView } from "./AdminView";
import { UserDashboardView } from "./UserDashboardView";
import { BrandDashboardView } from "./BrandDashboardView";
import { BrandPublicView } from "./BrandPublicView";
import { Footer } from "./Footer";
import { clearCustomerScan, consumeCustomerScan, rememberCustomerScan } from "./utils/customerScanReturn";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "./components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";

function Nav({ view, setView }: { view: View; setView: (v: View) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const primaryNavLinks: { id: View; label: string; icon: React.ElementType }[] = [
    { id: "landing", label: "Home", icon: Home },
    { id: "about", label: "About", icon: Info },
    { id: "faq", label: "FAQs", icon: CircleHelp },
    { id: "contact", label: "Contact", icon: Mail },
  ];

  const handleNavClick = (v: View) => {
    setView(v);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
        {/* Left: Brand Logo */}
        <button
          onClick={() => setView("landing")}
          className="flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg p-1 transition-transform active:scale-95"
          aria-label="Anovra Home"
        >
          <img
            src="/logo.png"
            alt="Anovra Logo"
            className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </button>

        {/* Center: Desktop Primary Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {primaryNavLinks.map((l) => (
            <button
              key={l.id}
              onClick={() => setView(l.id)}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer",
                view === l.id
                  ? "bg-emerald-500 text-white font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              )}
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Right: Desktop Actions & Mobile Burger */}
        <div className="flex items-center justify-end gap-3">
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Sign In Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="text-sm px-3.5 py-2 rounded-md font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-1 focus:outline-none">
                <span>Sign in</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-2">
                <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                  Account Sign In
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setView("customerlogin")}
                  className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-700 focus:bg-emerald-500/10 focus:text-emerald-700 data-[highlighted]:bg-emerald-500/10 data-[highlighted]:text-emerald-700 outline-none"
                >
                  <User className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-sm font-medium">Sign in as a User</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setView("vendorlogin")}
                  className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-700 focus:bg-emerald-500/10 focus:text-emerald-700 data-[highlighted]:bg-emerald-500/10 data-[highlighted]:text-emerald-700 outline-none"
                >
                  <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-sm font-medium">Sign in as a Vendor</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setView("brandlogin")}
                  className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-700 focus:bg-emerald-500/10 focus:text-emerald-700 data-[highlighted]:bg-emerald-500/10 data-[highlighted]:text-emerald-700 outline-none"
                >
                  <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-sm font-medium">Sign in as a Brand HQ</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Analyse Skin Button (Secondary Outline Button) */}
            <button
              onClick={() => setView("skintest")}
              className="text-sm px-4 py-2 rounded-lg border-2 border-[#008236] text-[#008236] hover:bg-[#008236]/10 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <span>Analyse Skin</span>
              <Scan className="w-3.5 h-3.5" />
            </button>

            {/* Join as Vendor Button (Green with White Text) */}
            <button
              onClick={() => {
                setView("signup");
              }}
              className="text-sm px-4 py-2 rounded-lg bg-[#008236] hover:bg-[#006c2c] text-white font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <span>Join as Vendor</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          {/* Mobile Hamburger Drawer Trigger */}
          <div className="flex md:hidden items-center">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-2 rounded-lg text-foreground hover:bg-secondary border border-border/60 transition-colors focus:outline-none"
                  aria-label="Open Navigation Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:max-w-md p-0 flex flex-col">
              {/* Drawer Header */}
              <SheetHeader className="p-4 border-b border-border/80 bg-secondary/30">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="Anovra Logo"
                    className="h-11 w-auto object-contain"
                  />
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                </div>
              </SheetHeader>

              {/* Drawer Scrollable Links Content */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                {/* Main Navigation */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1">
                    Navigation
                  </p>
                  {primaryNavLinks.map((l) => {
                    const Icon = l.icon;
                    return (
                      <button
                        key={l.id}
                        onClick={() => handleNavClick(l.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                          view === l.id
                            ? "bg-emerald-500 text-white font-bold shadow-xs"
                            : "text-foreground hover:bg-secondary"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0",
                            view === l.id ? "text-white" : "text-muted-foreground"
                          )}
                        />
                        <span>{l.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sign In Options */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 pb-1">
                    Account Sign In
                  </p>
                  <button
                    onClick={() => handleNavClick("customerlogin")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary text-left"
                  >
                    <User className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sign in as a User</span>
                  </button>
                  <button
                    onClick={() => handleNavClick("vendorlogin")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary text-left"
                  >
                    <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sign in as a Vendor</span>
                  </button>
                  <button
                    onClick={() => handleNavClick("brandlogin")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary text-left"
                  >
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sign in as a Brand HQ</span>
                  </button>
                </div>

                {/* CTA Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => handleNavClick("skintest")}
                    className="w-full py-3 rounded-xl border-2 border-[#008236] text-[#008236] font-bold hover:bg-[#008236]/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Analyse Skin</span>
                    <Scan className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      handleNavClick("signup");
                    }}
                    className="w-full py-3 rounded-xl bg-[#008236] text-white font-bold hover:bg-[#006c2c] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Join as Vendor</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

function ScrollToTopButton({ hidden }: { hidden?: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 360);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (hidden) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 w-11 h-11 rounded-full bg-accent text-white shadow-lg shadow-black/10 border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-accent/95 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring active:scale-95",
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-90 pointer-events-none"
      )}
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}

export default function App() {
  const getViewFromHash = (): View => {
    const isSystemDomain = [
      "anovra.africa",
      "www.anovra.africa",
      "localhost",
      "127.0.0.1"
    ].includes(window.location.hostname) || 
    window.location.hostname === "anovra-api.vercel.app" ||
    window.location.hostname.endsWith(".vercel.app") ||
    window.location.hostname.endsWith(".local") || 
    window.location.hostname.includes("webcontainer") || 
    window.location.hostname.includes("stackblitz");

    // Client-side fallback redirect for direct non-hash URLs (handles server redirects/fallbacks)
    const path = window.location.pathname;
    if (path.startsWith("/shop/")) {
      const slug = path.replace("/shop/", "").split("/")[0];
      sessionStorage.setItem("active_shop_slug", slug);
      window.location.href = window.location.origin + `/#/shop/${slug}`;
      return "shop";
    }
    if (path.startsWith("/scan/")) {
      const slug = path.replace("/scan/", "").split("/")[0];
      sessionStorage.setItem("active_scan_slug", slug);
      window.location.href = window.location.origin + `/#/scan/${slug}`;
      return "skintest";
    }
    if (path.startsWith("/brand/")) {
      const slug = path.replace("/brand/", "").split("/")[0];
      sessionStorage.setItem("active_brand_slug", slug);
      window.location.href = window.location.origin + `/#/brand/${slug}`;
      return "brand";
    }
    if (path === "/auth/callback") {
      return "verifyemail";
    }

    const hash = window.location.hash.replace("#", "").replace(/^\//, "");
    if (hash.startsWith("shop/")) {
      const slug = hash.replace("shop/", "").split("?")[0];
      sessionStorage.setItem("active_shop_slug", slug);
      return "shop";
    }
    if (hash.startsWith("scan/")) {
      const slug = hash.replace("scan/", "").split("?")[0];
      sessionStorage.setItem("active_scan_slug", slug);
      return "skintest";
    }
    if (hash.startsWith("brand/")) {
      const slug = hash.replace("brand/", "").split("?")[0];
      sessionStorage.setItem("active_brand_slug", slug);
      return "brand";
    }
    if (hash.startsWith("team/")) {
      const slug = hash.replace("team/", "").split("?")[0];
      sessionStorage.setItem("active_team_slug", slug);
      return "teamlogin";
    }
    const validViews: View[] = [
      "landing", "dashboard", "catalog", "skintest", "admin",
      "adminlogin", "shop", "brand", "signin", "vendorlogin", "brandlogin", "customerlogin", "signup", "brandsignup", "customersignup", "verifyemail", "forgotpassword",
      "resetpassword", "teamlogin", "teamdashboard", "branddashboard", "about", "contact", "faq",
      "userdashboard"
    ];
    
    if (validViews.includes(hash as View)) {
      return hash as View;
    }
    
    // If on a custom domain, default to storefront shop view instead of main Anovra landing page
    return !isSystemDomain ? "shop" : "landing";
  };

  const [view, setViewState] = useState<View>(getViewFromHash);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [view]);
  const protectedViews: View[] = ["dashboard", "catalog", "skintest", "userdashboard", "admin", "teamdashboard", "branddashboard"];
  const [isValidatingRoute, setIsValidatingRoute] = useState(() => protectedViews.includes(getViewFromHash()));

  const setView = (v: View) => {
    if (protectedViews.includes(v)) setIsValidatingRoute(true);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setViewState(v);
    if (v === "landing") {
      clearCustomerScan();
      if (window.location.hash) {
        window.history.pushState(null, "", window.location.pathname);
      }
    } else if (v === "shop") {
      const slug = sessionStorage.getItem("active_shop_slug");
      window.location.hash = slug ? `#/shop/${slug}` : "#/shop";
    } else if (v === "brand") {
      const slug = sessionStorage.getItem("active_brand_slug");
      window.location.hash = slug ? `#/brand/${slug}` : "#/brand";
    } else if (v === "skintest") {
      const slug = view === "shop" || view === "brand" ? sessionStorage.getItem("active_scan_slug") : null;
      if (!slug) sessionStorage.removeItem("active_scan_slug");
      window.location.hash = slug ? `#/scan/${slug}` : "#/skintest";
    } else {
      window.location.hash = `#/${v}`;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const nextView = getViewFromHash();
      if (protectedViews.includes(nextView)) setIsValidatingRoute(true);
      setViewState(nextView);
    };
    window.addEventListener("hashchange", handleHashChange);

    // Inactivity Session Timeout of 30 Minutes
    let timeoutId: any;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.auth.signOut();
          setViewState("landing");
          window.location.hash = "";
          toast.error("Your session has expired due to 30 minutes of inactivity. Please sign in again.");
        }
      }, 30 * 60 * 1000); // 30 minutes
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    const setupInactivityTracker = () => {
      const currentHash = window.location.hash.replace("#", "").replace(/^\//, "");
      const isDashboardView = ["dashboard", "userdashboard", "teamdashboard", "branddashboard", "admin", "catalog"].includes(currentHash);
      if (isDashboardView) {
        events.forEach((event) => document.addEventListener(event, resetTimer));
        resetTimer();
      } else {
        clearTimeout(timeoutId);
        events.forEach((event) => document.removeEventListener(event, resetTimer));
      }
    };

    setupInactivityTracker();
    window.addEventListener("hashchange", setupInactivityTracker);

    // Parse email verification redirect params
    const handleEmailConfirmation = async () => {
      const callbackUrl = new URL(window.location.href);
      const code = callbackUrl.searchParams.get("code");
      const fragment = new URLSearchParams(callbackUrl.hash.replace(/^#/, ""));
      const isSignup = callbackUrl.searchParams.get("type") === "signup" || fragment.get("type") === "signup";
      const routeAfterAuth = (target: View) => {
        if (protectedViews.includes(target)) setIsValidatingRoute(true);
        setViewState(target);
        window.history.replaceState(null, "", `${window.location.origin}/#/${target}`);
      };
      if (isSignup || code || callbackUrl.pathname === "/auth/callback") {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              toast.error("This verification link has expired or has already been used. Please sign in or request a new link.");
              routeAfterAuth("verifyemail");
              return;
            }
          }
        } else if (fragment.get("access_token") && fragment.get("refresh_token")) {
          const { error } = await supabase.auth.setSession({
            access_token: fragment.get("access_token") || "",
            refresh_token: fragment.get("refresh_token") || "",
          });
          if (error) {
            toast.error("This verification link could not be completed. Please sign in or request a new link.");
            routeAfterAuth("verifyemail");
            return;
          }
        }
        if (!code) await new Promise((resolve) => setTimeout(resolve, 600));
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          sessionStorage.setItem("show_welcome", "true");

          let teamMemberRole: string | null = null;
          try {
            const { data: member } = await supabase
              .from("team_members")
              .select("role")
              .eq("email", user.email)
              .maybeSingle();
            if (member) teamMemberRole = member.role;
          } catch (e) {
            console.warn("Session check team member lookup failed:", e);
          }

          let resolvedRole = user.user_metadata?.role || user.app_metadata?.role || "customer";
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("account_type, business_name")
              .eq("id", user.id)
              .maybeSingle();

            if (profile?.account_type === "brand") {
              resolvedRole = "brand";
            } else if (profile?.account_type === "vendor" || profile?.account_type === "branch" || profile?.business_name) {
              resolvedRole = "vendor";
            }
          } catch (e) {
            console.warn("Session check profile role lookup failed:", e);
          }

          if (resolvedRole === "brand") {
            routeAfterAuth("branddashboard");
          } else if (resolvedRole === "vendor") {
            routeAfterAuth("dashboard");
          } else if (teamMemberRole === "Manager" || teamMemberRole === "Viewer") {
            routeAfterAuth("dashboard");
          } else if (teamMemberRole === "Representative") {
            routeAfterAuth("teamdashboard");
          } else {
            routeAfterAuth(consumeCustomerScan() ? "skintest" : "userdashboard");
          }
        } else {
          toast.error("We could not verify this link. Please request a new confirmation email or sign in if you have already verified.");
          routeAfterAuth("verifyemail");
        }
      }
    };
    void handleEmailConfirmation();

    // Capture referral query parameter from URL
    const captureReferral = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      let ref = urlParams.get("ref");
      if (!ref && window.location.hash.includes("?")) {
        const hashQuery = window.location.hash.split("?")[1];
        const hashParams = new URLSearchParams(hashQuery);
        ref = hashParams.get("ref");
      }
      if (ref) {
        const cleanRef = ref.trim();
        sessionStorage.setItem("referral_code", cleanRef);
        
        // Record link click once per session to prevent abuse
        if (!sessionStorage.getItem("referral_recorded")) {
          sessionStorage.setItem("referral_recorded", "true");
          try {
            await supabase.functions.invoke("track-referral-event", { body: {
              referral_code: cleanRef,
              event_type: "link_click",
              city: "Nigeria",
              metadata: { user_agent: navigator.userAgent },
            } });
          } catch (e) {
            console.warn("Failed to record link click event:", e);
          }
        }
      }
    };
    captureReferral();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("hashchange", setupInactivityTracker);
      clearTimeout(timeoutId);
      events.forEach((event) => document.removeEventListener(event, resetTimer));
    };
  }, []);

  useEffect(() => {
    const enforceRouteAccess = async () => {
      if (!protectedViews.includes(view)) {
        setIsValidatingRoute(false);
        return;
      }

      setIsValidatingRoute(true);
      try {
        const isPublicVendorScan = view === "skintest" && /^#\/scan\/[^/?#]+/.test(window.location.hash);
        if (isPublicVendorScan) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (view === "skintest") {
            rememberCustomerScan();
            toast.error("Sign in or create a customer account to start your skin test.");
            setViewState("customerlogin");
            window.location.hash = "#/customerlogin";
          } else if (view === "userdashboard") {
            toast.error("Sign in to open your customer dashboard.");
            setViewState("customerlogin");
            window.location.hash = "#/customerlogin";
          } else if (view === "teamdashboard") {
            toast.error("Staff login required.");
            setViewState("teamlogin");
            window.location.hash = "#/teamlogin";
          } else {
            toast.error("Please sign up to continue.");
            setViewState("signup");
            window.location.hash = "#/signup";
          }
          return;
        }

        if (view === "skintest" && !user.email_confirmed_at) {
          rememberCustomerScan();
          sessionStorage.setItem("pending_verification_email", user.email || "");
          sessionStorage.setItem("pending_verification_kind", "customer");
          toast.error("Verify your email before starting your skin test.");
          setViewState("verifyemail");
          window.location.hash = "#/verifyemail";
          return;
        }

        const metadataRole = user.app_metadata?.role || user.user_metadata?.role;
        let role = metadataRole;
        const email = user.email?.toLowerCase();

        const { data: accessProfile } = await supabase
          .from("profiles")
          .select("account_type, business_name, branch_status, verification_status, parent_brand_id")
          .eq("id", user.id)
          .maybeSingle();

        if (metadataRole === "admin") {
          role = "admin";
        } else if (metadataRole === "vendor_staff") {
          role = "vendor_staff";
        } else if (accessProfile?.account_type === "brand") {
          role = "brand";
        } else if (accessProfile?.account_type === "vendor" || accessProfile?.account_type === "branch" || accessProfile?.business_name) {
          role = "vendor";
        } else {
          role = metadataRole || "customer";
        }

        if (["suspended", "banned"].includes(accessProfile?.verification_status || "")) {
          const accountState = accessProfile?.verification_status === "banned" ? "banned" : "suspended";
          await supabase.auth.signOut();
          toast.error(`This account has been ${accountState}. Check your email for the decision details or contact Anovra support.`);
          const loginView = role === "brand" ? "brandlogin" : role === "vendor" || role === "vendor_staff" ? "vendorlogin" : "customerlogin";
          setViewState(loginView);
          window.location.hash = `#/${loginView}`;
          return;
        }

        if (accessProfile?.account_type === "branch" && accessProfile.parent_brand_id) {
          const { data: parentBrand } = await supabase
            .from("profiles")
            .select("verification_status")
            .eq("id", accessProfile.parent_brand_id)
            .maybeSingle();
          if (["suspended", "banned"].includes(parentBrand?.verification_status || "")) {
            await supabase.auth.signOut();
            toast.error("This branch is unavailable while its Brand HQ account is under review.");
            setViewState("vendorlogin");
            window.location.hash = "#/vendorlogin";
            return;
          }
        }

        // Resolve admin role
        const isAdmin = role === "admin" || user.app_metadata?.role === "admin" || email === "admin@anovra.africa" || email === "hello@anovra.africa";

        // Resolve staff role
        let isStaff = false;
        try {
          const { data: staff } = await supabase
            .from("admin_team")
            .select("status")
            .or(`email.eq."${email}",username.eq."${email}"`)
            .maybeSingle();
          if (staff && staff.status === "active") isStaff = true;
        } catch (err) {}

        // Resolve team representative staff role
        let isTeamStaff = false;
        try {
          const { data: member } = await supabase
            .from("team_members")
            .select("role, status")
            .eq("email", email)
            .limit(1)
            .maybeSingle();
          if (member?.status === "active" && (member.role === "Manager" || member.role === "Viewer")) {
            isTeamStaff = true;
          }
        } catch (err) {}

        if (role === "vendor_staff" && !isTeamStaff) {
          await supabase.auth.signOut();
          toast.error("Your branch team access is no longer active.");
          setViewState("vendorlogin");
          window.location.hash = "#/vendorlogin";
          return;
        }

        const userRole = role || "customer";

        const redirectLoggedInUserToDashboard = () => {
          if (role === "brand") {
            setViewState("branddashboard");
            window.location.hash = "#/branddashboard";
          } else if (role === "vendor" || isTeamStaff) {
            setViewState("dashboard");
            window.location.hash = "#/dashboard";
          } else if (isStaff) {
            setViewState("teamdashboard");
            window.location.hash = "#/teamdashboard";
          } else if (isAdmin) {
            setViewState("admin");
            window.location.hash = "#/admin";
          } else {
            setViewState("userdashboard");
            window.location.hash = "#/userdashboard";
          }
        };

        // 1. Customer views (userdashboard) -> Only customer accounts
        if (view === "userdashboard") {
          if (userRole !== "customer" || isAdmin || isStaff) {
            toast.error("Customer profile required for customer dashboard. Redirecting to your account dashboard.");
            redirectLoggedInUserToDashboard();
            return;
          }
        }

        // 2. Vendor views (dashboard, catalog) -> Only vendors or manager/viewer team staff
        if (view === "dashboard" || view === "catalog") {
          if (role !== "vendor" && !isTeamStaff) {
            toast.error("Vendor portal access restricted. Redirecting to your account dashboard.");
            redirectLoggedInUserToDashboard();
            return;
          }
          if (role === "vendor") {
            if (accessProfile?.account_type === "branch" && accessProfile.branch_status !== "active") {
              await supabase.auth.signOut();
              toast.error("This branch workspace is not active. Contact your Brand Admin.");
              setViewState("vendorlogin");
              window.location.hash = "#/vendorlogin";
              return;
            }
          }
        }

        // 3. Brand organisation views -> Only brand profiles
        if (view === "branddashboard") {
          if (role !== "brand" && !isAdmin) {
            toast.error("Brand workspace access restricted. Redirecting to your account dashboard.");
            redirectLoggedInUserToDashboard();
            return;
          }
        }

        // 4. Admin views (admin) -> Only admin profiles
        if (view === "admin") {
          if (!isAdmin) {
            toast.error("Administrative access required. Redirecting to your account dashboard.");
            redirectLoggedInUserToDashboard();
            return;
          }
        }

        // 5. Team field staff views (teamdashboard) -> Only staff members
        if (view === "teamdashboard") {
          const { data: membership } = await supabase
            .from("team_members")
            .select("id, status")
            .eq("email", user.email)
            .maybeSingle();
          const hasActiveMembership = membership && membership.status !== "suspended";
          if (!hasActiveMembership && !isStaff && !isAdmin) {
            toast.error("Staff field workspace credentials required. Redirecting to your account dashboard.");
            await supabase.auth.signOut();
            setViewState("teamlogin");
            window.location.hash = "#/teamlogin";
          }
        }
      } catch (err) {
        console.error("Route access check failed:", err);
        if (view === "skintest" && !/^#\/scan\/[^/?#]+/.test(window.location.hash)) {
          rememberCustomerScan();
          toast.error("We could not verify your session. Please sign in to start your skin test.");
          setViewState("customerlogin");
          window.location.hash = "#/customerlogin";
        } else if (view === "userdashboard") {
          toast.error("We could not verify your session. Please sign in again.");
          setViewState("customerlogin");
          window.location.hash = "#/customerlogin";
        }
      } finally {
        setIsValidatingRoute(false);
      }
    };
    enforceRouteAccess();
  }, [view]);

  const isSystemDomain = [
    "anovra.africa",
    "www.anovra.africa",
    "localhost",
    "127.0.0.1"
  ].includes(window.location.hostname) || 
  window.location.hostname === "anovra-api.vercel.app" ||
  window.location.hostname.endsWith(".vercel.app") ||
  window.location.hostname.endsWith(".local") || 
  window.location.hostname.includes("webcontainer") || 
  window.location.hostname.includes("stackblitz");

  const hideNav = [
    "skintest",
    "dashboard",
    "userdashboard",
    "catalog",
    "admin",
    "shop",
    "brand",
    "signin",
    "vendorlogin",
    "brandlogin",
    "customerlogin",
    "signup",
    "brandsignup",
    "customersignup",
    "verifyemail",
    "forgotpassword",
    "resetpassword",
    "adminlogin",
    "teamlogin",
    "teamdashboard",
    "branddashboard",
  ].includes(view) || !isSystemDomain;

  if (isValidatingRoute) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-3">
        <div className="w-8 h-8 border-3 border-[#008236] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-medium animate-pulse" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Verifying account credentials...
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <Toaster position="top-right" closeButton richColors />
      {!hideNav && <Nav view={view} setView={setView} />}
      <div className="flex-1">
        {view === "landing" && <LandingView setView={setView} />}
        {view === "about" && <AboutView setView={setView} />}
        {view === "contact" && <ContactView setView={setView} />}
        {view === "faq" && <FAQView setView={setView} />}
        {view === "dashboard" && <DashboardView setView={setView} />}
        {view === "catalog" && <CatalogView setView={setView} />}
        {view === "skintest" && <SkinTestView setView={setView} />}
        {view === "adminlogin" && <SignInView setView={setView} />}
        {view === "admin" && <AdminView setView={setView} />}
        {view === "shop" && <ShopView setView={setView} />}
        {view === "brand" && <BrandPublicView setView={setView} />}
        {view === "signin" && <SignInView setView={setView} />}
        {view === "vendorlogin" && <SignInView setView={setView} accountKind="vendor" />}
        {view === "brandlogin" && <SignInView setView={setView} accountKind="brand" />}
        {view === "customerlogin" && <SignInView setView={setView} accountKind="customer" />}
        {view === "signup" && <SignUpView setView={setView} accountKind="vendor" />}
        {view === "brandsignup" && <SignUpView setView={setView} accountKind="brand" />}
        {view === "customersignup" && <CustomerSignUpView setView={setView} />}
        {view === "verifyemail" && <EmailVerificationPendingView setView={setView} />}
        {view === "forgotpassword" && <ForgotPasswordView setView={setView} />}
        {view === "resetpassword" && <ResetPasswordView setView={setView} />}
        {view === "teamlogin" && <TeamLoginView setView={setView} />}
        {view === "teamdashboard" && <TeamDashboardView setView={setView} />}
        {view === "branddashboard" && <BrandDashboardView setView={setView} />}
        {view === "userdashboard" && <UserDashboardView setView={setView} />}
      </div>
      <ScrollToTopButton hidden={view === "admin"} />
      {!hideNav && <Footer setView={setView} />}
    </div>
  );
}
