import { useState } from "react";
import {
  Store, AlertCircle, CreditCard, Calendar, Ban, Search, RefreshCw,
  Users, Package, Shield, BarChart2, CheckCircle, X, Check, Eye,
  ChevronDown, ChevronUp, AlertTriangle, Info, Activity, TrendingUp,
  ExternalLink, Upload, MapPin, Scan,
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { UnifiedDashboardHeader } from "./components/UnifiedDashboardHeader";

// ---- ADMIN DATA ----

const adminStats = [
  { label: "Total vendors", value: "184", delta: "+12 this month", icon: <Store className="w-4 h-4" />, warn: false },
  { label: "Scans platform-wide", value: "48,291", delta: "+22% MoM", icon: <Scan className="w-4 h-4" />, warn: false },
  { label: "Products pending safety review", value: "7", delta: "Oldest: 3 days ago", icon: <AlertCircle className="w-4 h-4" />, warn: true },
  { label: "MRR (₦)", value: "₦4.2M", delta: "+₦380k vs last month", icon: <CreditCard className="w-4 h-4" />, warn: false },
];

const revenueData = [
  { month: "Jan", mrr: 1800000 },
  { month: "Feb", mrr: 2100000 },
  { month: "Mar", mrr: 2450000 },
  { month: "Apr", mrr: 2900000 },
  { month: "May", mrr: 3600000 },
  { month: "Jun", mrr: 4200000 },
];

const tierData = [
  { name: "Free", value: 119, fill: "#EDE3D6" },
  { name: "Vendor Pro", value: 51, fill: "#C86B3A" },
  { name: "Brand", value: 14, fill: "#1A0A05" },
];

const flaggedQueue = [
  {
    id: "FLG-041",
    productName: "Ultra-White Intensive Lightening Lotion",
    vendor: "ClearGlo",
    vendorCity: "Lagos",
    flaggedDate: "27 Jun 2025",
    ingredients: ["Mercury Chloride", "Clobetasol Propionate", "Hydroquinone 4%"],
    violations: ["Mercury — globally banned", "Clobetasol — restricted corticosteroid", "Hydroquinone >2% — exceeds NAFDAC limit"],
    status: "pending",
    severity: "critical",
  },
  {
    id: "FLG-040",
    productName: "Rapid Glow Booster Serum",
    vendor: "LumiSkin NG",
    vendorCity: "Abuja",
    flaggedDate: "26 Jun 2025",
    ingredients: ["Arbutin 5%", "Kojic Acid", "Unknown Compound X-14"],
    violations: ["Unknown Compound X-14 — not in ingredient database, under review"],
    status: "pending",
    severity: "moderate",
  },
  {
    id: "FLG-039",
    productName: "Night Recovery Cream Plus",
    vendor: "DermaCure Store",
    vendorCity: "Port Harcourt",
    flaggedDate: "25 Jun 2025",
    ingredients: ["Retinol 1%", "Lactic Acid 10%", "Phenoxyethanol"],
    violations: ["Retinol 1% + Lactic Acid 10% combination — caution flag for potential over-exfoliation"],
    status: "under_review",
    severity: "low",
  },
  {
    id: "FLG-038",
    productName: "Brightening Body Milk SPF15",
    vendor: "AuraGlow Africa",
    vendorCity: "Kano",
    flaggedDate: "24 Jun 2025",
    ingredients: ["Niacinamide", "SPF Chemical Filters", "Fragrance Mix"],
    violations: ["Fragrance Mix — generic label, vendor requested to specify individual fragrance components"],
    status: "resolved",
    severity: "low",
  },
];

const ingredientDB = [
  { name: "Mercury / Mercurous Chloride", function: "Skin lightening", status: "banned", scope: "Global + NAFDAC", maxConc: "0%", notes: "No safe concentration. Neurotoxic. Banned in all cosmetics globally." },
  { name: "Hydroquinone", function: "Hyperpigmentation treatment", status: "restricted", scope: "NAFDAC (Nigeria)", maxConc: "2%", notes: "OTC limit is 2%. Higher concentrations require prescription. Carcinogenic risk at high doses." },
  { name: "Clobetasol Propionate", function: "Anti-inflammatory (corticosteroid)", status: "restricted", scope: "NAFDAC + WHO", maxConc: "0.05% (Rx only)", notes: "Prescription only. Often misused as a skin lightener. Causes skin atrophy at OTC doses." },
  { name: "Niacinamide", function: "Brightening, barrier support", status: "safe", scope: "Global", maxConc: "No limit (10% common)", notes: "Well-tolerated across all skin tones. No known dangerous interactions at cosmetic doses." },
  { name: "Kojic Acid", function: "Melanin synthesis inhibitor", status: "safe", scope: "Global", maxConc: "1–2% recommended", notes: "Safe at cosmetic concentrations. Photosensitising — pair with SPF." },
  { name: "Arbutin (Alpha)", function: "Tyrosinase inhibitor", status: "safe", scope: "Global", maxConc: "2% (EU guideline)", notes: "Considered safe. Avoid >3% without dermatologist guidance." },
  { name: "Retinol", function: "Anti-aging, cell turnover", status: "caution", scope: "Global", maxConc: "1% OTC (EU)", notes: "Avoid during pregnancy. Photosensitising. Caution combining with AHAs/BHAs." },
  { name: "Lactic Acid", function: "AHA exfoliant, hydration", status: "safe", scope: "Global", maxConc: "10% OTC", notes: "Safe up to 10% at pH ≥3.5. Above 10% requires professional supervision." },
];

const vendorList = [
  { id: "V-001", name: "Veraski", owner: "Adaeze Okafor", city: "Lagos", tier: "Brand", products: 24, scans: 2847, joined: "Mar 2025", status: "active", mrr: "₦75,000" },
  { id: "V-002", name: "GlowAfrique", owner: "Fatima Musa", city: "Abuja", tier: "Vendor Pro", products: 18, scans: 1420, joined: "Apr 2025", status: "active", mrr: "₦25,000" },
  { id: "V-003", name: "ClearGlo", owner: "Emmanuel Bright", city: "Lagos", tier: "Free", products: 6, scans: 0, joined: "Jun 2025", status: "pending", mrr: "₦0" },
  { id: "V-004", name: "LumiSkin NG", owner: "Ngozi Eze", city: "Abuja", tier: "Vendor Pro", products: 12, scans: 984, joined: "May 2025", status: "active", mrr: "₦25,000" },
  { id: "V-005", name: "SunGuard NG", owner: "Tunde Adeyemi", city: "Ibadan", tier: "Vendor Pro", products: 8, scans: 2105, joined: "Feb 2025", status: "active", mrr: "₦25,000" },
  { id: "V-006", name: "DermaCure Store", owner: "Chidinma Nwosu", city: "Port Harcourt", tier: "Free", products: 4, scans: 312, joined: "Jun 2025", status: "pending", mrr: "₦0" },
  { id: "V-007", name: "AuraGlow Africa", owner: "Halima Yakubu", city: "Kano", tier: "Vendor Pro", products: 15, scans: 1678, joined: "Apr 2025", status: "active", mrr: "₦25,000" },
];

const concernsData = [
  { name: "Hyperpig.", value: 847, fill: "#C86B3A" },
  { name: "Acne", value: 623, fill: "#D4854A" },
  { name: "Dryness", value: 512, fill: "#B85A2E" },
  { name: "Oil Control", value: 445, fill: "#E09060" },
  { name: "Brightening", value: 389, fill: "#A04820" },
  { name: "Anti-Aging", value: 234, fill: "#C07848" },
];

// ---- ADMIN VIEW ----

type AdminTab = "overview" | "safety" | "ingredients" | "vendors" | "team";

type TeamRole = "Marketing" | "Sales" | "Support";
type TeamMember = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: TeamRole;
  idFileName: string;
  headshotUrl: string;
  username: string;
  password: string;
  createdAt: string;
  status: "active" | "suspended";
};

