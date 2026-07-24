import { useState, useEffect } from "react";
import { Eye, AlertCircle, ChevronRight, Check, ExternalLink, MessageCircle, Store, Link as LinkIcon, Scan, Wallet, FileText, Megaphone } from "lucide-react";
import type { View } from "./types";
import { supabase } from "./utils/supabase";
import { toast } from "sonner";

// ---- TEAM LOGIN ----
export function TeamLoginView({ setView }: { setView: (v: View) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      setView("teamdashboard");
    } catch (err: any) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-foreground px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Anovra Logo" className="h-12 w-auto mx-auto mb-3 object-contain" />
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
  const [tab, setTab] = useState<TeamDashTab>(() => (sessionStorage.getItem("active_team_tab") as TeamDashTab) || "overview");
  const [copied, setCopied] = useState(false);
  const [member, setMember] = useState<any>({ name: "Team member", role: "Team", id: "" });
  const [referralLink, setReferralLink] = useState("");
  const [referralEvents, setReferralEvents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [monthlyTargets, setMonthlyTargets] = useState<any[]>([]);

  useEffect(() => {
    sessionStorage.setItem("active_team_tab", tab);
  }, [tab]);

  useEffect(() => {
    const loadTeamDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setView("teamlogin");
        return;
      }
      const { data: membership, error: membershipError } = await supabase
        .from("team_members")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (membershipError) {
        console.warn("Team membership lookup failed:", membershipError.message);
      }
      if (!membership) {
        toast.error("No team workspace is assigned to this account.");
        setView("teamlogin");
        return;
      }

      setMember({
        name: membership.name || user.email,
        role: membership.role || "Team",
        id: membership.referral_code || membership.id?.slice(0, 8).toUpperCase() || "",
      });
      setReferralLink(membership.referral_code ? `https://anovra.africa/#/scan?ref=${membership.referral_code}` : "");

      const [{ data: events }, { data: resourceRows }, { data: announcementRows }, { data: targetRows }] = await Promise.all([
        supabase.from("team_referral_events").select("*").eq("team_member_id", membership.id).order("created_at", { ascending: false }),
        supabase.from("team_resources").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("team_announcements").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("team_targets").select("*").eq("team_member_id", membership.id),
      ]);

      setReferralEvents(events || []);
      setResources(resourceRows || []);
      setAnnouncements(announcementRows || []);
      setMonthlyTargets((targetRows || []).map((target) => ({
        label: target.metric === "vendors_onboarded" ? "Vendors onboarded" : target.metric === "scans_via_link" ? "Scans via link" : "Revenue generated",
        current: 0,
        target: Number(target.target || 0),
        display: target.metric === "revenue_generated" ? `₦0 / ₦${Number(target.target || 0).toLocaleString()}` : undefined,
        color: target.metric === "vendors_onboarded" ? "#C86B3A" : target.metric === "scans_via_link" ? "#D4854A" : "#B85A2E",
      })));
    };
    loadTeamDashboard();
  }, [setView]);

  const countEvents = (type: string) => referralEvents.filter((event) => event.event_type === type).length;
  const revenueGenerated = referralEvents
    .filter((event) => event.event_type === "purchase")
    .reduce((sum, event) => sum + Number(event.amount || 0), 0);
  const linkClicks = countEvents("link_click");
  const scanStarted = countEvents("scan_started");
  const scansCompleted = countEvents("scan_completed");
  const vendorsSignedUp = countEvents("vendor_signup");
  const productClicks = countEvents("product_click");
  const purchases = countEvents("purchase");

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const kpis = [
    { label: "Link clicks", value: String(linkClicks), delta: linkClicks ? "Live referral data" : "No live referrals yet", up: true, icon: <LinkIcon className="w-4 h-4" /> },
    { label: "Scans via your link", value: String(scansCompleted), delta: scansCompleted ? "Live referral data" : "No live referrals yet", up: true, icon: <Scan className="w-4 h-4" /> },
    { label: "Vendors onboarded", value: String(vendorsSignedUp), delta: vendorsSignedUp ? "Live referral data" : "No live referrals yet", up: true, icon: <Store className="w-4 h-4" /> },
    { label: "Conversions", value: `₦${revenueGenerated.toLocaleString()}`, delta: revenueGenerated ? "Tracked payouts" : "No tracked payouts yet", up: true, icon: <Wallet className="w-4 h-4" /> },
  ];

  const leaderboard = referralEvents.length ? [{
    rank: 1,
    name: member.name,
    role: member.role,
    scans: scansCompleted,
    vendors: vendorsSignedUp,
    revenue: `₦${revenueGenerated.toLocaleString()}`,
    isMe: true,
  }] : [];

  const dailyScans = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => ({
    day,
    scans: referralEvents.filter((event) => {
      if (event.event_type !== "scan_completed") return false;
      const jsDay = new Date(event.created_at).getDay();
      const mondayIndex = jsDay === 0 ? 6 : jsDay - 1;
      return mondayIndex === index;
    }).length,
  }));
  const maxScans = Math.max(...dailyScans.map((d) => d.scans)) || 1;

  const recentActivity = referralEvents.slice(0, 5).map((event) => ({
    text: event.event_type.replace(/_/g, " "),
    time: new Date(event.created_at).toLocaleDateString("en-GB"),
    city: event.city || "Online",
  }));
  const referredVendors = referralEvents.filter((event) => event.event_type === "vendor_signup");
  const referralStats = [
    { label: "Total link clicks", value: String(linkClicks), sub: "All time" },
    { label: "Unique visitors", value: String(linkClicks), sub: "Tracked clicks" },
    { label: "Scans conducted", value: String(scansCompleted), sub: "Via your link" },
    { label: "Vendors signed up", value: String(vendorsSignedUp), sub: "Via your link" },
    { label: "Customers converted", value: String(purchases), sub: "Purchased after scan" },
    { label: "Commission earned", value: `₦${revenueGenerated.toLocaleString()}`, sub: "Pending payout" },
  ];
  const funnelBase = Math.max(linkClicks, scanStarted, scansCompleted, productClicks, purchases, 1);
  const referralFunnel = [
    { stage: "Link clicked", count: linkClicks, pct: linkClicks ? 100 : 0, color: "#C86B3A" },
    { stage: "Visited scan page", count: scanStarted, pct: Math.round((scanStarted / funnelBase) * 100), color: "#D4854A" },
    { stage: "Completed skin test", count: scansCompleted, pct: Math.round((scansCompleted / funnelBase) * 100), color: "#B85A2E" },
    { stage: "Viewed product", count: productClicks, pct: Math.round((productClicks / funnelBase) * 100), color: "#E09060" },
    { stage: "Purchased", count: purchases, pct: Math.round((purchases / funnelBase) * 100), color: "#A04820" },
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
                <span className="text-xs font-semibold text-accent">TM</span>
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
            Good morning, {member.name.split(" ")[0]}
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
            <p className="text-sm text-white/90 font-mono truncate">{referralLink || "No referral link assigned yet"}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={copyLink}
              disabled={!referralLink}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button disabled={!referralLink} className="flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white/80 text-xs font-medium rounded-lg hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <MessageCircle className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-6 items-start">
          <aside className="bg-card border border-border rounded-xl p-2 sticky top-24">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all ${
                  tab === t.id
                    ? "bg-accent text-white shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </aside>

          <main className="min-w-0">

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
                <p className="text-xs text-muted-foreground mb-5">Total: 0 scans</p>
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
                  {recentActivity.length > 0 ? recentActivity.map((a, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-foreground leading-snug">{a.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.time} · {a.city}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="border border-dashed border-border rounded-lg p-5 text-center text-xs text-muted-foreground">
                      No referral activity has been recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REFERRALS */}
        {tab === "referrals" && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {referralStats.map((s) => (
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
                {referralFunnel.map((f) => (
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
                  { channel: "WhatsApp", icon: <MessageCircle className="w-5 h-5" />, desc: "Share the assigned referral link", color: "bg-green-50 border-green-200 text-green-700" },
                  { channel: "Email campaign", icon: <Megaphone className="w-5 h-5" />, desc: "Copy the assigned referral link", color: "bg-blue-50 border-blue-200 text-blue-700" },
                ].map((c) => (
                  <button key={c.channel} disabled={!referralLink} className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed ${c.color}`}>
                    <span>{c.icon}</span>
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
                  <p className="text-xs text-muted-foreground mt-0.5">No referred vendors recorded yet</p>
                </div>
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                  0 vendors
                </span>
              </div>
              <div className="divide-y divide-border">
                {referredVendors.length > 0 ? referredVendors.map((v, i) => {
                  const meta = v.metadata || {};
                  const vendorName = meta.business_name || meta.vendor_name || "Referred vendor";
                  const vendorPlan = meta.plan || "Pending";
                  const planStyle =
                    vendorPlan === "Premium" || vendorPlan === "premium"
                      ? "bg-foreground text-primary-foreground"
                      : vendorPlan === "Basic" || vendorPlan === "basic"
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "bg-muted text-muted-foreground border border-border";
                  return (
                    <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-accent">
                          {vendorName.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                        </span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{vendorName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planStyle}`}>
                            {vendorPlan}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {meta.owner || "Owner not recorded"} · {v.city || meta.city || "Online"}
                        </p>
                      </div>
                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-6 text-right flex-shrink-0">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Products</p>
                          <p className="text-sm font-mono font-medium text-foreground">{meta.products || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Revenue</p>
                          <p className="text-sm font-mono font-medium text-foreground">₦{Number(v.amount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Joined</p>
                          <p className="text-xs font-mono text-muted-foreground">{new Date(v.created_at || Date.now()).toLocaleDateString("en-GB")}</p>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Referred vendors will appear here when referral tracking is connected.
                  </div>
                )}
              </div>
              <div className="px-5 py-3 bg-muted/40 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Showing {referredVendors.length} vendor{referredVendors.length === 1 ? "" : "s"}
                </p>
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
                  <p className="text-xs text-muted-foreground mt-0.5">Ranked by tracked referral performance</p>
                </div>
                <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-medium">
                  {member.id} · {member.role}
                </span>
              </div>
              <div className="divide-y divide-border">
                {leaderboard.length > 0 ? leaderboard.map((m) => (
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
                )) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No leaderboard data is available yet.
                  </div>
                )}
              </div>
            </div>

            {/* Target tracker */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-medium text-foreground mb-4">Your monthly targets</h3>
              <div className="space-y-4">
                {monthlyTargets.map((t) => {
                  const pct = t.target > 0 ? Math.min(100, Math.round((t.current / t.target) * 100)) : 0;
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
              {resources.length > 0 ? resources.map((r) => (
                <div key={r.title} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-accent/40 transition-colors">
                  <div className="flex items-start justify-between">
                    <FileText className="w-5 h-5 text-accent" />
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">{r.file_type || "FILE"} · {r.file_size || "—"}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-0.5">{r.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.description || "Team resource"}</p>
                  </div>
                  <a href={r.file_url || "#"} target="_blank" rel="noreferrer" className="mt-auto flex items-center gap-1.5 text-xs text-accent hover:text-accent/70 font-medium transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </a>
                </div>
              )) : (
                <div className="sm:col-span-2 lg:col-span-3 bg-card border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
                  Team resources have not been uploaded yet.
                </div>
              )}
            </div>

            {/* Announcements */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-medium text-foreground mb-4">Team announcements</h3>
              <div className="space-y-3">
                {announcements.length > 0 ? announcements.map((a, i) => (
                  <div key={i} className="border-b border-border last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground font-mono">{new Date(a.created_at || Date.now()).toLocaleDateString("en-GB")}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="text-xs font-semibold text-foreground">{a.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{a.body}</p>
                  </div>
                )) : (
                  <div className="border border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
                    No team announcements have been published yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
          </main>
        </div>
      </div>
    </div>
  );
}
