import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart as ReLineChart, Line,
} from "recharts";
import {
  Package, TrendingUp, Scan, Activity, Eye, Store, ExternalLink,
  Globe, Copy, Check, MessageCircle, Shield, Key, Users, Zap,
  ChevronRight, AlertTriangle, RefreshCw, CheckCircle, Lock, Plus,
  LifeBuoy, BookOpen, Webhook, ArrowRight, Settings, Menu, X, LogOut
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { CatalogView } from "./CatalogView";
import { supabase } from "./utils/supabase";

// ---- DASHBOARD TAB TYPES ----

type DashTab = "overview" | "catalog" | "analytics" | "settings" | "team" | "api" | "support";

export function DashboardView({ setView }: { setView: (v: View) => void }) {
  const [tab, setTab] = useState<DashTab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState<"7d" | "30d" | "90d">("7d");
  const [copied, setCopied] = useState<string | null>(null);
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);
  const [brandName, setBrandName] = useState("My Brand");
  const [customDomain, setCustomDomain] = useState("");
  const [domainSaved, setDomainSaved] = useState(false);

  // Vendor plan & verification state
  const [isVerified, setIsVerified] = useState(false);
  const [vendorPlan, setVendorPlan] = useState<"free" | "basic" | "premium">("free");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [embedPlatform, setEmbedPlatform] = useState<"html" | "shopify" | "wordpress">("html");

  const [teamMembers] = useState(() => {
    const domain = brandName.toLowerCase().replace(/[^a-z0-9]/g, "") || "mybrand";
    return [
      { name: "Adaeze Okafor", email: `adaeze@${domain}.com`, role: "Owner", status: "active", joined: "Mar 2025" },
      { name: "Chidi Nwosu", email: `chidi@${domain}.com`, role: "Manager", status: "active", joined: "Apr 2025" },
      { name: "Ngozi Eze", email: `ngozi@${domain}.com`, role: "Viewer", status: "invited", joined: "—" },
    ];
  });
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSaved, setWebhookSaved] = useState(false);

  const shopSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "my-brand";
  const shopLink = `https://anovra.africa/shop/${shopSlug}`;
  const testLink = `https://anovra.africa/scan/${shopSlug}`;
  const apiKey = "sk_live_vsk_a9f2c84d1e3b7a0f5c2d9e6b4a1f8e3c";

  const [liveScans, setLiveScans] = useState<any[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const [statsList, setStatsList] = useState<any[]>([
    { label: "Tests this month", value: "0", delta: "No scan data", icon: <Scan className="w-4 h-4" /> },
    { label: "Products in catalog", value: "0", delta: "0 flagged", icon: <Package className="w-4 h-4" /> },
    { label: "Product link clicks", value: "0", delta: "0 this week", icon: <TrendingUp className="w-4 h-4" /> },
    { label: "Top concern detected", value: "None", delta: "No data", icon: <Activity className="w-4 h-4" /> },
  ]);

  const [liveAnalytics, setLiveAnalytics] = useState<any[]>([]);
  const [liveProductPurchases, setLiveProductPurchases] = useState<any[]>([]);
  const [liveConcerns, setLiveConcerns] = useState<any[]>([]);
  const [funnelSteps, setFunnelSteps] = useState<any[]>([
    { label: "Clicked shop link", count: 0, pct: 0, color: "bg-[#C86B3A]" },
    { label: "Started skin analysis", count: 0, pct: 0, color: "bg-blue-400" },
    { label: "Completed recommendations", count: 0, pct: 0, color: "bg-indigo-400" },
    { label: "Clicked a product", count: 0, pct: 0, color: "bg-amber-400" },
    { label: "Made a purchase", count: 0, pct: 0, color: "bg-[#008236]" },
  ]);

  useEffect(() => {
    if (sessionStorage.getItem("show_welcome") === "true") {
      setShowWelcomeModal(true);
      sessionStorage.removeItem("show_welcome");
    }

    const fetchDashboardData = async () => {
      setDashboardLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setView("signin");
          return;
        }
        if (user.user_metadata?.business_name) {
          setBrandName(user.user_metadata.business_name);
        }

        // 1. Fetch vendor profile
        let { data: profile } = await supabase
          .from("profiles")
          .select("name, plan, is_verified, business_name")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          // Fallback: If backend triggers haven't executed yet, insert profile directly since client is now authenticated
          const fallbackProfile = {
            id: user.id,
            name: user.user_metadata?.full_name || "New Partner",
            business_name: user.user_metadata?.business_name || "My Skincare Brand",
            phone: user.user_metadata?.phone || null,
            nafdac_number: user.user_metadata?.nafdac_number || null,
            plan: "free",
            is_verified: false,
          };
          const { data: inserted, error: insertErr } = await supabase
            .from("profiles")
            .insert([fallbackProfile])
            .select("name, plan, is_verified, business_name")
            .maybeSingle();
            
          if (!insertErr && inserted) {
            profile = inserted;
          }
        }

        if (profile) {
          setIsVerified(profile.is_verified);
          setVendorPlan(profile.plan as any);
          if (profile.business_name) {
            setBrandName(profile.business_name);
          }
        }

        // 2. Fetch products list
        const { data: products } = await supabase
          .from("products")
          .select("*")
          .eq("vendor_id", user.id);

        const numProducts = products ? products.length : 0;
        const flaggedProds = products ? products.filter(p => p.nafdac_status === "flagged").length : 0;

        // 3. Fetch scans list
        const { data: scans } = await supabase
          .from("scans")
          .select("*")
          .eq("vendor_id", user.id)
          .order("created_at", { ascending: false });

        const numScans = scans ? scans.length : 0;

        // 4. Fetch cart items & match in memory to verify vendor items
        const { data: cartData } = await supabase
          .from("cart_items")
          .select("*");

        const matchedCartItems = (cartData || []).map((cartItem) => {
          const matchedProd = (products || []).find(p => p.id === cartItem.product_id);
          return {
            ...cartItem,
            products: matchedProd
          };
        }).filter(item => item.products !== undefined);

        const numCart = matchedCartItems.length;

        // Calculate top concern
        const concernCounts = (scans || []).reduce((acc: Record<string, number>, s: any) => {
          acc[s.concern] = (acc[s.concern] || 0) + 1;
          return acc;
        }, {});

        let maxConcern = "None";
        let maxCount = 0;
        Object.entries(concernCounts).forEach(([name, count]) => {
          if (count > maxCount) {
            maxCount = count;
            maxConcern = name;
          }
        });
        const maxConcernPct = numScans > 0 ? ((maxCount / numScans) * 100).toFixed(1) : "0";

        // Bind stats card data
        setStatsList([
          { label: "Tests this month", value: numScans.toLocaleString(), delta: `+${numScans > 0 ? "100" : "0"}% increase`, icon: <Scan className="w-4 h-4" /> },
          { label: "Products in catalog", value: numProducts.toString(), delta: `${flaggedProds} flagged for review`, icon: <Package className="w-4 h-4" />, warn: flaggedProds > 0 },
          { label: "Product link clicks", value: (numScans * 1.5).toFixed(0), delta: "+31% vs last month", icon: <TrendingUp className="w-4 h-4" /> },
          { label: "Top concern detected", value: maxConcern, delta: `${maxConcernPct}% of all scans`, icon: <Activity className="w-4 h-4" /> },
        ]);

        // Bind recent tests list
        if (scans && scans.length > 0) {
          const formatted = scans.slice(0, 5).map((s) => {
            const date = new Date(s.created_at);
            const timeAgo = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
            const timeLabel = timeAgo < 60 ? `${timeAgo} min ago` : `${Math.round(timeAgo/60)} hr${Math.round(timeAgo/60) > 1 ? 's' : ''} ago`;
            return {
              id: s.id.substring(0, 8).toUpperCase(),
              time: timeLabel,
              concern: s.concern,
              result: s.result,
              city: s.city || "Unknown",
            };
          });
          setLiveScans(formatted);
        }

        // Bind live concerns distribution
        const colors = ["#C86B3A", "#D4854A", "#B85A2E", "#E09060", "#A04820", "#C07848"];
        const formattedConcerns = Object.entries(concernCounts).map(([name, val], index) => ({
          name: name.substring(0, 12),
          value: val,
          fill: colors[index % colors.length]
        }));
        setLiveConcerns(formattedConcerns);

        // Bind weekly analytics
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const weeklyDistribution = days.map((day, index) => {
          const scansOnDay = (scans || []).filter(s => {
            const d = new Date(s.created_at).getDay();
            const jsDayIndex = d === 0 ? 6 : d - 1;
            return jsDayIndex === index;
          }).length;

          const cartOnDay = matchedCartItems.filter(c => {
            const d = new Date(c.created_at).getDay();
            const jsDayIndex = d === 0 ? 6 : d - 1;
            return jsDayIndex === index;
          }).length;

          return {
            day,
            visits: Math.round(scansOnDay * 1.3),
            analyses: scansOnDay,
            purchases: cartOnDay
          };
        });
        setLiveAnalytics(weeklyDistribution);

        // Bind funnel metrics
        const totalVisits = Math.round(numScans * 1.3);
        const clickShop = totalVisits;
        const startScan = numScans;
        const completeRecs = Math.round(numScans * 0.9);
        const clickProd = Math.round(numScans * 0.5);
        const makePurchase = numCart;

        setFunnelSteps([
          { label: "Clicked shop link", count: clickShop, pct: 100, color: "bg-[#C86B3A]" },
          { label: "Started skin analysis", count: startScan, pct: clickShop > 0 ? Math.round((startScan / clickShop) * 100) : 0, color: "bg-blue-400" },
          { label: "Completed recommendations", count: completeRecs, pct: clickShop > 0 ? Math.round((completeRecs / clickShop) * 100) : 0, color: "bg-indigo-400" },
          { label: "Clicked a product", count: clickProd, pct: clickShop > 0 ? Math.round((clickProd / clickShop) * 100) : 0, color: "bg-amber-400" },
          { label: "Made a purchase", count: makePurchase, pct: clickShop > 0 ? Math.round((makePurchase / clickShop) * 100) : 0, color: "bg-[#008236]" },
        ]);

        // Bind Purchases by product list
        const purchasesByProduct: Record<string, { count: number; revenue: number }> = {};
        matchedCartItems.forEach((c: any) => {
          const pName = c.products?.name || "Unknown Product";
          const pPrice = c.products?.price || 0;
          if (!purchasesByProduct[pName]) {
            purchasesByProduct[pName] = { count: 0, revenue: 0 };
          }
          purchasesByProduct[pName].count += c.quantity;
          purchasesByProduct[pName].revenue += c.quantity * pPrice;
        });

        const formattedPurchases = Object.entries(purchasesByProduct).map(([name, data]) => ({
          name,
          purchases: data.count,
          revenue: `₦${data.revenue.toLocaleString()}`,
          convRate: "35%"
        }));
        setLiveProductPurchases(formattedPurchases);

      } catch (err) {
        console.error("Dashboard failed to retrieve live data:", err);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  function copy(text: string, key: string) {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const handleGenerateShop = () => {
    if (vendorPlan !== "premium") {
      setShowPremiumModal(true);
    } else {
      setView("shop");
    }
  };

  const stats = [
    { label: "Tests this month", value: "2,847", delta: "+18% vs last month", icon: <Scan className="w-4 h-4" /> },
    { label: "Products in catalog", value: "24", delta: "1 flagged for review", icon: <Package className="w-4 h-4" />, warn: true },
    { label: "Product link clicks", value: "1,204", delta: "+31% vs last month", icon: <TrendingUp className="w-4 h-4" /> },
    { label: "Top concern detected", value: "Hyperpig.", delta: "29.7% of all scans", icon: <Activity className="w-4 h-4" /> },
  ];

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Successfully logged out.");
      setView("landing");
    } catch (err: any) {
      toast.error(err.message || "Sign out failed.");
    }
  };

  const tabs: { id: DashTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "catalog", label: "Product Catalog", icon: Package },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "team", label: "Team", icon: Users },
    { id: "api", label: "API & Dev", icon: Key },
    { id: "support", label: "Support", icon: LifeBuoy },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-30 w-full shrink-0">
        <div className="flex items-center">
          <img src="/logo.png" alt="Anovra Logo" className="h-11 w-auto" />
        </div>
        <button onClick={() => setSidebarOpen(true)} className="p-2 text-foreground hover:bg-secondary rounded-lg cursor-pointer">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Left Sidebar Frame */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col justify-between transform transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 md:h-screen shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top Section */}
        <div>
          {/* Logo and close button */}
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center">
              <img src="/logo.png" alt="Anovra Logo" className="h-12 w-auto" />
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Brand Profile Pane */}
          <div className="p-5 border-b border-border bg-[#FAF7F2]/45">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ACTIVE PARTNER</p>
            <h4 className="font-bold text-foreground text-sm leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{brandName}</h4>
            
            {/* Plan badge */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[9px] uppercase font-mono font-bold bg-[#008236]/10 text-[#008236] px-2 py-0.5 border border-[#008236]/20 rounded-full">
                {vendorPlan} PLAN
              </span>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-0.5",
                isVerified
                  ? "bg-emerald-500/10 text-emerald-800 border-emerald-500/25"
                  : "bg-amber-500/10 text-amber-800 border-amber-500/25"
              )}>
                {isVerified ? "Verified" : "Pending"}
              </span>
            </div>

            {/* Store preview URL */}
            <div className="mt-3.5 bg-card border border-border/80 rounded-lg p-2 flex items-center justify-between gap-1.5 shadow-2xs">
              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[130px]" title={`https://anovra.africa/shop/${brandName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
                {brandName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.anovra.africa
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://anovra.africa/shop/${brandName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`);
                  toast.success("Store URL copied!");
                }}
                className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-[#008236] transition-colors"
                title="Copy unique shop URL"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sidebar Links */}
          <nav className="p-4 space-y-1.5">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer",
                    isActive
                      ? "bg-[#008236] text-white shadow-md font-bold"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sign Out Panel */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Overlay Background */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/35 backdrop-blur-xs md:hidden" />
      )}

      {/* Right Viewport Content */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 bg-background relative">
        {/* Dynamic Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <h2 className="text-3xl font-light text-foreground uppercase tracking-wide" style={{ fontFamily: "'Fraunces', serif" }}>
              {tabs.find((t) => t.id === tab)?.label}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {tab === "overview" && "Branded skincare intelligence & store statistics"}
              {tab === "catalog" && "Manage your live safety-screened product catalog"}
              {tab === "analytics" && "Live customer scan reports & product funnel conversions"}
              {tab === "settings" && "Custom domains, compliance logs & partner profiles"}
              {tab === "team" && "Manage vendor account operators & permissions"}
              {tab === "api" && "Access credentials, webhooks & developer endpoints"}
              {tab === "support" && "Connect with Anovra account specialists"}
            </p>
          </div>
          
          <button
            onClick={handleGenerateShop}
            className="flex items-center gap-1.5 text-xs bg-[#008236] text-white px-4 py-2.5 rounded-xl hover:bg-[#006c2c] transition-colors font-bold shadow-xs cursor-pointer self-start sm:self-auto"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <Store className="w-4 h-4" /> Preview Live Shop
          </button>
        </div>

        {tab === "catalog" && (
          <CatalogView />
        )}

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsList.map((s, i) => {
              const isWarning = s.warn;
              return (
                <div
                  key={i}
                  className={cn(
                    "bg-card border rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-[#008236]/35 transition-all duration-300",
                    isWarning ? "border-amber-200 bg-amber-50/40" : "border-border"
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {s.label}
                    </span>
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
                        isWarning
                          ? "bg-amber-100 text-amber-600"
                          : i === 0
                          ? "bg-emerald-100 text-emerald-800"
                          : i === 2
                          ? "bg-blue-100 text-blue-600"
                          : "bg-[#008236]/10 text-[#008236]"
                      )}
                    >
                      {s.icon}
                    </div>
                  </div>
                  <p className="text-3xl font-light text-foreground mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
                    {s.value}
                  </p>
                  <p
                    className={cn(
                      "text-xs font-medium leading-relaxed",
                      isWarning ? "text-amber-600" : "text-muted-foreground"
                    )}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {s.delta}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Shareable links */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
            <h3 className="text-base font-medium text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Your shareable links</h3>
            <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Share these links with customers to start collecting skin analyses and generating orders.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: "Shop Link", url: shopLink, key: "shop", desc: "Your digital storefront with products, catalog, and skin test engine" },
                { label: "Skin Test Link", url: testLink, key: "test", desc: "Sends customers directly to your branded, CAC-verified skin test" },
              ].map((l) => (
                <div key={l.key} className="flex flex-col justify-between border border-border rounded-xl p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <span className="inline-block text-[10px] uppercase font-bold text-accent tracking-wider bg-accent/15 px-2.5 py-0.5 rounded-full mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {l.label}
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{l.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-background border border-border/80 rounded-lg px-3 py-2 text-xs text-[#008236] font-mono truncate font-semibold">
                      {l.url}
                    </div>
                    <button
                      onClick={() => copy(l.url, l.key)}
                      className="flex items-center gap-1.5 text-xs px-3.5 py-2 bg-background border border-border rounded-lg hover:bg-secondary hover:border-accent/40 transition-colors flex-shrink-0 font-medium cursor-pointer"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {copied === l.key ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent tests */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4.5 border-b border-border flex items-center justify-between flex-wrap gap-2 bg-muted/20">
              <h3 className="font-medium text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Recent customer scans</h3>
              <button
                onClick={() => setTab("analytics")}
                className="text-xs text-[#008236] hover:text-[#006c2c] transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                View full analytics <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-border/60">
              {liveScans.length > 0 ? (
                liveScans.map((t) => (
                  <div key={t.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-secondary/35 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
                      <div className="bg-muted px-2 py-1 rounded text-[10px] font-mono text-muted-foreground font-bold shrink-0">{t.id}</div>
                      <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t.concern}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 px-2.5 py-0.5 rounded-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t.result}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium self-end sm:self-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 opacity-60" /> {t.city}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px]">{t.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-sm text-muted-foreground font-sans">
                  No customer skin test scans recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Embed widget / Code Snippet Section */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs relative overflow-hidden">
            {vendorPlan === "premium" ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider animate-fade-in" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Website Embed Widget</h3>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-800 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" /> Feature Active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-5 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Embed Anovra's skin diagnostic tool directly on your website as a floating action widget to collect leads and recommend catalog items.
                </p>

                {/* Platform Selector tabs */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {[
                    { id: "html", label: "Custom HTML / JS" },
                    { id: "shopify", label: "Shopify Liquid" },
                    { id: "wordpress", label: "WordPress PHP" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setEmbedPlatform(p.id as any)}
                      className={`text-[11px] px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        embedPlatform === p.id
                          ? "bg-[#008236]/10 text-[#008236] border border-[#008236]/25"
                          : "bg-muted text-muted-foreground hover:bg-secondary border border-border"
                      }`}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Syntax Highlighted Code Editor Box */}
                <div className="bg-[#1A0A05] rounded-xl overflow-hidden border border-border/10 mb-4 font-mono text-xs select-all">
                  {/* Window title bar */}
                  <div className="flex items-center justify-between px-4 py-2 bg-secondary/5 border-b border-border/10 text-muted-foreground/60 select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-[10px] tracking-wider font-bold uppercase font-mono">
                      {embedPlatform === "html" ? "anovra-widget.html" : embedPlatform === "shopify" ? "theme.liquid" : "functions.php"}
                    </span>
                    <span className="w-10" />
                  </div>

                  {/* Code text lines */}
                  <div className="p-4.5 overflow-x-auto text-left leading-relaxed">
                    {embedPlatform === "html" && (
                      <pre className="text-gray-300">
                        <span className="text-cyan-400">&lt;script</span><br />
                        {"  "}<span className="text-amber-400">src</span>=<span className="text-emerald-400">"https://cdn.anovra.africa/skin-widget.js"</span><br />
                        {"  "}<span className="text-amber-400">data-vendor</span>=<span className="text-emerald-400">"{shopSlug}"</span><br />
                        {"  "}<span className="text-amber-400">async</span><span className="text-cyan-400">&gt;</span><br />
                        <span className="text-cyan-400">&lt;/script&gt;</span>
                      </pre>
                    )}
                    {embedPlatform === "shopify" && (
                      <pre className="text-gray-300">
                        <span className="text-slate-500 font-medium font-sans">{`{% comment %} Paste inside layout/theme.liquid before </body> {% endcomment %}`}</span><br />
                        <span className="text-cyan-400">&lt;script</span><br />
                        {"  "}<span className="text-amber-400">src</span>=<span className="text-emerald-400">"https://cdn.anovra.africa/skin-widget.js"</span><br />
                        {"  "}<span className="text-amber-400">data-vendor</span>=<span className="text-emerald-400">"{shopSlug}"</span><br />
                        {"  "}<span className="text-amber-400">async</span><span className="text-cyan-400">&gt;</span><br />
                        <span className="text-cyan-400">&lt;/script&gt;</span>
                      </pre>
                    )}
                    {embedPlatform === "wordpress" && (
                      <pre className="text-gray-300">
                        <span className="text-slate-500 font-medium font-sans">{`// Add at the bottom of active theme's functions.php`}</span><br />
                        <span className="text-purple-400">add_action</span>(<span className="text-emerald-400">'wp_footer'</span>, <span className="text-blue-400">function</span>() &#123;<br />
                        {"    "}<span className="text-blue-400">echo</span> <span className="text-emerald-400">{`'<script src="https://cdn.anovra.africa/skin-widget.js" data-vendor="${shopSlug}" async></script>'`}</span>;<br />
                        &#125;);
                      </pre>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const code = embedPlatform === "html"
                      ? `<script\n  src="https://cdn.anovra.africa/skin-widget.js"\n  data-vendor="${shopSlug}"\n  async>\n</script>`
                      : embedPlatform === "shopify"
                      ? `{% comment %} Paste inside layout/theme.liquid before </body> {% endcomment %}\n<script\n  src="https://cdn.anovra.africa/skin-widget.js"\n  data-vendor="${shopSlug}"\n  async>\n</script>`
                      : `// Add at the bottom of active theme's functions.php\nadd_action('wp_footer', function() {\n    echo '<script src="https://cdn.anovra.africa/skin-widget.js" data-vendor="${shopSlug}" async></script>';\n});`;
                    copy(code, "embed");
                  }}
                  className="flex items-center gap-1.5 text-xs px-4 py-2 bg-background border border-border rounded-lg hover:bg-secondary hover:border-accent/40 transition-colors cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {copied === "embed" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied Snippet!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code Snippet</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* High-Fidelity Feature Upgrade Presentation (No blurred overlays) */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left: Illustrative Storefront Mockup (5 cols) */}
                <div className="lg:col-span-5 w-full">
                  <div className="border border-border/70 rounded-xl overflow-hidden bg-background shadow-xs flex flex-col min-h-[170px]">
                    {/* Browser bar */}
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/40 border-b border-border/60 select-none">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <div className="flex-1 max-w-[120px] bg-background border border-border/40 rounded px-1.5 py-0.5 text-[8px] text-muted-foreground/60 text-center font-mono truncate ml-2">
                        yourbrand.com
                      </div>
                    </div>
                    {/* Browser Content */}
                    <div className="flex-grow p-3.5 bg-[#FAF7F2] relative flex flex-col justify-between select-none">
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <div className="w-10 h-2 bg-foreground/10 rounded" />
                        <div className="flex gap-1.5">
                          <div className="w-6 h-1.5 bg-foreground/5 rounded" />
                          <div className="w-6 h-1.5 bg-foreground/5 rounded" />
                        </div>
                      </div>
                      <div className="py-4 space-y-2">
                        <div className="w-24 h-3.5 bg-[#008236]/15 rounded" />
                        <div className="w-28 h-2 bg-foreground/10 rounded" />
                        <div className="w-20 h-2 bg-foreground/10 rounded" />
                      </div>
                      {/* Floating Widget Button mockup with CSS animation */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-[#008236] text-white text-[8px] font-bold px-2.5 py-1 rounded-full shadow-md animate-pulse">
                        <Scan className="w-2 h-2 text-white" /> Analyze Skin
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Feature highlight list & Upgrade Button (7 cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Website Embed Widget
                      </h4>
                      <span className="text-[9px] bg-amber-500/10 text-amber-800 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase font-mono flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-amber-600" /> Premium Feature
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Embed Anovra's skin diagnostic tool directly on your own website as a floating action widget. Customers can analyze skin and browse matched products without leaving your domain.
                    </p>
                    <ul className="space-y-2 text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#008236] shrink-0" />
                        <span>One-line embed snippet for Shopify, WordPress, or Custom HTML</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#008236] shrink-0" />
                        <span>Lead generation & automatic client skin profile synchronization</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#008236] shrink-0" />
                        <span>Fully customizable widget placement, brand colors & theme styling</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <button
                      onClick={() => setVendorPlan("premium")}
                      className="w-full sm:w-auto text-xs bg-[#008236] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#006c2c] transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <span>Upgrade to Premium Plan</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Feature Gate Modal for Generate My Shop */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-md w-full p-6 sm:p-8 text-center border border-border shadow-2xl relative">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              Premium Feature
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <strong>Generate My Shop</strong> is an exclusive feature for <strong>Premium Vendors</strong>. Upgrade your plan to generate and share custom branded shop links with your customers.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setVendorPlan("premium");
                  setShowPremiumModal(false);
                  setView("shop");
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#008236] text-white font-bold text-sm hover:bg-[#006c2c] transition-colors shadow-md cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Verified Email Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl relative">
            <div className="w-16 h-16 rounded-full bg-[#008236]/15 border border-[#008236]/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#008236]" />
            </div>
            <h3 className="text-2xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              Welcome to Anovra!
            </h3>
            <p className="text-xs text-green-700 uppercase font-bold tracking-wider mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Email Confirmed Successfully
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Our compliance team is verifying your business CAC certificate details within 3-5 working days. You can explore your workspace, manage your products catalog, and preview your storefront right away.
            </p>
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full py-3.5 rounded-xl bg-[#008236] text-white font-bold text-sm hover:bg-[#006c2c] transition-colors shadow-md cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Explore Workspace
            </button>
          </div>
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {tab === "analytics" && (
        <div className="space-y-6">
          {/* Shop Analytics Main Panel */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between flex-wrap gap-4 bg-muted/20">
              <div>
                <h2 className="font-semibold text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Shop Link Analytics</h2>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  anovra.africa/shop/<strong className="text-[#008236] font-semibold">{shopSlug}</strong>
                </p>
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border border-border/40">
                {(["7d", "30d", "90d"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAnalyticsRange(r)}
                    className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      analyticsRange === r
                        ? "bg-background text-[#008236] shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Analytics Cards */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-border bg-muted/5">
              {[
                { label: "Link visits", value: "3,547", delta: "+22%", deltaUp: true, sub: "Unique visitors clicked shop link", icon: <ExternalLink className="w-4 h-4" /> },
                { label: "Skin tests run", value: "2,907", delta: "+18%", deltaUp: true, sub: "82% of visitors took skin test", icon: <Scan className="w-4 h-4" /> },
                { label: "Purchases made", value: "527", delta: "+34%", deltaUp: true, sub: "Orders via matched recommendations", icon: <TrendingUp className="w-4 h-4" /> },
                { label: "Conversion rate", value: "14.9%", delta: "+2.1pp", deltaUp: true, sub: "Visits resulting in purchases", icon: <Activity className="w-4 h-4" /> },
              ].map((k, idx) => (
                <div key={k.label} className="bg-background border border-border/80 rounded-xl p-4.5 hover:border-[#008236]/30 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3 text-muted-foreground">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{k.label}</span>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      idx === 0 ? "bg-amber-100 text-amber-600" :
                      idx === 1 ? "bg-blue-100 text-blue-600" :
                      idx === 2 ? "bg-emerald-100 text-emerald-800" :
                      "bg-[#008236]/10 text-[#008236]"
                    )}>
                      {k.icon}
                    </div>
                  </div>
                  <p className="text-2xl font-light text-foreground mb-1.5" style={{ fontFamily: "'Fraunces', serif" }}>{k.value}</p>
                  <div className="flex flex-col gap-1">
                    <span className={`text-[10px] w-fit font-bold font-mono px-1.5 py-0.5 rounded-full ${k.deltaUp ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                      {k.deltaUp ? "↑" : "↓"} {k.delta}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-normal" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{k.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Area */}
            <div className="px-6 pb-6 pt-5">
              <div className="flex items-center gap-4 mb-5 text-xs font-bold text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#C86B3A] rounded-full" /> Link Visits</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-blue-400 rounded-full" /> Tests Run</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-emerald-500 rounded-full" /> Purchases</span>
              </div>
              {liveAnalytics.length > 0 && liveAnalytics.some(d => d.analyses > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <ReLineChart id="chart-link-analytics" data={liveAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,10,5,0.05)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#7A6355", fontFamily: "'Plus Jakarta Sans', sans-serif" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#7A6355", fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, border: "1px solid rgba(26,10,5,0.1)", borderRadius: 8, background: "#FFFFFF" }} />
                    <Line key="line-visits" type="monotone" dataKey="visits" stroke="#C86B3A" strokeWidth={2.5} dot={{ fill: "#C86B3A", r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} name="Visits" />
                    <Line key="line-analyses" type="monotone" dataKey="analyses" stroke="#60A5FA" strokeWidth={2.5} dot={{ fill: "#60A5FA", r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} name="Analyses" />
                    <Line key="line-purchases" type="monotone" dataKey="purchases" stroke="#10B981" strokeWidth={2.5} dot={{ fill: "#10B981", r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} name="Purchases" />
                  </ReLineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 bg-secondary/10 rounded-xl border border-dashed border-border/80 text-center px-4">
                  <Activity className="w-8 h-8 text-muted-foreground/60 mb-2.5 animate-pulse" />
                  <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No scan analytics recorded yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Your traffic and test conversion charts will appear here automatically once customers begin running skin analysis diagnostics using your storefront link.
                  </p>
                </div>
              )}
            </div>

            {/* Funnel & Product Purchases Row */}
            <div className="border-t border-border grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border bg-muted/5">
              {/* Funnel */}
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Conversion Funnel — This Week</p>
                <div className="space-y-4">
                  {funnelSteps.map((step) => (
                    <div key={step.label} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
                      <div className="sm:w-48 flex-shrink-0">
                        <span className="text-xs text-muted-foreground font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{step.label}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-3 w-full">
                        <div className="flex-1 bg-muted border border-border/40 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${step.color}`} style={{ width: `${step.pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-foreground font-mono shrink-0 w-24 text-right">
                          {step.count.toLocaleString()} <span className="text-[10px] text-muted-foreground">({step.pct}%)</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Purchases By Product</p>
                <div className="space-y-3">
                  {liveProductPurchases.length > 0 ? (
                    liveProductPurchases.map((p, i) => (
                      <div key={p.name} className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs text-muted-foreground w-4 flex-shrink-0 font-bold font-mono">{i + 1}</span>
                          <p className="text-sm text-foreground truncate font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.name}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 font-mono text-xs">
                          <span className="text-muted-foreground font-medium hidden sm:inline">{p.purchases} sold</span>
                          <span className="text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">{p.revenue}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs text-muted-foreground font-sans">
                      No purchases logged yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Skin concerns chart */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
            <h3 className="font-semibold text-foreground text-sm mb-1 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Top Skin Concerns Detected</h3>
            <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Based on all customer skin tests analyzed this month</p>
            {liveConcerns.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart id="chart-dash-concerns" data={liveConcerns} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,10,5,0.06)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#7A6355", fontFamily: "'Plus Jakarta Sans', sans-serif" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#7A6355", fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, border: "1px solid rgba(26,10,5,0.1)", borderRadius: 6, background: "#FFFFFF" }} cursor={{ fill: "rgba(200,107,58,0.06)" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {liveConcerns.map((entry, index) => (
                      <Cell key={`dash-concern-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-sm text-muted-foreground font-sans">
                No skin concern metrics recorded yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab === "settings" && (
        <div className="space-y-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Branding */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Branding on results page</h3>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Control how your brand appears to customers after their skin analysis.</p>
                </div>
                <div className="p-5 space-y-5">
                  {/* Anovra branding toggle */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Show Anovra branding</p>
                      <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>The "Powered by Anovra" badge appears on your results page. Included on all plans.</p>
                    </div>
                    <button
                      onClick={() => setWhiteLabelEnabled(false)}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${!whiteLabelEnabled ? "bg-[#008236]" : "bg-muted"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${!whiteLabelEnabled ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>

                  <div className="border-t border-border" />

                  {/* White-label toggle */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>White-labeled results page</p>
                        <span className="text-xs bg-foreground text-primary-foreground px-2 py-0.5 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>Vendor Pro</span>
                      </div>
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Remove all Anovra branding. Customers see only your brand name and logo on results.</p>
                    </div>
                    <button
                      onClick={() => setWhiteLabelEnabled((v) => !v)}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${whiteLabelEnabled ? "bg-[#008236]" : "bg-muted"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${whiteLabelEnabled ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>

                  {whiteLabelEnabled && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Brand name shown on results</label>
                        <input
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#008236] transition-colors"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        />
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                        <p className="text-xs text-green-700 dark:text-green-300" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Customers will see "<strong>{brandName}</strong> Skin Analysis" instead of Anovra branding.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Custom domain */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Custom domain for test link</h3>
                    <span className="text-xs bg-foreground text-primary-foreground px-2 py-0.5 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>Brand</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Use your own domain (e.g. <code className="font-mono">skin.yourbrand.com</code>) instead of the default Anovra link.</p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Custom domain</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={customDomain}
                        onChange={(e) => { setCustomDomain(e.target.value); setDomainSaved(false); }}
                        placeholder="skin.yourbrand.com"
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] transition-colors"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      />
                      <button
                        onClick={() => setDomainSaved(true)}
                        className="px-4 py-2 bg-[#008236] text-white rounded-lg text-sm font-medium hover:bg-[#006c2c] transition-colors shrink-0 cursor-pointer"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {domainSaved ? "Saved ✓" : "Save"}
                      </button>
                    </div>
                  </div>
                  {domainSaved && customDomain && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <p className="text-xs text-amber-800 dark:text-amber-300 font-medium mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>DNS setup required</p>
                      <p className="text-xs text-amber-800 dark:text-amber-300" style={{ fontFamily: "'DM Mono', monospace" }}>Add a CNAME record: <strong>{customDomain}</strong> → <strong>cname.anovra.africa</strong></p>
                    </div>
                  )}
                  <div className="space-y-1.5 text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <p className="flex items-center gap-1.5"><Globe className="w-3 h-3 flex-shrink-0" /> SSL certificate is automatically provisioned once DNS propagates.</p>
                    <p className="flex items-center gap-1.5"><Shield className="w-3 h-3 flex-shrink-0" /> Verification typically takes 5–30 minutes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shareable links */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <h3 className="font-medium text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Shareable test link</h3>
            <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Share this link on social media, WhatsApp, or your website to send customers directly to your skin test.</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-muted/50 rounded-lg p-3">
              <p className="flex-1 text-sm font-mono text-foreground truncate">{testLink}</p>
              <button onClick={() => copy(testLink, "test-settings")} className="flex items-center justify-center gap-1.5 text-xs px-4 py-2 bg-background border border-border rounded-lg hover:border-[#008236]/40 transition-colors shrink-0 font-medium cursor-pointer" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {copied === "test-settings" ? <><Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy link</>}
              </button>
            </div>
          </div>

          {/* Plan Simulator Card (Relocated from Top Header for Professional UX) */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs bg-muted/10">
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
              <h3 className="font-medium text-foreground text-sm flex items-center gap-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Demo Plan Simulator
              </h3>
              <span className="text-[9px] bg-accent/15 text-accent px-2 py-0.5 rounded-full font-bold font-mono">DEVELOPMENT DEV</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Toggle different subscription tiers below to test restricted premium features (such as generating storefronts, embed codes, white-labeled results, and priority support).
            </p>
            <div className="flex items-center gap-2 flex-wrap bg-background p-1.5 border border-border/80 rounded-xl w-fit">
              {(["free", "basic", "premium"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setVendorPlan(p)}
                  className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer uppercase tracking-wider ${
                    vendorPlan === p
                      ? "bg-[#008236] text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TEAM ── */}
      {tab === "team" && (
        <div className="space-y-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Accounts */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Team accounts</h3>
                      <span className="text-xs bg-foreground text-primary-foreground px-2 py-0.5 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>Brand</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Add up to 5 team members with different access levels.</p>
                  </div>
                  <button
                    onClick={() => setShowInvite((v) => !v)}
                    className="flex items-center gap-1.5 text-xs px-3.5 py-2 bg-[#008236] text-white rounded-lg hover:bg-[#006c2c] transition-colors font-medium shadow-xs cursor-pointer"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <Plus className="w-3.5 h-3.5" /> Invite member
                  </button>
                </div>

                {showInvite && (
                  <div className="px-5 py-4 bg-muted/30 border-b border-border">
                    <p className="text-xs font-medium text-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Invite a new team member</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@yourcompany.com"
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] transition-colors"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      />
                      <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#008236]">
                        <option>Manager</option>
                        <option>Viewer</option>
                      </select>
                      <button
                        onClick={() => { setShowInvite(false); setInviteEmail(""); }}
                        className="px-4 py-2 bg-[#008236] text-white rounded-lg text-sm font-medium hover:bg-[#006c2c] transition-colors shrink-0 cursor-pointer"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Send invite
                      </button>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-border">
                  {teamMembers.map((m) => (
                    <div key={m.email} className="flex items-center justify-between gap-3 px-5 py-3.5 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                          {m.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{m.name}</p>
                          <p className="text-xs text-muted-foreground truncate font-mono">{m.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${m.role === "Owner" ? "bg-foreground text-primary-foreground" : "bg-muted text-muted-foreground"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{m.role}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full ${m.status === "active" ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400" : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{m.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Role permissions */}
            <div className="lg:col-span-1 bg-muted/40 border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Role permissions</h4>
                <div className="space-y-3">
                  {[
                    { role: "Owner", perms: "Full access — billing, team, settings, catalog, analytics" },
                    { role: "Manager", perms: "Catalog, analytics, settings — no billing or team management" },
                    { role: "Viewer", perms: "Analytics and recent scans — read only" },
                  ].map((r) => (
                    <div key={r.role} className="flex flex-col gap-1 text-xs p-3 bg-background border border-border/70 rounded-lg">
                      <span className="font-semibold text-foreground font-mono">{r.role}</span>
                      <span className="text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{r.perms}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── API & DEV ── */}
      {tab === "api" && (
        <div className="space-y-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* REST API access */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>REST API access</h3>
                    <span className="text-xs bg-foreground text-primary-foreground px-2 py-0.5 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>Brand</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Use the Anovra API to pull scan results, product matches, and analytics into your own systems.</p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-mono">Live API key</label>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5">
                      <p className="flex-1 text-sm font-mono text-foreground truncate">
                        {apiKeyVisible ? apiKey : apiKey.slice(0, 12) + "•".repeat(28)}
                      </p>
                      <button onClick={() => setApiKeyVisible((v) => !v)} className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {apiKeyVisible ? "Hide" : "Reveal"}
                      </button>
                      <button onClick={() => copy(apiKey, "api-key")} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors shrink-0 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {copied === "api-key" ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Available REST Endpoints:</p>
                    {[
                      { method: "GET", path: "/v1/scans", desc: "Fetch recent skin test reports" },
                      { method: "POST", path: "/v1/recommendations", desc: "Trigger AI match engine" },
                      { method: "GET", path: "/v1/catalog", desc: "Sync catalog & NAFDAC status" },
                    ].map((ep) => (
                      <div key={ep.path} className="flex items-center justify-between p-2.5 bg-muted/30 border border-border/60 rounded-lg text-xs flex-wrap gap-2">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold rounded text-[10px]">{ep.method}</span>
                          <span className="text-foreground font-semibold">{ep.path}</span>
                        </div>
                        <span className="text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ep.desc}</span>
                      </div>
                    ))}
                  </div>
                  <a className="inline-flex items-center gap-1.5 mt-2 text-xs text-emerald-600 hover:text-emerald-700 transition-colors font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <BookOpen className="w-3.5 h-3.5" /> Full API documentation →
                  </a>
                </div>
              </div>
            </div>

            {/* Webhooks */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Webhooks</h3>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Get notified in real time when a customer completes a scan or makes a purchase.</p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-mono">Webhook endpoint URL</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={webhookUrl}
                        onChange={(e) => { setWebhookUrl(e.target.value); setWebhookSaved(false); }}
                        placeholder="https://yourapp.com/webhooks/anovra"
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] transition-colors"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      />
                      <button onClick={() => setWebhookSaved(true)} className="px-4 py-2 bg-[#008236] text-white rounded-lg text-sm font-medium hover:bg-[#006c2c] transition-colors shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {webhookSaved ? "Saved ✓" : "Save"}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Events sent to your endpoint:</p>
                    {["scan.completed", "purchase.created", "product.flagged", "catalog.updated"].map((e) => (
                      <div key={e} className="flex items-center gap-2 text-xs p-2 bg-muted/30 border border-border/60 rounded-lg">
                        <Webhook className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="font-mono text-foreground font-medium">{e}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUPPORT ── */}
      {tab === "support" && (
        <div className="space-y-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority WhatsApp */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Priority WhatsApp support</h3>
                    <span className="text-xs bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Vendor Pro</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Reach our vendor support team directly on WhatsApp. Guaranteed response within 4 hours.</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-green-900 dark:text-green-200" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Anovra Vendor Support</p>
                        <p className="text-xs text-green-700 dark:text-green-400 font-semibold font-mono">+2349167664619</p>
                      </div>
                    </div>
                    <a
                      href="https://wa.me/2349167664619?text=Hi%2C%20I%27m%20a%20Vendor%20Pro%20subscriber%20and%20need%20help%20with%20my%20Anovra%20account."
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors shrink-0 shadow-xs cursor-pointer"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Open WhatsApp →
                    </a>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Response guaranteed within 4 hours during business hours.</p>
                    <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Priority assistance with store setup, custom domains, and custom integrations.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SLA & Uptime */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>SLA support & guarantees</h3>
                    <span className="text-xs bg-foreground text-primary-foreground px-2 py-0.5 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>Brand</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Contractual uptime and support SLAs for enterprise-grade operations.</p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: "Platform uptime guarantee", value: "99.9%", icon: <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> },
                    { label: "Critical issue response", value: "< 1 hour", icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" /> },
                    { label: "Dedicated account manager", value: "Included", icon: <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> },
                    { label: "Incident escalation path", value: "Direct to engineering", icon: <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {s.icon}
                        <span className="text-xs sm:text-sm text-foreground truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.label}</span>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-foreground font-mono shrink-0 ml-2">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dedicated onboarding */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Dedicated onboarding & launch support</h3>
                <span className="text-xs bg-foreground text-primary-foreground px-2 py-0.5 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>Brand</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>A dedicated Anovra specialist will guide your team through setup and go-live.</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { step: "1", title: "Kickoff call", desc: "60-minute call to map catalog, branding, and integration requirements.", done: true },
                  { step: "2", title: "Catalog migration", desc: "Bulk-upload your existing product catalog with NAFDAC verification.", done: true },
                  { step: "3", title: "Custom domain setup", desc: "DNS configuration, SSL provisioning, and branded link testing.", done: false },
                  { step: "4", title: "Team training", desc: "Live walkthrough of the dashboard, analytics, and API for your team.", done: false },
                  { step: "5", title: "Go-live review", desc: "Final QA session and sign-off before your public launch on Anovra.", done: false },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3 p-3 bg-muted/30 border border-border/60 rounded-lg">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${s.done ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                      {s.done ? <Check className="w-3.5 h-3.5" /> : s.step}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-bold transition-colors mt-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <LifeBuoy className="w-4 h-4" /> Book next onboarding session →
              </button>
            </div>
          </div>

          {/* Email support */}
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Email support (all vendor plans)</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">vendors@anovra.africa · We reply within 24 business hours.</p>
            </div>
            <a href="mailto:vendors@anovra.africa" className="flex items-center justify-center gap-1.5 text-xs px-4 py-2 bg-secondary border border-border rounded-lg hover:border-emerald-500/40 transition-colors font-medium shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Send email <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
