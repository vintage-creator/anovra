import { useState, useEffect } from "react";
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Scan, Star, FlaskConical, Share2, Check, CheckCircle,
  ChevronRight, MessageCircle, Users,
  Calendar, BarChart2, ShoppingBag, BookOpen, Flame, Lock,
  Plus, X, LogOut, Settings, HeartPulse, User,
  Store,
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { UnifiedDashboardHeader } from "./components/UnifiedDashboardHeader";
import { supabase } from "./utils/supabase";
import { toast } from "sonner";

type UserTab = "overview" | "history" | "recommendations" | "ingredients" | "progress" | "routine" | "family" | "settings";

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

function buildRoutineFromProducts(products: any[], latestConcern: string) {
  const cleanConcern = latestConcern.toLowerCase();
  const relevantProducts = products
    .filter((product) => {
      const searchable = [product.name, product.brand, product.category, product.description].join(" ").toLowerCase();
      return cleanConcern && searchable.includes(cleanConcern.split(/\s+/)[0]);
    })
    .concat(products)
    .filter(Boolean);

  const uniqueProducts = Array.from(new Map(relevantProducts.map((product) => [product.id || product.name, product])).values()).slice(0, 6);
  if (uniqueProducts.length === 0) return [];

  const labels = [
    { step: "AM 1", label: "Cleanse", tip: "Start with clean, dry skin before applying active products." },
    { step: "AM 2", label: "Treat", tip: "Apply a thin layer and avoid combining too many actives at once." },
    { step: "AM 3", label: "Protect", tip: "Use sunscreen during the day, especially when treating pigmentation or texture." },
    { step: "PM 1", label: "Cleanse", tip: "Remove sunscreen, oil and daily build-up before night care." },
    { step: "PM 2", label: "Repair", tip: "Give active ingredients time to work while protecting the skin barrier." },
    { step: "PM 3", label: "Moisturise", tip: "Seal in hydration and pause if irritation appears." },
  ];

  return uniqueProducts.map((product, index) => ({
    ...labels[index],
    product: product.name,
  }));
}

function FormattedChatText({ text }: { text: string }) {
  const normalised = text
    .replace(/\*\*/g, "")
    .replace(/\s+\*\s+/g, "\n- ")
    .trim();
  return (
    <div className="space-y-1.5">
      {normalised.split(/\n+/).filter(Boolean).map((line, index) => {
        const isBullet = line.trim().startsWith("-");
        return (
          <p key={index} className={cn("leading-relaxed", isBullet && "pl-3 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1 before:h-1 before:rounded-full before:bg-current")}>
            {line.replace(/^-\s*/, "")}
          </p>
        );
      })}
    </div>
  );
}

const cleanTextInput = (value: string, maxLength = 120) =>
  value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength);

const cleanPhoneInput = (value: string) =>
  value.replace(/[^\d+()\-\s]/g, "").replace(/\s+/g, " ").trim().slice(0, 32);

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim().toLowerCase());

