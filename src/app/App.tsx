import { useState, useEffect } from "react";
import {
  Menu,
  ChevronDown,
  Sparkles,
  User,
  Store,
  ShieldCheck,
  Users,
  ShoppingBag,
  TestTube,
  Home,
  Info,
  Mail,
  ArrowRight,
  Scan,
} from "lucide-react";
import { type View, cn } from "./types";
import { Toaster } from "./components/ui/sonner";
import { LandingView } from "./LandingView";
import { ShopView } from "./ShopView";
import { DashboardView } from "./DashboardView";
import { CatalogView } from "./CatalogView";
import { SkinTestView } from "./SkinTestView";
import { SignUpView, CustomerSignUpView, SignInView, ForgotPasswordView, ResetPasswordView } from "./AuthViews";
import { TeamLoginView, TeamDashboardView } from "./TeamViews";
import { supabase } from "./utils/supabase";
import { AboutView, ContactView } from "./ContentViews";
import { AdminView } from "./AdminView";
import { UserDashboardView } from "./UserDashboardView";
import { Footer } from "./Footer";
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
            className="h-12 sm:h-14 md:h-16 w-auto object-contain transition-transform group-hover:scale-105"
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
                  onClick={() => setView("userdashboard")}
                  className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-700"
                >
                  <User className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-sm font-medium">Sign in as a User</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setView("signin")}
                  className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-700"
                >
                  <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-sm font-medium">Sign in as a Vendor</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Analyze Skin Button (Secondary Outline Button) */}
            <button
              onClick={() => setView("skintest")}
              className="text-sm px-4 py-2 rounded-lg border-2 border-[#008236] text-[#008236] hover:bg-[#008236]/10 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <span>Analyze Skin</span>
              <Scan className="w-3.5 h-3.5" />
            </button>

            {/* Join as Vendor Button (Green with White Text) */}
            <button
              onClick={() => setView("signup")}
              className="text-sm px-4 py-2 rounded-lg bg-[#008236] hover:bg-[#006c2c] text-white font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <span>Join as a Vendor</span>
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
                    className="h-9 w-auto object-contain"
                  />
                  <SheetTitle
                    className="text-base font-bold tracking-tight text-foreground text-left"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    Anovra Navigation
                  </SheetTitle>
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
                    onClick={() => handleNavClick("userdashboard")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary text-left"
                  >
                    <User className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sign in as a User</span>
                  </button>
                  <button
                    onClick={() => handleNavClick("signin")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-secondary text-left"
                  >
                    <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sign in as a Vendor</span>
                  </button>
                </div>

                {/* CTA Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => handleNavClick("skintest")}
                    className="w-full py-3 rounded-xl border-2 border-[#008236] text-[#008236] font-bold hover:bg-[#008236]/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Analyze Skin</span>
                    <Scan className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleNavClick("signup")}
                    className="w-full py-3 rounded-xl bg-[#008236] text-white font-bold hover:bg-[#006c2c] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Join as a Vendor</span>
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

export default function App() {
  const getViewFromHash = (): View => {
    const hash = window.location.hash.replace("#", "").replace(/^\//, "");
    const validViews: View[] = [
      "landing", "dashboard", "catalog", "skintest", "admin",
      "adminlogin", "shop", "signin", "signup", "customersignup", "forgotpassword",
      "resetpassword", "teamlogin", "teamdashboard", "about", "contact",
      "userdashboard"
    ];
    return validViews.includes(hash as View) ? (hash as View) : "landing";
  };

  const [view, setViewState] = useState<View>(getViewFromHash);

  const setView = (v: View) => {
    setViewState(v);
    if (v === "landing") {
      if (window.location.hash) {
        window.history.pushState(null, "", window.location.pathname);
      }
    } else {
      window.location.hash = `#/${v}`;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      setViewState(getViewFromHash());
    };
    window.addEventListener("hashchange", handleHashChange);

    // Parse email verification redirect params
    const handleEmailConfirmation = async () => {
      const urlStr = window.location.href;
      if (urlStr.includes("type=signup") || urlStr.includes("code=")) {
        // Wait briefly for Supabase client to process authentication tokens
        await new Promise((r) => setTimeout(r, 600));
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          sessionStorage.setItem("show_welcome", "true");
          const role = user.user_metadata?.role || "customer";
          if (role === "vendor") {
            setView("dashboard");
          } else {
            setView("userdashboard");
          }
          // Clean the URL by stripping signup query parameters
          window.history.replaceState(null, "", window.location.pathname + window.location.hash);
        }
      }
    };
    handleEmailConfirmation();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const hideNav = [
    "skintest",
    "dashboard",
    "userdashboard",
    "catalog",
    "admin",
    "shop",
    "signin",
    "signup",
    "customersignup",
    "forgotpassword",
    "resetpassword",
    "adminlogin",
    "teamlogin",
    "teamdashboard",
  ].includes(view);

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
        {view === "dashboard" && <DashboardView setView={setView} />}
        {view === "catalog" && <CatalogView setView={setView} />}
        {view === "skintest" && <SkinTestView setView={setView} />}
        {view === "adminlogin" && <SignInView setView={setView} />}
        {view === "admin" && <AdminView setView={setView} />}
        {view === "shop" && <ShopView setView={setView} />}
        {view === "signin" && <SignInView setView={setView} />}
        {view === "signup" && <SignUpView setView={setView} />}
        {view === "customersignup" && <CustomerSignUpView setView={setView} />}
        {view === "forgotpassword" && <ForgotPasswordView setView={setView} />}
        {view === "resetpassword" && <ResetPasswordView setView={setView} />}
        {view === "teamlogin" && <TeamLoginView setView={setView} />}
        {view === "teamdashboard" && <TeamDashboardView setView={setView} />}
        {view === "userdashboard" && <UserDashboardView setView={setView} />}
      </div>
      {!hideNav && <Footer setView={setView} />}
    </div>
  );
}
