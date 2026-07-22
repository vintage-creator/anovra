import { useState } from "react";
import { Eye, AlertCircle, ChevronRight, Check, ExternalLink, MessageCircle, TrendingUp, Users, Activity, Store } from "lucide-react";
import type { View } from "./types";

// ---- TEAM MOCK CREDENTIALS ----
const TEAM_CREDENTIALS: Record<string, { name: string; role: "Marketing" | "Sales" | "Support"; id: string }> = {
  "chiamaka.obi@anovra.africa": { name: "Chiamaka Obi", role: "Marketing", id: "TM-001" },
  "emeka.nwosu@anovra.africa": { name: "Emeka Nwosu", role: "Sales", id: "TM-002" },
};
const TEAM_PASSWORD = "TeamDemo@2025!";

// ---- TEAM LOGIN ----
export function TeamLoginView({ setView }: { setView: (v: View) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setView("teamdashboard");
    }, 900);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-foreground px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Anovra Logo" className="h-12 w-auto mx-auto mb-3 object-contain" />
          <p className="text-3xl font-light text-primary-foreground tracking-tight mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
            Anovra
          </p>
          <p className="text-xs text-white/40 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
            Team Portal
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h2 className="text-lg font-light text-primary-foreground mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
            Sign in to your workspace
          </h2>
          <p className="text-xs text-white/40 mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Use the credentials created by your admin.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>
                Work email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@anovra.africa"
                className="w-full bg-white/8 border border-white/15 text-primary-foreground placeholder:text-white/25 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "rgba(255,255,255,0.05)" }}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/8 border border-white/15 text-primary-foreground placeholder:text-white/25 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent transition-colors pr-10"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "rgba(255,255,255,0.05)" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-2.5 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-60 mt-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs text-white/25 mt-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Forgot your password? Contact{" "}
            <span className="text-accent/60">admin@anovra.africa</span>
          </p>
        </div>

        <button
          onClick={() => setView("landing")}
          className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs mx-auto mt-6 transition-colors"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          Back to Anovra
        </button>
      </div>
    </div>
  );
}

// ---- TEAM DASHBOARD ----
type TeamDashTab = "overview" | "referrals" | "resources" | "leaderboard";

