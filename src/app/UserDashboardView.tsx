import { useState, useEffect } from "react";
import {
  Scan, Star, FlaskConical, Share2, TrendingUp, Clock, Check, CheckCircle,
  ChevronRight, Copy, MessageCircle, Users, Sparkles, Bell,
  Calendar, BarChart2, ShoppingBag, BookOpen, Flame, Lock,
  ExternalLink, Plus, X, ChevronDown,
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { UnifiedDashboardHeader } from "./components/UnifiedDashboardHeader";
import { supabase } from "./utils/supabase";
import { toast } from "sonner";

type UserTab = "overview" | "history" | "recommendations" | "ingredients" | "progress" | "routine" | "family" | "perks" | "settings";

function PlanBadge({ required, current }: { required: "glow" | "glowplus" | "premium"; current: "glow" | "glowplus" | "premium" }) {
  const order = { glow: 0, glowplus: 1, premium: 2 };
  const locked = order[current] < order[required];
  if (locked) {
    const label = required === "glowplus" ? "Glow Pass+" : "Premium Glow";
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-muted border border-border text-muted-foreground px-2 py-0.5 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>
        <Lock className="w-2.5 h-2.5" /> {label}
      </span>
    );
  }
  return null;
}

function LockedOverlay({ label, onUpgrade }: { label: string; onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3 z-10">
      <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
        <Lock className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Upgrade to {label}</p>
      <button
        onClick={onUpgrade}
        className="px-4 py-1.5 bg-[#008236] hover:bg-[#006c2c] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        Upgrade plan →
      </button>
    </div>
  );
}

const ingredientGlossary = [
  { name: "Niacinamide", safe: true, benefit: "Brightens skin tone, minimizes pores, reduces hyperpigmentation" },
  { name: "Kojic Acid", safe: true, benefit: "Inhibits melanin production — effective for dark spots on melanin-rich skin" },
  { name: "Azelaic Acid", safe: true, benefit: "Anti-inflammatory; targets post-acne marks and redness" },
  { name: "Retinol", safe: true, benefit: "Speeds cell turnover — start with low concentrations, use at night" },
  { name: "Hydroquinone", safe: false, benefit: "Skin-lightening agent — flagged for long-term use; avoid above 2%" },
  { name: "Fragrance / Parfum", safe: false, benefit: "Common irritant — especially risky for sensitive and reactive skin types" },
];

