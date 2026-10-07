import { useState, useEffect, useRef } from "react";
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Scan, Star, FlaskConical, Share2, Check, CheckCircle,
  ChevronDown, ChevronRight, MessageCircle, Users,
  Calendar, BarChart2, ShoppingBag, BookOpen, Flame, Lock,
  Plus, X, LogOut, Settings, HeartPulse, User,
  Store, Zap, ArrowRight, ShieldCheck,
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { UnifiedDashboardHeader } from "./components/UnifiedDashboardHeader";
import { supabase } from "./utils/supabase";
import { AccountDeletionSection } from "./components/AccountDeletionSection";
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
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div><p className="text-sm font-semibold text-foreground">Available with {label}</p><p className="text-xs text-muted-foreground">Your saved data remains available after upgrading.</p></div>
      </div>
      <button
        onClick={onUpgrade}
        className="self-start whitespace-nowrap rounded-md bg-[#008236] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#006c2c] sm:self-auto"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        View plans
      </button>
    </div>
  );
}

function aiGuideGreeting(name?: string) {
  const intro = name ? `Hi ${name}.` : "Hi.";
  return `${intro} I'm Anovra Care Guide. I can explain your latest skin test report, define skin terms, review ingredient safety notes, compare your product matches, and help turn your results into a simple AM/PM routine. Ask me about a concern, ingredient, product match, or routine step.`;
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
  const [shareFallback, setShareFallback] = useState<string | null>(null);
  const shareTextRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    sessionStorage.setItem("active_user_tab", tab);
  }, [tab]);

  const [showAddFamily, setShowAddFamily] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatTyping, setChatTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ from: "user" | "advisor"; text: string }[]>([
    { from: "advisor", text: aiGuideGreeting() },
  ]);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [familyForm, setFamilyForm] = useState({ name: "", relationship: "", ageBand: "Adult", skinType: "Combination", concern: "", notes: "" });
  const [savingFamily, setSavingFamily] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "", location: "" });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [userProfile, setUserProfile] = useState<{ id?: string; name: string; plan: "none" | "starter" | "glowplus" | "premium" } | null>(null);
  const [analysesList, setAnalysesList] = useState<any[]>([]);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);
  const [matchedProducts, setMatchedProducts] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [routineList, setRoutineList] = useState<any[]>([]);
  const [visibleIngredients, setVisibleIngredients] = useState<any[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialExpired, setTrialExpired] = useState(false);
  const [paidAccessExpired, setPaidAccessExpired] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [trialMsRemaining, setTrialMsRemaining] = useState(3 * 24 * 60 * 60 * 1000);
  const [showTrialExpiredNotice, setShowTrialExpiredNotice] = useState(true);
  const [savingTrialNotice, setSavingTrialNotice] = useState(false);

  const dismissTrialExpiredNotice = async () => {
    if (!userProfile?.id || savingTrialNotice) return;
    setSavingTrialNotice(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { trial_notice_dismissed_at: new Date().toISOString() },
      });
      if (error) throw error;
      localStorage.setItem(`anovra_trial_notice_dismissed_${userProfile.id}`, "true");
      setShowTrialExpiredNotice(false);
    } catch (error) {
      console.error("Could not save trial notice acknowledgement:", error);
      toast.error("Could not save your choice. Please try again.");
    } finally {
      setSavingTrialNotice(false);
    }
  };

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
          .select("name, email, phone, location, plan, created_at, customer_plan_expires_at")
          .eq("id", user.id)
          .maybeSingle();

        // Trial access is tied to account creation, not a browser countdown.
        const createdDate = profile?.created_at ? new Date(profile.created_at) : (user.created_at ? new Date(user.created_at) : new Date());
        const endsAt = new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000);
        setTrialEndsAt(endsAt);
        setTrialMsRemaining(Math.max(0, endsAt.getTime() - Date.now()));
        const daysDiff = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        const rawPlan = profile?.plan || "free";
        const paidPlanExpired = rawPlan !== "free" && Boolean(profile?.customer_plan_expires_at)
          && Date.now() > new Date(profile!.customer_plan_expires_at).getTime();
        setPaidAccessExpired(paidPlanExpired);
        const dismissedLocally = localStorage.getItem(`anovra_trial_notice_dismissed_${user.id}`) === "true";
        const hasDismissedTrialNotice = Boolean(user.user_metadata?.trial_notice_dismissed_at) || dismissedLocally;
        if (dismissedLocally && !user.user_metadata?.trial_notice_dismissed_at) {
          const { error: noticeError } = await supabase.auth.updateUser({
            data: { trial_notice_dismissed_at: new Date().toISOString() },
          });
          if (noticeError) console.warn("Could not sync previous trial notice acknowledgement:", noticeError);
        }
        if ((rawPlan === "free" && daysDiff > 3) || paidPlanExpired) {
          setTrialExpired(true);
          if (hasDismissedTrialNotice) {
            setShowTrialExpiredNotice(false);
          }
        }

        const pVal = paidPlanExpired ? "none" : profile?.plan === "premium" ? "premium" : profile?.plan === "basic" ? "glowplus" : profile?.plan === "starter" ? "starter" : "none";
        const profileObj = {
          id: user.id,
          name: profile?.name || "Individual",
          plan: pVal as "none" | "starter" | "glowplus" | "premium"
        };
        setUserProfile(profileObj);
        setProfileForm({
          name: profileObj.name,
          email: user.email || profile?.email || "",
          phone: profile?.phone || user.user_metadata?.phone || "",
          location: profile?.location || "",
        });

        // Update AI guide initial greeting with name
        setChatHistory([
          { from: "advisor", text: aiGuideGreeting(profileObj.name) }
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
            const inconclusive = Boolean(s.image_quality?.products_withheld)
              || s.image_quality?.finding_confidence == null
              || (Number.isFinite(Number(s.image_quality.finding_confidence)) && Number(s.image_quality.finding_confidence) < 90);
            return {
              id: s.id.substring(0, 8).toUpperCase(),
              fullId: s.id,
              date: dateStr,
              vendor: s.vendor_name || s.vendor_brand || "Recorded scan",
              concerns: typeof s.concern === "string" && s.concern ? [s.concern] : [],
              skinType: typeof s.image_quality?.skin_type === "string" && s.image_quality.skin_type.trim() ? s.image_quality.skin_type : "Not recorded",
              selectedFocus: typeof s.image_quality?.selected_focus === "string" ? s.image_quality.selected_focus : "",
              inconclusive,
              score: s.score !== null && s.score !== undefined && !Number.isNaN(Number(s.score)) ? Math.round(Number(s.score)) : null,
              products: !inconclusive && Array.isArray(s.matched_products) ? s.matched_products.length : 0,
              severity: Array.isArray(s.image_quality?.conditions) && s.image_quality.conditions.length
                ? s.image_quality.conditions : Array.isArray(s.severity) ? s.severity : [],
              benefits: Array.isArray(s.benefits) ? s.benefits : [],
              treatmentPlan: !inconclusive && Array.isArray(s.treatment_plan) ? s.treatment_plan : [],
              area: s.skin_area || "Skin",
              createdAt: s.created_at,
            };
          });
          setAnalysesList(formatted);

          const savedMatches = formatted[0].inconclusive ? [] : Array.isArray(scans[0].matched_products) ? scans[0].matched_products : [];
          const matchIds = [...new Set(savedMatches.map((match: any) => match?.id).filter(Boolean))];
          let eligibleMatches: any[] = [];
          if (matchIds.length) {
            const { data: catalogueRows, error: catalogueError } = await supabase.from("products")
              .select("id, vendor_id, name, brand, price, image_url, nafdac_status")
              .in("id", matchIds).eq("nafdac_status", "approved");
            if (catalogueError) throw catalogueError;
            const vendorIds = [...new Set((catalogueRows || []).map((product) => product.vendor_id).filter(Boolean))];
            const { data: sellers, error: sellerError } = vendorIds.length
              ? await supabase.from("profiles")
                .select("id, slug, is_verified, verification_status, account_type, branch_status, parent_brand_id, plan, created_at")
                .in("id", vendorIds)
              : { data: [], error: null };
            if (sellerError) throw sellerError;
            const parentIds = [...new Set((sellers || []).map((seller) => seller.parent_brand_id).filter(Boolean))];
            const { data: parents, error: parentError } = parentIds.length
              ? await supabase.from("profiles").select("id, is_verified, verification_status, plan, created_at").in("id", parentIds)
              : { data: [], error: null };
            if (parentError) throw parentError;
            const parentById = new Map((parents || []).map((parent) => [parent.id, parent]));
            const sellerById = new Map((sellers || []).map((seller) => [seller.id, seller]));
            const productById = new Map((catalogueRows || []).map((product) => [product.id, product]));
            eligibleMatches = savedMatches.flatMap((match: any) => {
              const product = productById.get(match.id);
              const seller = product ? sellerById.get(product.vendor_id) : null;
              const owner = seller?.parent_brand_id ? parentById.get(seller.parent_brand_id) : seller;
              const trialEnd = new Date(owner?.created_at || 0).getTime() + 3 * 24 * 60 * 60 * 1000;
              if (!seller?.is_verified || seller.verification_status !== "approved"
                || (seller.account_type === "branch" && seller.branch_status !== "active")
                || !owner?.is_verified || owner.verification_status !== "approved"
                || ((owner.plan || "free") === "free" && Date.now() > trialEnd)) return [];
              return [{ ...match, name: product.name, brand: product.brand || match.brand,
                price: product.price, image_url: product.image_url || match.image_url,
                vendor_slug: seller.slug || match.vendor_slug }];
            });
          }
          setMatchedProducts(eligibleMatches.map((match: any, index: number) => ({
            id: match.id,
            name: match.name,
            brand: match.brand || "Partner product",
            concern: Array.isArray(match.matched_conditions) ? match.matched_conditions.join(", ") : scans[0].concern,
            match: `${Math.round(Number(match.score || 0))}%`,
            price: `₦${Number(match.price || 0).toLocaleString()}`,
            badge: index === 0 ? "Top match" : "",
            image: match.image_url || "",
            vendorSlug: match.vendor_slug || "",
            purchaseUrl: match.purchase_url || "",
          })));
          const ingredientNames = [...new Set(eligibleMatches.flatMap((match: any) =>
            Array.isArray(match.ingredients) ? match.ingredients.filter((name: unknown) => typeof name === "string") : []))] as string[];
          const fallbacks = !formatted[0].inconclusive && Array.isArray(scans[0].ingredient_fallback) ? scans[0].ingredient_fallback : [];
          for (const name of fallbacks) {
            if (typeof name === "string" && !ingredientNames.some((known) => known.toLowerCase() === name.toLowerCase())) ingredientNames.push(name);
          }
          const treatmentItems = !formatted[0].inconclusive && Array.isArray(scans[0].treatment_plan) ? scans[0].treatment_plan : [];
          for (const item of treatmentItems) {
            for (const target of Array.isArray(item?.ingredient_targets) ? item.ingredient_targets : []) {
              const name = typeof target === "string" ? target : target?.ingredient;
              if (typeof name === "string" && name.trim() && !ingredientNames.some((known) => known.toLowerCase() === name.trim().toLowerCase())) ingredientNames.push(name.trim());
            }
          }
          if (ingredientNames.length) {
            const { data: safetyRows, error: safetyError } = await supabase.from("safety_ingredients")
              .select("name, function, status, scope, max_conc, notes");
            if (safetyError) throw safetyError;
            const safetyByName = new Map((safetyRows || []).map((row) => [row.name.trim().toLowerCase(), row]));
            setVisibleIngredients(ingredientNames.map((name) => {
              const row = safetyByName.get(name.trim().toLowerCase());
              return { name, status: row?.status || "unassessed", safe: row?.status === "safe",
                benefit: row?.notes || row?.function || "No safety note is available for this ingredient yet.",
                scope: row?.scope || "Not assessed", maxConc: row?.max_conc || "Not specified" };
            }));
          }
          const savedTreatments = treatmentItems;
          setRoutineList(savedTreatments.flatMap((item: any) => {
            const frequency = String(item.frequency || "").toLowerCase();
            const periods = frequency.includes("am") && frequency.includes("pm") ? ["AM", "PM"]
              : frequency.includes("pm") || frequency.includes("night") ? ["PM"] : ["AM"];
            return periods.map((period) => ({
              step: `${period} ${item.condition || item.name}`,
              label: item.name,
              product: item.what_to_do,
              tip: item.why,
            }));
          }));
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

  async function shareLatestAnalysis() {
    if (!latestAnalysis) return;
    const summary = `Anovra skin analysis · ${latestAnalysis.date}\nArea: ${latestAnalysis.area}\nSkin type: ${latestAnalysis.skinType}${latestAnalysis.selectedFocus ? `\nYour selected focus: ${latestAnalysis.selectedFocus}` : ""}\nStrongest visible finding: ${latestAnalysis.concerns.join(", ") || "None recorded"}${latestAnalysis.inconclusive ? "\nResult inconclusive: do not use it to choose products or treatment." : ""}\nThis is a cosmetic assessment, not a medical diagnosis.`;
    try {
      if (navigator.share) await navigator.share({ title: "My Anovra skin summary", text: summary });
      else {
        await navigator.clipboard.writeText(summary);
        setCopied("result-summary");
        setTimeout(() => setCopied(null), 2000);
        toast.success("Summary copied. Only share it with someone you trust.");
      }
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") setShareFallback(summary);
    }
  }

  function openCustomerSkinTest() {
    if (trialExpired && userProfile?.plan === "none") {
      setTab("settings");
      toast.info("Your trial has ended. Choose a plan to start another analysis.");
      return;
    }
    sessionStorage.removeItem("active_scan_slug");
    setView("skintest");
  }

  const saveFamilyMember = async () => {
    if (!familyForm.name.trim()) {
      toast.error("Enter a family member name.");
      return;
    }
    if (familyMembers.length >= 5) {
      toast.error("You can add up to five family profiles.");
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
      const emailChanged = Boolean(nextProfile.email && nextProfile.email !== user.email);
      const { error } = await supabase
        .from("profiles")
        .update({
          name: nextProfile.name,
          email: user.email,
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
      if (emailChanged) {
        authUpdates.email = nextProfile.email;
      }
      const { error: authError } = await supabase.auth.updateUser(authUpdates);
      if (authError) throw authError;
      setProfileForm(nextProfile);
      setUserProfile((prev) => prev ? { ...prev, name: nextProfile.name } : prev);
      toast.success(emailChanged ? "Profile updated. Confirm your new email address to use it for sign-in." : "Profile updated.");
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

  const payWithPaystack = async (planKey: "starter" | "basic" | "premium") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("You must be logged in to upgrade your plan.");
        return;
      }
      const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      if (!paystackPublicKey) {
        toast.error("Checkout is temporarily unavailable.");
        return;
      }
      const { data: checkout, error: readinessError } = await supabase.functions.invoke("verify-customer-payment", { method: "GET" });
      if (readinessError) {
        const response = typeof readinessError.context?.json === "function" ? await readinessError.context.json().catch(() => null) : null;
        toast.error(response?.error || "Could not contact checkout. Please try again or contact Anovra support.");
        return;
      }
      if (!checkout?.ready) {
        toast.error("Checkout is not configured yet. Please contact Anovra support.");
        return;
      }
      if (!(window as any).PaystackPop) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://js.paystack.co/v1/inline.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Could not load Paystack checkout."));
          document.body.appendChild(script);
        });
      }
      if (typeof (window as any).PaystackPop?.setup !== "function") {
        throw new Error("Paystack checkout did not initialise. Please refresh the page and try again.");
      }
      let paymentCompleted = false;
      const handler = (window as any).PaystackPop.setup({
        key: paystackPublicKey,
        email: user.email,
        amount: (planKey === "starter" ? 1500 : planKey === "basic" ? 3500 : 7000) * 100,
        currency: "NGN",
        callback: async (response: { reference?: string; trxref?: string }) => {
          paymentCompleted = true;
          const reference = response.reference || response.trxref;
          if (!reference) {
            toast.error("Paystack did not return a reference. Please contact support.");
            return;
          }
          const { data, error } = await supabase.functions.invoke("verify-customer-payment", {
            body: { plan: planKey, reference },
          });
          if (error || !data?.success) {
            toast.error(data?.error || "Payment received, but plan activation needs review. Contact support with your Paystack reference.");
            return;
          }
          setUserProfile((current) => current ? {
            ...current, plan: planKey === "premium" ? "premium" : planKey === "basic" ? "glowplus" : "starter",
          } : current);
          setTrialExpired(false);
          setPaidAccessExpired(false);
          setShowTrialExpiredNotice(false);
          toast.success(`${planKey === "premium" ? "Premium Glow" : planKey === "basic" ? "Glow Pass+" : "Glow Pass"} is active.`);
        },
        onClose: () => {
          if (!paymentCompleted) toast.info("Checkout closed.");
        },
      });
      handler.openIframe();
    } catch (err: any) {
      console.error("Paystack launch error:", err);
      toast.error(String(err?.message || "Could not open checkout. Please try again.").replace(/[<>]/g, "").slice(0, 180));
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
      const latest = analysesList[0] || null;
      const dashboardContext = {
        customerName: userProfile?.name || "Individual",
        latestAnalysis: latest ? {
          area: latest.area,
          skinType: latest.skinType,
          concern: latest.concerns?.join(", "),
          score: latest.score,
          severity: latest.severity?.slice?.(0, 10) || [],
          benefits: latest.benefits?.slice?.(0, 8) || [],
        } : null,
        productMatches: matchedProducts.slice(0, 6).map((product) => ({
          name: product.name,
          brand: product.brand,
          concern: product.concern,
          match: product.match,
          price: product.price,
        })),
        routineSteps: routineList.slice(0, 6).map((step) => ({
          step: step.step,
          label: step.label,
          product: step.product,
          tip: step.tip,
        })),
      };
      const contents = [{
        role: "user",
        parts: [{ text: `Dashboard context:\n${JSON.stringify(dashboardContext, null, 2)}\n\nCustomer questions:\n${userTranscript}` }]
      }];

      const { data, error } = await supabase.functions.invoke("chat-advisor", {
        body: { contents }
      });

      if (error) throw error;
      const reply = data?.reply || "I'm sorry, I couldn't process that response. Please try again.";
      
      setChatHistory([...updatedHistory, { from: "advisor" as const, text: reply }]);
    } catch (err) {
      console.error("Gemini guide call failed:", err);
      setChatHistory([...updatedHistory, { from: "advisor" as const, text: "I'm having trouble reaching Anovra Care Guide right now. Please try again in a moment." }]);
    } finally {
      setChatTyping(false);
    }
  };

  const latestAnalysis = analysesList[0] || null;
  const plan = userProfile?.plan || "none";
  const trialAccessActive = plan === "none" && !trialExpired;
  const accessPlan = trialAccessActive ? "premium" : plan === "none" || plan === "starter" ? "glow" : plan;
  const trialDays = Math.floor(trialMsRemaining / (1000 * 60 * 60 * 24));
  const trialHours = Math.floor((trialMsRemaining / (1000 * 60 * 60)) % 24);
  const trialMinutes = Math.floor((trialMsRemaining / (1000 * 60)) % 60);
  const routineSteps = routineList;
  const familyProfiles = familyMembers;

  const tabs = [
    { id: "overview" as UserTab, label: "Overview", icon: <HeartPulse className="w-4 h-4" /> },
    { id: "history" as UserTab, label: "My Analyses", icon: <Scan className="w-4 h-4" /> },
    { id: "recommendations" as UserTab, label: "Recommendations", icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "ingredients" as UserTab, label: "Ingredients", icon: <FlaskConical className="w-4 h-4" /> },
    { id: "routine" as UserTab, label: "My Routine", icon: <Calendar className="w-4 h-4" /> },
    { id: "progress" as UserTab, label: "My Progress", icon: <BarChart2 className="w-4 h-4" /> },
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
  const planLabel = trialAccessActive ? "3-day trial" : plan === "premium" ? "Premium Glow" : plan === "glowplus" ? "Glow Pass+" : plan === "starter" ? "Glow Pass" : "No active plan";

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

  const severityName = (item: any) => String(item?.name || item?.concern || item?.label || item?.condition || item?.metric || "Skin concern");
  const severityValue = (item: any) => Number.isFinite(Number(item?.percentage))
    ? `${Math.round(Number(item.percentage))}% · ${item.level || "Recorded"}`
    : String(item?.severity || item?.level || item?.status || item?.value || item?.score || "Recorded");
  const progressScores = scoredAnalyses
    .slice()
    .reverse()
    .map((a) => ({
      month: new Date(a.createdAt || a.date).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      score: a.score
    }));
  const previousAnalysis = analysesList[1] || null;
  const concernRows = (latestAnalysis?.severity || []).slice(0, 8).map((item: any) => {
    const name = severityName(item);
    const previous = (previousAnalysis?.severity || []).find((entry: any) => severityName(entry).toLowerCase() === name.toLowerCase());
    const currentValue = severityValue(item);
    const previousValue = previous ? severityValue(previous) : "—";
    return {
      name,
      current: currentValue,
      previous: previousValue,
      trend: previousValue === "—" ? "New" : currentValue === previousValue ? "Stable"
        : Number.isFinite(Number(item?.percentage)) && Number.isFinite(Number(previous?.percentage))
          ? Number(item.percentage) < Number(previous.percentage) ? "Lower" : "Higher" : "Changed",
    };
  });
  const routineGroups = [
    { label: "Morning", title: "Morning routine", steps: routineSteps.filter((s) => s.step.startsWith("AM")), color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-100" },
    { label: "Evening", title: "Evening routine", steps: routineSteps.filter((s) => s.step.startsWith("PM")), color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-100" },
  ];
  const nextCheckIn = latestAnalysis?.createdAt
    ? new Date(new Date(latestAnalysis.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000)
    : null;

  return (
    <div className="min-h-screen bg-background pb-12">
      <UnifiedDashboardHeader
        currentView="userdashboard"
        setView={setView}
        title="My Skin Portal"
        role="consumer"
        showShopLink={false}
        onMenuClick={() => setSidebarOpen((open) => !open)}
        menuLabel={sidebarOpen ? "Close" : "Menu"}
        onProfileClick={() => setTab("settings")}
        profileName={userProfile?.name}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 relative">
        {trialExpired && plan === "none" && showTrialExpiredNotice && (
          <div
            className="fixed inset-0 z-[80] bg-[#142019]/60 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center overflow-y-auto overscroll-contain animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="trial-ended-title"
          >
            <div className="relative w-full max-w-4xl max-h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              {/* Close Button */}
              <button
                type="button"
                onClick={dismissTrialExpiredNotice}
                disabled={savingTrialNotice}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-background/80 hover:bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                aria-label="Dismiss modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto overscroll-contain grid lg:grid-cols-[0.92fr_1.08fr]">
                {/* Trial status and entry plan */}
                <div className="bg-gradient-to-b from-[#FBF9F5] via-[#F6F3EC] to-[#EFEBE1] border-b lg:border-b-0 lg:border-r border-border/70 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 text-[10px] font-bold uppercase tracking-widest mb-4 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                      {paidAccessExpired ? "Paid access ended" : "Free trial completed"}
                    </div>
                    <h2 id="trial-ended-title" className="text-2xl sm:text-3xl font-light text-foreground leading-[1.2]" style={{ fontFamily: "'Fraunces', serif" }}>
                      {paidAccessExpired ? "Your paid access has ended" : "Your 3-day trial has ended"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Your reports and profile are still saved. Choose a plan to start new analyses and keep using your skin tools.
                    </p>

                    {/* Entry plan */}
                    <div className="mt-6 rounded-2xl border border-[#008236]/25 bg-white/80 backdrop-blur-sm p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#008236]/10 text-[#008236] flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">Glow Pass</p>
                            <p className="text-[10px] text-muted-foreground font-mono">Entry plan</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#008236] bg-[#008236]/10 px-2.5 py-1 rounded-full font-mono">
                          ₦1,500/mo
                        </span>
                      </div>
                      <ul className="mt-3.5 space-y-2 text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#008236] shrink-0" />
                          <span>Skin portal workspace & shareable scan links</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#008236] shrink-0" />
                          <span>Top cosmetic product recommendations</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#008236] shrink-0" />
                          <span>Basic ingredient safety checks</span>
                        </li>
                      </ul>

                      <button
                        type="button"
                        onClick={() => payWithPaystack("starter")}
                        className="mt-5 w-full py-2.5 px-4 bg-[#008236] hover:bg-[#006c2c] text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        <span>Subscribe to Glow Pass</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground/75 mt-6 font-mono">
                    Not ready to subscribe? Close this window to review your saved records. New analyses require an active plan.
                  </p>
                </div>

                {/* Right Column: Premium Upgrades */}
                <div className="p-6 sm:p-8 bg-card flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between mb-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">Upgrade anytime</p>
                        <h3 className="text-lg font-semibold text-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Choose your skincare companion
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      {[
                        {
                          key: "basic" as const,
                          name: "Glow Pass+",
                          price: "₦3,500",
                          period: "month",
                          tag: "Most Popular",
                          desc: "Ideal for steady progress tracking & complete product lists.",
                          features: [
                            "Unlimited skin analyses & scans",
                            "Complete recommended product catalogue",
                            "Full historical scan timeline & logging",
                            "Personalised ingredient glossary",
                          ],
                          cta: "Upgrade to Glow Pass+",
                          featured: true,
                        },
                        {
                          key: "premium" as const,
                          name: "Premium Glow",
                          price: "₦7,000",
                          period: "month",
                          tag: "Full Concierge",
                          desc: "Complete dermatology guidance & family care suite.",
                          features: [
                            "Everything in Glow Pass+",
                            "Anovra AI Care Guide 24/7",
                            "Monthly progress reports & trend scores",
                            "Up to 5 family skin profiles & routine builder",
                          ],
                          cta: "Upgrade to Premium",
                          featured: false,
                        },
                      ].map((p) => (
                        <div
                          key={p.key}
                          className={cn(
                            "rounded-2xl p-4 sm:p-5 border transition-all relative",
                            p.featured
                              ? "border-[#C86B3A] bg-gradient-to-br from-[#C86B3A]/[0.06] to-transparent shadow-sm ring-1 ring-[#C86B3A]/20"
                              : "border-border bg-background/50 hover:border-border/80"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.name}</span>
                                <span
                                  className={cn(
                                    "text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full font-mono",
                                    p.featured ? "bg-[#C86B3A] text-white" : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {p.tag}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.desc}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-lg font-bold text-foreground font-mono leading-none">{p.price}</p>
                              <span className="text-[10px] text-muted-foreground">/{p.period}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1.5 my-3 text-[11px] text-foreground/80" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {p.features.map((feat) => (
                              <div key={feat} className="flex items-center gap-1.5">
                                <Check className={cn("w-3 h-3 shrink-0", p.featured ? "text-[#C86B3A]" : "text-[#008236]")} />
                                <span className="truncate">{feat}</span>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => payWithPaystack(p.key === "basic" ? "basic" : "premium")}
                            className={cn(
                              "w-full mt-2 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm",
                              p.featured
                                ? "bg-[#C86B3A] hover:bg-[#B85F33] text-white hover:shadow-md"
                                : "bg-[#008236] hover:bg-[#006c2c] text-white"
                            )}
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            <span>{p.cta}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-4 text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Payments are processed by Paystack. Contact support for subscription changes.
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
                  <span className="block text-sm font-semibold text-foreground truncate">{userProfile?.name || "Individual"}</span>
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
              { label: "Products matched", value: latestAnalysis ? String(latestAnalysis.products) : "0", delta: "From latest scan", icon: <ShoppingBag className="w-4 h-4" />, color: "text-blue-500" },
              { label: "Days since analysis", value: latestAnalysis ? String(Math.max(0, Math.floor((Date.now() - new Date(latestAnalysis.createdAt).getTime()) / (1000 * 60 * 60 * 24)))) : "—", delta: "Latest saved report", icon: <Flame className="w-4 h-4" />, color: "text-orange-500" },
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
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Strongest visible finding</p>
                  <p className="text-sm font-medium text-foreground">{latestAnalysis.concerns.join(", ")}</p>
                  {latestAnalysis.selectedFocus && <p className="mt-1 text-xs text-muted-foreground">You asked about {latestAnalysis.selectedFocus}</p>}
                </div>
                  <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Products matched</p>
                  <p className="text-sm font-medium text-foreground">{latestAnalysis.products} products</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={shareLatestAnalysis} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-semibold text-accent hover:bg-muted/50">
                  {copied === "result-summary" ? <><Check className="h-4 w-4" /> Copied</> : <><Share2 className="h-4 w-4" /> Share summary</>}
                </button>
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
              { icon: <Calendar className="w-4 h-4 text-green-600" />, title: "My skincare routine", desc: "Your personalised AM & PM routine steps", tab: "routine" as UserTab },
              { icon: <BarChart2 className="w-4 h-4 text-accent" />, title: "Skin progress report", desc: "See how your skin score has changed over time", tab: "progress" as UserTab },
              { icon: <BookOpen className="w-4 h-4 text-blue-500" />, title: "Ingredient glossary", desc: "Safe vs flagged ingredients for your skin type", tab: "ingredients" as UserTab },
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
              <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Review your latest saved report and product matches.</p>
            </div>
          </div>
          <div className="space-y-4 relative">
            {analysesList.length > 0 ? (
              (accessPlan === "glow" ? analysesList.slice(0, 1) : analysesList).map((a, i) => (
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
                      <button onClick={() => setExpandedAnalysisId(expandedAnalysisId === a.fullId ? null : a.fullId)} aria-expanded={expandedAnalysisId === a.fullId} className="flex items-center gap-1 text-xs text-accent hover:text-accent/70 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {expandedAnalysisId === a.fullId ? "Hide report" : "View report"} <ChevronDown className={cn("w-3 h-3 transition-transform", expandedAnalysisId === a.fullId && "rotate-180")} />
                      </button>
                    </div>
                  </div>
                  {expandedAnalysisId === a.fullId && (
                    <div className="border-t border-border px-5 py-5 space-y-4">
                      {a.inconclusive && <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">This assessment was inconclusive. Findings are provisional and should not guide treatment or product choices.</p>}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div><p className="text-xs text-muted-foreground">Skin area</p><p className="text-sm font-medium">{a.area}</p></div>
                        <div><p className="text-xs text-muted-foreground">Strongest visible finding</p><p className="text-sm font-medium">{a.concerns[0] || "Not recorded"}</p></div>
                        {a.selectedFocus && <div><p className="text-xs text-muted-foreground">Your selected focus</p><p className="text-sm font-medium">{a.selectedFocus}</p></div>}
                      </div>
                      {a.severity.length > 0 && (
                        <div><p className="text-xs font-semibold mb-2">Concern levels</p><div className="flex flex-wrap gap-2">{a.severity.map((item: any, index: number) => <span key={index} className="text-xs rounded-md border border-border px-2.5 py-1">{typeof item === "string" ? item : `${item.concern || item.name || "Concern"}: ${item.level || item.severity || "Recorded"}`}</span>)}</div></div>
                      )}
                      {a.treatmentPlan.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-2">Care guidance from this analysis</p>
                          <div className="space-y-3">{a.treatmentPlan.map((step: any, index: number) => (
                            <article key={index} className="rounded-md border border-border bg-background p-3 text-sm">
                              <h4 className="border-b border-border pb-2 font-semibold text-foreground">{typeof step === "string" ? step : step.name || step.condition || "Care step"}</h4>
                              {typeof step !== "string" && <div className="mt-3 space-y-2.5">
                                {[
                                  ["Do", step.what_to_do],
                                  ["Why", step.why],
                                  ["How often", step.frequency],
                                  ["Timeline", step.timeline],
                                  ["Avoid", Array.isArray(step.avoid) && step.avoid.length ? step.avoid.join("; ") : "—"],
                                  ["See a doctor", step.see_a_dermatologist_if],
                                ].filter(([, value]) => value).map(([label, value]) => (
                                  <div key={label} className="grid grid-cols-[90px_minmax(0,1fr)] gap-3 text-xs sm:grid-cols-[110px_minmax(0,1fr)]">
                                    <span className={cn("font-mono text-[10px] font-semibold uppercase", label === "See a doctor" ? "text-amber-800" : "text-muted-foreground")}>{label}</span>
                                    <span className="min-w-0 break-words text-foreground">{value}</span>
                                  </div>
                                ))}
                                {Array.isArray(step.ingredient_targets) && step.ingredient_targets.length > 0 && (
                                  <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-3 text-xs sm:grid-cols-[110px_minmax(0,1fr)]">
                                    <span className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">Look for</span>
                                    <div className="flex flex-wrap gap-1.5">{step.ingredient_targets.map((target: any, targetIndex: number) => <span key={targetIndex} className="rounded-md border border-border bg-muted px-2 py-1 text-foreground">{typeof target === "string" ? target : `${target.ingredient || "Ingredient"}${target.concentration ? ` · ${target.concentration}` : ""}`}</span>)}</div>
                                  </div>
                                )}
                              </div>}
                            </article>
                          ))}</div>
                        </div>
                      )}
                      {i === 0 && <button onClick={() => setTab("recommendations")} className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-white">View matched products <ChevronRight className="w-3.5 h-3.5" /></button>}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center text-muted-foreground">
                <p className="text-sm font-medium text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No analyses yet</p>
                <p className="text-xs mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Run a skin analysis to save its report, visible findings, care guidance, and eligible product matches here.</p>
                <button onClick={() => openCustomerSkinTest()} className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Start analysis</button>
              </div>
            )}
          </div>
          {accessPlan === "glow" && analysesList.length > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{analysesList.length - 1} earlier report{analysesList.length === 2 ? "" : "s"} available with Glow Pass+.</p>
              <button onClick={() => payWithPaystack("basic")} className="rounded-md bg-accent px-3 py-2 text-xs font-semibold text-white">View plans</button>
            </div>
          )}
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
                <div key={r.id || r.name} className={cn("bg-card border border-border rounded-xl p-4 flex flex-wrap sm:flex-nowrap items-center gap-4", i === 0 && "border-accent/30 ring-1 ring-accent/10")}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${i === 0 ? "bg-accent text-white" : "bg-muted text-muted-foreground"}`} style={{ fontFamily: "'DM Mono', monospace" }}>
                    {i + 1}
                  </div>
                  {r.image && <img src={r.image} alt="" className="w-12 h-12 object-cover rounded-md border border-border flex-shrink-0" />}
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
                  {r.id && (
                    <a
                      href={`/#/shop${r.vendorSlug ? `/${encodeURIComponent(r.vendorSlug)}` : ""}?product=${encodeURIComponent(r.id)}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-border text-xs font-semibold text-foreground hover:border-accent hover:text-accent w-full sm:w-auto"
                    >
                      View product <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center text-muted-foreground">
                <p className="text-sm font-medium text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No recommendations yet</p>
                <p className="text-xs mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {!latestAnalysis ? "Run an analysis to see approved products matched to your skin." : latestAnalysis.inconclusive
                    ? "Your latest analysis was inconclusive, so no products are recommended. Retake the photo or consult a registered dermatologist."
                    : latestAnalysis.products > 0
                    ? "Your scan recorded product matches, but those products are not currently available from approved partners. Your report and care guidance remain saved."
                    : "Your latest analysis did not produce eligible product matches. Review its care guidance or retake a clearer photo; products are never added without a suitable match."}
                </p>
                <button onClick={() => latestAnalysis ? setTab("history") : openCustomerSkinTest()} className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{latestAnalysis ? "View saved report" : "Start analysis"}</button>
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
          <div className={cn("space-y-3", accessPlan === "glow" && "[&>*:not(:first-child)]:hidden")}>
            {accessPlan === "glow" && <LockedOverlay label="Glow Pass+" onUpgrade={() => setTab("settings")} />}
            {visibleIngredients.length > 0 ? visibleIngredients.map((ing) => (
              <button
                key={ing.name}
                onClick={() => setSelectedIngredient(ing)}
                className={cn("w-full text-left bg-card border rounded-xl p-4 flex items-start gap-4 transition-all hover:shadow-sm hover:border-accent/40", ing.safe ? "border-border" : "border-red-200 bg-red-50/30")}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${ing.safe ? "bg-green-100" : ing.status === "unassessed" ? "bg-muted" : "bg-red-100"}`}>
                  {ing.safe ? <Check className="w-3.5 h-3.5 text-green-700" /> : ing.status === "unassessed" ? <FlaskConical className="w-3.5 h-3.5 text-muted-foreground" /> : <X className="w-3.5 h-3.5 text-red-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ing.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${ing.safe ? "bg-green-50 text-green-700" : ing.status === "unassessed" ? "bg-muted text-muted-foreground" : "bg-red-50 text-red-700"}`} style={{ fontFamily: "'DM Mono', monospace" }}>
                      {ing.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ing.benefit}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>{ing.scope}</span>
                    {ing.maxConc !== "Not specified" && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>Max: {ing.maxConc}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
              </button>
            )) : (
              <div className="bg-card border border-dashed border-border rounded-xl p-8 text-center">
                <p className="text-sm font-medium text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No scan-derived ingredient checks yet</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Ingredient guidance appears here when your saved report includes ingredient targets or matched products with identified ingredients.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PROGRESS ── */}
      {tab === "progress" && (
        <div className="space-y-5">
          <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#008236] via-[#C86B3A] to-[#0f766e]" />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl sm:text-3xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>My Skin Progress</h2>
                  <PlanBadge required="premium" current={accessPlan} />
                </div>
                <p className="text-sm text-muted-foreground max-w-2xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  See how your skin score, concerns, and routine response change between saved analyses.
                </p>
              </div>
              <button
                onClick={() => openCustomerSkinTest()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006c2c] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Scan className="w-4 h-4" />
                Re-analyse
              </button>
            </div>
          </section>

          <div className={cn("bg-card border border-border rounded-2xl p-5 shadow-sm", accessPlan !== "premium" && "[&>*:not(:first-child)]:hidden")}>
            {accessPlan !== "premium" && <LockedOverlay label="Premium Glow" onUpgrade={() => setTab("settings")} />}
            <div className="grid lg:grid-cols-[180px_1fr] gap-5 mb-5">
              <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 flex flex-col justify-center text-center">
                <p className="text-xs text-muted-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Current skin score</p>
                <p className="text-5xl font-light text-accent" style={{ fontFamily: "'Fraunces', serif" }}>
                  {latestAnalysis && typeof latestAnalysis.score === "number" ? latestAnalysis.score : "—"}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {scoredAnalyses.length > 1 ? `${scoredAnalyses[0].score - scoredAnalyses[1].score} pts vs last scan` : "Run 2 scans to compare"}
                </p>
              </div>
              <div className="min-h-[260px] rounded-2xl border border-border bg-background p-4">
                {progressScores.length > 0 ? (
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
                ) : (
                  <div className="h-full min-h-[220px] flex items-center justify-center text-center px-4">
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Your progress chart appears after scans with saved AI scores.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
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
          </div>

          <div className="grid min-w-0 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-5">
            <section className="min-w-0 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Skin concerns</h3>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Current concerns compared with your previous saved analysis.</p>
                </div>
                <button onClick={() => setTab("routine")} className="text-xs text-accent hover:text-accent/70 font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  View routine
                </button>
              </div>
              {concernRows.length > 0 ? (
                <>
                <div className="space-y-2 sm:hidden">
                  {concernRows.map((row) => (
                    <div key={row.name} className="rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="min-w-0 text-sm font-medium text-foreground break-words">{row.name}</p>
                        <span className={cn("shrink-0 text-[10px] px-2 py-1 rounded-full", row.trend === "Higher" ? "bg-amber-50 text-amber-800" : "bg-accent/10 text-accent")}>{row.trend}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
                        <span className="text-muted-foreground">Previous: {row.previous}</span>
                        <span aria-hidden="true" className="text-muted-foreground">→</span>
                        <span className="font-semibold text-foreground">Current: {row.current}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                        <th className="py-2 pr-3 font-medium">Concern</th>
                        <th className="py-2 pr-3 font-medium">Previous</th>
                        <th className="py-2 pr-3 font-medium">Current</th>
                        <th className="py-2 font-medium">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {concernRows.map((row) => (
                        <tr key={row.name}>
                          <td className="py-3 pr-3 text-sm text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{row.name}</td>
                          <td className="py-3 pr-3 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{row.previous}</td>
                          <td className="py-3 pr-3 text-xs text-foreground font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>{row.current}</td>
                          <td className="py-3">
                            <span className={cn("text-[10px] px-2 py-1 rounded-full", row.trend === "Higher" ? "bg-amber-50 text-amber-800" : "bg-accent/10 text-accent")} style={{ fontFamily: "'DM Mono', monospace" }}>{row.trend}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              ) : (
                <div className="border border-dashed border-border rounded-xl p-6 text-center">
                  <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No concern trend yet</p>
                  <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Run an analysis with saved severity data to track concern changes.</p>
                </div>
              )}
            </section>

            <section className="min-w-0 bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Skin journey</h3>
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Recent saved analyses.</p>
                </div>
                <button onClick={() => setTab("history")} className="text-xs text-accent hover:text-accent/70 font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  View all
                </button>
              </div>
              {analysesList.length > 0 ? (
                <div className="space-y-3">
                  {analysesList.slice(0, 3).map((item, index) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center text-xs font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>{index + 1}</span>
                        {index < Math.min(analysesList.length, 3) - 1 && <span className="w-px flex-1 bg-border my-1" />}
                      </div>
                      <div className="pb-4 min-w-0">
                        <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.date}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 break-words" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.concerns?.join(", ") || "Saved skin analysis"}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>Score {typeof item.score === "number" ? `${item.score}/100` : "not scored"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-xl p-6 text-center">
                  <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No journey yet</p>
                  <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Your skin journey begins after your first saved analysis.</p>
                </div>
              )}
              <div className="mt-4 grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                <div className="min-w-0 bg-muted/40 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tracked concern</p>
                  <p className="text-sm text-foreground font-medium break-words" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{latestAnalysis?.concerns?.join(", ") || "No concern yet"}</p>
                </div>
                <div className="min-w-0 bg-muted/40 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Latest area</p>
                  <p className="text-sm text-foreground font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{latestAnalysis?.area || "No area saved yet"}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ── ROUTINE ── */}
      {tab === "routine" && (
        <div className="space-y-5">
          <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#008236] via-[#C86B3A] to-[#0f766e]" />
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl sm:text-3xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>My Skincare Routine</h2>
                  <PlanBadge required="premium" current={accessPlan} />
                </div>
                <p className="text-sm text-muted-foreground max-w-2xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {latestAnalysis ? `Built from your latest ${latestAnalysis.concerns.join(", ")} analysis and matched product data.` : "Run a skin test to generate a personalised morning and evening routine."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <button
                  onClick={() => setTab("progress")}
                  className="inline-flex items-center justify-center gap-2 border border-border bg-background hover:border-accent/30 text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <BarChart2 className="w-4 h-4" />
                  Track progress
                </button>
                <button
                  onClick={() => openCustomerSkinTest()}
                  className="inline-flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006c2c] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <Scan className="w-4 h-4" />
                  Re-analyse
                </button>
              </div>
            </div>
          </section>

          <div className={cn(accessPlan !== "premium" && "[&>*:not(:first-child)]:hidden")}>
            {accessPlan !== "premium" && <LockedOverlay label="Premium Glow" onUpgrade={() => setTab("settings")} />}
            {routineSteps.length > 0 ? (
            <div className="grid xl:grid-cols-[1fr_320px] gap-5">
              <div className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { label: "Routine steps", value: String(routineSteps.length), detail: "Generated from latest analysis" },
                    { label: "Current focus", value: latestAnalysis?.concerns?.[0] || "Not set", detail: latestAnalysis ? "Primary concern" : "Run an analysis first" },
                    { label: "Next check-in", value: nextCheckIn ? nextCheckIn.toLocaleDateString("en-GB", { month: "short", day: "numeric" }) : "After first scan", detail: "Suggested re-analysis date" },
                  ].map((item) => (
                    <div key={item.label} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                      <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.label}</p>
                      <p className="text-lg font-light text-foreground line-clamp-2" style={{ fontFamily: "'Fraunces', serif" }}>{item.value}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1" style={{ fontFamily: "'DM Mono', monospace" }}>{item.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-4">
                  {routineGroups.map((group) => (
                    <div key={group.label} className={cn("bg-card border rounded-2xl overflow-hidden shadow-sm", group.border)}>
                      <div className={cn("px-4 py-3 border-b", group.bg, group.border)}>
                        <p className={cn("text-sm font-semibold", group.color)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{group.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{group.steps.length} steps</p>
                      </div>
                      <div className="divide-y divide-border">
                        {group.steps.length > 0 ? group.steps.map((s, index) => (
                          <div key={`${group.label}-${s.step}-${index}`} className="px-4 py-4">
                            <div className="flex gap-3">
                              <span className="w-7 h-7 rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
                                {index + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>{s.label}</p>
                                <p className="text-sm text-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.product}</p>
                                {s.tip && (
                                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.tip}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="px-4 py-6 text-center">
                            <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No {group.label.toLowerCase()} steps were returned for this routine.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="space-y-4">
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                  <h3 className="text-base font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Why this routine</h3>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    This routine is generated from the care guidance in your latest saved analysis. Re-analyse later to compare visible changes.
                  </p>
                  <div className="mt-4 space-y-2">
                    {(latestAnalysis?.concerns || []).slice(0, 4).map((concern) => (
                      <div key={concern} className="flex items-center gap-2 text-xs text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <CheckCircle className="w-3.5 h-3.5 text-accent" />
                        <span>{concern}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-base font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Matched products</h3>
                    <button onClick={() => setTab("recommendations")} className="text-xs text-accent hover:text-accent/70 font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      View all
                    </button>
                  </div>
                  {matchedProducts.length > 0 ? (
                    <div className="space-y-3">
                      {matchedProducts.slice(0, 4).map((product) => (
                        <div key={product.name} className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{product.name}</p>
                            <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{product.brand} · {product.match} match</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Matched products will appear after a scan returns approved catalogue recommendations.</p>
                  )}
                </div>
              </aside>
            </div>
            ) : (
              <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
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
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Keep skin notes for up to five family members.</p>
            </div>
            {accessPlan === "premium" && <button onClick={() => setShowAddFamily((v) => !v)} disabled={familyProfiles.length >= 5} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium disabled:opacity-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <Plus className="w-3.5 h-3.5" /> Add member
            </button>}
          </div>
          <div className={cn("space-y-3", accessPlan !== "premium" && "[&>*:not(:first-child)]:hidden")}>
            {accessPlan !== "premium" && <LockedOverlay label="Premium Glow" onUpgrade={() => setTab("settings")} />}
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
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Billing & Plans</h2>
            <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Review your current access and choose a plan that suits you.</p>
          </div>

          <div className="order-4 bg-card border border-border rounded-2xl p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Profile details</h3>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Update the details used across your skin portal.</p>
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

          <div className="order-5 bg-card border border-border rounded-2xl p-5 sm:p-6">
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

          <div className="order-6 bg-card border border-border rounded-2xl p-5 sm:p-6">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Security</h3>
              <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Change your account password.</p>
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
            <div className="order-1 bg-card border border-[#008236]/25 rounded-2xl p-5 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div>
                  <span className="inline-flex text-[10px] uppercase tracking-wider font-bold text-[#008236] bg-[#008236]/10 border border-[#008236]/20 px-2.5 py-1 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>
                    Current plan
                  </span>
                  <h3 className="text-2xl font-light text-foreground mt-3" style={{ fontFamily: "'Fraunces', serif" }}>3-day free trial</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Full dashboard access is active during your trial. When it ends, advanced tools require a paid plan.
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

          {trialExpired && plan === "none" && (
            <div className="order-1 flex items-start gap-3 rounded-lg border border-[#DCE8DE] bg-[#F4F9F5] p-4 text-sm text-[#31563B]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{paidAccessExpired ? "Your paid access has ended." : "Your 3-day trial has ended."} Your saved analyses remain available. Renew a plan below to start new analyses.</p>
            </div>
          )}

          <div className="order-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: "starter" as const,
                name: "Glow Pass",
                price: "₦1,500",
                period: "month",
                desc: "Essential skin reports and limited analysis access.",
                features: ["Limited skin analyses", "Top available product matches", "Basic skin report", "Ingredient safety checks", "Shareable report summary"],
                cta: plan === "starter" ? "Current plan" : "Subscribe to Glow Pass",
                planKey: "starter" as const,
                active: plan === "starter",
                disabled: false,
              },
              {
                id: "glowplus" as const,
                name: "Glow Pass+",
                price: "₦3,500",
                period: "month",
                desc: "Unlimited analyses, full product matches and complete skin history.",
                features: ["Unlimited skin analyses", "Full product recommendation list", "Detailed skin health report", "Save and track skin history", "Personalised ingredient glossary", "Priority product matching"],
                cta: trialAccessActive ? "Keep access after trial" : (plan === "glowplus" ? "Current plan" : "Upgrade to Glow Pass+"),
                planKey: "basic" as const,
                active: plan === "glowplus"
              },
              {
                id: "premium" as const,
                name: "Premium Glow",
                price: "₦7,000",
                period: "month",
                desc: "Complete features including Anovra Care Guide, family profiles, progress reports, and routines.",
                features: ["Everything in Glow Pass+", "Monthly progress reports & trend scores", "Anovra Care Guide for report, ingredient, routine, and product questions", "Verified partner product offers", "Family skin profiles (up to 5 members)", "Skincare routine builder"],
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
          <div className="order-7"><AccountDeletionSection kind="customer" setView={setView} /></div>
        </div>
      )}
          </main>
        </div>
          </>
      </div>

      {/* Floating Care Guide chat (Premium) */}
      {accessPlan === "premium" && (
        <div className="fixed bottom-6 right-6 z-50">
          {chatOpen && (
            <div className="w-[min(24rem,calc(100vw-2rem))] bg-card border border-border rounded-2xl shadow-xl overflow-hidden mb-3">
              <div className="bg-foreground px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Anovra Care Guide</p>
                  <p className="text-xs text-white/50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Report, ingredient, routine & product support</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-white/40 hover:text-white/70 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="px-4 pt-3 pb-1 border-b border-border/50">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Helpful prompts</p>
                <div className="flex gap-1.5 overflow-x-auto pb-2">
                  {[
                    "Explain my latest report",
                    "What do these skin terms mean?",
                    "Which match should I start with?",
                    "Build a simple AM/PM routine",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setChatMsg(prompt)}
                      className="shrink-0 px-2.5 py-1.5 rounded-full bg-muted text-[11px] text-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
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
                  placeholder="Ask about a report, term, ingredient or product..."
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

      {shareFallback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation" onClick={() => setShareFallback(null)}>
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="share-summary-title" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div><h3 id="share-summary-title" className="text-lg font-semibold text-foreground">Share your skin summary</h3><p className="mt-1 text-sm text-muted-foreground">Automatic sharing is unavailable here. Select the text below to copy it yourself. Only share it with someone you trust.</p></div>
              <button onClick={() => setShareFallback(null)} aria-label="Close share summary" className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <textarea ref={shareTextRef} readOnly value={shareFallback} onFocus={(event) => event.currentTarget.select()} className="mt-4 h-40 w-full resize-none rounded-md border border-border bg-background p-3 text-sm text-foreground" />
            <button onClick={() => shareTextRef.current?.select()} className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white">Select text</button>
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