export function TeamDashboardView({ setView }: { setView: (v: View) => void }) {
  const [tab, setTab] = useState<TeamDashTab>("overview");
  const [copied, setCopied] = useState(false);
  // Simulating logged-in user as Chiamaka for the demo
  const member = { name: "Chiamaka Obi", role: "Marketing" as const, id: "TM-001" };
  const referralLink = `https://anovra.africa/scan?ref=chiamaka-obi-mk01`;

  function copyLink() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const kpis = [
    { label: "Link clicks", value: "1,284", delta: "+12% this week", up: true, icon: "🔗" },
    { label: "Scans via your link", value: "743", delta: "+8% this week", up: true, icon: "🧴" },
    { label: "Vendors onboarded", value: "18", delta: "+3 this month", up: true, icon: "🏪" },
    { label: "Conversions", value: "₦284,000", delta: "+21% this month", up: true, icon: "💰" },
  ];

  const leaderboard = [
    { rank: 1, name: "Emeka Nwosu", role: "Sales", scans: 2104, vendors: 31, revenue: "₦620,000", badge: "🥇" },
    { rank: 2, name: "Chiamaka Obi", role: "Marketing", scans: 1284, vendors: 18, revenue: "₦284,000", badge: "🥈", isMe: true },
    { rank: 3, name: "Fatima Bello", role: "Sales", scans: 998, vendors: 14, revenue: "₦210,500", badge: "🥉" },
    { rank: 4, name: "Adaeze Ike", role: "Support", scans: 701, vendors: 9, revenue: "₦148,000", badge: "" },
    { rank: 5, name: "Seun Adeyemi", role: "Marketing", scans: 514, vendors: 7, revenue: "₦102,300", badge: "" },
  ];

  const dailyScans = [
    { day: "Mon", scans: 89 }, { day: "Tue", scans: 124 }, { day: "Wed", scans: 107 },
    { day: "Thu", scans: 156 }, { day: "Fri", scans: 143 }, { day: "Sat", scans: 78 }, { day: "Sun", scans: 46 },
  ];
  const maxScans = Math.max(...dailyScans.map((d) => d.scans));

  const resources = [
    { title: "Vendor Pitch Deck", desc: "Full slide deck for onboarding new skin-care vendors", type: "PDF", size: "3.2 MB", icon: "📊" },
    { title: "Anovra Product One-Pager", desc: "Concise platform overview for quick outreach", type: "PDF", size: "840 KB", icon: "📄" },
    { title: "WhatsApp Script Templates", desc: "Copy-paste outreach messages for vendors & customers", type: "DOC", size: "120 KB", icon: "💬" },
    { title: "Brand Assets Pack", desc: "Logos, banners, and social media templates", type: "ZIP", size: "18 MB", icon: "🎨" },
    { title: "Objection Handling Guide", desc: "Common questions from vendors and how to respond", type: "PDF", size: "580 KB", icon: "🛡️" },
    { title: "Commission Structure 2025", desc: "Breakdown of commission tiers and bonus targets", type: "PDF", size: "240 KB", icon: "💵" },
  ];

  const recentActivity = [
    { time: "2 min ago", text: "New scan via your referral link", city: "Lagos" },
    { time: "18 min ago", text: "Vendor 'SkinGlow Lagos' signed up via your link", city: "Lagos" },
    { time: "1 hr ago", text: "New scan via your referral link", city: "Abuja" },
    { time: "3 hrs ago", text: "Vendor 'ClearFace PH' signed up via your link", city: "Port Harcourt" },
    { time: "Yesterday", text: "New scan via your referral link", city: "Ibadan" },
  ];

  const tabs: { id: TeamDashTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "referrals", label: "Referrals" },
    { id: "leaderboard", label: "Leaderboard" },
    { id: "resources", label: "Resources" },
  ];

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Top bar */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView("landing")}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008236] rounded-xl transition-transform hover:scale-105 active:scale-95 shrink-0"
              aria-label="Anovra Home"
            >
              <img src="/logo.png" alt="Anovra Logo" className="h-14 sm:h-16 md:h-18 w-auto object-contain transition-transform group-hover:scale-105" />
            </button>
            <span className="text-border text-sm">·</span>
            <span className="text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
              Team Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center">
                <span className="text-xs font-semibold text-accent">CO</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-foreground leading-none">{member.name}</p>
                <p className="text-xs text-muted-foreground leading-none mt-0.5">{member.role}</p>
              </div>
            </div>
            <button
              onClick={() => setView("teamlogin")}
              className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
            Good morning, {member.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here's what's happening with your referrals today.
          </p>
        </div>

        {/* Referral link banner */}
        <div className="bg-foreground rounded-2xl p-5 mb-7 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
              Your referral link
            </p>
            <p className="text-sm text-white/90 font-mono truncate">{referralLink}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent/90 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white/80 text-xs font-medium rounded-lg hover:bg-white/15 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                tab === t.id
                  ? "bg-card shadow-sm text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((k) => (
                <div key={k.label} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg">{k.icon}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${k.up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {k.delta}
                    </span>
                  </div>
                  <p className="text-2xl font-light text-foreground mb-0.5" style={{ fontFamily: "'Fraunces', serif" }}>
                    {k.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Daily scans chart */}
              <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
                <h3 className="font-medium text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Scans via your link — this week
                </h3>
                <p className="text-xs text-muted-foreground mb-5">Total: 743 scans</p>
                <div className="flex items-end gap-2 h-32">
                  {dailyScans.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {d.scans}
                      </span>
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${(d.scans / maxScans) * 100}px`,
                          background: `linear-gradient(to top, #C86B3A, #D4854A)`,
                          opacity: d.day === "Thu" ? 1 : 0.6,
                        }}
                      />
                      <span className="text-xs text-muted-foreground">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent activity */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-medium text-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Recent activity
                </h3>
                <div className="space-y-3">
                  {recentActivity.map((a, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-foreground leading-snug">{a.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.time} · {a.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REFERRALS */}
        {tab === "referrals" && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Total link clicks", value: "1,284", sub: "All time" },
                { label: "Unique visitors", value: "918", sub: "All time" },
                { label: "Scans conducted", value: "743", sub: "Via your link" },
                { label: "Vendors signed up", value: "18", sub: "Via your link" },
                { label: "Customers converted", value: "312", sub: "Purchased after scan" },
                { label: "Commission earned", value: "₦142,000", sub: "Pending payout" },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-2">{s.label}</p>
                  <p className="text-2xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Referral funnel */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-medium text-foreground mb-1">Referral funnel</h3>
              <p className="text-xs text-muted-foreground mb-5">How people move from link click → purchase</p>
              <div className="space-y-2.5">
                {[
                  { stage: "Link clicked", count: 1284, pct: 100, color: "#C86B3A" },
                  { stage: "Visited scan page", count: 918, pct: 71, color: "#D4854A" },
                  { stage: "Completed skin test", count: 743, pct: 58, color: "#B85A2E" },
                  { stage: "Viewed product", count: 521, pct: 41, color: "#E09060" },
                  { stage: "Purchased", count: 312, pct: 24, color: "#A04820" },
                ].map((f) => (
                  <div key={f.stage}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{f.stage}</span>
                      <span className="font-mono text-foreground">{f.count.toLocaleString()} · {f.pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${f.pct}%`, background: f.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Share options */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-medium text-foreground mb-4">Share your link</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { channel: "WhatsApp", icon: "💬", desc: "Send a pre-written WhatsApp message", color: "bg-green-50 border-green-200 text-green-700" },
                  { channel: "Instagram DM", icon: "📸", desc: "Share a story with your link in bio", color: "bg-pink-50 border-pink-200 text-pink-700" },
                  { channel: "Email campaign", icon: "📧", desc: "Copy HTML snippet for email blasts", color: "bg-blue-50 border-blue-200 text-blue-700" },
                  { channel: "QR Code", icon: "◼️", desc: "Download a print-ready QR code", color: "bg-gray-50 border-gray-200 text-gray-700" },
                ].map((c) => (
                  <button key={c.channel} className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition-opacity hover:opacity-80 ${c.color}`}>
                    <span className="text-2xl">{c.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{c.channel}</p>
                      <p className="text-xs opacity-70 mt-0.5">{c.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Vendors signed up via referral link */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">Vendors signed up via your link</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">18 vendors total · showing most recent first</p>
                </div>
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                  18 vendors
                </span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { name: "SkinGlow Lagos", owner: "Adaeze Nkem", city: "Lagos", plan: "Premium", joined: "Jul 6, 2025", products: 14, revenue: "₦89,400" },
                  { name: "ClearFace PH", owner: "Blessing Obi", city: "Port Harcourt", plan: "Basic", joined: "Jul 4, 2025", products: 7, revenue: "₦31,200" },
                  { name: "NatureSkin Abuja", owner: "Hauwa Musa", city: "Abuja", plan: "Premium", joined: "Jul 2, 2025", products: 22, revenue: "₦140,000" },
                  { name: "GlowUp Ibadan", owner: "Sola Adeleke", city: "Ibadan", plan: "Free", joined: "Jun 30, 2025", products: 3, revenue: "—" },
                  { name: "RadiancePro Kano", owner: "Fatima Yusuf", city: "Kano", plan: "Basic", joined: "Jun 28, 2025", products: 9, revenue: "₦42,700" },
                  { name: "BeautyHub Enugu", owner: "Chioma Ezeh", city: "Enugu", plan: "Free", joined: "Jun 25, 2025", products: 2, revenue: "—" },
                  { name: "SkinFirst Warri", owner: "Efemena Okoro", city: "Warri", plan: "Premium", joined: "Jun 22, 2025", products: 18, revenue: "₦97,600" },
                  { name: "PureGlow Owerri", owner: "Ngozi Iheji", city: "Owerri", plan: "Basic", joined: "Jun 19, 2025", products: 11, revenue: "₦58,100" },
                  { name: "FaceFirst Benin", owner: "Ese Ovienmhada", city: "Benin", plan: "Free", joined: "Jun 17, 2025", products: 4, revenue: "—" },
                  { name: "SkincareNG Jos", owner: "Lydia Dung", city: "Jos", plan: "Basic", joined: "Jun 14, 2025", products: 6, revenue: "₦27,500" },
                ].map((v, i) => {
                  const planStyle =
                    v.plan === "Premium"
                      ? "bg-foreground text-primary-foreground"
                      : v.plan === "Basic"
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "bg-muted text-muted-foreground border border-border";
                  return (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-accent">
                          {v.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                        </span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{v.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planStyle}`}>
                            {v.plan}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {v.owner} · {v.city}
                        </p>
                      </div>
                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-6 text-right flex-shrink-0">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Products</p>
                          <p className="text-sm font-mono font-medium text-foreground">{v.products}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Revenue</p>
                          <p className="text-sm font-mono font-medium text-foreground">{v.revenue}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Joined</p>
                          <p className="text-xs font-mono text-muted-foreground">{v.joined}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3 bg-muted/40 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Showing 10 of 18 vendors
                </p>
                <button className="text-xs text-accent font-medium hover:text-accent/70 transition-colors">
                  View all 18 →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {tab === "leaderboard" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">Team leaderboard</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Ranked by total scans · July 2025</p>
                </div>
                <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-medium">
                  {member.id} · {member.role}
                </span>
              </div>
              <div className="divide-y divide-border">
                {leaderboard.map((m) => (
                  <div
                    key={m.rank}
                    className={`flex items-center gap-4 px-5 py-4 ${(m as any).isMe ? "bg-accent/5 border-l-2 border-l-accent" : ""}`}
                  >
                    <span className="w-6 text-center text-lg flex-shrink-0">{m.badge || <span className="text-sm text-muted-foreground font-mono">{m.rank}</span>}</span>
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-accent">
                        {m.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {m.name} {(m as any).isMe && <span className="text-xs text-accent font-normal">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.role}</p>
                    </div>
                    <div className="hidden sm:grid grid-cols-3 gap-6 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Scans</p>
                        <p className="text-sm font-mono font-medium text-foreground">{m.scans.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Vendors</p>
                        <p className="text-sm font-mono font-medium text-foreground">{m.vendors}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Revenue</p>
                        <p className="text-sm font-mono font-medium text-foreground">{m.revenue}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Target tracker */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-medium text-foreground mb-4">Your monthly targets</h3>
              <div className="space-y-4">
                {[
                  { label: "Vendors onboarded", current: 18, target: 25, color: "#C86B3A" },
                  { label: "Scans via link", current: 743, target: 1000, color: "#D4854A" },
                  { label: "Revenue generated", current: 284000, target: 500000, display: "₦284K / ₦500K", color: "#B85A2E" },
                ].map((t) => {
                  const pct = Math.min(100, Math.round((t.current / t.target) * 100));
                  return (
                    <div key={t.label}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-foreground font-medium">{t.label}</span>
                        <span className="text-muted-foreground font-mono">
                          {t.display || `${t.current.toLocaleString()} / ${t.target.toLocaleString()}`} · {pct}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: t.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* RESOURCES */}
        {tab === "resources" && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((r) => (
                <div key={r.title} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-accent/40 transition-colors">
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{r.icon}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">{r.type} · {r.size}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-0.5">{r.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
                  </div>
                  <button className="mt-auto flex items-center gap-1.5 text-xs text-accent hover:text-accent/70 font-medium transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              ))}
            </div>

            {/* Announcements */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-medium text-foreground mb-4">📢 Team announcements</h3>
              <div className="space-y-3">
                {[
                  { date: "Jul 7, 2025", title: "New commission tier unlocked", body: "Anyone who onboards 20+ vendors this month earns 15% commission instead of 10%. You're at 18 — just 2 more to go!" },
                  { date: "Jul 1, 2025", title: "Q3 targets released", body: "See the updated target sheet in Resources. Leaderboard bonuses now include top 3 spots." },
                  { date: "Jun 28, 2025", title: "New pitch deck uploaded", body: "The updated vendor pitch deck is now in Resources. Use this version for all new outreach." },
                ].map((a, i) => (
                  <div key={i} className="border-b border-border last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-mono">{a.date}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="text-xs font-semibold text-foreground">{a.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{a.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