export function UserDashboardView({ setView }: { setView: (v: View) => void }) {
  const [tab, setTab] = useState<UserTab>("overview");
  const [copied, setCopied] = useState<string | null>(null);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState<{ from: "user" | "advisor"; text: string }[]>([
    { from: "advisor", text: "Hi! I'm your certified skin advisor. I can review your latest analysis results and help you build a skincare plan. What would you like to know?" },
  ]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const [userProfile, setUserProfile] = useState<{ name: string; plan: "glow" | "glowplus" | "premium" } | null>(null);
  const [analysesList, setAnalysesList] = useState<any[]>([]);
  const [matchedProducts, setMatchedProducts] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [routineList, setRoutineList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("show_welcome") === "true") {
      setShowWelcomeModal(true);
      sessionStorage.removeItem("show_welcome");
    }

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Authentication required to access skin portal.");
          setView("signin");
          return;
        }

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, plan")
          .eq("id", user.id)
          .maybeSingle();

        // Enforce 14-day trial check
        const createdDate = user.created_at ? new Date(user.created_at) : new Date();
        const daysDiff = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        const rawPlan = profile?.plan || "free";
        if (rawPlan === "free" && daysDiff > 14) {
          setTrialExpired(true);
        }

        const pVal = profile?.plan === "premium" ? "premium" : (profile?.plan === "basic" ? "glowplus" : "glow");
        const profileObj = {
          name: profile?.name || "Customer",
          plan: pVal as "glow" | "glowplus" | "premium"
        };
        setUserProfile(profileObj);

        // Update chat adviser initial greeting with name
        setChatHistory([
          { from: "advisor", text: `Hi ${profileObj.name}! I'm your certified skin advisor. I can review your latest analysis results and help you build a skincare plan. What would you like to know?` }
        ]);

        // Fetch scans
        const { data: scans } = await supabase
          .from("scans")
          .select("*")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        if (scans && scans.length > 0) {
          const formatted = scans.map((s, idx) => {
            const dateObj = new Date(s.created_at);
            const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
            return {
              id: s.id.substring(0, 8).toUpperCase(),
              date: dateStr,
              vendor: "Anovra Brand",
              concerns: [s.concern],
              skinType: s.result || "Normal",
              score: Math.max(50, 78 - (idx * 6)),
              products: 3,
              link: `https://anovra.africa/results/${s.id.substring(0, 8)}`,
            };
          });
          setAnalysesList(formatted);

          // Get dynamic routine based on latest scan concern
          const latestConcern = scans[0].concern;
          const cleanConcern = latestConcern.toLowerCase();
          let rSteps = [];
          if (cleanConcern.includes("acne")) {
            rSteps = [
              { step: "AM 1", label: "Cleanser", product: "Salicylic Acid Cleanser", tip: "Wash for 60 seconds to let active ingredients work." },
              { step: "AM 2", label: "Treatment", product: "Niacinamide Serum", tip: "Reduces inflammation and regulates sebum production." },
              { step: "AM 3", label: "Protection", product: "Oil-Free SPF 50 Sunscreen", tip: "Protects post-inflammatory hyperpigmentation from darkening." },
              { step: "PM 1", label: "Double Cleanse", product: "Gentle Foaming Cleanser", tip: "Ensures all SPF and dirt is fully removed." },
              { step: "PM 2", label: "Active", product: "Salicylic Acid 2% Liquid", tip: "Unclogs pores and prevents breakouts. Use 3x a week." },
              { step: "PM 3", label: "Moisturiser", product: "Lightweight Gel Hydrator", tip: "Keeps skin hydrated without clogging pores." },
            ];
          } else if (cleanConcern.includes("pigment") || cleanConcern.includes("spot") || cleanConcern.includes("bright")) {
            rSteps = [
              { step: "AM 1", label: "Cleanser", product: "Vitamin C Brightening Cleanser", tip: "Brightens and prepares skin for serums." },
              { step: "AM 2", label: "Antioxidant", product: "Vitamin C 15% Serum", tip: "Fights free radicals and fades dark spots." },
              { step: "AM 3", label: "Moisturiser & SPF", product: "Brightening SPF 50 Fluid", tip: "Essential - UV light triggers melanin and spots." },
              { step: "PM 1", label: "Cleanser", product: "Gentle Hydrating Cleanser", tip: "Cleanses without stripping delicate skin barrier." },
              { step: "PM 2", label: "Treatment", product: "Niacinamide 10% + Kojic Acid", tip: "Prime treatment to fade hyperpigmentation." },
              { step: "PM 3", label: "Moisturiser", product: "Ceramide Night Cream", tip: "Rebuilds barrier while active ingredients work overnight." },
            ];
          } else {
            rSteps = [
              { step: "AM 1", label: "Cleanser", product: "Hydrating Cleanser", tip: "Wash with lukewarm water." },
              { step: "AM 2", label: "Hydration", product: "Hyaluronic Acid Serum", tip: "Apply to damp skin for maximum moisture retention." },
              { step: "AM 3", label: "Sunscreen", product: "Broad Spectrum SPF 50+", tip: "Never skip sunscreen." },
              { step: "PM 1", label: "Cleanser", product: "Hydrating Cleanser", tip: "Cleanse away daily pollutants." },
              { step: "PM 2", label: "Moisturiser", product: "Barrier Restoring Cream", tip: "Locks in hydration and strengthens the skin barrier." },
            ];
          }
          setRoutineList(rSteps);

          // Query approved products to match
          const { data: dbProducts } = await supabase
            .from("products")
            .select("*")
            .eq("nafdac_status", "approved");

          if (dbProducts && dbProducts.length > 0) {
            const matches = dbProducts.map((p) => {
              const isMatch = p.category?.toLowerCase().includes(cleanConcern) || 
                              p.description?.toLowerCase().includes(cleanConcern) ||
                              cleanConcern.includes(p.category?.toLowerCase() || "");
              return {
                name: p.name,
                brand: p.brand || "Own Brand",
                concern: p.category || "General Skincare",
                match: isMatch ? "98%" : "85%",
                price: `₦${Number(p.price).toLocaleString()}`,
                badge: isMatch ? "Top pick" : "",
              };
            });
            setMatchedProducts(matches);
          }
        }

        // Initialize family members with just user
        setFamilyMembers([
          { name: `Me (${profile?.name || "User"})`, skinType: "Normal", concern: "General Care", lastScan: "—", isYou: true }
        ]);

      } catch (err) {
        console.error("Dashboard failed to retrieve live data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }
  const payWithPaystack = async (planKey: "basic" | "premium") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to upgrade your plan.");
        return;
      }

      const email = user.email;
      const prices = {
        basic: 3500,
        premium: 7000,
      };
      
      const amount = prices[planKey] * 100; // in kobo

      const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      if (!paystackPublicKey) {
        toast.error("Paystack public key is not configured.");
        return;
      }

      // Initialize Paystack Inline popup
      const handler = (window as any).PaystackPop.setup({
        key: paystackPublicKey,
        email: email,
        amount: amount,
        currency: "NGN",
        callback: (response: any) => {
          supabase
            .from("profiles")
            .update({ plan: planKey })
            .eq("id", user.id)
            .then(({ error }) => {
              if (error) {
                toast.error(`Update failed: ${error.message}`);
              } else {
                setUserProfile(prev => prev ? {
                  ...prev,
                  plan: planKey === "premium" ? "premium" : "glowplus"
                } : null);
                toast.success(`Welcome to ${planKey === "premium" ? "Premium Glow" : "Glow Pass+"}! Plan activated successfully!`);
              }
            });
        },
        onClose: () => {
          toast.error("Upgrade checkout closed.");
        }
      });

      handler.openIframe();
    } catch (err: any) {
      console.error("Paystack launch error:", err);
      toast.error("Failed to initialize payment gateway.");
    }
  };
  const sendChat = async () => {
    if (!chatMsg.trim()) return;
    
    const userText = chatMsg;
    setChatMsg("");
    
    const updatedHistory = [...chatHistory, { from: "user" as const, text: userText }];
    setChatHistory(updatedHistory);

    try {
      const contents = updatedHistory.map(h => ({
        role: h.from === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      }));

      const { data, error } = await supabase.functions.invoke("chat-advisor", {
        body: { contents }
      });

      if (error) throw error;
      const reply = data?.reply || "I'm sorry, I couldn't process that response. Please try again.";
      
      setChatHistory([...updatedHistory, { from: "advisor" as const, text: reply }]);
    } catch (err) {
      console.error("Gemini advisor call failed:", err);
      setChatHistory([...updatedHistory, { from: "advisor" as const, text: "I'm experiencing connection issues. Please try again in a moment!" }]);
    }
  };

  const latestAnalysis = analysesList[0] || null;
  const plan = userProfile?.plan || "glow";

  const tabs: { id: UserTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "history", label: "My Analyses" },
    { id: "recommendations", label: "Recommendations" },
    { id: "ingredients", label: "Ingredients" },
    { id: "progress", label: "Progress" },
    { id: "routine", label: "My Routine" },
    { id: "family", label: "Family" },
    { id: "perks", label: "Perks & Discounts" },
    { id: "settings", label: "Billing & Plans" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4">
        <div className="w-8 h-8 border-4 border-[#008236] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Loading your skin profile...
        </p>
      </div>
    );
  }

  const progressScores = analysesList.map((a, idx) => {
    return {
      month: new Date(analysesList[analysesList.length - 1 - idx].date).toLocaleDateString("en-US", { month: "short" }),
      score: analysesList[analysesList.length - 1 - idx].score
    };
  });

  return (
    <div className="min-h-screen bg-background pb-12">
      <UnifiedDashboardHeader
        currentView="userdashboard"
        setView={setView}
        title="My Skin Portal"
        subtitle={latestAnalysis ? `Skin score: ${latestAnalysis.score} / 100 · Personalized routine` : "Start a skin test to evaluate your skin"}
        badgeText="CONSUMER PROFILE"
        role="consumer"
        showShopLink={false}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-8 space-y-7 relative">
        {trialExpired ? (
          <div className="max-w-2xl mx-auto py-16 text-center">
            <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-3xl p-8 sm:p-12 shadow-md">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-amber-700 dark:text-amber-400" />
              </div>
              <h2 className="text-3xl font-light text-foreground mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
                Your 14-Day Free Trial Has Expired
              </h2>
              <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Your free trial of Anovra Skin Portal has ended. To continue evaluating your skin, building custom routines, tracking safety glossary terms, and chatting with experts, please choose a plan below.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                {[
                  {
                    key: "glow" as const,
                    name: "Glow Pass",
                    price: "₦1,500/mo",
                    desc: "1 analysis per month, top 3 recommendations, basic skin reports, ingredient checks."
                  },
                  {
                    key: "basic" as const,
                    name: "Glow Pass+",
                    price: "₦3,500/mo",
                    desc: "Unlimited analyses, full recommendation list, save & track skin history, personalized glossary."
                  },
                  {
                    key: "premium" as const,
                    name: "Premium Glow",
                    price: "₦7,000/mo",
                    desc: "Direct chats with certified skin advisors, monthly progress reports, family profiles, discounts."
                  }
                ].map((p) => (
                  <div key={p.key} className="border border-border rounded-2xl p-4 bg-card flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.name}</p>
                      <p className="text-lg font-bold text-foreground mt-1 font-mono">{p.price}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (p.key === "glow") {
                          // Allow setting basic Glow plan
                          supabase.auth.getUser().then(({ data: { user } }) => {
                            if (!user) return;
                            supabase.from("profiles").update({ plan: "glow" }).eq("id", user.id).then(() => {
                              setUserProfile(prev => prev ? { ...prev, plan: "glow" } : null);
                              setTrialExpired(false);
                              toast.success("Welcome back! Glow Pass activated successfully.");
                            });
                          });
                        } else {
                          payWithPaystack(p.key === "basic" ? "basic" : "premium");
                        }
                      }}
                      className="w-full mt-4 py-2 bg-[#008236] hover:bg-[#006c2c] text-white text-[10px] font-semibold rounded-lg transition-colors cursor-pointer text-center"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Subscribe & Activate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-accent/15 text-accent border border-accent/20 px-3 py-1.5 rounded-full font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {userProfile?.plan === "premium" ? "Premium Glow" : (userProfile?.plan === "glowplus" ? "Glow Pass+" : "Glow Pass")}
            </span>
          </div>
          <button
            onClick={() => setView("skintest")}
            className="flex items-center gap-1.5 text-xs sm:text-sm bg-[#008236] hover:bg-[#006c2c] text-white px-3.5 py-2 rounded-lg transition-colors font-medium shadow-xs cursor-pointer"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <Scan className="w-3.5 h-3.5 text-white" /> New skin analysis
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-full sm:w-fit overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all cursor-pointer ${tab === t.id ? "bg-card shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
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
              { label: "Skin score", value: latestAnalysis ? String(latestAnalysis.score) : "—", delta: latestAnalysis ? "Updated recently" : "No scan yet", icon: <Star className="w-4 h-4" />, color: "text-amber-500" },
              { label: "Analyses done", value: String(analysesList.length), delta: "Platform scans", icon: <Scan className="w-4 h-4" />, color: "text-accent" },
              { label: "Products matched", value: latestAnalysis ? String(matchedProducts.length) : "0", delta: "Safety verified", icon: <ShoppingBag className="w-4 h-4" />, color: "text-blue-500" },
              { label: "Days on routine", value: latestAnalysis ? String(Math.max(1, Math.round((Date.now() - new Date(latestAnalysis.date).getTime()) / (1000 * 60 * 60 * 24)))) : "—", delta: "Tracked days", icon: <Flame className="w-4 h-4" />, color: "text-orange-500" },
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
          {latestAnalysis ? (
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
          ) : (
            <div className="bg-card border border-border rounded-xl p-8 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                <Scan className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-foreground text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No Skin Scan Recorded Yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Start your first skin analysis to see your personalized report, matching products, and customized routine!
                </p>
              </div>
              <button
                onClick={() => setView("skintest")}
                className="text-xs bg-[#008236] hover:bg-[#006c2c] text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Start skin test now
              </button>
            </div>
          )}

          {/* Quick links */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: <BarChart2 className="w-4 h-4 text-accent" />, title: "Skin progress report", desc: "See how your skin score has changed over time", tab: "progress" as UserTab },
              { icon: <BookOpen className="w-4 h-4 text-blue-500" />, title: "Ingredient glossary", desc: "Safe vs flagged ingredients for your skin type", tab: "ingredients" as UserTab },
              { icon: <Calendar className="w-4 h-4 text-green-600" />, title: "My skincare routine", desc: "Your personalized AM & PM routine steps", tab: "routine" as UserTab },
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
            {plan === "glow" && <LockedOverlay label="Glow Pass+" onUpgrade={() => payWithPaystack("basic")} />}
            {analysesList.length > 0 ? (
              analysesList.map((a) => (
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
              ))
            ) : (
              <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center text-muted-foreground">
                No analyses run yet. Tap "+ New analysis" at the top to begin!
              </div>
            )}
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
            {matchedProducts.length > 0 ? (
              (plan === "glow" ? matchedProducts.slice(0, 3) : matchedProducts).map((r, i) => (
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
              ))
            ) : (
              <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center text-muted-foreground">
                No product recommendations available. Run a skin test to get matches!
              </div>
            )}
          </div>
          {plan === "glow" && matchedProducts.length > 0 && (
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
                Personalized for your skin type (Combination · Hyperpigmentation). <PlanBadge required="glowplus" current={plan} />
              </p>
            </div>
          </div>
          <div className="relative space-y-3">
            {plan === "glow" && <LockedOverlay label="Glow Pass+" onUpgrade={() => payWithPaystack("basic")} />}
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
            {plan !== "premium" && <LockedOverlay label="Premium Glow" onUpgrade={() => payWithPaystack("premium")} />}
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
              <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Personalized skincare routine</h2>
              <PlanBadge required="premium" current={plan} />
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Built for Combination skin · Hyperpigmentation · Lagos climate.</p>
          </div>
          <div className="relative">
            {plan !== "premium" && <LockedOverlay label="Premium Glow" onUpgrade={() => payWithPaystack("premium")} />}
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
            {plan !== "premium" && <LockedOverlay label="Premium Glow" onUpgrade={() => payWithPaystack("premium")} />}
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
              {plan !== "premium" && <LockedOverlay label="Premium Glow" onUpgrade={() => payWithPaystack("premium")} />}
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
      {/* ── SETTINGS / BILLING ── */}
      {tab === "settings" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Subscription Billing & Plans</h2>
            <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Manage your account subscription, unlock features, and view active benefits.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: "glow" as const,
                name: "Glow Pass",
                price: "₦1,500",
                period: "month",
                desc: "Essential skin health analysis & matched recommendations.",
                features: ["1 full skin analysis per month", "Top 3 product recommendations", "Basic skin type & concern report", "Ingredient safety check", "Results shared via link"],
                cta: plan === "glow" ? "Current Plan" : "Downgrade to Glow Pass",
                planKey: null,
                active: plan === "glow"
              },
              {
                id: "glowplus" as const,
                name: "Glow Pass+",
                price: "₦3,500",
                period: "month",
                desc: "Unlimited skin analyses and complete history log files tracking.",
                features: ["Unlimited skin analyses", "Full product recommendation list", "Detailed skin health report", "Save & track skin history", "Personalized ingredient glossary", "Priority product matching"],
                cta: plan === "glow" ? "Upgrade to Glow Pass+" : (plan === "glowplus" ? "Current Plan" : "Downgrade to Glow Pass+"),
                planKey: "basic" as const,
                active: plan === "glowplus"
              },
              {
                id: "premium" as const,
                name: "Premium Glow",
                price: "₦7,000",
                period: "month",
                desc: "Complete features including live dermatologist chats and routines.",
                features: ["Everything in Glow Pass+", "Monthly progress reports & trend scores", "Direct chat with certified skin advisors", "Exclusive discounts from Anovra vendors", "Family skin profiles (up to 5 members)", "Skincare routine builder & early AI access"],
                cta: plan === "premium" ? "Current Plan" : "Upgrade to Premium Glow",
                planKey: "premium" as const,
                active: plan === "premium"
              }
            ].map((p) => (
              <div key={p.id} className={cn("bg-card border rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden", p.active ? "border-[#008236] ring-1 ring-[#008236]/20" : "border-border")}>
                {p.active && (
                  <div className="absolute top-0 right-0 bg-[#008236] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                    Active
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-foreground text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.price}</span>
                    <span className="text-xs text-muted-foreground font-medium">/{p.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.desc}</p>
                  
                  <div className="border-t border-border/60 my-5" />
                  
                  <ul className="space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-foreground/80" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <Check className="w-3.5 h-3.5 text-[#008236] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8">
                  {p.active ? (
                    <button disabled className="w-full py-3 bg-muted text-muted-foreground rounded-xl text-xs font-semibold cursor-not-allowed">
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (p.planKey) {
                          payWithPaystack(p.planKey);
                        } else {
                          toast.error("Downgrades must be processed via account support.");
                        }
                      }}
                      className="w-full py-3 bg-[#008236] hover:bg-[#006c2c] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {p.cta}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
          </>
        )}
      </div>

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

      {/* Welcome Verified Email Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl relative">
            <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-2xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              Welcome to Anovra!
            </h3>
            <p className="text-xs text-green-700 uppercase font-bold tracking-wider mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Email Confirmed Successfully
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Welcome to Anovra! Your email has been verified. You can now start scanning your skin, tracking ingredients, and creating routines.
            </p>
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-colors shadow-md cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Enter Skin Portal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
