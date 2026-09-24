import { useState, useEffect } from "react";
import {
  Eye, AlertCircle, ChevronRight, Check, ExternalLink, MessageCircle, Store,
  Link as LinkIcon, Scan, Wallet, FileText, Megaphone, LayoutDashboard,
  Trophy, BookOpen, Settings, Menu, X, LogOut, Users,
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { supabase } from "./utils/supabase";
import { toast } from "sonner";
import { UnifiedDashboardHeader } from "./components/UnifiedDashboardHeader";

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
type TeamDashTab = "overview" | "referrals" | "leaderboard" | "announcements" | "resources" | "settings";

export function TeamDashboardView({ setView }: { setView: (v: View) => void }) {
  const [tab, setTab] = useState<TeamDashTab>(() => (sessionStorage.getItem("active_team_tab") as TeamDashTab) || "overview");
  const [copied, setCopied] = useState(false);
  const [member, setMember] = useState<any>({ name: "Team member", role: "Team", id: "", headshotUrl: "" });
  const [referralLink, setReferralLink] = useState("");
  const [referralEvents, setReferralEvents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [monthlyTargets, setMonthlyTargets] = useState<any[]>([]);
  const [leaderboardRows, setLeaderboardRows] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile forms
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    email: "",
    headshotUrl: "",
    saving: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
    saving: false,
  });

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileForm((prev) => ({ ...prev, saving: true }));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-platform-team", { body: {
        action: "update_profile",
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        headshot_url: profileForm.headshotUrl,
      } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setMember((prev: any) => ({
        ...prev,
        name: profileForm.name,
        headshotUrl: profileForm.headshotUrl,
      }));
      toast.success("Profile details updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile details.");
    } finally {
      setProfileForm((prev) => ({ ...prev, saving: false }));
    }
  }

  async function handleProfilePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedFormats = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedFormats.includes(file.type)) {
      toast.error("Format not supported. Please upload a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    const toastId = toast.loading("Uploading new headshot photo...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const filePath = `team-profile-${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("vendor-documents")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("vendor-documents")
        .getPublicUrl(filePath);

      setProfileForm((prev) => ({ ...prev, headshotUrl: publicUrl }));
      toast.success("Photo uploaded! Click 'Save changes' to apply.", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo.", { id: toastId });
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setPasswordForm((prev) => ({ ...prev, saving: true }));
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setPasswordForm({ newPassword: "", confirmPassword: "", saving: false });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setPasswordForm((prev) => ({ ...prev, saving: false }));
    }
  }

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
      let membership: any = null;
      try {
        const { data: memberRec, error: membershipError } = await supabase
          .from("team_members")
          .select("*")
          .eq("email", user.email)
          .maybeSingle();
        if (membershipError) console.warn("Team membership lookup failed:", membershipError.message);
        
        if (memberRec && memberRec.status !== "suspended") {
          membership = memberRec;
        } else {
          // Fallback to admin_team table to resolve platform field officers
          const { data: adminRec, error: adminErr } = await supabase
            .from("admin_team")
            .select("*")
            .or(`email.eq."${user.email}",username.eq."${user.email}"`)
            .maybeSingle();
          if (adminErr) console.warn("Admin team fallback lookup failed:", adminErr.message);
          if (adminRec?.status === "active") {
            membership = {
              id: adminRec.id,
              name: adminRec.name,
              email: adminRec.email,
              role: adminRec.role,
              referral_code: adminRec.username || adminRec.id.slice(0, 8),
              headshot_url: adminRec.headshot_url,
              phone: adminRec.phone || "",
            };
          }
        }
      } catch (err) {
        console.error("Failed to load workspace membership:", err);
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
        headshotUrl: membership.headshot_url || "",
      });
      setProfileForm({
        name: membership.name || "",
        phone: membership.phone || "",
        email: membership.email || user.email,
        headshotUrl: membership.headshot_url || "",
        saving: false,
      });
      setReferralLink(membership.referral_code ? `https://anovra-api.vercel.app/#/scan?ref=${membership.referral_code}` : "");

      const [{ data: events }, { data: resourceRows }, { data: announcementRows }, { data: targetRows }, { data: leaderboardData }] = await Promise.all([
        supabase.from("team_referral_events").select("*").eq("team_member_id", membership.id).order("created_at", { ascending: false }),
        supabase.from("team_resources").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("team_announcements").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("team_targets").select("*").eq("team_member_id", membership.id),
        supabase.rpc("get_platform_team_leaderboard"),
      ]);

      const localEvents = events || [];
      const localScansCompleted = localEvents.filter(e => e.event_type === "scan_completed").length;
      const localVendorsSignedUp = localEvents.filter(e => e.event_type === "vendor_signup").length;
      const localRevenueGenerated = localEvents.filter(e => e.event_type === "purchase").reduce((sum, e) => sum + Number(e.amount || 0), 0);

      setReferralEvents(localEvents);
      setResources(resourceRows || []);
      setAnnouncements(announcementRows || []);
      setLeaderboardRows((leaderboardData || []).map((row: any) => ({
        rank: Number(row.rank),
        id: row.member_id,
        name: row.member_name,
        role: row.member_role,
        scans: Number(row.scans || 0),
        vendors: Number(row.vendors || 0),
        revenue: `₦${Number(row.revenue || 0).toLocaleString()}`,
        isMe: row.member_id === membership.id,
        headshotUrl: row.headshot_url || "",
      })));
      setMonthlyTargets((targetRows || []).map((target) => {
        const isVendors = target.metric === "vendors_onboarded";
        const isScans = target.metric === "scans_via_link";
        const isRevenue = target.metric === "revenue_generated";
        const currentVal = isVendors ? localVendorsSignedUp : isScans ? localScansCompleted : isRevenue ? localRevenueGenerated : 0;
        
        return {
          label: isVendors ? "Vendors onboarded" : isScans ? "Scans via link" : "Revenue generated",
          current: currentVal,
          target: Number(target.target || 0),
          display: isRevenue ? `₦${currentVal.toLocaleString()} / ₦${Number(target.target || 0).toLocaleString()}` : `${currentVal} / ${Number(target.target || 0).toLocaleString()}`,
          color: isVendors ? "#C86B3A" : isScans ? "#D4854A" : "#B85A2E",
        };
      }));
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

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message || "Unable to sign out.");
      return;
    }
    sessionStorage.removeItem("active_team_tab");
    setView("teamlogin");
  }

  const kpis = [
    { label: "Link clicks", value: String(linkClicks), delta: linkClicks ? "Live referral data" : "No live referrals yet", up: true, icon: <LinkIcon className="w-4 h-4" /> },
    { label: "Scans via your link", value: String(scansCompleted), delta: scansCompleted ? "Live referral data" : "No live referrals yet", up: true, icon: <Scan className="w-4 h-4" /> },
    { label: "Vendors onboarded", value: String(vendorsSignedUp), delta: vendorsSignedUp ? "Live referral data" : "No live referrals yet", up: true, icon: <Store className="w-4 h-4" /> },
    { label: "Conversions", value: `₦${revenueGenerated.toLocaleString()}`, delta: revenueGenerated ? "Tracked payouts" : "No tracked payouts yet", up: true, icon: <Wallet className="w-4 h-4" /> },
  ];

  const leaderboard = leaderboardRows;

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

  const recentActivity = referralEvents.slice(0, 5).map((event) => {
    let text = "Referral activity";
    const meta = event.metadata || {};
    if (event.event_type === "link_click") {
      text = "Someone clicked your referral link";
    } else if (event.event_type === "scan_started") {
      text = "A customer started a skin scan";
    } else if (event.event_type === "scan_completed") {
      text = "A customer completed a skin scan";
    } else if (event.event_type === "vendor_signup") {
      text = `Vendor "${meta.business_name || meta.vendor_name || "New Vendor"}" signed up`;
    } else if (event.event_type === "product_click") {
      text = `A customer viewed product: ${meta.product_name || "Anovra product"}`;
    } else if (event.event_type === "purchase") {
      text = `A customer purchased (payout: ₦${Number(event.amount || 0).toLocaleString()})`;
    }
    return {
      text,
      time: new Date(event.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + " " + new Date(event.created_at).toLocaleDateString("en-GB"),
      city: event.city || "Nigeria",
    };
  });
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

  const tabs: { id: TeamDashTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "referrals", label: "Referrals", icon: LinkIcon },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "resources", label: "Resources", icon: BookOpen },
    { id: "settings", label: "Profile & security", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background pb-12" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <UnifiedDashboardHeader
        currentView="teamdashboard"
        setView={setView}
        title="Team workspace"
        badgeText={member.role || "TEAM"}
        role="admin"
        showShopLink={false}
        onMenuClick={() => setSidebarOpen((open) => !open)}
        menuLabel={sidebarOpen ? "Close" : "Menu"}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative pt-2">
        <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] gap-6 items-start">
          <aside className="hidden lg:flex bg-card border border-border rounded-xl py-5 px-3 sticky top-24 h-[calc(100vh-7rem)] flex-col justify-between overflow-hidden">
            <div className="space-y-2 overflow-y-auto pr-1">
              <div className="px-3 pb-4 mb-2 border-b border-border flex items-center gap-3 min-w-0">
                {member.headshotUrl && !member.headshotUrl.startsWith("blob:") ? (
                  <img src={member.headshotUrl} alt={member.name} className="w-9 h-9 rounded-full object-cover bg-secondary shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                    {member.name.split(/\s+/).filter(Boolean).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase() || "TM"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate" title={member.name}>{member.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{member.role}</p>
                </div>
              </div>
              {tabs.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => setTab(item.id)} className={cn("w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-left transition-colors", tab === item.id ? "bg-accent text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 mt-4 border-t border-border pt-4 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </aside>

          <div className={cn("fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] transition-[opacity,visibility] duration-300 lg:hidden", sidebarOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none")} onClick={() => setSidebarOpen(false)} />
          <aside className={cn("fixed inset-y-0 left-0 z-[60] w-72 max-w-[85vw] bg-card border-r border-border p-5 flex flex-col justify-between transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
            <div className="min-h-0 flex flex-col">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-border">
                <div className="flex items-center gap-2 min-w-0"><Users className="w-5 h-5 text-accent shrink-0" /><span className="font-semibold text-foreground truncate">Team menu</span></div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Close navigation"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2 overflow-y-auto">
                {tabs.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-left transition-colors", tab === item.id ? "bg-accent text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                      <Icon className="w-4 h-4 shrink-0" /><span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"><LogOut className="w-4 h-4" />Sign out</button>
          </aside>

          <main className="min-w-0 w-full">
        {/* Welcome */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="min-w-0">
          <h1 className="text-2xl font-light text-foreground break-words" style={{ fontFamily: "'Fraunces', serif" }}>
            Good morning, {member.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Here is what is happening with your referrals today.
          </p>
          </div>
          <span className="self-start sm:self-auto max-w-full text-[11px] bg-secondary border border-border text-muted-foreground px-3 py-1.5 rounded-full font-mono truncate" title={member.id}>{member.role}{member.id ? ` · ${member.id}` : ""}</span>
        </div>

        {/* Referral link banner */}
        <div className="bg-foreground rounded-xl p-4 sm:p-5 mb-7 flex flex-col sm:flex-row sm:items-center gap-4 overflow-hidden">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
              Your referral link
            </p>
            <p className="text-sm text-white/90 font-mono truncate">{referralLink || "No referral link assigned yet"}</p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2 sm:flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={copyLink}
              disabled={!referralLink}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              disabled={!referralLink}
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: "Anovra Skin Diagnostics",
                      text: "Take your skin diagnostic test check and explore custom skincare formulations on Anovra:",
                      url: referralLink,
                    });
                  } catch (err) {
                    console.warn("Share sheet interaction aborted or failed:", err);
                  }
                } else {
                  copyLink();
                  toast.success("Referral link copied! (Share sheet not supported on this browser)");
                }
              }}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-white/10 text-white/80 text-xs font-medium rounded-lg hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-w-0"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* KPI grid */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {kpis.map((k) => (
                <div key={k.label} className="bg-card border border-border rounded-xl p-4 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-lg">{k.icon}</span>
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full text-right leading-tight max-w-[70%] ${k.up ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
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
                <p className="text-xs text-muted-foreground mb-5">Total: {scansCompleted.toLocaleString()} scans</p>
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
                <button
                  disabled={!referralLink}
                  onClick={() => {
                    const shareText = `Check out Anovra's skin diagnostic check using my referral: ${referralLink}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, "_blank");
                  }}
                  className="flex items-center gap-3 p-3.5 rounded-lg border text-left transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed bg-green-50 border-green-200 text-green-700 cursor-pointer"
                >
                  <span><MessageCircle className="w-5 h-5" /></span>
                  <div>
                    <p className="text-sm font-medium">WhatsApp</p>
                    <p className="text-xs opacity-70 mt-0.5">Share prefilled text via WhatsApp</p>
                  </div>
                </button>
                <button
                  disabled={!referralLink}
                  onClick={() => {
                    copyLink();
                    toast.success("Referral link copied! Pre-formatted for your email campaign.");
                  }}
                  className="flex items-center gap-3 p-3.5 rounded-lg border text-left transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-50 border-blue-200 text-blue-700 cursor-pointer"
                >
                  <span><Megaphone className="w-5 h-5" /></span>
                  <div>
                    <p className="text-sm font-medium">Email campaign</p>
                    <p className="text-xs opacity-70 mt-0.5">Copy referral link for campaign templates</p>
                  </div>
                </button>
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
              <div className="px-4 sm:px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground">Team leaderboard</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Ranked by tracked referral performance</p>
                </div>
                <span className="self-start sm:self-auto max-w-full text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-medium truncate" title={`${member.id} · ${member.role}`}>
                  {member.role}{member.id ? ` · ${member.id}` : ""}
                </span>
              </div>
              <div className="divide-y divide-border">
                {leaderboard.length > 0 ? leaderboard.map((m) => (
                  <div
                    key={m.rank}
                    className={`grid grid-cols-[auto_auto_minmax(0,1fr)] sm:grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 min-w-0 ${(m as any).isMe ? "bg-accent/5 border-l-2 border-l-accent" : ""}`}
                  >
                    <span className="w-6 text-center text-lg flex-shrink-0">{m.badge || <span className="text-sm text-muted-foreground font-mono">{m.rank}</span>}</span>
                    {m.headshotUrl && !m.headshotUrl.startsWith("blob:") ? (
                      <img
                        src={m.headshotUrl}
                        alt={m.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-secondary"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 font-bold text-xs text-accent">
                        {m.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {m.name} {(m as any).isMe && <span className="text-xs text-accent font-normal">(you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{m.role}</p>
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
                    <div className="col-span-3 grid grid-cols-3 gap-2 sm:hidden pt-3 border-t border-border/70 text-center">
                      <div><p className="text-[10px] text-muted-foreground">Scans</p><p className="text-xs font-mono font-semibold text-foreground mt-0.5">{m.scans.toLocaleString()}</p></div>
                      <div><p className="text-[10px] text-muted-foreground">Vendors</p><p className="text-xs font-mono font-semibold text-foreground mt-0.5">{m.vendors}</p></div>
                      <div className="min-w-0"><p className="text-[10px] text-muted-foreground">Revenue</p><p className="text-xs font-mono font-semibold text-foreground mt-0.5 truncate">{m.revenue}</p></div>
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
                {monthlyTargets.length ? monthlyTargets.map((t) => {
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
                }) : (
                  <div className="border border-dashed border-border rounded-lg p-6 text-center">
                    <p className="text-sm font-semibold text-foreground">No monthly targets assigned</p>
                    <p className="text-xs text-muted-foreground mt-1">Targets set by the Platform Admin will appear here.</p>
                  </div>
                )}
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

          </div>
        )}

        {tab === "announcements" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Team announcements</h2>
              <p className="text-sm text-muted-foreground mt-1">Operational updates published by Anovra administration.</p>
            </div>
            <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
              {announcements.length > 0 ? announcements.map((announcement) => (
                <article key={announcement.id} className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0"><Megaphone className="w-4 h-4" /></div>
                  <div className="min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <h3 className="text-sm font-semibold text-foreground break-words">{announcement.title}</h3>
                      <time className="text-[10px] text-muted-foreground font-mono shrink-0">{new Date(announcement.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2 whitespace-pre-wrap break-words">{announcement.body}</p>
                  </div>
                </article>
              )) : (
                <div className="p-10 text-center"><Megaphone className="w-7 h-7 text-muted-foreground/50 mx-auto mb-3" /><p className="text-sm font-semibold text-foreground">No announcements yet</p><p className="text-xs text-muted-foreground mt-1">New operational updates will appear here.</p></div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-medium text-foreground mb-1">Account settings</h3>
              <p className="text-xs text-muted-foreground mb-6">Manage your profile details and security</p>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-border pb-6 mb-6">
                  {/* Photo upload / avatar preview */}
                  <div className="relative group cursor-pointer">
                    {profileForm.headshotUrl && !profileForm.headshotUrl.startsWith("blob:") ? (
                      <img
                        src={profileForm.headshotUrl}
                        alt={profileForm.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-accent"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center font-bold text-2xl text-accent border-2 border-dashed border-accent/40">
                        {profileForm.name.split(/\s+/).filter(Boolean).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "TM"}
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-semibold text-center cursor-pointer">
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="text-sm font-medium text-foreground">{profileForm.name || member.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{member.role} · ID: {member.id}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Recommended: Square format PNG or JPG under 5MB</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">Full name</label>
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">Phone number</label>
                    <input
                      type="text"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">Login Email (Read-only)</label>
                    <input
                      type="email"
                      disabled
                      value={profileForm.email}
                      className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">Username (Read-only)</label>
                    <input
                      type="text"
                      disabled
                      value={member.id}
                      className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    disabled={profileForm.saving}
                    className="bg-accent text-white px-4 py-2 text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {profileForm.saving ? "Saving profile..." : "Save changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-medium text-foreground mb-1">Update password</h3>
              <p className="text-xs text-muted-foreground mb-6">Change your login access credentials</p>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">New password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">Confirm new password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                    placeholder="Re-enter new password"
                  />
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    type="submit"
                    disabled={passwordForm.saving}
                    className="bg-accent text-white px-4 py-2 text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {passwordForm.saving ? "Updating password..." : "Update password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
          </main>
        </div>
      </div>
    </div>
  );
}
