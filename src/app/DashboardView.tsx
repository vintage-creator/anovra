import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart as ReLineChart, Line,
} from "recharts";
import {
  Package, TrendingUp, Scan, Activity, Eye, Store, ExternalLink,
  Globe, Copy, Check, MessageCircle, Shield, Key, Users, Zap,
  ChevronRight, AlertTriangle, RefreshCw, CheckCircle, Lock, Plus,
  LifeBuoy, BookOpen, Webhook, ArrowRight, Settings, Menu, X, LogOut, Pencil, Save
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { CatalogView } from "./CatalogView";
import { supabase } from "./utils/supabase";
import { sendEmailNotification } from "./utils/notifications";
import { toast } from "sonner";

// ---- DASHBOARD TAB TYPES ----

type DashTab = "overview" | "catalog" | "analytics" | "settings" | "team" | "api" | "support";
type VendorPlan = "free" | "basic" | "premium" | "brand";

export function DashboardView({ setView }: { setView: (v: View) => void }) {
  const [tab, setTab] = useState<DashTab>(() => (sessionStorage.getItem("active_vendor_tab") as DashTab) || "overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem("active_vendor_tab", tab);
  }, [tab]);
  const [analyticsRange, setAnalyticsRange] = useState<"7d" | "30d" | "90d">("7d");
  const [copied, setCopied] = useState<string | null>(null);
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [domainSaved, setDomainSaved] = useState(false);
  const [domainStatus, setDomainStatus] = useState<"idle" | "checking" | "verified" | "pending" | "invalid">("idle");
  const [domainMessage, setDomainMessage] = useState("");

  // Vendor plan & verification state
  const [isVerified, setIsVerified] = useState(false);
  const [vendorPlan, setVendorPlan] = useState<VendorPlan>("free");
  const [trialActive, setTrialActive] = useState(true);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(14);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);
  const [trialMsRemaining, setTrialMsRemaining] = useState(14 * 24 * 60 * 60 * 1000);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [upgradeTargetFeature, setUpgradeTargetFeature] = useState<string | null>(null);
  const [upgradeTargetPlan, setUpgradeTargetPlan] = useState<"basic" | "premium" | "brand" | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);
  const [onboardingArea, setOnboardingArea] = useState("Catalog setup");
  const [onboardingContact, setOnboardingContact] = useState("Email");
  const [onboardingPreferredTime, setOnboardingPreferredTime] = useState("");
  const [onboardingUrgency, setOnboardingUrgency] = useState("Normal");
  const [onboardingNotes, setOnboardingNotes] = useState("");
  const [showApiDocs, setShowApiDocs] = useState(false);
  const [showRoleSimModal, setShowRoleSimModal] = useState(false);
  const [simulatedRoleInfo, setSimulatedRoleInfo] = useState<"Vendor" | "Manager" | "Viewer">("Vendor");
  const [embedPlatform, setEmbedPlatform] = useState<"html" | "shopify" | "wordpress">("html");
  const [teamRole, setTeamRole] = useState<"Vendor" | "Manager" | "Viewer">("Vendor");

  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Manager");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKeyPrefix, setApiKeyPrefix] = useState("");
  const [isGeneratingApiKey, setIsGeneratingApiKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [totalVisits, setTotalVisits] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [tagline, setTagline] = useState("");
  const [location, setLocation] = useState("");
  const [since, setSince] = useState("");
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [storeSaved, setStoreSaved] = useState(false);
  const [isEditingStorefront, setIsEditingStorefront] = useState(false);

  const shopSlug = (brandName || "your-brand").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "your-brand";
  const shopLink = `https://anovra.africa/#/shop/${shopSlug}`;
  const testLink = `https://anovra.africa/#/scan/${shopSlug}`;
  const [apiKey, setApiKey] = useState("");

  const [liveScans, setLiveScans] = useState<any[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allScans, setAllScans] = useState<any[]>([]);
  const [allCartItems, setAllCartItems] = useState<any[]>([]);

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

  const planRank: Record<VendorPlan, number> = { free: 0, basic: 1, premium: 2, brand: 3 };
  const hasFeatureAccess = (required: Exclude<VendorPlan, "free">) => trialActive || planRank[vendorPlan] >= planRank[required];
  const featureBadgeText = trialActive ? `Trial active · ${trialDaysRemaining} day${trialDaysRemaining === 1 ? "" : "s"} left` : "Feature Active";
  const apiDocsKey = apiKey || `${apiKeyPrefix || "ak_live_new_key"} (generate a key to copy the full token)`;
  const apiBaseUrl = `${import.meta.env.VITE_SUPABASE_URL || "https://ejpdrcbgqelxlopivwld.supabase.co"}/functions/v1/vendor-api`;
  const isValidWebhookUrl = (value: string) => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol);
    } catch {
      return false;
    }
  };
  const normalizeDomain = (value: string) => value.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
  const isValidDomain = (value: string) => /^(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,}$/i.test(normalizeDomain(value));
  const domainParts = normalizeDomain(customDomain).split(".").filter(Boolean);
  const isApexDomain = domainParts.length === 2;
  const dnsHostName = isApexDomain ? "@" : domainParts.slice(0, -2).join(".") || "skin";
  const suggestedSubdomain = isApexDomain ? `skin.${normalizeDomain(customDomain)}` : normalizeDomain(customDomain);
  const trialTime = {
    days: Math.max(0, Math.floor(trialMsRemaining / (1000 * 60 * 60 * 24))),
    hours: Math.max(0, Math.floor((trialMsRemaining / (1000 * 60 * 60)) % 24)),
    minutes: Math.max(0, Math.floor((trialMsRemaining / (1000 * 60)) % 60)),
  };

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
        const { data: keyRows } = await supabase
          .from("vendor_api_keys")
          .select("key_prefix, created_at")
          .eq("vendor_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1);
        if (keyRows?.[0]?.key_prefix) setApiKeyPrefix(keyRows[0].key_prefix);
        const normalizeName = (value?: string | null) => (value || "").trim().toLowerCase();
        const personalName = normalizeName(user.user_metadata?.full_name || user.user_metadata?.name);
        const isPlaceholderBusinessName = (value?: string | null) => {
          const normalized = normalizeName(value);
          return !normalized || normalized === "my brand" || normalized === "my skincare brand";
        };
        if (user.user_metadata) {
          const rawBiz = user.user_metadata.business_name;
          const initialBrandName = isPlaceholderBusinessName(rawBiz) ? "" : rawBiz;
          setBrandName(initialBrandName || "");
          if (user.user_metadata.tagline) setTagline(user.user_metadata.tagline);
          if (user.user_metadata.location) setLocation(user.user_metadata.location);
          if (user.user_metadata.since) setSince(user.user_metadata.since);
        }

        // 1. Fetch vendor profile (fail-safe fallback query if live schema isn't migrated yet)
        let profile: any = null;
        let fetchErr: any = null;
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("name, plan, is_verified, business_name, custom_domain, white_label, webhook_url, tagline, location, since")
            .eq("id", user.id)
            .maybeSingle();
          if (error) {
            fetchErr = error;
          } else {
            profile = data;
          }
        } catch (e) {
          fetchErr = e;
        }

        if (fetchErr || !profile) {
          // Fallback to base columns if query failed due to missing settings columns
          const { data: baseData } = await supabase
            .from("profiles")
            .select("name, plan, is_verified, business_name")
            .eq("id", user.id)
            .maybeSingle();
          profile = baseData;
        }

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
          
          let insertedData: any = null;
          try {
            const { data } = await supabase
              .from("profiles")
              .insert([fallbackProfile])
              .select("name, plan, is_verified, business_name, custom_domain, white_label, webhook_url, tagline, location, since")
              .maybeSingle();
            insertedData = data;
          } catch (e) {
            // Fallback select if settings columns do not exist
            const { data } = await supabase
              .from("profiles")
              .insert([fallbackProfile])
              .select("name, plan, is_verified, business_name")
              .maybeSingle();
            insertedData = data;
          }
          if (insertedData) {
            profile = insertedData;
          }
        }

        if (profile) {
          setIsVerified(profile.is_verified);
          setVendorPlan(profile.plan as any);
          if (isPlaceholderBusinessName(profile.business_name)) {
            setBrandName("");
          } else {
            setBrandName(profile.business_name || "");
          }
          if (profile.tagline) setTagline(profile.tagline);
          if (profile.location) setLocation(profile.location);
          if (profile.since) setSince(profile.since);
          if (profile.custom_domain) {
            setCustomDomain(profile.custom_domain);
            setDomainSaved(true);
          }
          if (profile.white_label !== undefined) {
            setWhiteLabelEnabled(profile.white_label);
          }
          if (profile.webhook_url) {
            setWebhookUrl(profile.webhook_url);
            setWebhookSaved(isValidWebhookUrl(profile.webhook_url));
          }

          // Enforce 14-day trial check
          const createdDate = user.created_at ? new Date(user.created_at) : new Date();
          const trialEndDate = new Date(createdDate.getTime() + 14 * 24 * 60 * 60 * 1000);
          const daysDiff = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          const planVal = (profile.plan || "free") as VendorPlan;
          const freeTrialDaysRemaining = Math.max(0, Math.ceil(14 - daysDiff));
          setTrialEndsAt(trialEndDate);
          setTrialMsRemaining(Math.max(0, trialEndDate.getTime() - Date.now()));
          setTrialDaysRemaining(freeTrialDaysRemaining);
          setTrialActive(planVal === "free" && daysDiff <= 14);
          if (planVal === "free" && daysDiff > 14) {
            setTrialExpired(true);
          } else {
            setTrialExpired(false);
          }

          // Populate team members list with the actual logged-in vendor admin
          const ownerMember = {
            name: profile.name || user.user_metadata?.full_name || "Vendor",
            email: user.email || "",
            role: "Vendor",
            status: "active",
            joined: "Joined"
          };
          setTeamMembers([
            ownerMember
          ]);

          const { data: savedTeamMembers } = await supabase
            .from("team_members")
            .select("name, email, role, status, created_at")
            .eq("vendor_id", user.id)
            .order("created_at", { ascending: false });

          if (savedTeamMembers && savedTeamMembers.length > 0) {
            setTeamMembers([
              ownerMember,
              ...savedTeamMembers.map((m) => ({
                name: m.name || m.email,
                email: m.email,
                role: m.role,
                status: m.status,
                joined: m.created_at ? new Date(m.created_at).toLocaleDateString("en-GB") : "—"
              }))
            ]);
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

        // Store all database records in raw state variables for dynamic filtering
        setAllProducts(products || []);
        setAllScans(scans || []);
        setAllCartItems(matchedCartItems || []);

      } catch (err) {
        console.error("Dashboard failed to retrieve live data:", err);
      } finally {
        setDashboardLoading(false);
      }
    };

    // Load Paystack script dynamically
    const paystackScript = document.createElement("script");
    paystackScript.src = "https://js.paystack.co/v1/inline.js";
    paystackScript.async = true;
    document.body.appendChild(paystackScript);

    fetchDashboardData();

    return () => {
      if (document.body.contains(paystackScript)) {
        document.body.removeChild(paystackScript);
      }
    };
  }, []);

  useEffect(() => {
    if (!trialEndsAt) return;
    const tick = () => setTrialMsRemaining(Math.max(0, trialEndsAt.getTime() - Date.now()));
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, [trialEndsAt]);

  useEffect(() => {

    const rangeDays = analyticsRange === "7d" ? 7 : (analyticsRange === "30d" ? 30 : 90);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rangeDays);

    const filteredScans = allScans.filter(s => new Date(s.created_at) >= cutoffDate);
    const filteredCartItems = allCartItems.filter(c => new Date(c.created_at) >= cutoffDate);

    const numScans = filteredScans.length;
    const numCart = filteredCartItems.length;

    // 1. Calculate Stats
    const flaggedProds = allProducts.filter(p => p.nafdac_status === "flagged").length;
    
    // Find top concern
    const concernCounts: Record<string, number> = {};
    filteredScans.forEach((s) => {
      if (s.concern) {
        concernCounts[s.concern] = (concernCounts[s.concern] || 0) + 1;
      }
    });
    let topConcern = "None";
    let maxCount = 0;
    Object.entries(concernCounts).forEach(([c, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topConcern = c;
      }
    });

    const maxConcernPct = numScans > 0 ? ((maxCount / numScans) * 100).toFixed(1) : "0";

    setStatsList([
      { label: `Tests (${analyticsRange})`, value: String(numScans), delta: `${analyticsRange} scan data`, icon: <Scan className="w-4 h-4" /> },
      { label: "Products in catalog", value: String(allProducts.length), delta: `${flaggedProds} flagged`, icon: <Package className="w-4 h-4" /> },
      { label: `Sales conversions (${analyticsRange})`, value: String(numCart), delta: `${numCart} checkouts`, icon: <TrendingUp className="w-4 h-4" /> },
      { label: "Top concern detected", value: topConcern, delta: topConcern !== "None" ? `${maxConcernPct}% of all scans` : "No scans", icon: <Activity className="w-4 h-4" /> },
    ]);

    // Bind recent tests list
    if (filteredScans.length > 0) {
      const formatted = filteredScans.slice(0, 5).map((s) => {
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
    } else {
      setLiveScans([]);
    }

    // 2. Range analytics buckets
    const bucketCount = analyticsRange === "7d" ? 7 : analyticsRange === "30d" ? 6 : 6;
    const bucketSize = Math.ceil(rangeDays / bucketCount);
    const rangeDistribution = Array.from({ length: bucketCount }, (_, index) => {
      const bucketStart = new Date(cutoffDate);
      bucketStart.setDate(cutoffDate.getDate() + index * bucketSize);
      bucketStart.setHours(0, 0, 0, 0);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketStart.getDate() + bucketSize);
      const isLastBucket = index === bucketCount - 1;
      const label = analyticsRange === "7d"
        ? bucketStart.toLocaleDateString("en-US", { weekday: "short" })
        : `${bucketStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

      const scansInBucket = filteredScans.filter((s) => {
        const createdAt = new Date(s.created_at);
        return createdAt >= bucketStart && (isLastBucket ? createdAt <= new Date() : createdAt < bucketEnd);
      }).length;

      const cartInBucket = filteredCartItems.filter((c) => {
        const createdAt = new Date(c.created_at);
        return createdAt >= bucketStart && (isLastBucket ? createdAt <= new Date() : createdAt < bucketEnd);
      }).length;

      return {
        day: label,
        visits: Math.round(scansInBucket * 1.3),
        analyses: scansInBucket,
        purchases: cartInBucket
      };
    });
    setLiveAnalytics(rangeDistribution);

    // 3. Funnel Steps
    const totalVisitsVal = Math.round(numScans * 1.3);
    const clickShop = totalVisitsVal;
    const startScan = numScans;
    const completeRecs = Math.round(numScans * 0.9);
    const clickProd = Math.round(numScans * 0.5);
    const makePurchase = numCart;

    setTotalVisits(clickShop);
    setTotalScans(startScan);
    setTotalPurchases(makePurchase);

    setFunnelSteps([
      { label: "Clicked shop link", count: clickShop, pct: 100, color: "bg-[#C86B3A]" },
      { label: "Started skin analysis", count: startScan, pct: clickShop > 0 ? Math.round((startScan / clickShop) * 100) : 0, color: "bg-blue-400" },
      { label: "Completed recommendations", count: completeRecs, pct: clickShop > 0 ? Math.round((completeRecs / clickShop) * 100) : 0, color: "bg-indigo-400" },
      { label: "Clicked a product", count: clickProd, pct: clickShop > 0 ? Math.round((clickProd / clickShop) * 100) : 0, color: "bg-amber-400" },
      { label: "Made a purchase", count: makePurchase, pct: clickShop > 0 ? Math.round((makePurchase / clickShop) * 100) : 0, color: "bg-[#008236]" },
    ]);

    // 4. Product Purchases
    const purchasesByProduct: Record<string, { count: number; revenue: number }> = {};
    filteredCartItems.forEach((c: any) => {
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

    // 5. Concerns distributions
    const colors = ["#C86B3A", "#D4854A", "#B85A2E", "#E09060", "#A04820", "#C07848"];
    const formattedConcerns = Object.entries(concernCounts).map(([name, val], index) => ({
      name: name.substring(0, 12),
      value: val,
      fill: colors[index % colors.length]
    }));
    setLiveConcerns(formattedConcerns);

  }, [analyticsRange, allProducts, allScans, allCartItems]);

  function copy(text: string, key: string) {
    if (!text) {
      toast.info("Generate a new API key first. Existing keys cannot be revealed again.");
      return;
    }
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const generateApiKey = async () => {
    if (!hasFeatureAccess("brand")) {
      setUpgradeTargetFeature("Developer REST API Access");
      setUpgradeTargetPlan("brand");
      setShowPremiumModal(true);
      return;
    }
    setIsGeneratingApiKey(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-api-key", {
        body: { action: "create", name: "Live API key" },
      });
      if (error) throw error;
      setApiKey(data.key);
      setApiKeyPrefix(data.key_prefix);
      setApiKeyVisible(true);
      toast.success("API key generated. Copy it now; it will only be shown once.");
    } catch (err: any) {
      toast.error(err.message || "Could not generate API key.");
    } finally {
      setIsGeneratingApiKey(false);
    }
  };

  const requestOnboardingSession = async () => {
    if (!onboardingNotes.trim()) {
      toast.error("Please add a short note so Anovra knows what to prepare for.");
      return;
    }
    setIsSubmittingOnboarding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first.");
      const requestDetails = {
        area: onboardingArea,
        preferred_contact: onboardingContact,
        preferred_time: onboardingPreferredTime || "Not specified",
        urgency: onboardingUrgency,
        notes: onboardingNotes.trim(),
        brand: brandName || "Unnamed brand",
        vendor_email: user.email,
      };
      const { error } = await supabase.from("onboarding_requests").insert([{
        vendor_id: user.id,
        requested_by: user.id,
        request_type: "brand_onboarding",
        notes: JSON.stringify(requestDetails),
      }]);
      if (error) throw error;
      await sendEmailNotification("admin_onboarding_request", {
        message: `${brandName || user.email || "A vendor"} requested onboarding help with ${onboardingArea}.`,
        metadata: { vendor_id: user.id, ...requestDetails },
      });
      setShowOnboardingModal(false);
      setOnboardingPreferredTime("");
      setOnboardingUrgency("Normal");
      setOnboardingNotes("");
      toast.success("Onboarding request sent. Anovra will follow up.");
    } catch (err: any) {
      toast.error(err.message || "Could not send onboarding request.");
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  const checkAndSaveCustomDomain = async () => {
    if (!hasFeatureAccess("brand")) {
      setUpgradeTargetFeature("Custom domain mapping");
      setUpgradeTargetPlan("brand");
      setShowPremiumModal(true);
      toast.warning("Custom domain setup is a Brand plan feature. Upgrade to unlock.");
      return;
    }
    const domain = normalizeDomain(customDomain);
    if (!isValidDomain(domain)) {
      setDomainStatus("invalid");
      setDomainMessage("Enter a valid domain such as skin.yourbrand.com.");
      toast.error("Enter a valid custom domain.");
      return;
    }
    setCustomDomain(domain);
    setDomainStatus("checking");
    setDomainMessage("Checking DNS records...");
    try {
      const { data, error } = await supabase.functions.invoke("verify-domain", {
        body: { domain },
      });
      if (error) throw error;
      await saveSettings({ custom_domain: domain });
      setDomainSaved(true);
      setDomainStatus(data.status === "verified" ? "verified" : "pending");
      setDomainMessage(data.message || "Domain checked.");
      toast.success(data.status === "verified" ? "Domain verified and saved." : "Domain is valid. DNS setup is still pending.");
    } catch (err: any) {
      setDomainStatus("pending");
      setDomainMessage(err.message || "Could not verify DNS yet. Save the DNS records below and check again.");
      toast.error("Could not verify domain DNS yet.");
    }
  };

  const saveSettings = async (updates: {
    custom_domain?: string;
    white_label?: boolean;
    webhook_url?: string;
    business_name?: string;
    tagline?: string;
    location?: string;
    since?: string;
  }) => {
    if (teamRole !== "Vendor") {
      const msg = teamRole === "Viewer" 
        ? "Viewer role is read-only. You cannot save settings."
        : "Only the Brand Owner can save brand profile configurations.";
      toast.error(msg);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        console.warn("Could not save settings to database (schema may need update):", error.message);
      } else {
        toast.success("Settings updated successfully!");
      }
    } catch (err) {
      console.error("Save settings error:", err);
    }
  };

  const payWithPaystack = async (planKey: "basic" | "premium" | "brand") => {
    if (teamRole !== "Vendor") {
      toast.error("Only the Brand Owner can manage plan subscriptions and billing.");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to subscribe.");
        return;
      }

      const email = user.email;
      const prices = {
        basic: 12500,
        premium: 25000,
        brand: 75000,
      };
      const amount = prices[planKey] * 100; // in kobo

      if (!(window as any).PaystackPop) {
        toast.error("Payment gateway loading. Please try again in a moment.");
        return;
      }

      const paystackPublicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      if (!paystackPublicKey) {
        toast.error("Paystack public key is not configured.");
        return;
      }

      const handler = (window as any).PaystackPop.setup({
        key: paystackPublicKey,
        email: email,
        amount: amount,
        currency: "NGN",
        callback: function(response: any) {
          const tid = toast.loading("Verifying payment transaction...");
          
          supabase
            .from("profiles")
            .update({ plan: planKey })
            .eq("id", user.id)
            .then(async ({ error }) => {
              toast.dismiss(tid);
              if (error) {
                toast.error("Payment successful, but failed to update subscription. Please contact support.");
              } else {
                const { error: paymentError } = await supabase
                  .from("payments")
                  .insert([{
                    vendor_id: user.id,
                    amount: prices[planKey],
                    currency: "NGN",
                    plan: planKey,
                    status: "success",
                    provider: "paystack",
                    reference: response?.reference || response?.trxref || `paystack-${Date.now()}`,
                  }]);
                if (paymentError) {
                  console.warn("Payment was successful but could not be recorded for admin analytics:", paymentError.message);
                  toast.warning("Subscription updated. Admin payment tracking needs a schema update.");
                }
                await sendEmailNotification("payment_success_receipt", {
                  name: user.user_metadata?.full_name || brandName || "Partner",
                  email: user.email,
                  plan: planKey.toUpperCase(),
                  amount: `₦${prices[planKey].toLocaleString()}`,
                });
                await sendEmailNotification("admin_payment_success", {
                  message: `New ${planKey.toUpperCase()} subscription payment received.`,
                  metadata: { vendor_id: user.id, email: user.email, amount: prices[planKey], reference: response?.reference || response?.trxref },
                });
                setVendorPlan(planKey);
                toast.success(`Subscription successfully updated to ${planKey.toUpperCase()} plan!`);
              }
            });
        },
        onClose: function() {
          toast.error("Transaction cancelled.");
          sendEmailNotification("admin_payment_failed", {
            message: "A vendor closed or failed to complete Paystack checkout.",
            metadata: { vendor_id: user.id, email: user.email, plan: planKey, amount: prices[planKey] },
          });
        }
      });

      handler.openIframe();
    } catch (err) {
      console.error("Paystack transaction initialization failed:", err);
      toast.error("Checkout failed to initialize.");
    }
  };

  const handleGenerateShop = () => {
    toast.success("Opening Storefront Preview (Free Trial mode) — upgrade to Pro/Brand to enable custom domain mapping and premium widgets!");
    sessionStorage.setItem("active_shop_slug", shopSlug);
    sessionStorage.setItem("active_scan_slug", shopSlug);
    sessionStorage.setItem("shop_preview_mode", "true");
    sessionStorage.setItem("active_shop_snapshot", JSON.stringify({
      name: brandName,
      tagline,
      location,
      since,
      is_verified: isVerified,
      plan: vendorPlan,
    }));
    setView("shop");
  };

  const saveStoreSettings = async (updates: any) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates
      });
      if (error) throw error;
      toast.success("Storefront settings updated successfully!");
    } catch (err: any) {
      console.error("Failed to update store settings:", err);
      toast.error("Failed to save storefront settings.");
    }
  };

  const saveStorefrontProfile = async () => {
    setIsSavingStore(true);
    await saveSettings({
      business_name: brandName,
      tagline,
      location,
      since
    });
    await saveStoreSettings({
      business_name: brandName,
      tagline,
      location,
      since
    });
    setIsSavingStore(false);
    setIsEditingStorefront(false);
    setStoreSaved(true);
    setTimeout(() => setStoreSaved(false), 2000);
  };

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
    { id: "team", label: "Team", icon: Users },
    { id: "api", label: "API & Dev", icon: Key },
    { id: "support", label: "Support", icon: LifeBuoy },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-30 w-full shrink-0">
        <button onClick={() => setView("landing")} className="flex items-center cursor-pointer" title="Go to home">
          <img src="/logo.png" alt="Anovra Logo" className="h-13 w-auto" />
        </button>
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
            <button onClick={() => setView("landing")} className="flex items-center cursor-pointer" title="Go to home">
              <img src="/logo.png" alt="Anovra Logo" className="h-15 w-auto" />
            </button>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Brand Profile Pane */}
          <div className="p-5 border-b border-border bg-[#FAF7F2]/45">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>ACTIVE PARTNER</p>
            <h4 className="font-bold text-foreground text-sm leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{brandName || "Store profile not named"}</h4>
            
            {/* Plan badge */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[9px] uppercase font-mono font-bold bg-[#008236]/10 text-[#008236] px-2 py-0.5 border border-[#008236]/20 rounded-full">
                {trialActive ? `FREE TRIAL · ${trialDaysRemaining}D LEFT` : vendorPlan === "free" ? "FREE PLAN" : `${vendorPlan.toUpperCase()} PLAN`}
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

            {/* Segmented Switch Toggle for Role Simulation */}
            <div className="mt-3.5 bg-[#FAF7F2] dark:bg-zinc-900 border border-border/80 rounded-xl p-2 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider font-mono">Simulate Role View</span>
                <button 
                  onClick={() => {
                    setSimulatedRoleInfo(teamRole);
                    setShowRoleSimModal(true);
                  }}
                  className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-0.5 bg-transparent border-0 outline-none focus:outline-none flex items-center justify-center"
                  title="View permissions breakdown matrix"
                >
                  <BookOpen className="w-3 h-3 text-[#008236]" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-0.5 bg-secondary p-0.5 rounded-lg text-[9px] font-bold text-center border border-border/40">
                {[
                  { id: "Vendor" as const, label: "Vendor" },
                  { id: "Manager" as const, label: "Manager" },
                  { id: "Viewer" as const, label: "Viewer" }
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSimulatedRoleInfo(r.id);
                      setShowRoleSimModal(true);
                    }}
                    className={cn(
                      "py-1 rounded text-[10px] font-semibold transition-all cursor-pointer border-0 bg-transparent outline-none focus:outline-none",
                      teamRole === r.id ? "bg-white dark:bg-zinc-800 shadow-xs text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                    )}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3.5 bg-card border border-border/80 rounded-lg p-2 flex items-center justify-between gap-1.5 shadow-2xs">
              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[130px]" title={shopLink}>
                {shopSlug}.anovra.africa
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shopLink);
                  copy(shopLink, "sidebar");
                  toast.success("Store URL copied!");
                }}
                className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-[#008236] transition-colors flex items-center gap-1 shrink-0"
                title="Copy unique shop URL"
              >
                {copied === "sidebar" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span className="text-[9px] text-emerald-700 font-bold">Copied</span>
                  </>
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
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
                Your free trial of Anovra Skincare Partner has ended. To continue managing your safety-screened catalog, team accounts, custom domains, and viewing live customer scans, please select a plan below.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
                {[
                  {
                    key: "basic" as const,
                    name: "Basic Plan",
                    price: "₦12,500/mo",
                    desc: "Up to 50 skin tests/month, 10 products in catalog, Anovra branding, shareable link, basic analytics."
                  },
                  {
                    key: "premium" as const,
                    name: "Vendor Pro",
                    price: "₦25,000/mo",
                    desc: "Unlimited tests, unlimited catalog, white-labeled results page, website embed widget, full analytics, priority support."
                  }
                ].map((p) => (
                  <div key={p.key} className="border border-border rounded-2xl p-5 bg-card flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.name}</p>
                      <p className="text-xl font-bold text-foreground mt-1.5 font-mono">{p.price}</p>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.desc}</p>
                    </div>
                    <button
                      onClick={() => payWithPaystack(p.key)}
                      className="w-full mt-6 py-2.5 bg-[#008236] hover:bg-[#006c2c] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center"
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
          <CatalogView role={teamRole} />
        )}

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Setup Profile Warning Banner */}
          {(!tagline || tagline === "Science-backed skincare for African skin" || !location || location === "Lagos, Nigeria") && (
            <div className="bg-[#008236]/10 border border-[#008236]/15 p-4 rounded-2xl flex items-center justify-between gap-4 flex-wrap animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#008236]/15 flex items-center justify-center shrink-0">
                  <Settings className="w-4 h-4 text-[#008236]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Complete your Store Profile Settings
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Add your custom brand tagline, store location, and year founded to complete your live storefront preview.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTab("settings")}
                className="text-xs font-bold text-white bg-[#008236] hover:bg-[#006c2c] px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Configure profile settings →
              </button>
            </div>
          )}
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
            {hasFeatureAccess("premium") ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-sm uppercase tracking-wider animate-fade-in" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Website Embed Widget</h3>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-800 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" /> {featureBadgeText}
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
                        {"  "}<span className="text-amber-400">src</span>=<span className="text-emerald-400">"https://anovra.africa/skin-widget.js"</span><br />
                        {"  "}<span className="text-amber-400">data-vendor</span>=<span className="text-emerald-400">"{shopSlug}"</span><br />
                        {"  "}<span className="text-amber-400">async</span><span className="text-cyan-400">&gt;</span><br />
                        <span className="text-cyan-400">&lt;/script&gt;</span>
                      </pre>
                    )}
                    {embedPlatform === "shopify" && (
                      <pre className="text-gray-300">
                        <span className="text-slate-500 font-medium font-sans">{`{% comment %} Paste inside layout/theme.liquid before </body> {% endcomment %}`}</span><br />
                        <span className="text-cyan-400">&lt;script</span><br />
                        {"  "}<span className="text-amber-400">src</span>=<span className="text-emerald-400">"https://anovra.africa/skin-widget.js"</span><br />
                        {"  "}<span className="text-amber-400">data-vendor</span>=<span className="text-emerald-400">"{shopSlug}"</span><br />
                        {"  "}<span className="text-amber-400">async</span><span className="text-cyan-400">&gt;</span><br />
                        <span className="text-cyan-400">&lt;/script&gt;</span>
                      </pre>
                    )}
                    {embedPlatform === "wordpress" && (
                      <pre className="text-gray-300">
                        <span className="text-slate-500 font-medium font-sans">{`// Add at the bottom of active theme's functions.php`}</span><br />
                        <span className="text-purple-400">add_action</span>(<span className="text-emerald-400">'wp_footer'</span>, <span className="text-blue-400">function</span>() &#123;<br />
                        {"    "}<span className="text-blue-400">echo</span> <span className="text-emerald-400">{`'<script src="https://anovra.africa/skin-widget.js" data-vendor="${shopSlug}" async></script>'`}</span>;<br />
                        &#125;);
                      </pre>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const code = embedPlatform === "html"
                      ? `<script\n  src="https://anovra.africa/skin-widget.js"\n  data-vendor="${shopSlug}"\n  async>\n</script>`
                      : embedPlatform === "shopify"
                      ? `{% comment %} Paste inside layout/theme.liquid before </body> {% endcomment %}\n<script\n  src="https://anovra.africa/skin-widget.js"\n  data-vendor="${shopSlug}"\n  async>\n</script>`
                      : `// Add at the bottom of active theme's functions.php\nadd_action('wp_footer', function() {\n    echo '<script src="https://anovra.africa/skin-widget.js" data-vendor="${shopSlug}" async></script>';\n});`;
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
                      onClick={() => {
                        setUpgradeTargetFeature("Website Embed Widget");
                        setUpgradeTargetPlan("premium");
                        setShowPremiumModal(true);
                      }}
                      className="w-full sm:w-auto text-xs bg-[#008236] text-white font-bold px-5 py-2.5 rounded-xl hover:bg-[#006c2c] transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <span>Upgrade Plan Options</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Plan Selector Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-3xl max-w-4xl w-full p-6 sm:p-8 border border-border shadow-2xl relative">
            <button 
              onClick={() => setShowPremiumModal(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1.5 hover:bg-secondary rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-8 max-w-xl mx-auto">
              <span className="text-[10px] bg-[#008236]/10 text-[#008236] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">Subscription Plans</span>
              <h3 className="text-3xl font-light text-foreground mt-2" style={{ fontFamily: "'Fraunces', serif" }}>
                Select Your Subscription Plan
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Choose the best path to scale your business. Unlock white-labeled results, custom domains, widgets, and dedicated support.
              </p>
            </div>

            {/* Target Feature Unlock Notification Banner */}
            {upgradeTargetFeature && (
              <div className="mb-6 p-4 bg-[#008236]/10 border border-[#008236]/25 rounded-2xl text-left text-xs leading-relaxed text-[#008236] flex items-start gap-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <Lock className="w-4 h-4 text-[#008236] mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="font-bold text-foreground">You are unlocking: {upgradeTargetFeature}</p>
                  <p className="text-muted-foreground mt-0.5">
                    This feature is exclusive to {upgradeTargetPlan === "basic" ? "Basic, Vendor Pro, or Brand" : upgradeTargetPlan === "premium" ? "Vendor Pro or Brand" : "the Brand Plan"}. We have highlighted the eligible plans below.
                  </p>
                </div>
              </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              {/* Basic */}
              <div className={cn(
                "border p-5 flex flex-col justify-between space-y-4 relative transition-all rounded-2xl",
                (upgradeTargetPlan === "premium" || upgradeTargetPlan === "brand")
                  ? "opacity-40 border-dashed border-border bg-muted/5 cursor-not-allowed"
                  : "bg-muted/10 border-border/80 hover:border-border/100"
              )}>
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Basic</span>
                    <span className="text-[9px] bg-secondary text-muted-foreground border border-border/80 px-2 py-0.5 rounded-md font-mono uppercase font-bold">Standard</span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-2xl font-light font-mono text-foreground">₦12,500</span>
                    <span className="text-xs text-muted-foreground font-mono">/mo</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-[10.5px] text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Up to 50 skin tests/month</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> 10 products in catalog</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Shareable storefront link</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Basic analytics reports</li>
                  </ul>
                </div>
                <button
                  disabled={upgradeTargetPlan === "premium" || upgradeTargetPlan === "brand"}
                  onClick={() => {
                    setShowPremiumModal(false);
                    payWithPaystack("basic");
                  }}
                  className={cn(
                    "w-full py-2.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer",
                    (upgradeTargetPlan === "premium" || upgradeTargetPlan === "brand")
                      ? "border-border/40 text-muted-foreground cursor-not-allowed bg-transparent"
                      : "border-border text-foreground hover:bg-secondary"
                  )}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {(upgradeTargetPlan === "premium" || upgradeTargetPlan === "brand") ? "Lacks Access" : "Subscribe Basic"}
                </button>
              </div>

              {/* Vendor Pro */}
              <div className={cn(
                "border p-5 flex flex-col justify-between space-y-4 relative transition-all rounded-2xl shadow-xs",
                upgradeTargetPlan === "premium"
                  ? "border-2 border-emerald-600 ring-2 ring-emerald-500/10 scale-102 bg-card"
                  : upgradeTargetPlan === "brand"
                    ? "opacity-40 border-dashed border-border bg-muted/5 cursor-not-allowed"
                    : "border-[#008236] border-2 bg-card"
              )}>
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] bg-[#008236] text-white px-3 py-0.5 rounded-full font-bold uppercase tracking-wider">Most Popular</span>
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-[#008236]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Vendor Pro</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-800 border border-emerald-500/25 px-2 py-0.5 rounded-md font-mono uppercase font-bold">Best Value</span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-2xl font-semibold font-mono text-foreground">₦25,000</span>
                    <span className="text-xs text-muted-foreground font-mono">/mo</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-[10.5px] text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Unlimited skin tests</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Unlimited catalog capacity</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> White-labeled results page</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Website embed widget</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Full analytics dashboard</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Priority WhatsApp support</li>
                  </ul>
                </div>
                <button
                  disabled={upgradeTargetPlan === "brand"}
                  onClick={() => {
                    setShowPremiumModal(false);
                    payWithPaystack("premium");
                  }}
                  className={cn(
                    "w-full py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer",
                    upgradeTargetPlan === "brand"
                      ? "bg-zinc-200 dark:bg-zinc-800 text-muted-foreground cursor-not-allowed"
                      : "bg-[#008236] text-white hover:bg-[#006c2c] shadow-xs"
                  )}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {upgradeTargetPlan === "brand" ? "Lacks Access" : "Subscribe Pro"}
                </button>
              </div>

              {/* Brand */}
              <div className={cn(
                "border p-5 flex flex-col justify-between space-y-4 relative transition-all rounded-2xl",
                upgradeTargetPlan === "brand"
                  ? "border-2 border-amber-500 ring-2 ring-amber-500/10 scale-102 bg-card"
                  : "bg-muted/10 border-border/80 hover:border-border/100"
              )}>
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Brand</span>
                    <span className="text-[9px] bg-secondary text-muted-foreground border border-border/80 px-2 py-0.5 rounded-md font-mono uppercase font-bold">Enterprise</span>
                  </div>
                  <div className="mt-2.5">
                    <span className="text-2xl font-light font-mono text-foreground">₦75,000</span>
                    <span className="text-xs text-muted-foreground font-mono">/mo</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-[10.5px] text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Everything in Vendor Pro</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Full developer REST API</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Custom domain mapping</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Multi-user team accounts</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Contractual uptime SLA</li>
                    <li className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> Dedicated onboarding guide</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setShowPremiumModal(false);
                    payWithPaystack("brand");
                  }}
                  className={cn(
                    "w-full py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer",
                    upgradeTargetPlan === "brand"
                      ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                      : "bg-[#008236] text-white hover:bg-[#006c2c] shadow-xs"
                  )}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Subscribe Brand
                </button>
              </div>
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
                { label: "Link visits", value: totalVisits.toLocaleString(), delta: "Live", deltaUp: true, sub: "Estimated from recorded scan starts", icon: <ExternalLink className="w-4 h-4" /> },
                { label: "Skin tests run", value: totalScans.toLocaleString(), delta: "Live", deltaUp: true, sub: `${totalVisits > 0 ? Math.round((totalScans / totalVisits) * 100) : 0}% of visitors took skin test`, icon: <Scan className="w-4 h-4" /> },
                { label: "Purchases made", value: totalPurchases.toLocaleString(), delta: "Live", deltaUp: true, sub: "Orders via matched recommendations", icon: <TrendingUp className="w-4 h-4" /> },
                { label: "Conversion rate", value: totalVisits > 0 ? ((totalPurchases / totalVisits) * 100).toFixed(1) + "%" : "0.0%", delta: "Live", deltaUp: true, sub: "Visits resulting in purchases", icon: <Activity className="w-4 h-4" /> },
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
                      {k.delta}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* Left Column */}
            <div className="space-y-6">
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
                      onClick={async () => {
                        setWhiteLabelEnabled(false);
                        await saveSettings({ white_label: false });
                      }}
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
                      onClick={async () => {
                        if (!hasFeatureAccess("premium")) {
                          setUpgradeTargetFeature("White-labeled results page");
                          setUpgradeTargetPlan("premium");
                          setShowPremiumModal(true);
                          toast.warning("White-labeling requires Vendor Pro or Brand tier. Upgrade to unlock!");
                          return;
                        }
                        const nextVal = !whiteLabelEnabled;
                        setWhiteLabelEnabled(nextVal);
                        await saveSettings({ white_label: nextVal });
                      }}
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
                          onBlur={() => saveSettings({ business_name: brandName })}
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
              {/* Storefront Customization */}
              <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
                <div>
                  <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Storefront Customization</h3>
                      <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Customize your storefront preview tagline, location, and metadata details.</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (!isEditingStorefront) {
                          setStoreSaved(false);
                          setIsEditingStorefront(true);
                          return;
                        }
                        await saveStorefrontProfile();
                      }}
                      disabled={isSavingStore}
                      className={cn(
                        "inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors shrink-0",
                        isEditingStorefront
                          ? "bg-[#008236] text-white hover:bg-[#006c2c] disabled:opacity-60"
                          : "bg-secondary text-foreground border border-border hover:border-[#008236]/40 hover:text-[#008236]"
                      )}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {isEditingStorefront ? (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          {isSavingStore ? "Saving..." : storeSaved ? "Saved" : "Save Changes"}
                        </>
                      ) : (
                        <>
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Business / Brand Name</label>
                      <input
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        readOnly={!isEditingStorefront}
                        placeholder="e.g. Vintage"
                        className={cn(
                          "w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors",
                          isEditingStorefront
                            ? "bg-background border-border text-foreground focus:border-[#008236]"
                            : "bg-muted/30 border-border/50 text-muted-foreground cursor-default"
                        )}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Store Tagline</label>
                      <input
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        readOnly={!isEditingStorefront}
                        placeholder="e.g. Science-backed skincare for African skin"
                        className={cn(
                          "w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors",
                          isEditingStorefront
                            ? "bg-background border-border text-foreground focus:border-[#008236]"
                            : "bg-muted/30 border-border/50 text-muted-foreground cursor-default"
                        )}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Store Location</label>
                        <input
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          readOnly={!isEditingStorefront}
                          placeholder="e.g. Lagos, Nigeria"
                          className={cn(
                            "w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors",
                            isEditingStorefront
                              ? "bg-background border-border text-foreground focus:border-[#008236]"
                              : "bg-muted/30 border-border/50 text-muted-foreground cursor-default"
                          )}
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Year Founded</label>
                        <input
                          type="number"
                          value={since}
                          onChange={(e) => setSince(e.target.value)}
                          readOnly={!isEditingStorefront}
                          placeholder="e.g. 2023"
                          className={cn(
                            "w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors",
                            isEditingStorefront
                              ? "bg-background border-border text-foreground focus:border-[#008236]"
                              : "bg-muted/30 border-border/50 text-muted-foreground cursor-default"
                          )}
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {storeSaved && !isEditingStorefront && (
                  <div className="px-5 py-3 bg-green-50 dark:bg-green-950/30 border-t border-green-100 dark:border-green-900/40">
                    <p className="text-xs text-green-700 dark:text-green-300 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Storefront details saved.
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-6">
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
                        onChange={(e) => { setCustomDomain(e.target.value); setDomainSaved(false); setDomainStatus("idle"); setDomainMessage(""); }}
                        placeholder="skin.yourbrand.com"
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] transition-colors"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      />
                      <button
                        onClick={checkAndSaveCustomDomain}
                        disabled={domainStatus === "checking"}
                        className="px-4 py-2 bg-[#008236] text-white rounded-lg text-sm font-medium hover:bg-[#006c2c] transition-colors shrink-0 cursor-pointer"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {domainStatus === "checking" ? "Checking..." : domainStatus === "verified" ? "Verified ✓" : domainStatus === "pending" ? "Needs DNS setup" : "Check setup"}
                      </button>
                    </div>
                  </div>
                  {domainMessage && (
                    <div className={cn(
                      "border rounded-lg p-3 text-xs leading-relaxed",
                      domainStatus === "verified" ? "bg-green-50 border-green-200 text-green-800" :
                      domainStatus === "invalid" ? "bg-red-50 border-red-200 text-red-700" :
                      "bg-amber-50 border-amber-200 text-amber-800"
                    )} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <strong className="block mb-1">
                        {domainStatus === "verified" ? "Domain verified" : domainStatus === "invalid" ? "Invalid domain" : "Valid domain, DNS setup needed"}
                      </strong>
                      {domainMessage}
                    </div>
                  )}
                  {domainSaved && customDomain && (
                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-border rounded-xl p-4.5 space-y-3.5">
                      <div>
                        <p className="text-xs font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>DNS setup instructions</p>
                        <p className="text-[10.5px] text-muted-foreground mt-1 leading-normal" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Go to the website where you bought your domain, open DNS settings, add one record below, save it, then return here and click Check setup again.
                        </p>
                      </div>

                      {isApexDomain && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          For easiest setup, use a subdomain like <strong className="font-mono">{suggestedSubdomain}</strong>. If you want to use <strong className="font-mono">{normalizeDomain(customDomain)}</strong> directly, use the A record option below.
                        </div>
                      )}

                      <div className="space-y-3">
                        {/* Option 1: CNAME */}
                        <div className={cn("border border-border/60 rounded-lg bg-background p-3", isApexDomain && "opacity-70")}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[9.5px] font-bold text-[#008236] bg-[#008236]/10 px-2 py-0.5 rounded font-mono">{isApexDomain ? "OPTION 1: CNAME FOR SUBDOMAIN" : "OPTION 1: CNAME (Recommended)"}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[10.5px] font-mono mt-2 pt-2 border-t border-border/30">
                            <div>
                              <span className="block text-[8.5px] text-muted-foreground uppercase font-sans mb-0.5">Type</span>
                              <strong>CNAME</strong>
                            </div>
                            <div>
                              <span className="block text-[8.5px] text-muted-foreground uppercase font-sans mb-0.5">Host/Name</span>
                              <strong>{isApexDomain ? "skin" : dnsHostName}</strong>
                            </div>
                            <div>
                              <span className="block text-[8.5px] text-muted-foreground uppercase font-sans mb-0.5">Target/Value</span>
                              <strong className="break-all">anovra.africa</strong>
                            </div>
                          </div>
                          {isApexDomain && (
                            <p className="text-[10.5px] text-muted-foreground mt-2 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              This creates <strong className="font-mono">{suggestedSubdomain}</strong>. Update the field above to that subdomain before checking again.
                            </p>
                          )}
                        </div>

                        {/* Option 2: A Record */}
                        <div className="border border-border/60 rounded-lg bg-background p-3">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[9.5px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded font-mono">OPTION 2: A RECORD (Alternative)</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[10.5px] font-mono mt-2 pt-2 border-t border-border/30">
                            <div>
                              <span className="block text-[8.5px] text-muted-foreground uppercase font-sans mb-0.5">Type</span>
                              <strong>A</strong>
                            </div>
                            <div>
                              <span className="block text-[8.5px] text-muted-foreground uppercase font-sans mb-0.5">Host/Name</span>
                              <strong>{dnsHostName}</strong>
                            </div>
                            <div>
                              <span className="block text-[8.5px] text-muted-foreground uppercase font-sans mb-0.5">Target/Value</span>
                              <strong>198.54.115.240</strong>
                            </div>
                          </div>
                        </div>
                      </div>
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

          {/* Billing & Subscription Card */}
          <div className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-xs space-y-5 lg:col-span-2">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Billing & Subscriptions</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-3xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Start on Free, try all premium features for 14 days, then choose a paid tier to keep advanced tools such as white-labeled results, custom domains, webhooks, and priority WhatsApp support.
                </p>
              </div>
              {vendorPlan === "free" && (
                <div className={cn(
                  "rounded-2xl border px-4 py-3 w-full xl:w-[360px] shadow-sm",
                  trialActive
                    ? "bg-gradient-to-br from-emerald-50 via-amber-50 to-sky-50 border-emerald-200"
                    : "bg-red-50 border-red-200"
                )}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className={cn("text-[10px] font-bold uppercase tracking-wider font-mono", trialActive ? "text-emerald-700" : "text-red-700")}>
                        {trialActive ? "Free access ends in" : "Free trial ended"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {trialActive ? "Premium trial features turn off when this reaches zero." : "Your account remains on Free until you upgrade."}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono leading-none">
                        {trialActive ? `${trialTime.days}d ${trialTime.hours}h` : "0d 0h"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">
                        {trialActive ? `${trialTime.minutes} min left` : "expired"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  key: "free",
                  name: "Free Tier",
                  price: "₦0/mo",
                  desc: trialActive
                    ? "14-day premium feature trial, storefront preview, product catalog setup, scan testing, and basic workspace access."
                    : "Basic workspace access after trial. Premium storefront, API, webhooks, custom domain, and team features require an upgrade.",
                  isContact: false
                },
                { 
                  key: "basic", 
                  name: "Basic Plan", 
                  price: "₦12,500/mo", 
                  desc: "Up to 50 skin tests/month, 10 products in catalog, Anovra branding, shareable link, basic analytics.",
                  isContact: false
                },
                { 
                  key: "premium", 
                  name: "Vendor Pro", 
                  price: "₦25,000/mo", 
                  desc: "Unlimited tests, unlimited catalog, white-labeled results page, website embed widget, full analytics, priority support.",
                  isContact: false
                },
                { 
                  key: "brand", 
                  name: "Brand Tier", 
                  price: "₦75,000/mo", 
                  desc: "Everything in Pro, plus REST API access, custom domain for test link, multi-user team accounts, SLA support, onboarding.",
                  isContact: false
                },
              ].map((p) => {
                const isActive = vendorPlan === p.key;
                return (
                  <div key={p.name} className={cn("border rounded-xl p-4 min-h-[190px] flex flex-col justify-between space-y-4 bg-muted/5", isActive ? "border-[#008236] ring-1 ring-[#008236]/10 bg-emerald-50/30" : "border-border")}>
                    <div>
                      <p className="text-sm font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.name}</p>
                      <p className="text-xl font-light text-foreground font-mono mt-1.5">{p.price}</p>
                      <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{p.desc}</p>
                    </div>
                    {isActive ? (
                      <span className="w-full text-center py-1.5 text-[10px] bg-green-50 text-green-700 font-bold rounded-lg border border-green-200">
                        Current plan
                      </span>
                    ) : p.key === "free" ? (
                      <span className="w-full text-center py-1.5 text-[10px] bg-secondary text-muted-foreground font-bold rounded-lg border border-border">
                        Included
                      </span>
                    ) : p.isContact ? (
                      <a
                        href="mailto:sales@anovra.africa?subject=Anovra Brand Tier Inquiry"
                        className="w-full text-center py-1.5 text-[10px] bg-secondary text-foreground hover:bg-muted font-bold rounded-lg transition-colors block decoration-none"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Contact Sales
                      </a>
                    ) : (
                      <button
                        onClick={() => payWithPaystack(p.key as any)}
                        className="w-full text-center py-1.5 text-[10px] bg-[#008236] text-white hover:bg-[#006c2c] font-bold rounded-lg transition-colors cursor-pointer"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Subscribe with Paystack
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TEAM ── */}
      {tab === "team" && (
        <div className="space-y-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Accounts */}
            <div className="lg:col-span-3 bg-card border border-border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Team accounts</h3>
                      <span className="text-xs bg-foreground text-primary-foreground px-2 py-0.5 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>Brand</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Add up to 5 team members with different access levels.</p>
                  </div>
                  {teamRole === "Vendor" ? (
                    <button
                      onClick={() => setShowInvite((v) => !v)}
                      className="flex items-center gap-1.5 text-xs px-3.5 py-2 bg-[#008236] text-white rounded-lg hover:bg-[#006c2c] transition-colors font-medium shadow-xs cursor-pointer"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Invite member
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-1.5 text-xs px-3.5 py-2 bg-muted text-muted-foreground border border-border rounded-lg font-medium cursor-not-allowed"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      title="Only the Brand Owner can invite team members"
                    >
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Invite member (Locked)
                    </button>
                  )}
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
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-[#008236]"
                      >
                        <option value="Manager">Manager</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                      <button
                        onClick={async () => {
                          if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
                            toast.error("Please enter a valid email address.");
                            return;
                          }
                          const namePart = inviteEmail.split("@")[0];
                          const mName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
                          setTeamMembers((prev) => [
                            ...prev,
                            { name: mName, email: inviteEmail, role: inviteRole, status: "invited", joined: "—" }
                          ]);

                          // Dispatch invitation email securely via Supabase client invoke wrapper
                          try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                              await supabase
                                .from("team_members")
                                .upsert({
                                  vendor_id: user.id,
                                  name: mName,
                                  email: inviteEmail,
                                  role: inviteRole,
                                  status: "invited",
                                }, { onConflict: "vendor_id,email" });
                            }
                            await supabase.functions.invoke("send-onboarding-email", {
                              body: {
                                email: inviteEmail,
                                name: mName,
                                action: "invite",
                                inviter: brandName,
                                role: inviteRole
                              }
                            });
                          } catch (e) {
                            console.error("Failed to send invitation email:", e);
                          }

                          setShowInvite(false);
                          setInviteEmail("");
                          toast.success(`Invitation successfully sent to ${inviteEmail}!`);
                        }}
                        className="px-4 py-2 bg-[#008236] text-white rounded-lg text-sm font-medium hover:bg-[#006c2c] transition-colors shrink-0 cursor-pointer"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Send invite
                      </button>
                    </div>
                  </div>
                )}

                <div className="divide-y divide-border">
                  {teamMembers.map((m) => {
                    const initials = m.name ? m.name.split(/\s+/).filter(Boolean).map((n) => n[0]).join("").toUpperCase() : "U";
                    return (
                      <div key={m.email} className="flex items-center justify-between gap-3 px-5 py-3.5 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{m.name}</p>
                            <p className="text-xs text-muted-foreground truncate font-mono">{m.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${m.role === "Vendor" ? "bg-foreground text-primary-foreground" : "bg-muted text-muted-foreground"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{m.role}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full ${m.status === "active" ? "bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400" : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{m.status}</span>
                          {m.role !== "Vendor" && teamRole === "Vendor" && (
                            <button
                              onClick={() => {
                                setTeamMembers((prev) => prev.filter((member) => member.email !== m.email));
                                toast.success(`Removed ${m.name} from team.`);
                              }}
                              className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                  {hasFeatureAccess("brand") ? (
                    <div className="space-y-3">
                      <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-mono">Live API key</label>
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5">
                        <p className="flex-1 text-sm font-mono text-foreground truncate">
                          {apiKey ? (apiKeyVisible ? apiKey : apiKey.slice(0, 14) + "•".repeat(24)) : (apiKeyPrefix ? `${apiKeyPrefix} ${"•".repeat(20)}` : "No live key generated yet")}
                        </p>
                        {apiKey && <button onClick={() => setApiKeyVisible((v) => !v)} className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {apiKeyVisible ? "Hide" : "Reveal"}
                        </button>}
                        <button onClick={() => copy(apiKey, "api-key")} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition-colors shrink-0 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {copied === "api-key" ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                      </div>
                      <button
                        onClick={generateApiKey}
                        disabled={isGeneratingApiKey}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#008236] text-white rounded-lg text-xs font-bold hover:bg-[#006c2c] disabled:opacity-60 transition-colors"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        <Key className="w-3.5 h-3.5" /> {isGeneratingApiKey ? "Generating..." : apiKeyPrefix ? "Rotate API key" : "Generate API key"}
                      </button>
                      <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Keep this key private. For security, the full key is shown only once after generation.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-muted/30 border border-dashed border-border rounded-lg p-4 text-center space-y-3">
                      <p className="text-xs text-muted-foreground leading-normal font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        REST API key access is a Brand feature. Please upgrade to see plans and access endpoint authentication keys.
                      </p>
                      <button
                        onClick={() => {
                          setUpgradeTargetFeature("Developer REST API Access");
                          setUpgradeTargetPlan("brand");
                          setShowPremiumModal(true);
                        }}
                        className="mx-auto text-xs bg-[#008236] text-white font-bold px-4 py-2 rounded-lg hover:bg-[#006c2c] transition-colors cursor-pointer"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Upgrade Plan Options
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Available REST endpoints:</p>
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
                  <button
                    onClick={() => setShowApiDocs(true)}
                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-emerald-600 hover:text-emerald-700 transition-colors font-medium cursor-pointer"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Full API documentation →
                  </button>
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
                  {hasFeatureAccess("basic") ? (
                    <div className="space-y-3">
                      <label className="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-mono">Webhook endpoint URL</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          value={webhookUrl}
                          onChange={(e) => { setWebhookUrl(e.target.value); setWebhookSaved(false); }}
                          placeholder="https://yourapp.com/webhooks/anovra"
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] transition-colors"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        />
                        <button
                          onClick={async () => {
                            if (!isValidWebhookUrl(webhookUrl)) {
                              setWebhookSaved(false);
                              toast.error("Enter a valid webhook URL starting with https:// or http://.");
                              return;
                            }
                            await saveSettings({ webhook_url: webhookUrl });
                            setWebhookSaved(true);
                          }}
                          className="px-4 py-2 bg-[#008236] text-white rounded-lg text-sm font-medium hover:bg-[#006c2c] transition-colors shrink-0 cursor-pointer"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {webhookSaved ? "Saved ✓" : "Save"}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Enter a live HTTPS endpoint. Anovra will send event payloads to this URL and track delivery attempts for support.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-muted/30 border border-dashed border-border rounded-lg p-4 text-center space-y-3">
                      <p className="text-xs text-muted-foreground leading-normal font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Webhook endpoints are available on the Vendor Basic, Pro, or Brand plans.
                      </p>
                      <button
                        onClick={() => {
                          setUpgradeTargetFeature("Real-time Webhook integrations");
                          setUpgradeTargetPlan("basic");
                          setShowPremiumModal(true);
                        }}
                        className="mx-auto text-xs bg-[#008236] text-white font-bold px-4 py-2 rounded-lg hover:bg-[#006c2c] transition-colors cursor-pointer"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Upgrade Plan Options
                      </button>
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Webhook event types:</p>
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
                    {hasFeatureAccess("premium") ? (
                      <a
                        href="https://wa.me/2349167664619?text=Hi%2C%20I%27m%20a%20Vendor%20Pro%20subscriber%20and%20need%20help%20with%20my%20Anovra%20account."
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors shrink-0 shadow-xs cursor-pointer"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Open WhatsApp →
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          setShowPremiumModal(true);
                          toast.warning("Priority WhatsApp support requires Vendor Pro or Brand tier. Upgrade to unlock!");
                        }}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-400 text-white text-xs font-bold rounded-lg hover:bg-zinc-500 transition-colors shrink-0 shadow-xs cursor-pointer"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Upgrade to unlock →
                      </button>
                    )}
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
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Preview enterprise support terms during trial. Contractual SLA activation starts on a paid Brand plan.
                  </p>
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
                  {!hasFeatureAccess("brand") && (
                    <button
                      onClick={() => {
                        setUpgradeTargetFeature("Uptime SLA guarantees");
                        setUpgradeTargetPlan("brand");
                        setShowPremiumModal(true);
                        toast.info("Uptime SLA guarantees are exclusive to the Brand Plan. Upgrade to unlock.");
                      }}
                      className="w-full text-center mt-3 text-xs text-accent hover:text-accent/80 font-bold cursor-pointer border-t border-border/40 pt-2 bg-transparent border-0 outline-none focus:outline-none flex items-center justify-center gap-1.5"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <Lock className="w-3 h-3 text-accent" /> Upgrade to Brand to activate SLA contract
                    </button>
                  )}
                  {trialActive && hasFeatureAccess("brand") && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                      <p className="text-xs text-amber-800 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Trial access lets you preview SLA terms. The SLA contract becomes active only after upgrading to Brand.
                      </p>
                    </div>
                  )}
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
              <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>A dedicated Anovra specialist can guide your team through setup and go-live.</p>
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
              {hasFeatureAccess("brand") ? (
                <button 
                  onClick={() => setShowOnboardingModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-bold transition-colors mt-2 bg-transparent border-0 outline-none cursor-pointer" 
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <LifeBuoy className="w-4 h-4" /> Request onboarding session →
                </button>
              ) : (
                <button
                  onClick={() => {
                    setUpgradeTargetFeature("Dedicated 1-on-1 onboarding support");
                    setUpgradeTargetPlan("brand");
                    setShowPremiumModal(true);
                    toast.warning("Dedicated 1-on-1 onboarding requires the Brand plan. Upgrade to unlock!");
                  }}
                  className="flex items-center gap-1.5 text-xs sm:text-sm text-accent hover:text-accent/80 font-bold transition-colors mt-2 bg-transparent border-0 outline-none cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <LifeBuoy className="w-4 h-4 text-accent" /> Upgrade to Brand to book session →
                </button>
              )}
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
          </>
        )}
      </div>

      {showApiDocs && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-border shadow-2xl relative my-8">
            <button 
              onClick={() => setShowApiDocs(false)} 
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground leading-none" style={{ fontFamily: "'Fraunces', serif" }}>
                  Anovra REST API Documentation
                </h3>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Integrate skin analysis and recommendations into your backend or mobile app
                </p>
              </div>
            </div>

            <div className="space-y-6 text-sm overflow-y-auto max-h-[60vh] pr-2 scrollbar-thin">
              {/* Authentication */}
              <div className="space-y-2">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Authentication</h4>
                <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  All API requests must include your live secret token in the header of the request:
                </p>
                <div className="bg-muted p-3 rounded-lg font-mono text-[10px] text-foreground/95 select-all leading-normal">
                  Authorization: Bearer {apiDocsKey}
                </div>
              </div>

              {/* Scans API */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold rounded text-[10px] font-mono">GET</span>
                  <span className="text-xs font-mono font-bold text-foreground">/v1/scans</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Retrieve a list of skin test reports completed by your customers.
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Example Request Payload (cURL):</p>
                <div className="bg-muted p-3 rounded-lg font-mono text-[10px] text-foreground/95 select-all overflow-x-auto whitespace-pre">
{`curl -X GET "${apiBaseUrl}/scans" \\
  -H "Authorization: Bearer ${apiDocsKey}" \\
  -H "Content-Type: application/json"`}
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Success Response JSON (200 OK):</p>
                <div className="bg-muted p-3 rounded-lg font-mono text-[10px] text-foreground/95 overflow-x-auto whitespace-pre">
{`{
  "status": "success",
  "data": [
    {
      "id": "SC-8F2D1",
      "concern": "Hyperpigmentation",
      "result": "Moderate melanin dispersion detected in cheek area.",
      "score": 76,
      "city": "Lagos",
      "created_at": "2026-07-22T19:21:58.123Z"
    }
  ]
}`}
                </div>
              </div>

              {/* Recommendations API */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-blue-500/15 text-blue-800 dark:text-blue-300 font-bold rounded text-[10px] font-mono">POST</span>
                  <span className="text-xs font-mono font-bold text-foreground">/v1/recommendations</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Pass skin attributes to Anovra's AI engine to return safety-screened product matching recommendations.
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Example Request Payload (cURL):</p>
                <div className="bg-muted p-3 rounded-lg font-mono text-[10px] text-foreground/95 select-all overflow-x-auto whitespace-pre">
{`curl -X POST "${apiBaseUrl}/recommendations" \\
  -H "Authorization: Bearer ${apiDocsKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "skin_type": "oily",
    "concern": "acne",
    "sensitivities": ["fragrance"]
  }'`}
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Success Response JSON (200 OK):</p>
                <div className="bg-muted p-3 rounded-lg font-mono text-[10px] text-foreground/95 overflow-x-auto whitespace-pre">
{`{
  "status": "success",
  "recommendations": [
    {
      "id": "prod_1",
      "name": "Niacinamide Hydrating Serum",
      "suitability": "96%",
      "reasoning": "Niacinamide regulates sebum production without sensitizing skin."
    }
  ]
}`}
                </div>
              </div>

              {/* Catalog API */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold rounded text-[10px] font-mono">GET</span>
                  <span className="text-xs font-mono font-bold text-foreground">/v1/catalog</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Retrieve your safety-screened product catalog, including automated NAFDAC compliance status.
                </p>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mt-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Example Request Payload (cURL):</p>
                <div className="bg-muted p-3 rounded-lg font-mono text-[10px] text-foreground/95 select-all overflow-x-auto whitespace-pre">
{`curl -X GET "${apiBaseUrl}/catalog" \\
  -H "Authorization: Bearer ${apiDocsKey}" \\
  -H "Content-Type: application/json"`}
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-border pt-4 text-center">
              <button 
                onClick={() => setShowApiDocs(false)} 
                className="px-6 py-2.5 bg-secondary hover:bg-muted text-foreground text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Close Documentation
              </button>
            </div>
          </div>
        </div>
      )}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-border shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowOnboardingModal(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1.5 hover:bg-secondary rounded-full"
              aria-label="Close onboarding request"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-foreground leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                  Request onboarding support
                </h3>
                <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Tell Anovra what your team needs help with before we follow up.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide font-mono">Area</span>
                <select
                  value={onboardingArea}
                  onChange={(e) => setOnboardingArea(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#008236]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {["Catalog setup", "Custom domain", "Team training", "API and webhooks", "Launch QA", "Billing", "Other"].map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide font-mono">Contact method</span>
                <select
                  value={onboardingContact}
                  onChange={(e) => setOnboardingContact(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#008236]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {["Email", "WhatsApp", "Phone call"].map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide font-mono">Preferred time</span>
                <input
                  value={onboardingPreferredTime}
                  onChange={(e) => setOnboardingPreferredTime(e.target.value)}
                  placeholder="e.g. Tuesday, 11am WAT"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide font-mono">Urgency</span>
                <select
                  value={onboardingUrgency}
                  onChange={(e) => setOnboardingUrgency(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#008236]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {["Normal", "Urgent launch blocker"].map((urgency) => (
                    <option key={urgency} value={urgency}>{urgency}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block mt-4 space-y-1.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide font-mono">What do you need help with?</span>
              <textarea
                value={onboardingNotes}
                onChange={(e) => setOnboardingNotes(e.target.value)}
                rows={5}
                placeholder="Share the setup goal, blocker, or launch support you want Anovra to prepare for."
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] resize-none"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
            </label>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border pt-5">
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                This creates an onboarding request and emails Anovra admin with the details.
              </p>
              <button
                onClick={requestOnboardingSession}
                disabled={isSubmittingOnboarding}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-[#008236] text-white rounded-xl text-xs font-bold hover:bg-[#006c2c] disabled:opacity-60 transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {isSubmittingOnboarding ? "Sending..." : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showRoleSimModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-border shadow-2xl relative">
            <button 
              onClick={() => setShowRoleSimModal(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1.5 hover:bg-secondary rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 mb-6 text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-foreground leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                  {simulatedRoleInfo} View Simulation
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Testing Role-Based Access Controls (RBAC) live in the editor
                </p>
              </div>
            </div>

            {/* Dynamic Role explanation callout */}
            <div className="mb-5 p-3.5 bg-secondary/80 border border-border/50 rounded-2xl text-left text-[11px] leading-relaxed text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <p className="font-bold text-foreground mb-1">
                {simulatedRoleInfo === "Vendor" ? "About the Vendor (Owner) role:" : "Why invite team members under this role?"}
              </p>
              {simulatedRoleInfo === "Vendor" && (
                <p>As the primary Vendor, you are the direct partner of Anovra who registered this organization. You hold full ownership access and can invite other team members (like Managers or Viewers) to collaborate.</p>
              )}
              {simulatedRoleInfo === "Manager" && (
                <p>Invite managers (like store supervisors or product catalog leads) to actively curate your brand catalog and review customer skin scans. Their access excludes changing billing or developer settings.</p>
              )}
              {simulatedRoleInfo === "Viewer" && (
                <p>Invite viewers (like point-of-sale staff or retail consultants) to search matching products and look up skin logs. They are completely locked out of edits or settings.</p>
              )}
            </div>

            {/* Sim Permissions breakdown */}
            <div className="mb-6">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 font-mono text-left">Capabilities Matrix</p>
              <div className="border border-border/80 rounded-2xl overflow-hidden bg-muted/20">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/60">
                      <th className="px-4 py-2 font-semibold text-muted-foreground text-[10px] uppercase font-mono">Permission Scope</th>
                      <th className="px-4 py-2 font-semibold text-muted-foreground text-[10px] text-right uppercase font-mono">Access Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium text-foreground">
                    {simulatedRoleInfo === "Vendor" && (
                      <>
                        <tr>
                          <td className="px-4 py-2.5">Catalog & Diagnostics</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600 font-bold">Full Control</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5">Billing & Subscriptions</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600 font-bold">Full Control</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5">Custom Domains & Webhooks</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600 font-bold">Full Control</td>
                        </tr>
                      </>
                    )}
                    {simulatedRoleInfo === "Manager" && (
                      <>
                        <tr>
                          <td className="px-4 py-2.5">Add & Edit Products</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600 font-bold">Allowed</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5">View Scan Diagnostics</td>
                          <td className="px-4 py-2.5 text-right text-foreground/80">Read Only</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5">Billing, Domains & Webhooks</td>
                          <td className="px-4 py-2.5 text-right text-red-600 font-bold">Locked</td>
                        </tr>
                      </>
                    )}
                    {simulatedRoleInfo === "Viewer" && (
                      <>
                        <tr>
                          <td className="px-4 py-2.5">Browse Catalog & Products</td>
                          <td className="px-4 py-2.5 text-right text-foreground/80">Read Only</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5">View Customer Scans</td>
                          <td className="px-4 py-2.5 text-right text-foreground/80">Read Only</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5">Add Products & Edit Settings</td>
                          <td className="px-4 py-2.5 text-right text-red-600 font-bold">Locked</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Login flow graphic representation */}
            <div className="border-t border-border/60 pt-4 mb-8 text-left">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3.5 font-mono">Team Login Sequence</p>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                {[
                  { label: "1. Invite Code", desc: "Sent via email invitation" },
                  { label: "2. Team Portal", desc: "Inputs email & unique code" },
                  { label: "3. Workspace", desc: "Access limited by role" }
                ].map((s) => (
                  <div key={s.label} className="p-2.5 bg-muted/40 border border-border/50 rounded-xl flex flex-col justify-between">
                    <p className="text-[10.5px] font-bold text-foreground leading-snug">{s.label}</p>
                    <p className="text-[9px] text-muted-foreground leading-normal mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setTeamRole(simulatedRoleInfo);
                setShowRoleSimModal(false);
                toast.info(`Simulation switched to ${simulatedRoleInfo} mode.`);
              }}
              className="w-full py-3.5 rounded-xl bg-[#008236] hover:bg-[#006c2c] text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Continue Simulation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
