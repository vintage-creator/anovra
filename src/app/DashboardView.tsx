import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart as ReLineChart, Line,
} from "recharts";
import {
  Package, TrendingUp, Scan, Activity, Eye, Store, ExternalLink,
  Globe, Copy, Check, MessageCircle, Shield, Key, Users, Zap,
  ChevronRight, AlertTriangle, RefreshCw, CheckCircle, Lock, Plus,
  LifeBuoy, BookOpen, Webhook,
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";

// ---- DASHBOARD DATA ----

const linkAnalyticsData = [
  { day: "Mon", visits: 312, analyses: 248, purchases: 41 },
  { day: "Tue", visits: 428, analyses: 351, purchases: 63 },
  { day: "Wed", visits: 389, analyses: 302, purchases: 55 },
  { day: "Thu", visits: 514, analyses: 430, purchases: 78 },
  { day: "Fri", visits: 601, analyses: 497, purchases: 94 },
  { day: "Sat", visits: 743, analyses: 618, purchases: 112 },
  { day: "Sun", visits: 560, analyses: 461, purchases: 84 },
];

const productPurchaseData = [
  { name: "Niacinamide 10% + Zinc 1% Serum", purchases: 187, revenue: "₦841,500", convRate: "38%" },
  { name: "SPF 50+ Invisible Sunscreen Fluid", purchases: 143, revenue: "₦1,072,500", convRate: "31%" },
  { name: "Kojic Acid & Turmeric Brightening Cream", purchases: 112, revenue: "₦694,400", convRate: "27%" },
  { name: "Deep Moisture Barrier Repair Cream", purchases: 85, revenue: "₦493,000", convRate: "19%" },
];

const concernsData = [
  { name: "Hyperpig.", value: 847, fill: "#C86B3A" },
  { name: "Acne", value: 623, fill: "#D4854A" },
  { name: "Dryness", value: 512, fill: "#B85A2E" },
  { name: "Oil Control", value: 445, fill: "#E09060" },
  { name: "Brightening", value: 389, fill: "#A04820" },
  { name: "Anti-Aging", value: 234, fill: "#C07848" },
];

const recentTests = [
  { id: "T-2847", time: "2 min ago", concern: "Hyperpigmentation", result: "3 products matched", city: "Lagos" },
  { id: "T-2846", time: "14 min ago", concern: "Acne/Blemishes", result: "4 products matched", city: "Abuja" },
  { id: "T-2845", time: "31 min ago", concern: "Dryness", result: "2 products matched", city: "Port Harcourt" },
  { id: "T-2844", time: "1 hr ago", concern: "Oil Control", result: "3 products matched", city: "Ibadan" },
  { id: "T-2843", time: "2 hrs ago", concern: "Brightening", result: "5 products matched", city: "Kano" },
];

type DashTab = "overview" | "analytics" | "settings" | "team" | "api" | "support";

export function DashboardView({ setView }: { setView: (v: View) => void }) {
  const [tab, setTab] = useState<DashTab>("overview");
  const [analyticsRange, setAnalyticsRange] = useState<"7d" | "30d" | "90d">("7d");
  const [copied, setCopied] = useState<string | null>(null);
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);
  const [brandName, setBrandName] = useState("Veraski");
  const [customDomain, setCustomDomain] = useState("");
  const [domainSaved, setDomainSaved] = useState(false);

  // Vendor plan & verification state
  const [isVerified, setIsVerified] = useState(false);
  const [vendorPlan, setVendorPlan] = useState<"free" | "basic" | "premium">("free");
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [teamMembers] = useState([
    { name: "Adaeze Okafor", email: "adaeze@veraski.com", role: "Owner", status: "active", joined: "Mar 2025" },
    { name: "Chidi Nwosu", email: "chidi@veraski.com", role: "Manager", status: "active", joined: "Apr 2025" },
    { name: "Ngozi Eze", email: "ngozi@veraski.com", role: "Viewer", status: "invited", joined: "—" },
  ]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSaved, setWebhookSaved] = useState(false);

  const shopLink = "https://anovra.africa/shop/veraski-ng";
  const testLink = "https://anovra.africa/scan/veraski-ng";
  const apiKey = "sk_live_vsk_a9f2c84d1e3b7a0f5c2d9e6b4a1f8e3c";

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

  const tabs: { id: DashTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "analytics", label: "Analytics" },
    { id: "settings", label: "Settings" },
    { id: "team", label: "Team" },
    { id: "api", label: "API & Dev" },
    { id: "support", label: "Support" },
  ];

  return (
    <div className="min-h-screen bg-background pb-12">
      <UnifiedDashboardHeader
        currentView="dashboard"
        setView={setView}
        title="Vendor Dashboard"
        subtitle="Branded skincare intelligence & store management"
        showShopLink={true}
        isVerified={isVerified}
        onToggleVerify={() => setIsVerified((v) => !v)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap sm:flex-nowrap bg-card border border-border rounded-xl p-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">QUICK ACTIONS:</span>
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <button onClick={() => setView("catalog")} className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs bg-secondary text-foreground px-3 py-2 rounded-lg hover:bg-muted transition-colors font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Package className="w-3.5 h-3.5" /> Manage catalog
            </button>
            <button onClick={() => setView("skintest")} className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs bg-secondary text-foreground px-3 py-2 rounded-lg hover:bg-muted transition-colors font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Eye className="w-3.5 h-3.5" /> Preview test
            </button>
            <button
              onClick={handleGenerateShop}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs bg-emerald-500 text-amber-950 px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-bold shadow-xs"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Store className="w-3.5 h-3.5" /> Generate My Shop
            </button>
          </div>
        </div>

      {/* Plan Switcher Bar for Demo Testing */}
      <div className="bg-secondary/60 border border-border rounded-xl p-3 mb-6 flex items-center justify-between flex-wrap gap-2 text-xs">
        <span className="text-muted-foreground">Plan Access Control:</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-medium">Active Plan:</span>
          {(["free", "basic", "premium"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setVendorPlan(p)}
              className={`px-3 py-1 rounded-md uppercase tracking-wider font-bold transition-all ${
                vendorPlan === p
                  ? "bg-emerald-500 text-amber-950 shadow-xs"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 bg-muted rounded-xl p-1.5 mb-7 w-full sm:w-auto overflow-x-auto scrollbar-none border border-border/50">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${tab === t.id ? "bg-card shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={i} className={cn("bg-card border rounded-lg p-4", s.warn ? "border-amber-200 bg-amber-50" : "border-border")}>
                <div className={cn("flex items-center gap-2 mb-2", s.warn ? "text-amber-600" : "text-muted-foreground")}>
                  {s.icon}
                  <span className="text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.label}</span>
                </div>
                <p className="text-2xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>{s.value}</p>
                <p className={cn("text-xs mt-0.5", s.warn ? "text-amber-600" : "text-muted-foreground")} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.delta}</p>
              </div>
            ))}
          </div>

          {/* Shareable links */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-medium text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Your shareable links</h3>
            <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Share these with customers to start collecting skin analyses and purchases.</p>
            <div className="space-y-3">
              {[
                { label: "Shop link", url: shopLink, key: "shop", desc: "Your full storefront — products, purchases, and skin test" },
                { label: "Skin test link", url: testLink, key: "test", desc: "Sends customers directly to your branded skin test" },
              ].map((l) => (
                <div key={l.key} className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>{l.label}</p>
                    <p className="text-sm text-foreground font-mono truncate">{l.url}</p>
                    <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{l.desc}</p>
                  </div>
                  <button onClick={() => copy(l.url, l.key)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-background border border-border rounded-lg hover:border-emerald-500/40 transition-colors flex-shrink-0 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {copied === l.key ? <><Check className="w-3 h-3 text-emerald-600" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent tests */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-medium text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Recent customer scans</h3>
              <button onClick={() => setTab("analytics")} className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                View full analytics <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {recentTests.map((t) => (
                <div key={t.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground w-14 shrink-0">{t.id}</span>
                    <span className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t.concern}</span>
                    <span className="text-xs bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t.result}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono self-end sm:self-auto">
                    <span>{t.city}</span>
                    <span>•</span>
                    <span>{t.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Embed widget / Code Snippet Section (Gated for Free & Basic users) */}
          <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Website embed widget code snippet</h3>
              {vendorPlan !== "premium" && (
                <span className="text-[10px] bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-500" /> Premium Only
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Drop this one-liner into any website to embed your skin test as a floating widget.</p>

            {/* Code container with gate overlay */}
            <div className="relative">
              <div className="bg-foreground rounded-md p-3 mb-3">
                <code className="text-xs text-green-400 font-mono leading-relaxed block whitespace-pre-wrap">
                  {`<script\n  src="https://cdn.anovra.africa/skin-widget.js"\n  data-vendor="veraski-ng"\n  async>\n</script>`}
                </code>
              </div>

              {/* Locked Overlay for Free & Basic Users */}
              {vendorPlan !== "premium" && (
                <div className="absolute inset-0 bg-background/85 backdrop-blur-xs rounded-md flex flex-col items-center justify-center p-4 text-center border border-border">
                  <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-2">
                    <Lock className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-sm font-bold text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    To access website embed code snippet, Upgrade to Vendor Pro or Premium plan
                  </p>
                  <button
                    onClick={() => setVendorPlan("premium")}
                    className="mt-2 text-xs bg-emerald-500 text-amber-950 font-bold px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors shadow-xs"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Upgrade to Premium
                  </button>
                </div>
              )}
            </div>

            <button onClick={() => copy("embed", "embed")} disabled={vendorPlan !== "premium"} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-secondary border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {copied === "embed" ? <><Check className="w-3 h-3 text-emerald-600" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy snippet</>}
            </button>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Works on Shopify, WordPress, and custom HTML sites.</p>
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
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-amber-950 font-bold text-sm hover:bg-emerald-600 transition-colors shadow-md"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {tab === "analytics" && (
        <div className="space-y-6">
          {/* Link analytics panel */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-medium text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Shop link analytics</h2>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>anovra.africa/shop/<strong className="text-foreground">veraski-ng</strong></p>
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg">
                {(["7d", "30d", "90d"] as const).map((r) => (
                  <button key={r} onClick={() => setAnalyticsRange(r)} className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${analyticsRange === r ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{r}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
              {[
                { label: "Link visits", value: "3,547", delta: "+22%", deltaUp: true, sub: "people clicked your shop link", icon: <ExternalLink className="w-4 h-4" /> },
                { label: "Skin analyses started", value: "2,907", delta: "+18%", deltaUp: true, sub: "of visitors ran a skin test", icon: <Scan className="w-4 h-4" /> },
                { label: "Purchases made", value: "527", delta: "+34%", deltaUp: true, sub: "from AI-matched recommendations", icon: <TrendingUp className="w-4 h-4" /> },
                { label: "Conversion rate", value: "14.9%", delta: "+2.1pp", deltaUp: true, sub: "visits that became purchases", icon: <Activity className="w-4 h-4" /> },
              ].map((k) => (
                <div key={k.label} className="px-5 py-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">{k.icon}<span className="text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{k.label}</span></div>
                  <p className="text-2xl font-light text-foreground mb-0.5" style={{ fontFamily: "'Fraunces', serif" }}>{k.value}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${k.deltaUp ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`} style={{ fontFamily: "'DM Mono', monospace" }}>{k.deltaUp ? "↑" : "↓"} {k.delta}</span>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{k.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 pb-5 pt-2">
              <div className="flex items-center gap-4 mb-4 text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-accent inline-block rounded" />Link visits</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-400 inline-block rounded" />Analyses</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-green-500 inline-block rounded" />Purchases</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <ReLineChart id="chart-link-analytics" data={linkAnalyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,10,5,0.05)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#7A6355", fontFamily: "'Plus Jakarta Sans', sans-serif" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#7A6355", fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, border: "1px solid rgba(26,10,5,0.1)", borderRadius: 8, background: "#FFFFFF" }} />
                  <Line key="line-visits" type="monotone" dataKey="visits" stroke="#C86B3A" strokeWidth={2} dot={{ fill: "#C86B3A", r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} name="Visits" />
                  <Line key="line-analyses" type="monotone" dataKey="analyses" stroke="#60A5FA" strokeWidth={2} dot={{ fill: "#60A5FA", r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} name="Analyses" />
                  <Line key="line-purchases" type="monotone" dataKey="purchases" stroke="#22C55E" strokeWidth={2} dot={{ fill: "#22C55E", r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} name="Purchases" />
                </ReLineChart>
              </ResponsiveContainer>
            </div>

            <div className="border-t border-border grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
              {/* Funnel */}
              <div className="px-5 py-4">
                <p className="text-xs font-medium text-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Conversion funnel — this week</p>
                <div className="space-y-3">
                  {[
                    { label: "Clicked shop link", count: 3547, pct: 100, color: "bg-accent" },
                    { label: "Started skin analysis", count: 2907, pct: 82, color: "bg-blue-400" },
                    { label: "Completed analysis & recommendations", count: 2214, pct: 62, color: "bg-indigo-400" },
                    { label: "Clicked a product", count: 1204, pct: 34, color: "bg-amber-400" },
                    { label: "Made a purchase", count: 527, pct: 15, color: "bg-green-500" },
                  ].map((step) => (
                    <div key={step.label} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                      <div className="sm:w-44 flex-shrink-0"><span className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{step.label}</span></div>
                      <div className="flex-1 flex items-center gap-2 w-full">
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden"><div className={`h-full rounded-full ${step.color}`} style={{ width: `${step.pct}%` }} /></div>
                        <span className="text-xs font-medium text-foreground font-mono shrink-0">{step.count.toLocaleString()} ({step.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div className="px-5 py-4">
                <p className="text-xs font-medium text-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Purchases by product</p>
                <div className="space-y-2.5">
                  {productPurchaseData.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between gap-3 py-1.5 border-b border-border/60 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-4 flex-shrink-0 font-mono">{i + 1}</span>
                        <p className="text-sm text-foreground truncate font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 font-mono text-xs">
                        <span className="text-foreground font-medium hidden sm:inline">{p.purchases} sold</span>
                        <span className="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-full font-semibold">{p.revenue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Skin concerns chart */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-medium text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Top skin concerns detected</h3>
            <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Across all customer scans this month</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart id="chart-dash-concerns" data={concernsData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,10,5,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#7A6355", fontFamily: "'Plus Jakarta Sans', sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#7A6355", fontFamily: "'DM Mono', monospace" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, border: "1px solid rgba(26,10,5,0.1)", borderRadius: 6, background: "#FFFFFF" }} cursor={{ fill: "rgba(200,107,58,0.06)" }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                  {concernsData.map((entry, index) => (
                    <Cell key={`dash-concern-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${!whiteLabelEnabled ? "bg-accent" : "bg-muted"}`}
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
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${whiteLabelEnabled ? "bg-accent" : "bg-muted"}`}
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
                          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-accent transition-colors"
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
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Use your own domain (e.g. <code className="font-mono">skin.veraski.com</code>) instead of the default Anovra link.</p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Custom domain</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={customDomain}
                        onChange={(e) => { setCustomDomain(e.target.value); setDomainSaved(false); }}
                        placeholder="skin.yourbrand.com"
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent transition-colors"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      />
                      <button
                        onClick={() => setDomainSaved(true)}
                        className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shrink-0"
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
              <button onClick={() => copy(testLink, "test-settings")} className="flex items-center justify-center gap-1.5 text-xs px-4 py-2 bg-background border border-border rounded-lg hover:border-accent/40 transition-colors shrink-0 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {copied === "test-settings" ? <><Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy link</>}
              </button>
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
                    className="flex items-center gap-1.5 text-xs px-3.5 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium shadow-xs"
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
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent transition-colors"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      />
                      <select className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-accent">
                        <option>Manager</option>
                        <option>Viewer</option>
                      </select>
                      <button
                        onClick={() => { setShowInvite(false); setInviteEmail(""); }}
                        className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shrink-0"
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
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent transition-colors"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      />
                      <button onClick={() => setWebhookSaved(true)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
                        <p className="text-sm font-medium text-green-900 dark:text-green-200" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Anovra Vendor Support</p>
                        <p className="text-xs text-green-700 dark:text-green-400 font-mono">+234 800 266 8720</p>
                      </div>
                    </div>
                    <a
                      href="https://wa.me/2348002668720?text=Hi%2C%20I%27m%20a%20Vendor%20Pro%20subscriber%20and%20need%20help%20with%20my%20Anovra%20account."
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors shrink-0 shadow-xs"
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