function generateCredentials(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "");
  const username = `${slug}@anovra.africa`;
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  const password = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return { username, password };
}

export function AdminView({ setView }: { setView?: (v: View) => void }) {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [flagStatuses, setFlagStatuses] = useState<Record<string, string>>({});
  const [vendorStatuses, setVendorStatuses] = useState<Record<string, string>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "TM-001", name: "Chiamaka Obi", phone: "+234 803 456 7890", email: "chiamaka.obi@example.com", role: "Marketing", idFileName: "nin_chiamaka.pdf", headshotUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&auto=format", username: "chiamaka.obi@anovra.africa", password: "••••••••••••", createdAt: "12 May 2025", status: "active" },
    { id: "TM-002", name: "Emeka Nwosu", phone: "+234 812 345 6789", email: "emeka.nwosu@example.com", role: "Sales", idFileName: "drivers_emeka.jpg", headshotUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&h=80&fit=crop&auto=format", username: "emeka.nwosu@anovra.africa", password: "••••••••••••", createdAt: "3 Jun 2025", status: "active" },
  ]);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: "", phone: "", email: "", role: "Marketing" as TeamRole, idFileName: "", headshotUrl: "" });
  const [newCredentials, setNewCredentials] = useState<{ username: string; password: string; name: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function handleCreateTeamMember() {
    if (!teamForm.name || !teamForm.email || !teamForm.phone) return;
    const creds = generateCredentials(teamForm.name);
    const member: TeamMember = {
      id: `TM-${String(teamMembers.length + 3).padStart(3, "0")}`,
      name: teamForm.name,
      phone: teamForm.phone,
      email: teamForm.email,
      role: teamForm.role,
      idFileName: teamForm.idFileName || "id_document.pdf",
      headshotUrl: teamForm.headshotUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&auto=format",
      username: creds.username,
      password: creds.password,
      createdAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      status: "active",
    };
    setTeamMembers((t) => [...t, member]);
    setNewCredentials({ ...creds, name: teamForm.name });
    setTeamForm({ name: "", phone: "", email: "", role: "Marketing", idFileName: "", headshotUrl: "" });
    setShowTeamForm(false);
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function getVendorStatus(v: typeof vendorList[0]) {
    return vendorStatuses[v.id] ?? v.status;
  }

  function setVendorAction(id: string, action: string) {
    setVendorStatuses((s) => ({ ...s, [id]: action }));
    setOpenDropdown(null);
  }

  const tabs: { id: AdminTab; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "safety", label: "Safety Queue", badge: flaggedQueue.filter((f) => f.status === "pending").length },
    { id: "ingredients", label: "Ingredient DB" },
    { id: "vendors", label: "Vendors" },
    { id: "team", label: "Team" },
  ];

  const filteredIngredients = ingredientDB.filter(
    (i) =>
      search === "" ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.function.toLowerCase().includes(search.toLowerCase())
  );

  const filteredVendors = vendorList.filter(
    (v) =>
      search === "" ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.owner.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase())
  );

  function resolveFlag(id: string, action: "approve" | "ban") {
    setFlagStatuses((s) => ({ ...s, [id]: action === "approve" ? "resolved" : "banned" }));
    setExpandedFlag(null);
  }

  const severityColors: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border-red-200",
    moderate: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-yellow-50 text-yellow-700 border-yellow-200",
  };

  const ingredientStatusColors: Record<string, string> = {
    banned: "bg-red-100 text-red-700",
    restricted: "bg-amber-100 text-amber-700",
    caution: "bg-yellow-100 text-yellow-700",
    safe: "bg-green-100 text-green-700",
  };

  const tierColors: Record<string, string> = {
    Brand: "bg-foreground text-primary-foreground",
    "Vendor Pro": "bg-accent/10 text-accent",
    Free: "bg-muted text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {setView && (
        <UnifiedDashboardHeader
          currentView="admin"
          setView={setView}
          title="Anovra Control Centre"
          subtitle="Platform Administration, NAFDAC Safety Queue & MRR Analytics"
          badgeText="PLATFORM ADMIN"
          role="admin"
          showShopLink={false}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative pt-4">
        {/* Tab bar */}
        <div className="flex gap-2 border-b border-border overflow-x-auto pb-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(""); }}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 text-sm transition-colors border-b-2 font-medium whitespace-nowrap",
                tab === t.id
                  ? "border-accent text-accent font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {t.label}
              {t.badge ? (
                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-mono">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ---- OVERVIEW ---- */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {adminStats.map((s, i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-card border rounded-lg p-4",
                    s.warn ? "border-amber-200 bg-amber-50" : "border-border"
                  )}
                >
                  <div className={cn("flex items-center gap-2 mb-2", s.warn ? "text-amber-600" : "text-muted-foreground")}>
                    {s.icon}
                    <span className="text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.label}</span>
                  </div>
                  <p className="text-2xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                    {s.value}
                  </p>
                  <p className={cn("text-xs mt-0.5", s.warn ? "text-amber-600" : "text-muted-foreground")} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {s.delta}
                  </p>
                </div>
              ))}
            </div>

            {/* Subscription plan breakdown */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Subscribed vendors by plan
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Active paying subscriptions · updated daily
                  </p>
                </div>
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>
                  65 total paying
                </span>
              </div>

              <div className="divide-y divide-border">
                {[
                  {
                    plan: "Basic Plan",
                    price: "₦12,500 / mo",
                    count: 51,
                    total: 184,
                    mrr: "₦637,500",
                    color: "bg-accent",
                    textColor: "text-accent",
                    badgeColor: "bg-accent/10 text-accent",
                    features: ["Up to 50 skin tests/month", "10 products in catalog", "Shareable test link", "Basic analytics"],
                  },
                  {
                    plan: "Premium Plan",
                    price: "₦25,000 / mo",
                    count: 14,
                    total: 184,
                    mrr: "₦350,000",
                    color: "bg-foreground",
                    textColor: "text-foreground",
                    badgeColor: "bg-foreground text-primary-foreground",
                    features: ["Unlimited skin tests", "Unlimited catalog", "White-labeled results", "Website embed widget", "Priority support"],
                  },
                ].map((plan) => {
                  const pct = Math.round((plan.count / plan.total) * 100);
                  return (
                    <div key={plan.plan} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plan.badgeColor}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              {plan.plan}
                            </span>
                            <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{plan.price}</span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                            {plan.features.map((f) => (
                              <span key={f} className="text-xs text-muted-foreground flex items-center gap-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                <CheckCircle className="w-3 h-3 text-accent flex-shrink-0" />{f}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-3xl font-light text-foreground leading-none mb-0.5" style={{ fontFamily: "'Fraunces', serif" }}>
                            {plan.count}
                          </p>
                          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>vendors</p>
                          <p className="text-xs font-medium text-green-700 mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                            {plan.mrr} MRR
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${plan.color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0 w-12 text-right" style={{ fontFamily: "'DM Mono', monospace" }}>
                          {pct}% of all
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Free tier summary row */}
                <div className="px-5 py-3 bg-muted/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Free tier</span>
                    <span className="text-xs text-muted-foreground ml-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>— no subscription</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full bg-border" style={{ width: "65%" }} />
                    </div>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>119 vendors · 65%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* MRR line chart */}
              <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
                <h3 className="font-medium text-foreground mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Monthly Recurring Revenue
                </h3>
                <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Jan–Jun 2025 · Nigerian Naira (₦)
                </p>
                {/* SVG MRR line chart */}
                {(() => {
                  const w = 480, h = 150, padL = 52, padR = 12, padT = 8, padB = 28;
                  const vals = revenueData.map((d) => d.mrr);
                  const minV = Math.min(...vals), maxV = Math.max(...vals);
                  const xStep = (w - padL - padR) / (vals.length - 1);
                  const yScale = (v: number) => padT + (h - padT - padB) * (1 - (v - minV) / (maxV - minV));
                  const pts = vals.map((v, i) => `${padL + i * xStep},${yScale(v)}`).join(" ");
                  const area = `${padL},${h - padB} ` + pts + ` ${padL + (vals.length - 1) * xStep},${h - padB}`;
                  const yTicks = [minV, (minV + maxV) / 2, maxV];
                  return (
                    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
                      {yTicks.map((v, i) => (
                        <g key={i}>
                          <line x1={padL} x2={w - padR} y1={yScale(v)} y2={yScale(v)} stroke="rgba(26,10,5,0.06)" strokeDasharray="3 3" />
                          <text x={padL - 4} y={yScale(v) + 4} textAnchor="end" fontSize={9} fill="#7A6355" fontFamily="'DM Mono', monospace">
                            ₦{(v / 1000000).toFixed(1)}M
                          </text>
                        </g>
                      ))}
                      <defs>
                        <linearGradient id="svg-mrr-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#C86B3A" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#C86B3A" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon points={area} fill="url(#svg-mrr-grad)" />
                      <polyline points={pts} fill="none" stroke="#C86B3A" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                      {vals.map((v, i) => (
                        <circle key={i} cx={padL + i * xStep} cy={yScale(v)} r={3} fill="#C86B3A" />
                      ))}
                      {revenueData.map((d, i) => (
                        <text key={i} x={padL + i * xStep} y={h - padB + 14} textAnchor="middle" fontSize={10} fill="#7A6355" fontFamily="'Plus Jakarta Sans', sans-serif">
                          {d.month}
                        </text>
                      ))}
                    </svg>
                  );
                })()}
              </div>

              {/* Tier breakdown */}
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-medium text-foreground mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Vendors by tier
                </h3>
                <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  184 total vendors
                </p>
                {/* CSS conic-gradient donut */}
                {(() => {
                  const total = tierData.reduce((s, d) => s + d.value, 0);
                  let cursor = 0;
                  const stops = tierData.map((d) => {
                    const pct = (d.value / total) * 100;
                    const s = `${d.fill} ${cursor.toFixed(1)}% ${(cursor + pct).toFixed(1)}%`;
                    cursor += pct;
                    return s;
                  }).join(", ");
                  return (
                    <div className="flex items-center justify-center py-2">
                      <div
                        className="rounded-full flex-shrink-0"
                        style={{
                          width: 100, height: 100,
                          background: `conic-gradient(${stops})`,
                          WebkitMask: "radial-gradient(circle at center, transparent 32px, black 33px)",
                          mask: "radial-gradient(circle at center, transparent 32px, black 33px)",
                        }}
                      />
                    </div>
                  );
                })()}
                <div className="space-y-2 mt-2">
                  {tierData.map((t) => (
                    <div key={t.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.fill }} />
                        <span className="text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t.name}</span>
                      </div>
                      <span className="font-mono text-xs text-foreground">{t.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Platform-wide concern chart */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-medium text-foreground mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Top skin concerns — platform-wide
              </h3>
              <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Aggregated across all vendors and 48,291 scans
              </p>
              {/* CSS horizontal bar chart */}
              {(() => {
                const maxVal = Math.max(...concernsData.map((d) => d.value));
                return (
                  <div className="space-y-3">
                    {concernsData.map((d) => (
                      <div key={d.name} className="flex items-center gap-3">
                        <span className="w-28 flex-shrink-0 text-xs text-muted-foreground text-right truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{d.name}</span>
                        <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                          <div
                            className="h-full rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${(d.value / maxVal) * 100}%`, background: d.fill }}
                          >
                            <span className="text-white text-xs font-mono leading-none">{d.value}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ---- SAFETY QUEUE ---- */}
        {tab === "safety" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Ingredient safety review queue
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Products auto-flagged by the ingredient safety layer — review and approve or ban.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border px-3 py-2 rounded-lg" style={{ fontFamily: "'DM Mono', monospace" }}>
                <RefreshCw className="w-3 h-3" />
                Last sync: 2 min ago
              </div>
            </div>

            <div className="space-y-3">
              {flaggedQueue.map((item) => {
                const resolvedStatus = flagStatuses[item.id];
                const displayStatus = resolvedStatus || item.status;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "bg-card border rounded-xl overflow-hidden transition-opacity",
                      resolvedStatus ? "opacity-60" : "",
                      displayStatus === "pending" ? "border-amber-200" : displayStatus === "under_review" ? "border-blue-200" : "border-border"
                    )}
                  >
                    {/* Row header */}
                    <button
                      className="w-full p-4 flex items-start gap-4 text-left hover:bg-secondary/40 transition-colors"
                      onClick={() => setExpandedFlag(expandedFlag === item.id ? null : item.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full border font-medium",
                              severityColors[item.severity] ?? "bg-muted text-muted-foreground"
                            )}
                            style={{ fontFamily: "'DM Mono', monospace" }}
                          >
                            {item.severity.toUpperCase()}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground">{item.id}</span>
                          {displayStatus === "resolved" && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Resolved</span>
                          )}
                          {displayStatus === "banned" && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Banned</span>
                          )}
                          {displayStatus === "under_review" && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Under review</span>
                          )}
                        </div>
                        <h3 className="font-medium text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {item.productName}
                        </h3>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {item.vendor} · {item.vendorCity} · Flagged {item.flaggedDate}
                        </p>
                      </div>
                      {expandedFlag === item.id
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                      }
                    </button>

                    {expandedFlag === item.id && (
                      <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                        {/* Flagged ingredients */}
                        <div>
                          <p className="text-xs font-medium text-accent uppercase tracking-wide mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                            Flagged ingredients
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {item.ingredients.map((ing) => (
                              <span
                                key={ing}
                                className="flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full"
                                style={{ fontFamily: "'DM Mono', monospace" }}
                              >
                                {ing}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Violations */}
                        <div>
                          <p className="text-xs font-medium text-accent uppercase tracking-wide mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                            Violations detected
                          </p>
                          <ul className="space-y-1.5">
                            {item.violations.map((v) => (
                              <li key={v} className="flex items-start gap-2 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <span className="text-foreground">{v}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Actions */}
                        {!resolvedStatus && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                            <button
                              onClick={() => resolveFlag(item.id, "approve")}
                              className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve & unblock product
                            </button>
                            <button
                              onClick={() => resolveFlag(item.id, "ban")}
                              className="flex items-center gap-1.5 text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Ban product & notify vendor
                            </button>
                          </div>
                        )}
                        {resolvedStatus && (
                          <p className="text-sm text-muted-foreground pt-2 border-t border-border" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {resolvedStatus === "approve" ? "✓ Product approved and unblocked." : "✗ Product banned. Vendor notified."}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- INGREDIENT DB ---- */}
        {tab === "ingredients" && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Ingredient safety database
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {ingredientDB.length} ingredients · {ingredientDB.filter((i) => i.status === "banned").length} banned · {ingredientDB.filter((i) => i.status === "restricted").length} restricted
                </p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search ingredients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-input-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-52"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
                <button className="flex items-center gap-1.5 text-sm bg-accent text-white px-3 py-2 rounded-lg hover:bg-accent/90 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  + Add ingredient
                </button>
              </div>
            </div>

            {/* Status legend */}
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { status: "banned", label: "Banned — globally prohibited" },
                { status: "restricted", label: "Restricted — regulatory limit applies" },
                { status: "caution", label: "Caution — specific use warnings" },
                { status: "safe", label: "Safe — no known restrictions" },
              ].map((item) => (
                <span key={item.status} className={cn("text-xs px-2.5 py-1 rounded-full font-medium", ingredientStatusColors[item.status])} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {item.label}
                </span>
              ))}
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-border bg-secondary">
                {["Ingredient", "Function", "Status", "Scope", "Max conc.", "Notes"].map((h) => (
                  <p key={h} className={cn("text-xs font-medium text-muted-foreground", h === "Ingredient" ? "col-span-3" : h === "Notes" ? "col-span-3" : "col-span-1")} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {h}
                  </p>
                ))}
              </div>
              <div className="divide-y divide-border">
                {filteredIngredients.map((ing) => (
                  <div key={ing.name} className="grid grid-cols-12 gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors items-start">
                    <p className="col-span-3 text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {ing.name}
                    </p>
                    <p className="col-span-1 text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {ing.function}
                    </p>
                    <div className="col-span-1">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", ingredientStatusColors[ing.status])} style={{ fontFamily: "'DM Mono', monospace" }}>
                        {ing.status}
                      </span>
                    </div>
                    <p className="col-span-1 text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {ing.scope}
                    </p>
                    <p className="col-span-1 text-xs font-mono text-foreground">{ing.maxConc}</p>
                    <p className="col-span-3 text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {ing.notes}
                    </p>
                  </div>
                ))}
                {filteredIngredients.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No ingredients match your search.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- VENDORS ---- */}
        {tab === "vendors" && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Vendor accounts
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {vendorList.length} vendors · {vendorList.filter((v) => getVendorStatus(v) === "active").length} active · {vendorList.filter((v) => getVendorStatus(v) === "flagged").length} pending approval
                </p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-input-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-52"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-border bg-secondary text-xs font-medium text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <span className="col-span-3">Vendor</span>
                <span className="col-span-2">Location</span>
                <span className="col-span-1">Tier</span>
                <span className="col-span-1 text-right">Products</span>
                <span className="col-span-1 text-right">Scans</span>
                <span className="col-span-1 text-right">MRR</span>
                <span className="col-span-1">Joined</span>
                <span className="col-span-2">Status / Action</span>
              </div>
              <div className="divide-y divide-border">
                {filteredVendors.map((v) => {
                  const status = getVendorStatus(v);
                  const isApproved = status !== "pending";
                  const isDropOpen = openDropdown === v.id;

                  const statusBadge = () => {
                    if (status === "pending") return <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium"><AlertCircle className="w-3 h-3" />Pending</span>;
                    if (status === "suspended") return <span className="flex items-center gap-1 text-xs text-orange-600 font-medium"><AlertTriangle className="w-3 h-3" />Suspended</span>;
                    if (status === "banned") return <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><Ban className="w-3 h-3" />Banned</span>;
                    if (status === "removed") return <span className="flex items-center gap-1 text-xs text-red-400 font-medium"><X className="w-3 h-3" />Removed</span>;
                    if (status === "flagged") return <span className="flex items-center gap-1 text-xs text-amber-600 font-medium"><AlertTriangle className="w-3 h-3" />Flagged</span>;
                    return <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle className="w-3 h-3" />Active</span>;
                  };

                  return (
                    <div
                      key={v.id}
                      className={cn(
                        "grid grid-cols-12 gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors items-center",
                        status === "flagged" ? "bg-amber-50/50" : "",
                        status === "banned" ? "bg-red-50/30 opacity-60" : "",
                        status === "suspended" ? "bg-orange-50/30" : "",
                      )}
                    >
                      <div className="col-span-3">
                        <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{v.name}</p>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{v.owner}</p>
                        {isApproved && (
                          <p className="text-xs text-accent mt-0.5 font-mono truncate">
                            anovra.africa/shop/{v.name.toLowerCase().replace(/\s+/g, "-")}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center gap-1 text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {v.city}
                      </div>
                      <div className="col-span-1">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", tierColors[v.tier] ?? "bg-muted text-muted-foreground")} style={{ fontFamily: "'DM Mono', monospace" }}>
                          {v.tier}
                        </span>
                      </div>
                      <p className="col-span-1 text-sm text-right font-mono text-foreground">{v.products}</p>
                      <p className="col-span-1 text-sm text-right font-mono text-foreground">{v.scans.toLocaleString()}</p>
                      <p className="col-span-1 text-sm text-right font-mono text-foreground">{v.mrr}</p>
                      <div className="col-span-1 flex items-center gap-1 text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <Calendar className="w-3 h-3" />
                        {v.joined}
                      </div>

                      {/* Action column */}
                      <div className="col-span-2 flex items-center gap-2">
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {statusBadge()}
                        </div>
                        {!isApproved ? (
                          <button
                            onClick={() => setVendorAction(v.id, "active")}
                            className="flex items-center gap-1 text-xs bg-accent text-white px-2.5 py-1 rounded-full hover:bg-accent/90 transition-colors font-medium whitespace-nowrap"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            <Check className="w-3 h-3" />
                            Approve
                          </button>
                        ) : (
                          <div className="relative">
                            <button
                              onClick={() => setOpenDropdown(isDropOpen ? null : v.id)}
                              className="flex items-center gap-1 text-xs bg-secondary border border-border text-foreground px-2.5 py-1 rounded-full hover:bg-muted transition-colors"
                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                              Manage
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            {isDropOpen && (
                              <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                                <button
                                  onClick={() => setVendorAction(v.id, "suspended")}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-orange-600 hover:bg-orange-50 transition-colors text-left"
                                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Suspend vendor
                                </button>
                                <button
                                  onClick={() => setVendorAction(v.id, "banned")}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left border-t border-border"
                                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  Ban vendor
                                </button>
                                <button
                                  onClick={() => setVendorAction(v.id, "removed")}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors text-left border-t border-border"
                                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Remove account
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredVendors.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No vendors match your search.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---- TEAM ---- */}
        {tab === "team" && (
          <div>
            {/* Credentials modal */}
            {newCredentials && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="bg-foreground text-primary-foreground p-5">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-lg font-light" style={{ fontFamily: "'Fraunces', serif" }}>
                        Account created
                      </h3>
                    </div>
                    <p className="text-xs text-white/50 mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Share these credentials securely with <strong className="text-white/80">{newCredentials.name}</strong>. The password cannot be retrieved again.
                    </p>
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>LOGIN EMAIL</p>
                      <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2.5">
                        <p className="flex-1 text-sm font-mono text-foreground truncate">{newCredentials.username}</p>
                        <button
                          onClick={() => copyToClipboard(newCredentials.username, "email")}
                          className="text-xs text-accent hover:text-accent/70 transition-colors whitespace-nowrap"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {copiedField === "email" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>TEMPORARY PASSWORD</p>
                      <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2.5">
                        <p className="flex-1 text-sm font-mono text-foreground">
                          {showPassword ? newCredentials.password : "•".repeat(newCredentials.password.length)}
                        </p>
                        <button
                          onClick={() => setShowPassword((s) => !s)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(newCredentials.password, "password")}
                          className="text-xs text-accent hover:text-accent/70 transition-colors whitespace-nowrap"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {copiedField === "password" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        This password will not be shown again. Ask the team member to change it on first login.
                      </p>
                    </div>
                    <button
                      onClick={() => { setNewCredentials(null); setShowPassword(false); }}
                      className="w-full mt-2 bg-accent text-white py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Team accounts
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {teamMembers.length} team members · Marketing, Sales &amp; Support staff
                </p>
              </div>
              {!showTeamForm && (
                <button
                  onClick={() => setShowTeamForm(true)}
                  className="flex items-center gap-1.5 text-sm bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors font-medium"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  + Create account
                </button>
              )}
            </div>

            {/* Create form */}
            {showTeamForm && (
              <div className="bg-card border border-border rounded-xl mb-6 overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-medium text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    New team member
                  </h3>
                  <button onClick={() => setShowTeamForm(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5 grid sm:grid-cols-2 gap-4">
                  {/* Full name */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chiamaka Obi"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Email address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="personal or work email"
                      value={teamForm.email}
                      onChange={(e) => setTeamForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Phone number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+234 800 000 0000"
                      value={teamForm.phone}
                      onChange={(e) => setTeamForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={teamForm.role}
                      onChange={(e) => setTeamForm((f) => ({ ...f, role: e.target.value as TeamRole }))}
                      className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Support">Support</option>
                    </select>
                  </div>

                  {/* Valid ID upload */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Valid ID <span className="text-xs text-muted-foreground font-normal">(NIN, passport, driver's licence)</span>
                    </label>
                    <label className={cn(
                      "flex items-center gap-2 px-3 py-2.5 border border-dashed rounded-lg cursor-pointer transition-colors",
                      teamForm.idFileName ? "border-accent bg-accent/5" : "border-border hover:border-accent/50 bg-input-background"
                    )}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setTeamForm((f) => ({ ...f, idFileName: file.name }));
                        }}
                      />
                      <Upload className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: teamForm.idFileName ? "var(--accent)" : "var(--muted-foreground)" }}>
                        {teamForm.idFileName || "Upload ID document"}
                      </span>
                    </label>
                  </div>

                  {/* Headshot upload */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Headshot photo <span className="text-xs text-muted-foreground font-normal">(clear, front-facing)</span>
                    </label>
                    <label className={cn(
                      "flex items-center gap-2 px-3 py-2.5 border border-dashed rounded-lg cursor-pointer transition-colors",
                      teamForm.headshotUrl ? "border-accent bg-accent/5" : "border-border hover:border-accent/50 bg-input-background"
                    )}>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setTeamForm((f) => ({ ...f, headshotUrl: url }));
                          }
                        }}
                      />
                      <Upload className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: teamForm.headshotUrl ? "var(--accent)" : "var(--muted-foreground)" }}>
                        {teamForm.headshotUrl ? "Photo selected" : "Upload headshot"}
                      </span>
                    </label>
                  </div>

                  {/* Preview of generated login */}
                  {teamForm.name && (
                    <div className="sm:col-span-2 p-3 bg-secondary border border-border rounded-lg flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-3.5 h-3.5 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Login will be generated as</p>
                        <p className="text-sm font-mono text-foreground">{generateCredentials(teamForm.name).username}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-5 pb-5 flex gap-2">
                  <button
                    onClick={handleCreateTeamMember}
                    disabled={!teamForm.name || !teamForm.email || !teamForm.phone}
                    className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Create account &amp; generate login
                  </button>
                  <button
                    onClick={() => setShowTeamForm(false)}
                    className="px-5 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Team member list */}
            <div className="space-y-3">
              {teamMembers.map((m) => (
                <div key={m.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
                  <img
                    src={m.headshotUrl}
                    alt={m.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-secondary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{m.name}</p>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            m.role === "Marketing" ? "bg-blue-100 text-blue-700" :
                            m.role === "Sales" ? "bg-accent/10 text-accent" :
                            "bg-purple-100 text-purple-700"
                          )} style={{ fontFamily: "'DM Mono', monospace" }}>
                            {m.role}
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          <span>{m.phone}</span>
                          <span>{m.email}</span>
                          <span className="font-mono">{m.username}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <Calendar className="w-3 h-3" />
                        {m.createdAt}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <Shield className="w-3 h-3 text-green-600" />
                        ID verified · {m.idFileName}
                      </div>
                      <button
                        onClick={() => {
                          const creds = generateCredentials(m.name);
                          setNewCredentials({ ...creds, name: m.name });
                        }}
                        className="text-xs text-accent hover:underline"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Regenerate login
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
