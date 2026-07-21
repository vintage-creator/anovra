import { useState } from "react";
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
} from "lucide-react";
import { type View, cn } from "./types";
import { LandingView } from "./LandingView";
import { ShopView } from "./ShopView";
import { DashboardView } from "./DashboardView";
import { CatalogView } from "./CatalogView";
import { SkinTestView } from "./SkinTestView";
import { SignUpView, SignInView } from "./AuthViews";
import { TeamLoginView, TeamDashboardView } from "./TeamViews";
import { AboutView, ContactView } from "./ContentViews";
import { AdminLoginView } from "./AdminLoginView";
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
    { id: "userdashboard", label: "My Skin", icon: User },
    { id: "catalog", label: "Product Catalog", icon: ShoppingBag },
    { id: "skintest", label: "Skin Test", icon: TestTube },
  ];

  const handleNavClick = (v: View) => {
    setView(v);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
        {/* Brand Logo Only */}
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

        {/* Desktop Primary Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {primaryNavLinks.map((l) => (
            <button
              key={l.id}
              onClick={() => setView(l.id)}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                view === l.id
                  ? "bg-emerald-500 text-amber-950 font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              )}
            >
              {l.label}
            </button>
          ))}
        </nav>

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

          {/* Join as Vendor Button (Green with Dark Text) */}
          <button
            onClick={() => setView("signup")}
            className="text-sm px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-amber-950 font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <span>Join as a Vendor</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-950" />
          </button>
        </div>

        {/* Mobile Hamburger Drawer Trigger */}
        <div className="flex md:hidden items-center gap-2">
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
                            ? "bg-emerald-500 text-amber-950 font-bold shadow-xs"
                            : "text-foreground hover:bg-secondary"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0",
                            view === l.id ? "text-amber-950" : "text-muted-foreground"
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

                {/* CTA Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleNavClick("signup")}
                    className="w-full py-3 rounded-xl bg-emerald-500 text-amber-950 font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Join as a Vendor</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [view, setView] = useState<View>("landing");

  const hideNav = ["shop", "signin", "signup", "adminlogin", "teamlogin", "teamdashboard"].includes(view);

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {!hideNav && <Nav view={view} setView={setView} />}
      <div className="flex-1">
        {view === "landing" && <LandingView setView={setView} />}
        {view === "about" && <AboutView setView={setView} />}
        {view === "contact" && <ContactView setView={setView} />}
        {view === "dashboard" && <DashboardView setView={setView} />}
        {view === "catalog" && <CatalogView />}
        {view === "skintest" && <SkinTestView />}
        {view === "adminlogin" && <AdminLoginView setView={setView} />}
        {view === "admin" && <AdminView />}
        {view === "shop" && <ShopView setView={setView} />}
        {view === "signin" && <SignInView setView={setView} />}
        {view === "signup" && <SignUpView setView={setView} />}
        {view === "teamlogin" && <TeamLoginView setView={setView} />}
        {view === "teamdashboard" && <TeamDashboardView setView={setView} />}
        {view === "userdashboard" && <UserDashboardView setView={setView} />}
      </div>
      <Footer setView={setView} />
    </div>
  );
}
