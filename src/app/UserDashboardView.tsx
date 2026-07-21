import { useState } from "react";
import {
  Scan, Star, FlaskConical, Share2, TrendingUp, Clock, Check,
  ChevronRight, Copy, MessageCircle, Users, Sparkles, Bell,
  Calendar, BarChart2, ShoppingBag, BookOpen, Flame, Lock,
  ExternalLink, Plus, X, ChevronDown,
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { UnifiedDashboardHeader } from "./components/UnifiedDashboardHeader";

// ── Fake data ──────────────────────────────────────────────

const plan: "glow" | "glowplus" | "premium" = "premium";

const analysisHistory = [
  {
    id: "A-0041",
    date: "Jul 12, 2026",
    vendor: "Veraski",
    concerns: ["Hyperpigmentation", "Uneven tone"],
    skinType: "Combination",
    score: 72,
    products: 5,
    link: "https://anovra.africa/results/a0041",
  },
  {
    id: "A-0038",
    date: "Jun 14, 2026",
    vendor: "Glow Lab",
    concerns: ["Acne", "Oiliness"],
    skinType: "Oily",
    score: 65,
    products: 4,
    link: "https://anovra.africa/results/a0038",
  },
  {
    id: "A-0031",
    date: "May 9, 2026",
    vendor: "Veraski",
    concerns: ["Dryness", "Sensitivity"],
    skinType: "Dry",
    score: 59,
    products: 3,
    link: "https://anovra.africa/results/a0031",
  },
];

const recommendations = [
  { name: "Niacinamide 10% + Zinc 1% Serum", brand: "Veraski", concern: "Hyperpigmentation", match: "98%", price: "₦4,500", badge: "Top pick" },
  { name: "SPF 50+ Invisible Sunscreen Fluid", brand: "Glow Lab", concern: "UV Protection", match: "95%", price: "₦7,500", badge: "" },
  { name: "Kojic Acid Brightening Cream", brand: "Veraski", concern: "Uneven tone", match: "93%", price: "₦6,200", badge: "Best seller" },
  { name: "Deep Moisture Barrier Repair Cream", brand: "NaturaSkin", concern: "Dryness", match: "89%", price: "₦5,800", badge: "" },
  { name: "Azelaic Acid 15% Suspension", brand: "Glow Lab", concern: "Acne", match: "85%", price: "₦3,900", badge: "" },
];

const ingredientGlossary = [
  { name: "Niacinamide", safe: true, benefit: "Brightens skin tone, minimises pores, reduces hyperpigmentation" },
  { name: "Kojic Acid", safe: true, benefit: "Inhibits melanin production — effective for dark spots on melanin-rich skin" },
  { name: "Azelaic Acid", safe: true, benefit: "Anti-inflammatory; targets post-acne marks and redness" },
  { name: "Retinol", safe: true, benefit: "Speeds cell turnover — start with low concentrations, use at night" },
  { name: "Hydroquinone", safe: false, benefit: "Skin-lightening agent — flagged for long-term use; avoid above 2%" },
  { name: "Fragrance / Parfum", safe: false, benefit: "Common irritant — especially risky for sensitive and reactive skin types" },
];

const progressScores = [
  { month: "Jan", score: 51 },
  { month: "Feb", score: 55 },
  { month: "Mar", score: 59 },
  { month: "Apr", score: 63 },
  { month: "May", score: 59 },
  { month: "Jun", score: 65 },
  { month: "Jul", score: 72 },
];

const discounts = [
  { vendor: "Veraski", code: "GLOW-VSK-20", discount: "20% off", expires: "Aug 31, 2026", used: false },
  { vendor: "Glow Lab", code: "GLOW-GL-15", discount: "15% off", expires: "Jul 31, 2026", used: true },
  { vendor: "NaturaSkin", code: "GLOW-NS-25", discount: "25% off first order", expires: "Sep 15, 2026", used: false },
];

const familyProfiles = [
  { name: "Me (Adaeze)", skinType: "Combination", concern: "Hyperpigmentation", lastScan: "Jul 12", isYou: true },
  { name: "Mum", skinType: "Dry", concern: "Anti-aging", lastScan: "Jun 30", isYou: false },
  { name: "Sister Ngozi", skinType: "Oily", concern: "Acne", lastScan: "Jul 1", isYou: false },
];

const routineSteps = [
  { step: "AM 1", label: "Gentle cleanser", product: "CeraVe Hydrating Cleanser", tip: "Lukewarm water only — hot water strips the skin barrier." },
  { step: "AM 2", label: "Vitamin C serum", product: "Veraski Brightening C15", tip: "Apply to damp skin for better absorption. Wait 2 minutes." },
  { step: "AM 3", label: "Moisturiser", product: "Glow Lab Barrier Cream SPF", tip: "Double-duty: hydration + sun protection." },
  { step: "AM 4", label: "Sunscreen", product: "Glow Lab SPF 50+ Fluid", tip: "Even on cloudy days. African sun year-round." },
  { step: "PM 1", label: "Oil cleanser", product: "NaturaSkin Balm Cleanser", tip: "First cleanse removes SPF and surface debris." },
  { step: "PM 2", label: "Water cleanser", product: "CeraVe Hydrating Cleanser", tip: "Double-cleanse clears what oil cleanser left behind." },
  { step: "PM 3", label: "Niacinamide serum", product: "Veraski Niacinamide 10%", tip: "Prime treatment for hyperpigmentation. Use every night." },
  { step: "PM 4", label: "Night moisturiser", product: "Veraski Deep Repair Cream", tip: "Occlusive layer locks in serums during sleep." },
];

type UserTab = "overview" | "history" | "recommendations" | "ingredients" | "progress" | "routine" | "family" | "perks";

function PlanBadge({ required, current }: { required: "glow" | "glowplus" | "premium"; current: typeof plan }) {
  const order = { glow: 0, glowplus: 1, premium: 2 };
  const locked = order[current] < order[required];
  if (!locked) return null;
  const label = required === "glowplus" ? "Glow Pass+" : "Premium Glow";
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-muted border border-border text-muted-foreground px-2 py-0.5 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>
      <Lock className="w-2.5 h-2.5" /> {label}
    </span>
  );
}