export function UserDashboardView({ setView }: { setView: (v: View) => void }) {
  const [tab, setTab] = useState<UserTab>(() => (sessionStorage.getItem("active_user_tab") as UserTab) || "overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    sessionStorage.setItem("active_user_tab", tab);
  }, [tab]);

  const [showAddFamily, setShowAddFamily] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ from: "user" | "advisor"; text: string }[]>([
    { from: "advisor", text: "Hi! I'm your certified skin adviser. I can review your latest analysis results and help you build a skincare plan. What would you like to know?" },
  ]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [familyForm, setFamilyForm] = useState({ name: "", relationship: "", ageBand: "Adult", skinType: "Combination", concern: "", notes: "" });
  const [savingFamily, setSavingFamily] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "", location: "" });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [userProfile, setUserProfile] = useState<{ name: string; plan: "glow" | "glowplus" | "premium" } | null>(null);
  const [analysesList, setAnalysesList] = useState<any[]>([]);
  const [matchedProducts, setMatchedProducts] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [routineList, setRoutineList] = useState<any[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialExpired, setTrialExpired] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [trialMsRemaining, setTrialMsRemaining] = useState(14 * 24 * 60 * 60 * 1000);
  const [showTrialExpiredNotice, setShowTrialExpiredNotice] = useState(true);

  useEffect(() => {
    if (!trialEndsAt || trialExpired) return;
    const timer = window.setInterval(() => {
      setTrialMsRemaining(Math.max(0, trialEndsAt.getTime() - Date.now()));
    }, 60000);
    return () => window.clearInterval(timer);
  }, [trialEndsAt, trialExpired]);

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
          .select("name, email, phone, location, plan, created_at")
          .eq("id", user.id)
          .maybeSingle();

        // Enforce 14-day trial check
        const createdDate = profile?.created_at ? new Date(profile.created_at) : (user.created_at ? new Date(user.created_at) : new Date());
        const endsAt = new Date(createdDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        setTrialEndsAt(endsAt);
        setTrialMsRemaining(Math.max(0, endsAt.getTime() - Date.now()));
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
        setProfileForm({
          name: profileObj.name,
          email: profile?.email || user.email || "",
          phone: profile?.phone || user.user_metadata?.phone || "",
          location: profile?.location || "",
        });

        // Update chat adviser initial greeting with name
        setChatHistory([
          { from: "advisor", text: `Hi ${profileObj.name}! I'm your certified skin adviser. I can review your latest analysis results and help you build a skincare plan. What would you like to know?` }
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
            const dateStr = dateObj.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
            return {
              id: s.id.substring(0, 8).toUpperCase(),
              date: dateStr,
              vendor: s.vendor_name || s.vendor_brand || "Recorded scan",
              concerns: [s.concern],
              skinType: s.result || "Normal",
              score: s.score !== null && s.score !== undefined && !Number.isNaN(Number(s.score)) ? Math.round(Number(s.score)) : null,
              products: 0,
              severity: Array.isArray(s.severity) ? s.severity : [],
              benefits: Array.isArray(s.benefits) ? s.benefits : [],
              area: s.skin_area || "Skin",
              createdAt: s.created_at,
              link: `https://anovra-api.vercel.app/#/userdashboard`,
            };
          });
          setAnalysesList(formatted);

          const latestConcern = scans[0].concern;
          const cleanConcern = latestConcern.toLowerCase();

          // Query approved products to match
          const { data: dbProducts } = await supabase
            .from("products")
            .select("*")
            .eq("nafdac_status", "approved");

          if (dbProducts && dbProducts.length > 0) {
            setRoutineList(buildRoutineFromProducts(dbProducts, latestConcern));
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
          } else {
            setRoutineList([]);
          }
        }

        try {
          const { data: familyRows } = await supabase
            .from("customer_family_profiles")
            .select("*")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: true });
          const savedFamily = (familyRows || []).map((member: any) => ({
            id: member.id,
            name: member.name,
            skinType: member.skin_type || "Not set",
            concern: member.concern || "General care",
            relationship: member.relationship || "Family member",
            ageBand: member.age_band || "Not set",
            notes: member.notes || "",
            lastScan: member.last_scan_at ? new Date(member.last_scan_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" }) : "—",
            isYou: member.name === (profile?.name || user.user_metadata?.full_name),
          }));
          setFamilyMembers(savedFamily);
        } catch {
          setFamilyMembers([]);
        }

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

  function openCustomerSkinTest() {
    sessionStorage.removeItem("active_scan_slug");
    setView("skintest");
  }

  const saveFamilyMember = async () => {
    if (!familyForm.name.trim()) {
      toast.error("Enter a family member name.");
      return;
    }
    setSavingFamily(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first.");
      const { data, error } = await supabase
        .from("customer_family_profiles")
        .insert([{
          customer_id: user.id,
          name: familyForm.name.trim(),
          relationship: familyForm.relationship.trim() || "Family member",
          age_band: familyForm.ageBand,
          skin_type: familyForm.skinType,
          concern: familyForm.concern.trim() || "General care",
          notes: familyForm.notes.trim(),
        }])
        .select()
        .single();
      if (error) throw error;
      setFamilyMembers((prev) => [...prev, {
        id: data.id,
        name: data.name,
        skinType: data.skin_type || "Not set",
        concern: data.concern || "General care",
        relationship: data.relationship || "Family member",
        ageBand: data.age_band || "Not set",
        notes: data.notes || "",
        lastScan: "—",
        isYou: false,
      }]);
      setFamilyForm({ name: "", relationship: "", ageBand: "Adult", skinType: "Combination", concern: "", notes: "" });
      setShowAddFamily(false);
      toast.success("Family profile added.");
    } catch (err: any) {
      toast.error(err.message || "Could not save family profile.");
    } finally {
      setSavingFamily(false);
    }
  };

  const saveUserProfile = async () => {
    const nextProfile = {
      name: cleanTextInput(profileForm.name, 80),
      email: profileForm.email.trim().toLowerCase(),
      phone: cleanPhoneInput(profileForm.phone),
      location: cleanTextInput(profileForm.location, 80),
    };
    if (!nextProfile.name) {
      toast.error("Enter your name.");
      return;
    }
    if (nextProfile.email && !isValidEmail(nextProfile.email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setSavingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first.");
      const { error } = await supabase
        .from("profiles")
        .update({
          name: nextProfile.name,
          email: nextProfile.email || user.email,
          phone: nextProfile.phone || null,
          location: nextProfile.location || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      const authUpdates: { email?: string; data: Record<string, string> } = {
        data: {
          full_name: nextProfile.name,
          phone: nextProfile.phone,
          location: nextProfile.location,
        },
      };
      if (nextProfile.email && nextProfile.email !== user.email) {
        authUpdates.email = nextProfile.email;
      }
      await supabase.auth.updateUser(authUpdates);
      setProfileForm(nextProfile);
      setUserProfile((prev) => prev ? { ...prev, name: nextProfile.name } : prev);
      toast.success("Profile updated.");
    } catch (err: any) {
      toast.error(err.message || "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    const newPassword = passwordForm.newPassword.trim();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== passwordForm.confirmPassword.trim()) {
      toast.error("Passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      toast.success("Password changed.");
    } catch (err: any) {
      toast.error(err.message || "Could not change password.");
    } finally {
      setSavingPassword(false);
    }
  };

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out.");
    setView("landing");
  };

  const sendChat = async () => {
    if (!chatMsg.trim()) return;
    
    const userText = chatMsg;
    setChatMsg("");
    
    const updatedHistory = [...chatHistory, { from: "user" as const, text: userText }];
    setChatHistory(updatedHistory);
    setChatTyping(true);

    try {
      const userTranscript = updatedHistory
        .filter((h) => h.from === "user")
        .map((h) => h.text)
        .join("\n\n");
      const contents = [{
        role: "user",
        parts: [{ text: userTranscript }]
      }];

      const { data, error } = await supabase.functions.invoke("chat-advisor", {
        body: { contents }
      });

      if (error) throw error;
      const reply = data?.reply || "I'm sorry, I couldn't process that response. Please try again.";
      
      setChatHistory([...updatedHistory, { from: "advisor" as const, text: reply }]);
    } catch (err) {
      console.error("Gemini adviser call failed:", err);
      setChatHistory([...updatedHistory, { from: "advisor" as const, text: "I'm experiencing connection issues. Please try again in a moment!" }]);
    } finally {
      setChatTyping(false);
    }
  };

  const latestAnalysis = analysesList[0] || null;
  const plan = userProfile?.plan || "glow";
  const trialAccessActive = plan === "glow" && !trialExpired;
  const accessPlan = trialAccessActive ? "premium" : plan;
  const trialDays = Math.floor(trialMsRemaining / (1000 * 60 * 60 * 24));
  const trialHours = Math.floor((trialMsRemaining / (1000 * 60 * 60)) % 24);
  const trialMinutes = Math.floor((trialMsRemaining / (1000 * 60)) % 60);
  const routineSteps = routineList;
  const familyProfiles = familyMembers;
  const visibleIngredients: any[] = [];

  const tabs = [
    { id: "overview" as UserTab, label: "Overview", icon: <HeartPulse className="w-4 h-4" /> },
    { id: "history" as UserTab, label: "My Analyses", icon: <Scan className="w-4 h-4" /> },
    { id: "recommendations" as UserTab, label: "Recommendations", icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "ingredients" as UserTab, label: "Ingredients", icon: <FlaskConical className="w-4 h-4" /> },
    { id: "progress" as UserTab, label: "Progress", icon: <BarChart2 className="w-4 h-4" /> },
    { id: "routine" as UserTab, label: "My Routine", icon: <Calendar className="w-4 h-4" /> },
    { id: "family" as UserTab, label: "Family", icon: <Users className="w-4 h-4" /> },
    { id: "settings" as UserTab, label: "Billing & Plans", icon: <Settings className="w-4 h-4" /> },
  ];
  const primaryTabs = tabs.slice(0, 4);
  const trackingTabs = tabs.slice(4, 7);
  const accountTabs = tabs.slice(7);

  const activeTab = tabs.find((t) => t.id === tab) || tabs[0];
  const scoredAnalyses = analysesList.filter((analysis) => typeof analysis.score === "number");
  const latestScoreText = latestAnalysis && typeof latestAnalysis.score === "number" ? `${latestAnalysis.score} / 100` : "Not scored yet";
  const userInitials = (userProfile?.name || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
  const planLabel = trialAccessActive ? "Free trial" : (userProfile?.plan === "premium" ? "Premium Glow" : (userProfile?.plan === "glowplus" ? "Glow Pass+" : "Free plan"));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4">
        <div className="w-8 h-8 border-4 border-[#008236] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Loading your skin profile…
        </p>
      </div>
    );
  }

  const progressScores = scoredAnalyses.map((a, idx) => {
    return {
      month: new Date(scoredAnalyses[scoredAnalyses.length - 1 - idx].date).toLocaleDateString("en-GB", { month: "short" }),
      score: scoredAnalyses[scoredAnalyses.length - 1 - idx].score
    };
  });

  return (
    <div className="min-h-screen bg-background pb-12">
      <UnifiedDashboardHeader
        currentView="userdashboard"
        setView={setView}
        title="My Skin Portal"
        subtitle={latestAnalysis ? `Skin score: ${latestScoreText} · Personalised routine` : "Start a skin test to evaluate your skin"}
        role="consumer"
        showShopLink={false}
        onMenuClick={() => setSidebarOpen((open) => !open)}
        menuLabel={sidebarOpen ? "Close" : "Menu"}
        onProfileClick={() => setTab("settings")}
        profileName={userProfile?.name}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 relative">
        {trialExpired && showTrialExpiredNotice && (
          <div className="fixed inset-0 z-[80] bg-[#1f2a24]/45 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="trial-ended-title">
            <div className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="grid lg:grid-cols-[0.95fr_1.35fr]">
                <div className="bg-[#fbfaf7] border-b lg:border-b-0 lg:border-r border-border p-6 sm:p-8">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-5">
                    <Lock className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700 mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
                    Free trial ended
                  </p>
                  <h2 id="trial-ended-title" className="text-2xl sm:text-3xl font-light text-foreground leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                    Your dashboard has moved to the free plan
                  </h2>
                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    You can still use your basic skin portal. Premium tools such as unlimited analyses, full history, family profiles, adviser chat, and deeper progress tracking require an upgrade.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTrialExpiredNotice(false);
                      setUserProfile((prev) => prev ? { ...prev, plan: "glow" } : prev);
                      toast.success("Continuing on the free Glow Pass.");
                    }}
                    className="mt-6 w-full sm:w-auto px-4 py-2.5 bg-white border border-border text-foreground rounded-lg text-sm font-semibold hover:border-accent/40 transition-colors"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Continue on Free
                  </button>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      {
                        key: "glow" as const,
                        name: "Glow Pass",
                        price: "Free",
                        tag: "Current free plan",
                        desc: "Basic workspace access, scan links, top recommendations, and ingredient checks.",
                        cta: "Continue",
                        featured: false,
                      },
                      {
                        key: "basic" as const,
                        name: "Glow Pass+",
                        price: "₦3,500/mo",
                        tag: "Recommended",
                        desc: "Unlimited analyses, full recommendation list, saved skin history, and personalised glossary.",
                        cta: "Upgrade",
                        featured: true,
                      },
                      {
                        key: "premium" as const,
                        name: "Premium Glow",
                        price: "₦7,000/mo",
                        tag: "Advanced care",
                        desc: "Adviser chat, monthly progress reports, family profiles, partner offers, and routine builder.",
                        cta: "Upgrade",
                        featured: false,
                      },
                    ].map((p) => (
                      <div key={p.key} className={cn(
                        "border rounded-xl p-4 flex flex-col min-h-[220px]",
                        p.featured ? "border-[#C86B3A] bg-[#C86B3A]/5" : "border-border bg-background"
                      )}>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <p className="text-sm font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.name}</p>
                          <span className={cn("text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-full", p.featured ? "bg-[#C86B3A] text-white" : "bg-secondary text-muted-foreground")}>{p.tag}</span>
                        </div>
                        <p className="text-xl font-bold text-foreground font-mono">{p.price}</p>
                        <p className="text-xs text-muted-foreground mt-3 leading-relaxed flex-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.desc}</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (p.key === "glow") {
                              setShowTrialExpiredNotice(false);
                              setUserProfile((prev) => prev ? { ...prev, plan: "glow" } : prev);
                              toast.success("Continuing on the free Glow Pass.");
                            } else {
                              payWithPaystack(p.key === "basic" ? "basic" : "premium");
                            }
                          }}
                          className={cn(
                            "w-full mt-4 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center",
                            p.featured ? "bg-[#C86B3A] hover:bg-[#B85F33] text-white" : "bg-[#008236] hover:bg-[#006c2c] text-white"
                          )}
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {p.cta}
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    You can change plans later from Billing & Plans. Your saved analyses and profile are preserved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <>
        <div className="lg:pl-72">
          <aside className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border p-3 shadow-xl transform-gpu transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform lg:z-20 lg:translate-x-0 lg:top-24 lg:left-0 lg:h-[calc(100vh-6rem)] lg:rounded-r-xl lg:rounded-l-none lg:border-y lg:border-r lg:shadow-sm overflow-y-auto",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="px-3 py-3 border-b border-border mb-3 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setTab("settings");
                  setSidebarOpen(false);
                }}
                className="min-w-0 flex items-center gap-3 text-left rounded-xl hover:bg-muted/60 transition-colors p-1 -m-1 flex-1"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <span className="w-10 h-10 rounded-full bg-accent/10 text-accent border border-accent/20 flex items-center justify-center text-xs font-bold shrink-0">
                  {userInitials}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground truncate">{userProfile?.name || "Customer"}</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">{planLabel}</span>
                </span>
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Close menu">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <nav className="space-y-5">
              <div className="space-y-2">
                <p className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Dashboard</p>
            {primaryTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${tab === t.id ? "bg-accent text-white shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
              </div>
              <div className="space-y-2">
                <p className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Skincare tools</p>
            {trackingTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${tab === t.id ? "bg-accent text-white shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
            <button
              onClick={() => {
                sessionStorage.removeItem("active_shop_slug");
                setSidebarOpen(false);
                setView("shop");
              }}
              className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Store className="w-4 h-4" />
              <span>Product Shop</span>
            </button>
              </div>
              <div className="space-y-2">
                <p className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Account</p>
            {accountTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${tab === t.id ? "bg-accent text-white shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
              </div>
            </nav>
            <div className="border-t border-border mt-3 pt-3">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </aside>
          {sidebarOpen && (
            <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/35 backdrop-blur-xs lg:hidden animate-in fade-in duration-300" />
          )}

          <main className="min-w-0 animate-in fade-in duration-300">

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#008236] via-[#f59e0b] to-[#0f766e]" />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent border border-accent/20 flex items-center justify-center shrink-0">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>Overview</p>
                  <h2 className="text-2xl sm:text-3xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                    Good to see you, {(userProfile?.name || "there").split(" ")[0]}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {latestAnalysis
                      ? "Your latest skin analysis, product matches, routine steps, and progress signals are organised here."
                      : "Start your first skin analysis to generate a personalised report, product matches, ingredient guidance, and routine tracking."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => openCustomerSkinTest()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006c2c] text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-sm transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Plus className="w-4 h-4" />
                <span className="whitespace-nowrap">New analysis</span>
              </button>
            </div>
          </section>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Skin score", value: latestAnalysis && typeof latestAnalysis.score === "number" ? String(latestAnalysis.score) : "—", delta: latestAnalysis ? "From saved scan data" : "No scan yet", icon: <Star className="w-4 h-4" />, color: "text-amber-500" },
              { label: "Analyses done", value: String(analysesList.length), delta: "Platform scans", icon: <Scan className="w-4 h-4" />, color: "text-accent" },
              { label: "Products matched", value: latestAnalysis ? String(matchedProducts.length) : "0", delta: "Safety verified", icon: <ShoppingBag className="w-4 h-4" />, color: "text-blue-500" },
              { label: "Days on routine", value: latestAnalysis ? String(Math.max(1, Math.round((Date.now() - new Date(latestAnalysis.createdAt || latestAnalysis.date).getTime()) / (1000 * 60 * 60 * 24)))) : "—", delta: "Tracked days", icon: <Flame className="w-4 h-4" />, color: "text-orange-500" },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
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
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>Latest saved report</p>
                  <h3 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>{latestAnalysis.date}</h3>
                </div>
                <span className="text-xs text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-full self-start" style={{ fontFamily: "'DM Mono', monospace" }}>{latestAnalysis.id}</span>
              </div>
              <div className="grid lg:grid-cols-[160px_1fr] gap-5 mb-5">
                <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 flex flex-col items-center justify-center text-center">
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Skin score</p>
                  <p className="text-4xl font-light text-accent" style={{ fontFamily: "'Fraunces', serif" }}>{typeof latestAnalysis.score === "number" ? latestAnalysis.score : "—"}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>out of 100</p>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Skin type</p>
                  <p className="text-sm font-medium text-foreground">{latestAnalysis.skinType}</p>
                </div>
                  <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Primary concerns</p>
                  <p className="text-sm font-medium text-foreground">{latestAnalysis.concerns.join(", ")}</p>
                </div>
                  <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Products matched</p>
                  <p className="text-sm font-medium text-foreground">{matchedProducts.length} products</p>
                  </div>
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
            <div className="bg-card border border-border rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent border border-accent/20">
                <Scan className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-medium text-foreground text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No skin analysis recorded yet</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Start your first skin analysis to see your personalised report, matching products, and customised routine.
                </p>
              </div>
              <button
                onClick={() => openCustomerSkinTest()}
                className="inline-flex items-center gap-2 text-xs bg-[#008236] hover:bg-[#006c2c] text-white px-4 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="whitespace-nowrap">Start new analysis</span>
              </button>
            </div>
          )}

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
          <div>
            <div>
              <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Analysis history</h2>
              <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>All your skin analyses are saved and tracked. <PlanBadge required="glowplus" current={accessPlan} /></p>
            </div>
          </div>
          <div className="space-y-4 relative">
            {accessPlan === "glow" && <LockedOverlay label="Glow Pass+" onUpgrade={() => payWithPaystack("basic")} />}
            {analysesList.length > 0 ? (
              analysesList.map((a, i) => (
                <div key={a.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground">{a.id}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{a.date}</span>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{a.vendor}</span>
                    </div>
                    {typeof a.score === "number" ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Score: {a.score}/100</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${a.score}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>Not scored</span>
                    )}
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
                      <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{i === 0 ? `${matchedProducts.length} live matches` : "View latest matches"}</span>
                      <button onClick={() => copy(a.link, a.id)} className="flex items-center gap-1 text-xs text-accent hover:text-accent/70 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {copied === a.id ? <><Check className="w-3 h-3" /> Copied</> : <><Share2 className="w-3 h-3" /> Share results</>}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center text-muted-foreground">
                <p className="text-sm font-medium text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No analyses yet</p>
                <p className="text-xs mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Run a skin analysis and this page will show the saved report, score, concern, result link, and the path into recommendations.</p>
                <button onClick={() => openCustomerSkinTest()} className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Start analysis</button>
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
              {accessPlan === "glow" ? "Top 3 matches from your latest analysis." : "Full AI-matched list based on your latest skin analysis with priority product matching."}
            </p>
          </div>
          <div className="space-y-3">
            {matchedProducts.length > 0 ? (
              (accessPlan === "glow" ? matchedProducts.slice(0, 3) : matchedProducts).map((r, i) => (
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
                <p className="text-sm font-medium text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No recommendations yet</p>
                <p className="text-xs mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Recommendations appear after a scan is saved and approved vendor products are available for matching.</p>
                <button onClick={() => openCustomerSkinTest()} className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Run analysis</button>
              </div>
            )}
          </div>
          {accessPlan === "glow" && matchedProducts.length > 0 && (
            <div className="bg-muted/50 border border-dashed border-border rounded-xl p-5 text-center">
              <Lock className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>See your full recommendation list</p>
              <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Upgrade to Glow Pass+ for priority product matching and the complete list of matched products.</p>
              <button onClick={() => payWithPaystack("basic")} className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Upgrade to Glow Pass+</button>
            </div>
          )}
        </div>
      )}

      {/* ── INGREDIENTS ── */}
      {tab === "ingredients" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Ingredient safety check</h2>
              <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Ingredient checks will appear when a saved scan includes product ingredients or label-extracted actives. <PlanBadge required="glowplus" current={accessPlan} />
              </p>
            </div>
          </div>
          <div className="relative space-y-3">
            {accessPlan === "glow" && <LockedOverlay label="Glow Pass+" onUpgrade={() => payWithPaystack("basic")} />}
            {visibleIngredients.length > 0 ? visibleIngredients.map((ing) => (
              <button
                key={ing.name}
                onClick={() => setSelectedIngredient(ing)}
                className={cn("w-full text-left bg-card border rounded-xl p-4 flex items-start gap-4 transition-all hover:shadow-sm hover:border-accent/40", ing.safe ? "border-border" : "border-red-200 bg-red-50/30")}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${ing.safe ? "bg-green-100" : "bg-red-100"}`}>
                  {ing.safe ? <Check className="w-3.5 h-3.5 text-green-700" /> : <X className="w-3.5 h-3.5 text-red-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ing.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${ing.safe ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`} style={{ fontFamily: "'DM Mono', monospace" }}>
                      {ing.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ing.benefit}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>{ing.scope}</span>
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>Max: {ing.maxConc}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
              </button>
            )) : (
              <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
                <p className="text-sm font-medium text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No scan-derived ingredient checks yet</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Run an analysis and choose matched products with saved ingredients. This page will then show ingredient safety notes based on real scan and catalogue data.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PROGRESS ── */}
      {tab === "progress" && (
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Monthly skin progress report</h2>
              <PlanBadge required="premium" current={accessPlan} />
            </div>
            <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Your skin score trend over the past 7 months.</p>
          </div>

          <div className="relative bg-card border border-border rounded-xl p-5">
            {accessPlan !== "premium" && <LockedOverlay label="Premium Glow" onUpgrade={() => payWithPaystack("premium")} />}
            {progressScores.length > 0 ? (
              <div className="mb-4 h-64 rounded-xl border border-border bg-background p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressScores} margin={{ top: 12, right: 18, left: -18, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.08)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) => [`${value} / 100`, "Skin score"]}
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#008236" strokeWidth={3} dot={{ r: 4, fill: "#008236" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mb-4 h-36 rounded-xl border border-dashed border-border bg-muted/30 flex items-center justify-center text-center px-4">
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Your progress chart appears after scans with saved AI scores.</p>
              </div>
            )}

            <div className="border-t border-border pt-4 grid sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Current score",
                  value: latestScoreText,
                  delta: scoredAnalyses.length > 1 ? "Compared with previous scan" : "Run more scans to build trend data",
                  good: true
                },
                {
                  label: "Best score",
                  value: scoredAnalyses.length ? `${Math.max(...scoredAnalyses.map((a) => a.score))} / 100` : "—",
                  delta: scoredAnalyses.length ? "From your scan history" : "No scan history yet",
                  good: true
                },
                {
                  label: "Trend",
                  value: scoredAnalyses.length > 1 ? (scoredAnalyses[0].score >= scoredAnalyses[1].score ? "Improving" : "Monitor") : "Not enough data",
                  delta: scoredAnalyses.length > 1 ? `${scoredAnalyses[0].score - scoredAnalyses[1].score} pts vs previous scan` : "At least 2 scans required",
                  good: scoredAnalyses.length <= 1 || scoredAnalyses[0].score >= scoredAnalyses[1].score
                },
              ].map((s) => (
                <div key={s.label} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.label}</p>
                  <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>{s.value}</p>
                  <p className={`text-xs mt-0.5 ${s.good ? "text-green-700" : "text-red-600"}`} style={{ fontFamily: "'DM Mono', monospace" }}>{s.delta}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              {[
                { label: "Tracked concern", value: latestAnalysis?.concerns?.join(", ") || "No concern yet" },
                { label: "Latest scan area", value: latestAnalysis?.area || "No area saved yet" },
              ].map((item) => (
                <div key={item.label} className="bg-background border border-border rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.label}</p>
                  <p className="text-sm text-foreground font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.value}</p>
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
              <PlanBadge required="premium" current={accessPlan} />
            </div>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {latestAnalysis ? `Built from your latest ${latestAnalysis.concerns.join(", ")} analysis.` : "Run a skin test to generate a routine."}
              </p>
          </div>
          <div className="relative">
            {accessPlan !== "premium" && <LockedOverlay label="Premium Glow" onUpgrade={() => payWithPaystack("premium")} />}
            {routineSteps.length > 0 ? (
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
            ) : (
              <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
                <p className="text-sm font-medium text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No routine yet</p>
                <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Run an analysis first. The routine page will use your latest concern and product matches to build AM and PM steps.</p>
                <button onClick={() => openCustomerSkinTest()} className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Run analysis</button>
              </div>
            )}
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
                <PlanBadge required="premium" current={accessPlan} />
              </div>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Track up to 5 family members. Each profile gets its own skin analysis history.</p>
            </div>
            <button onClick={() => setShowAddFamily((v) => !v)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Plus className="w-3.5 h-3.5" /> Add member
            </button>
          </div>
          <div className="relative space-y-3">
            {accessPlan !== "premium" && <LockedOverlay label="Premium Glow" onUpgrade={() => payWithPaystack("premium")} />}
            {showAddFamily && (
              <div className="bg-muted/30 border border-dashed border-border rounded-xl p-4 grid sm:grid-cols-2 lg:grid-cols-[1fr_150px_140px] gap-3">
                <input
                  value={familyForm.name}
                  onChange={(e) => setFamilyForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-accent min-w-0"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
                <input
                  value={familyForm.relationship}
                  onChange={(e) => setFamilyForm((prev) => ({ ...prev, relationship: e.target.value }))}
                  placeholder="Relationship"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-accent min-w-0"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
                <select
                  value={familyForm.ageBand}
                  onChange={(e) => setFamilyForm((prev) => ({ ...prev, ageBand: e.target.value }))}
                  className="bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground outline-none focus:border-accent"
                >
                  <option>Child</option><option>Teen</option><option>Adult</option><option>Older adult</option>
                </select>
                <select
                  value={familyForm.skinType}
                  onChange={(e) => setFamilyForm((prev) => ({ ...prev, skinType: e.target.value }))}
                  className="bg-background border border-border rounded-lg px-2 py-2 text-sm text-foreground outline-none focus:border-accent"
                >
                  <option>Dry</option><option>Oily</option><option>Combination</option><option>Normal</option><option>Sensitive</option>
                </select>
                <input
                  value={familyForm.concern}
                  onChange={(e) => setFamilyForm((prev) => ({ ...prev, concern: e.target.value }))}
                  placeholder="Main concern"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-accent min-w-0"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
                <input
                  value={familyForm.notes}
                  onChange={(e) => setFamilyForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes, allergies or sensitivities"
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-accent min-w-0"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
                <button
                  onClick={saveFamilyMember}
                  disabled={savingFamily}
                  className="sm:col-span-2 lg:col-span-3 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-60"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {savingFamily ? "Saving…" : "Save"}
                </button>
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
                  <p className="text-[11px] text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{m.relationship} · {m.ageBand}{m.notes ? ` · ${m.notes}` : ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Last scan</p>
                  <p className="text-xs font-medium text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{m.lastScan}</p>
                </div>
                <button onClick={() => openCustomerSkinTest()} className="flex items-center gap-1 text-xs text-accent hover:text-accent/70 transition-colors flex-shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  New scan <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}
            {familyProfiles.length === 0 && (
              <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
                <p className="text-sm font-medium text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No family profiles yet</p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Add a real family profile above. Saved profiles are stored and fetched from your account.</p>
              </div>
            )}
            <div className="text-xs text-muted-foreground text-center py-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {familyProfiles.length} of 5 profiles used
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS / BILLING ── */}
      {tab === "settings" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Account settings</h2>
            <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Manage your profile, sign-in security, trial access, and paid plan options.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Profile details</h3>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Update the customer identity used across your skin portal.</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 rounded-full font-semibold self-start" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <User className="w-3.5 h-3.5" />
                {planLabel}
              </span>
            </div>
            <div className="grid sm:grid-cols-[96px_1fr] gap-4 items-center">
              <div className="w-20 h-20 rounded-full bg-accent/10 text-accent border border-accent/20 flex items-center justify-center text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {userInitials}
              </div>
              <label className="block">
                <span className="block text-xs font-semibold text-muted-foreground mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Full name</span>
                <input
                  value={profileForm.name}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </label>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Contact details</h3>
              <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Keep your email, phone number, and location up to date for account recovery and support.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-muted-foreground mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Email address</span>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-muted-foreground mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Phone number</span>
                <input
                  value={profileForm.phone}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-xs font-semibold text-muted-foreground mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Location</span>
                <input
                  value={profileForm.location}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, location: event.target.value }))}
                  placeholder="City, country"
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={saveUserProfile}
                disabled={savingProfile}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 disabled:opacity-60 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {savingProfile ? "Saving…" : "Save profile"}
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Security</h3>
              <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Change your password for this customer account.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-muted-foreground mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>New password</span>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-muted-foreground mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Confirm password</span>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={changePassword}
                disabled={savingPassword}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-muted disabled:opacity-60 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {savingPassword ? "Changing…" : "Change password"}
              </button>
            </div>
          </div>

          {trialAccessActive && (
            <div className="bg-card border border-[#008236]/25 rounded-2xl p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div>
                  <span className="inline-flex text-[10px] uppercase tracking-wider font-bold text-[#008236] bg-[#008236]/10 border border-[#008236]/20 px-2.5 py-1 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>
                    Current plan
                  </span>
                  <h3 className="text-2xl font-light text-foreground mt-3" style={{ fontFamily: "'Fraunces', serif" }}>14-day free trial</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Full customer dashboard access is active during your trial. When it ends, advanced tools require a paid plan.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 min-w-[260px]">
                  {[
                    { label: "Days", value: trialDays },
                    { label: "Hours", value: trialHours },
                    { label: "Minutes", value: trialMinutes },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-[#FAF7F2] border border-border p-3 text-center">
                      <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{item.value}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: "glow" as const,
                name: "Free plan",
                price: "₦0",
                period: "month",
                desc: "Basic access after the free trial ends.",
                features: ["Limited skin analysis access", "Top product recommendations", "Basic skin type and concern report", "Ingredient safety check", "Results shared via link"],
                cta: trialAccessActive ? "Available after trial" : (plan === "glow" ? "Current plan" : "Downgrade to free plan"),
                planKey: null,
                active: plan === "glow" && !trialAccessActive,
                disabled: trialAccessActive,
              },
              {
                id: "glowplus" as const,
                name: "Glow Pass+",
                price: "₦3,500",
                period: "month",
                desc: "Unlimited skin analyses and complete history log files tracking.",
                features: ["Unlimited skin analyses", "Full product recommendation list", "Detailed skin health report", "Save and track skin history", "Personalised ingredient glossary", "Priority product matching"],
                cta: trialAccessActive ? "Keep access after trial" : (plan === "glow" ? "Upgrade to Glow Pass+" : (plan === "glowplus" ? "Current plan" : "Downgrade to Glow Pass+")),
                planKey: "basic" as const,
                active: plan === "glowplus"
              },
              {
                id: "premium" as const,
                name: "Premium Glow",
                price: "₦7,000",
                period: "month",
                desc: "Complete features including live dermatologist chats and routines.",
                features: ["Everything in Glow Pass+", "Monthly progress reports & trend scores", "Direct chat with certified skin advisers", "Verified partner product offers", "Family skin profiles (up to 5 members)", "Skincare routine builder"],
                cta: trialAccessActive ? "Keep all features after trial" : (plan === "premium" ? "Current plan" : "Upgrade to Premium Glow"),
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
                  {p.active || p.disabled ? (
                    <button disabled className="w-full py-3 bg-muted text-muted-foreground rounded-xl text-xs font-semibold cursor-not-allowed">
                      {p.active ? "Current plan" : p.cta}
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
          </main>
        </div>
          </>
      </div>

      {/* ── Floating adviser chat (Premium) ── */}
      {accessPlan === "premium" && (
        <div className="fixed bottom-6 right-6 z-50">
          {chatOpen && (
            <div className="w-[min(24rem,calc(100vw-2rem))] bg-card border border-border rounded-2xl shadow-xl overflow-hidden mb-3">
              <div className="bg-foreground px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Skin Adviser</p>
                  <p className="text-xs text-white/50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Certified · Usually replies in minutes</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-white/40 hover:text-white/70 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="h-72 overflow-y-auto p-4 space-y-3">
                {chatHistory.map((m, i) => (
                  <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words ${m.from === "user" ? "bg-accent text-white" : "bg-muted text-foreground"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {m.from === "advisor" ? <FormattedChatText text={m.text} /> : m.text}
                    </div>
                  </div>
                ))}
                {chatTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground rounded-xl px-3 py-2 flex items-center gap-1.5">
                      {[0, 1, 2].map((dot) => (
                        <span key={dot} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${dot * 120}ms` }} />
                      ))}
                    </div>
                  </div>
                )}
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

      {selectedIngredient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>Ingredient record</p>
                <h3 className="text-xl font-light text-foreground mt-1" style={{ fontFamily: "'Fraunces', serif" }}>{selectedIngredient.name}</h3>
              </div>
              <button onClick={() => setSelectedIngredient(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: "Safety status", value: selectedIngredient.status },
                { label: "Function", value: selectedIngredient.function },
                { label: "Scope", value: selectedIngredient.scope },
                { label: "Maximum concentration", value: selectedIngredient.maxConc },
              ].map((item) => (
                <div key={item.label} className="bg-muted/40 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{item.label}</p>
                  <p className="text-sm text-foreground mt-1 capitalize" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.value || "Not specified"}</p>
                </div>
              ))}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>Notes</p>
                <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {selectedIngredient.notes || selectedIngredient.benefit || "No additional notes have been added for this ingredient."}
                </p>
              </div>
            </div>
          </div>
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