function LockedOverlay({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3 z-10">
      <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
        <Lock className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Upgrade to {label}</p>
      <button className="px-4 py-1.5 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent/90 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Upgrade plan →
      </button>
    </div>
  );
}

export function UserDashboardView({ setView }: { setView: (v: View) => void }) {
  const [tab, setTab] = useState<UserTab>("overview");
  const [copied, setCopied] = useState<string | null>(null);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState<{ from: "user" | "advisor"; text: string }[]>([
    { from: "advisor", text: "Hi Adaeze! I'm your certified skin advisor. I can review your latest analysis results and help you build a skincare plan. What would you like to know?" },
  ]);

  function copy(text: string, key: string) {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function sendChat() {
    if (!chatMsg.trim()) return;
    setChatHistory((h) => [...h, { from: "user", text: chatMsg }]);
    const reply = chatMsg.toLowerCase().includes("hyperpig")
      ? "For hyperpigmentation on African skin, I'd prioritise niacinamide, vitamin C, and kojic acid. Avoid hydroquinone above 2%. Your current Veraski serum is a strong choice — stick with it for at least 8 weeks before judging results."
      : "Great question! Based on your latest scan showing combination skin with hyperpigmentation, I'd recommend a vitamin C serum in the morning and a niacinamide serum at night. Want me to build out a full routine?";
    setTimeout(() => setChatHistory((h) => [...h, { from: "advisor", text: reply }]), 900);
    setChatMsg("");
  }

  const latestAnalysis = analysisHistory[0];

  const tabs: { id: UserTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "history", label: "My Analyses" },
    { id: "recommendations", label: "Recommendations" },
    { id: "ingredients", label: "Ingredients" },
    { id: "progress", label: "Progress" },
    { id: "routine", label: "My Routine" },
    { id: "family", label: "Family" },
    { id: "perks", label: "Perks & Discounts" },
  ];

  return (
    <div className="min-h-screen bg-background pb-12">
      <UnifiedDashboardHeader
        currentView="userdashboard"
        setView={setView}
        title="My Skin Portal"
        subtitle="Skin score: 72 / 100 · Personalised routines & scan history"
        badgeText="CONSUMER PROFILE"
        role="consumer"
        showShopLink={false}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <span className="text-xs bg-accent/15 text-accent border border-accent/20 px-3 py-1.5 rounded-full font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Premium Glow
          </span>
          <button
            onClick={() => setView("skintest")}
            className="flex items-center gap-1.5 text-xs sm:text-sm bg-accent text-white px-3.5 py-2 rounded-lg hover:bg-accent/90 transition-colors font-medium shadow-xs"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <Scan className="w-3.5 h-3.5" /> New skin analysis
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-7 w-full sm:w-fit overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${tab === t.id ? "bg-card shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Skin score", value: "72", delta: "↑ 7 pts this month", icon: <Star className="w-4 h-4" />, color: "text-amber-500" },
              { label: "Analyses done", value: "3", delta: "1 this month", icon: <Scan className="w-4 h-4" />, color: "text-accent" },
              { label: "Products matched", value: "12", delta: "across all scans", icon: <ShoppingBag className="w-4 h-4" />, color: "text-blue-500" },
              { label: "Days on routine", value: "41", delta: "since Jun 2", icon: <Flame className="w-4 h-4" />, color: "text-orange-500" },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-lg p-4">
                <div className={`flex items-center gap-2 mb-2 ${s.color}`}>
                  {s.icon}
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.label}</span>
                </div>
                <p className="text-2xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.delta}</p>
              </div>
            ))}
          </div>

          {/* Latest result card */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Latest analysis — {latestAnalysis.date}</h3>
              <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{latestAnalysis.id}</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Skin type</p>
                <p className="text-sm font-medium text-foreground">{latestAnalysis.skinType}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Primary concerns</p>
                <p className="text-sm font-medium text-foreground">{latestAnalysis.concerns.join(", ")}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Products matched</p>
                <p className="text-sm font-medium text-foreground">{latestAnalysis.products} products</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 flex-1 min-w-0">
                <p className="text-xs font-mono text-foreground truncate flex-1">{latestAnalysis.link}</p>
                <button onClick={() => copy(latestAnalysis.link, "result-link")} className="flex items-center gap-1 text-xs text-accent hover:text-accent/70 transition-colors flex-shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {copied === "result-link" ? <><Check className="w-3 h-3" /> Copied</> : <><Share2 className="w-3 h-3" /> Share</>}
                </button>
              </div>
              <button onClick={() => setTab("recommendations")} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                View recommendations <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: <BarChart2 className="w-4 h-4 text-accent" />, title: "Skin progress report", desc: "See how your skin score has changed over time", tab: "progress" as UserTab },
              { icon: <BookOpen className="w-4 h-4 text-blue-500" />, title: "Ingredient glossary", desc: "Safe vs flagged ingredients for your skin type", tab: "ingredients" as UserTab },
              { icon: <Calendar className="w-4 h-4 text-green-600" />, title: "My skincare routine", desc: "Your personalised AM & PM routine steps", tab: "routine" as UserTab },
            ].map((q) => (
              <button key={q.title} onClick={() => setTab(q.tab)} className="text-left bg-card border border-border rounded-xl p-4 hover:border-accent/30 transition-colors group">
                <div className="mb-3">{q.icon}</div>
                <p className="text-sm font-medium text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{q.title}</p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{q.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MY ANALYSES ── */}
      {tab === "history" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Analysis history</h2>
              <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>All your skin analyses saved and tracked. <PlanBadge required="glowplus" current={plan} /></p>
            </div>
            <button onClick={() => setView("skintest")} className="flex items-center gap-1.5 text-sm bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-colors font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Plus className="w-3.5 h-3.5" /> New analysis
            </button>
          </div>
          <div className="space-y-4 relative">
            {plan === "glow" && <LockedOverlay label="Glow Pass+" />}
            {analysisHistory.map((a) => (
              <div key={a.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">{a.id}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{a.date}</span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{a.vendor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Score: {a.score}/100</span>
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${a.score}%` }} />
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Skin type: <strong className="text-foreground">{a.skinType}</strong></p>
                    <div className="flex gap-1.5 flex-wrap">
                      {a.concerns.map((c) => (
                        <span key={c} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{a.products} products matched</span>
                    <button onClick={() => copy(a.link, a.id)} className="flex items-center gap-1 text-xs text-accent hover:text-accent/70 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {copied === a.id ? <><Check className="w-3 h-3" /> Copied</> : <><Share2 className="w-3 h-3" /> Share results</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RECOMMENDATIONS ── */}
      {tab === "recommendations" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Your product recommendations</h2>
            <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {plan === "glow" ? "Top 3 matches from your latest analysis." : "Full AI-matched list based on your latest skin analysis with priority product matching."}
            </p>
          </div>
          <div className="space-y-3">
            {(plan === "glow" ? recommendations.slice(0, 3) : recommendations).map((r, i) => (
              <div key={r.name} className={cn("bg-card border border-border rounded-xl p-4 flex items-center gap-4", i === 0 && "border-accent/30 ring-1 ring-accent/10")}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${i === 0 ? "bg-accent text-white" : "bg-muted text-muted-foreground"}`} style={{ fontFamily: "'DM Mono', monospace" }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{r.name}</p>
                    {r.badge && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full flex-shrink-0">{r.badge}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{r.brand} · {r.concern}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{r.price}</p>
                  <p className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>{r.match} match</p>
                </div>
              </div>
            ))}
          </div>
          {plan === "glow" && (
            <div className="bg-muted/50 border border-dashed border-border rounded-xl p-5 text-center">
              <Lock className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>See your full recommendation list</p>
              <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Upgrade to Glow Pass+ for priority product matching and the complete list of matched products.</p>
              <button className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Upgrade to Glow Pass+</button>
            </div>
          )}
        </div>
      )}

      {/* ── INGREDIENTS ── */}
      {tab === "ingredients" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Ingredient safety check & glossary</h2>
              <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Personalised for your skin type (Combination · Hyperpigmentation). <PlanBadge required="glowplus" current={plan} />
              </p>
            </div>
          </div>
          <div className="relative space-y-3">
            {plan === "glow" && <LockedOverlay label="Glow Pass+" />}
            {ingredientGlossary.map((ing) => (
              <div key={ing.name} className={cn("bg-card border rounded-xl p-4 flex items-start gap-4", ing.safe ? "border-border" : "border-red-200 bg-red-50/30")}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${ing.safe ? "bg-green-100" : "bg-red-100"}`}>
                  {ing.safe
                    ? <Check className="w-3.5 h-3.5 text-green-700" />
                    : <X className="w-3.5 h-3.5 text-red-600" />
                  }
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ing.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ing.safe ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`} style={{ fontFamily: "'DM Mono', monospace" }}>
                      {ing.safe ? "Safe for you" : "Flagged"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ing.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PROGRESS ── */}
      {tab === "progress" && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Monthly skin progress report</h2>
              <PlanBadge required="premium" current={plan} />
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Your skin score trend over the past 7 months.</p>
          </div>

          <div className="relative bg-card border border-border rounded-xl p-5">
            {plan !== "premium" && <LockedOverlay label="Premium Glow" />}
            {/* SVG chart */}
            <div className="mb-4 flex items-end gap-2 justify-between h-36">
              {progressScores.map((s, i) => {
                const isLatest = i === progressScores.length - 1;
                const height = `${(s.score / 100) * 100}%`;
                return (
                  <div key={s.month} className="flex flex-col items-center gap-1.5 flex-1">
                    <span className="text-xs font-medium text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{s.score}</span>
                    <div className="w-full rounded-t-sm flex items-end" style={{ height: "100px" }}>
                      <div
                        className={`w-full rounded-t-sm transition-all ${isLatest ? "bg-accent" : "bg-accent/25"}`}
                        style={{ height: `${(s.score / 100) * 100}px` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.month}</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border pt-4 grid sm:grid-cols-3 gap-4">
              {[
                { label: "Current score", value: "72 / 100", delta: "↑ 7 from last month", good: true },
                { label: "Best score", value: "72 / 100", delta: "Reached this month", good: true },
                { label: "Trend", value: "Improving", delta: "+21 pts over 7 months", good: true },
              ].map((s) => (
                <div key={s.label} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.label}</p>
                  <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>{s.value}</p>
                  <p className={`text-xs mt-0.5 ${s.good ? "text-green-700" : "text-red-600"}`} style={{ fontFamily: "'DM Mono', monospace" }}>{s.delta}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ROUTINE ── */}
      {tab === "routine" && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Personalised skincare routine</h2>
              <PlanBadge required="premium" current={plan} />
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Built for Combination skin · Hyperpigmentation · Lagos climate.</p>
          </div>
          <div className="relative">
            {plan !== "premium" && <LockedOverlay label="Premium Glow" />}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Morning Routine", steps: routineSteps.filter((s) => s.step.startsWith("AM")), color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Evening Routine", steps: routineSteps.filter((s) => s.step.startsWith("PM")), color: "text-indigo-600", bg: "bg-indigo-50" },
              ].map((group) => (
                <div key={group.label} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className={`px-4 py-3 ${group.bg} border-b border-border`}>
                    <p className={`text-sm font-medium ${group.color}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{group.label}</p>
                  </div>
                  <div className="divide-y divide-border">
                    {group.steps.map((s) => (
                      <div key={s.step} className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono text-muted-foreground w-8">{s.step}</span>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>{s.label}</p>
                        </div>
                        <p className="text-sm text-foreground ml-10" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.product}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 ml-10 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FAMILY ── */}
      {tab === "family" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Family skin profiles</h2>
                <PlanBadge required="premium" current={plan} />
              </div>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Track up to 5 family members. Each profile gets its own skin analysis history.</p>
            </div>
            <button onClick={() => setShowAddFamily((v) => !v)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Plus className="w-3.5 h-3.5" /> Add member
            </button>
          </div>
          <div className="relative space-y-3">
            {plan !== "premium" && <LockedOverlay label="Premium Glow" />}
            {showAddFamily && (
              <div className="bg-muted/30 border border-dashed border-border rounded-xl p-4 flex gap-2 flex-wrap">
                <input placeholder="Name" className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-accent min-w-32" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                <select className="bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground outline-none focus:border-accent">
                  <option>Dry</option><option>Oily</option><option>Combination</option><option>Normal</option>
                </select>
                <button onClick={() => setShowAddFamily(false)} className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Save</button>
              </div>
            )}
            {familyProfiles.map((m) => (
              <div key={m.name} className="bg-card border border-border rounded-xl flex items-center gap-4 px-5 py-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm ${m.isYou ? "bg-accent text-white" : "bg-muted text-foreground"}`}>
                  {m.name.split(" ")[0][0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    {m.isYou && <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">You</span>}
                  </div>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{m.skinType} · {m.concern}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Last scan</p>
                  <p className="text-xs font-medium text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{m.lastScan}</p>
                </div>
                <button onClick={() => setView("skintest")} className="flex items-center gap-1 text-xs text-accent hover:text-accent/70 transition-colors flex-shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  New scan <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
            <div className="text-xs text-muted-foreground text-center py-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {familyProfiles.length} of 5 profiles used
            </div>
          </div>
        </div>
      )}

      {/* ── PERKS ── */}
      {tab === "perks" && (
        <div className="space-y-6">
          {/* Discounts */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Exclusive vendor discounts</h2>
              <PlanBadge required="premium" current={plan} />
            </div>
            <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Discounts from Anovra partner vendors, available only to Premium Glow subscribers.</p>
            <div className="relative space-y-3">
              {plan !== "premium" && <LockedOverlay label="Premium Glow" />}
              {discounts.map((d) => (
                <div key={d.code} className={cn("bg-card border rounded-xl p-4 flex items-center gap-4", d.used ? "opacity-50" : "border-border")}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-foreground">{d.vendor}</p>
                      <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{d.discount}</span>
                      {d.used && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Used</span>}
                    </div>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Expires {d.expires}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground bg-muted px-3 py-1.5 rounded-lg">{d.code}</span>
                    {!d.used && (
                      <button onClick={() => copy(d.code, d.code)} className="flex items-center gap-1 text-xs text-accent hover:text-accent/70 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {copied === d.code ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Early access */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Early access features</h2>
              <PlanBadge required="premium" current={plan} />
            </div>
            <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>You get first access to new Anovra AI features before they go public.</p>
            <div className="relative space-y-3">
              {plan !== "premium" && <LockedOverlay label="Premium Glow" />}
              {[
                { name: "AI Skin Camera (Beta)", desc: "Live skin analysis via your phone camera — no photos required.", status: "Live for you", active: true },
                { name: "Seasonal Routine Adjustments", desc: "AI adapts your routine for harmattan, rainy season, and humidity changes.", status: "Live for you", active: true },
                { name: "Ingredient Conflict Checker", desc: "Upload your full skincare shelf and detect harmful combinations.", status: "Coming soon", active: false },
                { name: "African Dermatologist Network", desc: "In-app referrals to verified dermatologists across major Nigerian cities.", status: "Q3 2026", active: false },
              ].map((f) => (
                <div key={f.name} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.active ? "bg-green-500" : "bg-muted-foreground"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.desc}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${f.active ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"}`} style={{ fontFamily: "'DM Mono', monospace" }}>
                    {f.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating advisor chat (Premium) ── */}
      {plan === "premium" && (
        <div className="fixed bottom-6 right-6 z-50">
          {chatOpen && (
            <div className="w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden mb-3">
              <div className="bg-foreground px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Skin Advisor</p>
                  <p className="text-xs text-white/50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Certified · Usually replies in minutes</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-white/40 hover:text-white/70 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="h-52 overflow-y-auto p-4 space-y-3">
                {chatHistory.map((m, i) => (
                  <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${m.from === "user" ? "bg-accent text-white" : "bg-muted text-foreground"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-3 py-3 border-t border-border flex gap-2">
                <input
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Ask about your skin..."
                  className="flex-1 bg-muted rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-accent/30"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
                <button onClick={sendChat} className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent/90 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Send</button>
              </div>
            </div>
          )}
          <button
            onClick={() => setChatOpen((v) => !v)}
            className="w-12 h-12 bg-accent rounded-full shadow-lg flex items-center justify-center hover:bg-accent/90 transition-colors ml-auto"
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
