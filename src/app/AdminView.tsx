import { useState, useEffect } from "react";
import {
  Store, AlertCircle, CreditCard, Calendar, Ban, Search, RefreshCw,
  Users, Package, Shield, BarChart2, CheckCircle, X, Check, Eye,
  ChevronDown, ChevronUp, AlertTriangle, Info, Activity, TrendingUp,
  ExternalLink, Upload, Download, MapPin, Scan, FileText, Star, Edit, Trash2, LogOut, Menu, ArrowUp,
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { UnifiedDashboardHeader } from "./components/UnifiedDashboardHeader";
import { supabase } from "./utils/supabase";
import { dispatchVendorWebhook, sendEmailNotification } from "./utils/notifications";
import { toast } from "sonner";



// ---- ADMIN VIEW ----

type AdminTab = "overview" | "safety" | "ingredients" | "vendors" | "reviews" | "team" | "payments" | "onboarding" | "logs";

type TeamRole = "Marketing" | "Sales" | "Support" | "Representative" | "Operations" | "Manager";
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

const ingredientDB: any[] = [];

function generateCredentials(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.]/g, "");
  const username = `${slug}@anovra.africa`;
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  const password = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return { username, password };
}

export function AdminView({ setView }: { setView?: (v: View) => void }) {
  const [tab, setTab] = useState<AdminTab>(() => (sessionStorage.getItem("active_admin_tab") as AdminTab) || "overview");

  useEffect(() => {
    sessionStorage.setItem("active_admin_tab", tab);
  }, [tab]);

  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [flagStatuses, setFlagStatuses] = useState<Record<string, string>>({});
  const [vendorStatuses, setVendorStatuses] = useState<Record<string, string>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Live database states
  const [vendorsList, setVendorsList] = useState<any[]>([]);
  const [scansList, setScansList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [ingredientsList, setIngredientsList] = useState<any[]>(ingredientDB);
  const [onboardingRequests, setOnboardingRequests] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [showAddIngModal, setShowAddIngModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<any | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "info",
    onConfirm: () => {},
  });

  // Add ingredient form states
  const [ingName, setIngName] = useState("");
  const [ingFunction, setIngFunction] = useState("");
  const [ingStatus, setIngStatus] = useState<"safe" | "caution" | "restricted" | "banned">("safe");
  const [ingScope, setIngScope] = useState("Global");
  const [ingMaxConc, setIngMaxConc] = useState("No limit");
  const [ingNotes, setIngNotes] = useState("");
  const [isSavingIng, setIsSavingIng] = useState(false);

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Successfully logged out.");
      setView("landing");
    } catch (err: any) {
      toast.error(err.message || "Failed to log out.");
    }
  }

  useEffect(() => {
    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*");
          
        const vendors = (profiles || []).filter((p: any) => p.business_name !== null);
        setVendorsList(vendors);

        const { data: scans } = await supabase
          .from("scans")
          .select("*");
        setScansList(scans || []);

        const { data: products } = await supabase
          .from("products")
          .select("*");
        setProductsList(products || []);

        try {
          const { data: reviews } = await supabase
            .from("storefront_reviews")
            .select("*")
            .order("created_at", { ascending: false });
          setReviewsList(reviews || []);
        } catch (reviewError) {
          setReviewsList([]);
        }

        const { data: authData } = await supabase.auth.getUser();
        const isAdminUser = authData.user?.user_metadata?.role === "admin";
        if (isAdminUser) {
          const { data: payments, error: paymentsError } = await supabase
            .from("payments")
            .select("*")
            .order("created_at", { ascending: false });
          if (paymentsError) {
            console.warn("Payment telemetry is not available yet:", paymentsError.message);
            setPaymentsList([]);
          } else {
            setPaymentsList(payments || []);
          }
        } else {
          setPaymentsList([]);
        }

        try {
          const { data: ingredients, error: ingErr } = await supabase
            .from("safety_ingredients")
            .select("*")
            .order("name", { ascending: true });
          if (ingredients && ingredients.length > 0) {
            setIngredientsList(ingredients);
          }
        } catch (e) {
          console.warn("Could not load safety_ingredients table:", e);
        }

        try {
          const { data: team, error: teamErr } = await supabase
            .from("admin_team")
            .select("*")
            .order("created_at", { ascending: false });
          if (!teamErr && team) {
            setTeamMembers(team);
          }
        } catch (e) {
          console.warn("Could not load admin_team table:", e);
        }

        // Load announcements
        try {
          const { data: ann } = await supabase
            .from("team_announcements")
            .select("*")
            .order("created_at", { ascending: false });
          setAnnouncements(ann || []);
        } catch (e) {
          console.warn("Could not load team_announcements:", e);
        }

        // Load resources
        try {
          const { data: res } = await supabase
            .from("team_resources")
            .select("*")
            .order("created_at", { ascending: false });
          setResources(res || []);
        } catch (e) {
          console.warn("Could not load team_resources:", e);
        }

        // Load targets
        try {
          const { data: targ } = await supabase
            .from("team_targets")
            .select("*");
          setTargets(targ || []);
        } catch (e) {
          console.warn("Could not load team_targets:", e);
        }

        try {
          const { data: onboarding, error: onboardingErr } = await supabase
            .from("onboarding_requests")
            .select("*")
            .order("created_at", { ascending: false });
          if (!onboardingErr && onboarding) {
            setOnboardingRequests(onboarding);
          }
        } catch (e) {
          console.warn("Could not load onboarding_requests table:", e);
        }

        try {
          const { data: emails, error: emailsErr } = await supabase
            .from("email_delivery_logs")
            .select("*")
            .order("created_at", { ascending: false });
          if (!emailsErr && emails) {
            setEmailLogs(emails);
          }
        } catch (e) {
          console.warn("Could not load email_delivery_logs table:", e);
        }

        try {
          const { data: webhooks, error: webhooksErr } = await supabase
            .from("webhook_delivery_logs")
            .select("*")
            .order("created_at", { ascending: false });
          if (!webhooksErr && webhooks) {
            setWebhookLogs(webhooks);
          }
        } catch (e) {
          console.warn("Could not load webhook_delivery_logs table:", e);
        }
      } catch (err) {
        console.error("Failed to fetch admin dashboard telemetry:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
  }, []);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: "", phone: "", email: "", role: "Marketing" as TeamRole, idFileName: "", headshotUrl: "" });
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [idDocFile, setIdDocFile] = useState<File | null>(null);
  const [newCredentials, setNewCredentials] = useState<{ username: string; password: string; name: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Sub-tab toggling for team management
  const [teamSubTab, setTeamSubTab] = useState<"accounts" | "announcements" | "resources" | "targets">("accounts");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);

  // Announcement form
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annForm, setAnnForm] = useState({ title: "", body: "" });
  const [isPublishingAnn, setIsPublishingAnn] = useState(false);

  // Resource form
  const [showResForm, setShowResForm] = useState(false);
  const [resForm, setResForm] = useState({ title: "", description: "" });
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [isUploadingRes, setIsUploadingRes] = useState(false);

  // Target edit modal state
  const [editingTargetsMember, setEditingTargetsMember] = useState<any | null>(null);
  const [targetForm, setTargetForm] = useState<any>({
    vendors_onboarded: 0,
    scans_via_link: 0,
    revenue_generated: 0,
    saving: false,
  });

  async function handlePublishAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    if (!annForm.title || !annForm.body) {
      toast.error("Please fill in all fields.");
      return;
    }
    setIsPublishingAnn(true);
    try {
      const { data, error } = await supabase
        .from("team_announcements")
        .insert([{ title: annForm.title, body: annForm.body, is_active: true }])
        .select()
        .single();
      if (error) throw error;
      setAnnouncements((prev) => [data, ...prev]);
      setAnnForm({ title: "", body: "" });
      setShowAnnForm(false);
      toast.success("Announcement published successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish announcement.");
    } finally {
      setIsPublishingAnn(false);
    }
  }

  async function handleDeleteAnnouncement(id: string) {
    const { error } = await supabase
      .from("team_announcements")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    toast.success("Announcement deleted successfully.");
  }

  async function handleAddResource(e: React.FormEvent) {
    e.preventDefault();
    if (!resForm.title || !resourceFile) {
      toast.error("Please provide a title and select a file.");
      return;
    }
    setIsUploadingRes(true);
    const toastId = toast.loading("Uploading team resource file...");
    try {
      const fileExt = resourceFile.name.split(".").pop();
      const filePath = `team-resources/resource-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("vendor-documents")
        .upload(filePath, resourceFile, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("vendor-documents")
        .getPublicUrl(filePath);

      const sizeString = (resourceFile.size / (1024 * 1024)).toFixed(2) + " MB";
      const typeString = fileExt?.toUpperCase() || "FILE";

      const { data, error } = await supabase
        .from("team_resources")
        .insert([{
          title: resForm.title,
          description: resForm.description,
          file_type: typeString,
          file_size: sizeString,
          file_url: publicUrl,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;
      setResources((prev) => [data, ...prev]);
      setResForm({ title: "", description: "" });
      setResourceFile(null);
      setShowResForm(false);
      toast.success("Resource uploaded successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to add resource.", { id: toastId });
    } finally {
      setIsUploadingRes(false);
    }
  }

  async function handleDeleteResource(id: string) {
    const { error } = await supabase
      .from("team_resources")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResources((prev) => prev.filter((r) => r.id !== id));
    toast.success("Resource deleted successfully.");
  }

  async function handleSaveTargets(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTargetsMember) return;
    setTargetForm((prev: any) => ({ ...prev, saving: true }));
    try {
      const metrics = ["vendors_onboarded", "scans_via_link", "revenue_generated"];
      const promises = metrics.map((metric) => {
        const targetValue = targetForm[metric] || 0;
        return supabase
          .from("team_targets")
          .upsert([{
            team_member_id: editingTargetsMember.id,
            metric,
            target: targetValue,
            period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
          }], { onConflict: "team_member_id,metric,period_start" });
      });

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;

      // Reload all targets
      const { data: targ } = await supabase.from("team_targets").select("*");
      setTargets(targ || []);

      setEditingTargetsMember(null);
      toast.success("Monthly targets updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update targets.");
    } finally {
      setTargetForm((prev: any) => ({ ...prev, saving: false }));
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleCreateTeamMember() {
    if (!teamForm.name || !teamForm.email || !teamForm.phone) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const creds = generateCredentials(teamForm.name);

    setIsCreatingTeam(true);
    const tid = toast.loading("Saving team member record and sending credentials...");
    try {
      // 1. Upload Headshot to Supabase Storage if present
      let uploadedHeadshotUrl = "";
      if (headshotFile) {
        const fileExt = headshotFile.name.split('.').pop();
        const fileName = `headshots/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("vendor-documents")
          .upload(fileName, headshotFile, { cacheControl: '3600', upsert: true });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("vendor-documents")
            .getPublicUrl(fileName);
          uploadedHeadshotUrl = publicUrl;
        } else {
          console.error("Headshot upload failed:", uploadError);
        }
      }

      // 2. Upload ID Document to Supabase Storage if present
      let uploadedIdFileName = "";
      if (idDocFile) {
        const fileExt = idDocFile.name.split('.').pop();
        const fileName = `ids/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("vendor-documents")
          .upload(fileName, idDocFile, { cacheControl: '3600', upsert: true });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("vendor-documents")
            .getPublicUrl(fileName);
          uploadedIdFileName = publicUrl;
        } else {
          console.error("ID document upload failed:", uploadError);
          uploadedIdFileName = idDocFile.name; // fallback to raw filename
        }
      }

      const { data, error } = await supabase.functions.invoke("send-onboarding-email", {
        body: {
          action: "create_team_member",
          name: teamForm.name,
          phone: teamForm.phone,
          email: teamForm.email,
          role: teamForm.role,
          id_file_name: uploadedIdFileName || teamForm.idFileName || "id_document.pdf",
          headshot_url: uploadedHeadshotUrl || "",
          username: creds.username,
          password: creds.password
        }
      });

      if (error) throw error;

      // Query database directly to get the created member's exact UUID
      const { data: dbUser } = await supabase
        .from("admin_team")
        .select("*")
        .eq("email", teamForm.email)
        .maybeSingle();

      toast.success("Team member successfully created and notified!");
      
      const newMember: TeamMember = {
        id: dbUser?.id || data?.user?.id || Math.random().toString(),
        name: teamForm.name,
        phone: teamForm.phone,
        email: teamForm.email,
        role: teamForm.role,
        idFileName: dbUser?.id_file_name || uploadedIdFileName || teamForm.idFileName || "id_document.pdf",
        headshotUrl: dbUser?.headshot_url || uploadedHeadshotUrl || "",
        username: creds.username,
        password: creds.password,
        status: "active",
        createdAt: dbUser?.created_at || new Date().toISOString()
      };
      
      setTeamMembers((t) => [newMember, ...t]);
      setNewCredentials({ ...creds, name: teamForm.name });
      setTeamForm({ name: "", phone: "", email: "", role: "Marketing", idFileName: "", headshotUrl: "" });
      setHeadshotFile(null);
      setIdDocFile(null);
      setShowTeamForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create team member.");
    } finally {
      toast.dismiss(tid);
      setIsCreatingTeam(false);
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  // Calculate dynamic telemetry and statistics
  const totalVendors = vendorsList.length;
  const scansPlatformWide = scansList.length;
  const productsPending = productsList.filter(p => p.nafdac_status === "flagged" || p.nafdac_status === "pending").length;

  const basicCount = vendorsList.filter(v => v.plan === "basic").length;
  const premiumCount = vendorsList.filter(v => v.plan === "premium").length;
  const brandCount = vendorsList.filter(v => v.plan === "brand").length;
  const freeCount = vendorsList.filter(v => v.plan === "free" || !v.plan).length;
  const successfulPayments = paymentsList.filter((p) => p.status === "success");
  const currentMonthPayments = successfulPayments.filter((p) => {
    const paidAt = new Date(p.created_at || Date.now());
    const now = new Date();
    return paidAt.getFullYear() === now.getFullYear() && paidAt.getMonth() === now.getMonth();
  });
  const actualRevenueVal = currentMonthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const mrrVal = actualRevenueVal;
  const formattedMrr = `₦${mrrVal.toLocaleString()}`;
  const revenueDelta = actualRevenueVal
    ? `${currentMonthPayments.length} successful Paystack payment${currentMonthPayments.length === 1 ? "" : "s"} this month`
    : "No tracked Paystack payments this month";

  const dynamicStats = [
    { label: "Total vendors", value: String(totalVendors), delta: `+${vendorsList.filter(v => new Date(v.created_at || Date.now()).getMonth() === new Date().getMonth()).length} this month`, icon: <Store className="w-4 h-4" />, warn: false },
    { label: "Scans platform-wide", value: String(scansPlatformWide), delta: `Across all vendors`, icon: <Scan className="w-4 h-4" />, warn: false },
    { label: "Products pending safety review", value: String(productsPending), delta: productsPending > 0 ? "Requires action" : "All cleared", icon: <AlertCircle className="w-4 h-4" />, warn: productsPending > 0 },
    { label: "MRR (₦)", value: formattedMrr, delta: revenueDelta, icon: <CreditCard className="w-4 h-4" />, warn: false },
  ];

  // Dynamic mapped vendor representations
  const dynamicVendors = vendorsList.map(v => {
    const vendorProds = productsList.filter(p => p.vendor_id === v.id);
    const vendorScans = scansList.filter(s => s.vendor_id === v.id).length;
    const vendorPayments = successfulPayments.filter((p) => p.vendor_id === v.id);
    const latestPayment = vendorPayments[0];
    const vendorMrr = latestPayment
      ? `₦${Number(latestPayment.amount || 0).toLocaleString()}`
      : v.plan === "brand" ? "₦75,000" : (v.plan === "premium" ? "₦25,000" : v.plan === "basic" ? "₦12,500" : "₦0");
    const joinedDate = new Date(v.created_at || Date.now()).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
    
    // Status resolution based on local overrides or profile flags
    const status = vendorStatuses[v.id] ?? (v.is_verified ? "active" : "pending");

    return {
      id: v.id,
      name: v.business_name || "My Skincare Brand",
      owner: v.name || "Vendor Partner",
      city: v.location || "Nigeria",
      tier: v.plan === "brand" ? "Brand" : (v.plan === "premium" ? "Pro" : v.plan === "basic" ? "Basic" : "Free"),
      products: vendorProds.length,
      scans: vendorScans,
      joined: joinedDate,
      status: status,
      mrr: vendorMrr,
      cacNumber: v.cac_number,
      cacDocumentUrl: v.cac_document_url,
      paymentReference: latestPayment?.reference,
    };
  });

  const filteredVendors = dynamicVendors.filter(
    (v) =>
      search === "" ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.owner.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPayments = paymentsList.filter((p) => {
    if (search === "") return true;
    const vendor = vendorsList.find((v) => v.id === p.vendor_id);
    const searchLower = search.toLowerCase();
    return (
      (p.reference && p.reference.toLowerCase().includes(searchLower)) ||
      (p.id && p.id.toLowerCase().includes(searchLower)) ||
      (p.status && p.status.toLowerCase().includes(searchLower)) ||
      (p.tier_name && p.tier_name.toLowerCase().includes(searchLower)) ||
      (vendor?.business_name && vendor.business_name.toLowerCase().includes(searchLower)) ||
      (vendor?.name && vendor.name.toLowerCase().includes(searchLower)) ||
      (vendor?.email && vendor.email.toLowerCase().includes(searchLower))
    );
  });

  function downloadPaymentsCSV() {
    const headers = ["Transaction Reference", "Vendor Name", "Vendor Email", "Amount", "Billing Plan", "Date", "Status"];
    const rows = filteredPayments.map((p) => {
      const vendor = vendorsList.find((v) => v.id === p.vendor_id);
      return [
        p.reference || p.id,
        vendor?.business_name || vendor?.name || "Unknown Vendor",
        vendor?.email || "",
        p.amount ? `₦${p.amount.toLocaleString()}` : "₦0",
        p.plan || p.tier_name || "free",
        p.created_at ? new Date(p.created_at).toLocaleDateString("en-GB") : "",
        p.status || "success"
      ];
    });
    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `anovra_subscriptions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  // Dynamic mapped safety queue representations
  const activeFlaggedQueue = productsList
    .filter((p) => p.nafdac_status === "flagged" || p.nafdac_status === "pending")
    .map((p) => {
      const vendorProfileObj = vendorsList.find((v) => v.id === p.vendor_id);
      const vendorName = vendorProfileObj?.business_name || p.brand || "Unknown Vendor";
      const vendorCity = vendorProfileObj?.location || "Nigeria";
      const status = flagStatuses[p.id] ?? (p.nafdac_status === "flagged" ? "pending" : "under_review");

      return {
        id: p.id,
        productName: p.name,
        vendor: vendorName,
        vendorCity: vendorCity,
        flaggedDate: new Date(p.created_at || Date.now()).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric"
        }),
        ingredients: p.description?.toLowerCase().includes("mercury") ? ["Mercury Chloride"] : ["Unregistered Active"],
        violations: p.description?.toLowerCase().includes("mercury") ? ["Mercury — globally banned"] : ["Needs verification"],
        status: status,
        severity: (p.description?.toLowerCase().includes("mercury") ? "critical" : "moderate") as "critical" | "moderate" | "low"
      };
    });

  function getVendorStatus(v: typeof dynamicVendors[0]) {
    return vendorStatuses[v.id] ?? v.status;
  }

  const setVendorAction = async (vendorId: string, action: "active" | "suspended" | "banned" | "removed") => {
    const tid = toast.loading(`Updating vendor status...`);
    try {
      if (action === "removed") {
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", vendorId);
        if (error) throw error;
        
        setVendorsList((prev) => prev.filter((v) => v.id !== vendorId));
        toast.success("Vendor account removed successfully!");
      } else {
        const nextVerified = action === "active";
        const verificationStatus = action === "active" ? "approved" : action;
        const { error } = await supabase
          .from("profiles")
          .update({ is_verified: nextVerified, verification_status: verificationStatus })
          .eq("id", vendorId);
        if (error) throw error;

        setVendorsList((prev) =>
          prev.map((v) => (v.id === vendorId ? { ...v, is_verified: nextVerified, verification_status: verificationStatus } : v))
        );
        toast.success(`Vendor status updated to ${action}!`);
      }
      setVendorStatuses((s) => ({ ...s, [vendorId]: action }));
      setOpenDropdown(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update vendor status.");
    } finally {
      toast.dismiss(tid);
    }
  };

  const resolveFlag = async (productId: string, action: "approve" | "ban") => {
    const tid = toast.loading(`${action === "approve" ? "Approving" : "Blocking"} product...`);
    try {
      const nextStatus = action === "approve" ? "approved" : "flagged";
      const { error } = await supabase
        .from("products")
        .update({ nafdac_status: nextStatus })
        .eq("id", productId);

      if (error) throw error;
      const product = productsList.find((p) => p.id === productId);
      const vendor = vendorsList.find((v) => v.id === product?.vendor_id);
      await dispatchVendorWebhook(product?.vendor_id, action === "approve" ? "catalog.updated" : "product.flagged", {
        product_id: productId,
        product_name: product?.name,
        status: nextStatus,
      });
      if (vendor?.email) {
        await sendEmailNotification(action === "approve" ? "product_approved" : "product_rejected", {
          name: vendor.name || vendor.business_name || "Partner",
          email: vendor.email,
          product: product?.name || "Product",
          message: action === "approve" ? "It can now appear on eligible storefront and recommendation surfaces." : "Please review the product details and resubmit after updating compliance information.",
        });
      }
      
      toast.success(`Product successfully ${action === "approve" ? "approved" : "blocked"}!`);
      setProductsList((prev) => 
        prev.map((p) => (p.id === productId ? { ...p, nafdac_status: nextStatus } : p))
      );
      setFlagStatuses((s) => ({ ...s, [productId]: action === "approve" ? "resolved" : "banned" }));
      setExpandedFlag(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve product safety flag.");
    } finally {
      toast.dismiss(tid);
    }
  };

  const handleAddIngredientSubmit = async () => {
    if (!ingName.trim() || !ingFunction.trim()) {
      toast.error("Please fill in the ingredient name and function.");
      return;
    }
    setIsSavingIng(true);
    const isEdit = editingIngredient !== null;
    const tid = toast.loading(isEdit ? "Updating ingredient in safety database..." : "Adding ingredient to safety database...");
    try {
      const payload = {
        name: ingName.trim(),
        function: ingFunction.trim(),
        status: ingStatus,
        scope: ingScope.trim(),
        max_conc: ingMaxConc.trim(),
        notes: ingNotes.trim(),
      };

      if (isEdit) {
        const { data, error } = await supabase
          .from("safety_ingredients")
          .update(payload)
          .eq("id", editingIngredient.id)
          .select()
          .maybeSingle();

        if (error) throw error;
        toast.success("Ingredient successfully updated!");
        setIngredientsList((prev) =>
          prev.map((item) => (item.id === editingIngredient.id ? (data || { ...item, ...payload }) : item))
              .sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        const { data, error } = await supabase
          .from("safety_ingredients")
          .insert([payload])
          .select()
          .maybeSingle();

        if (error) throw error;
        toast.success("Ingredient successfully added!");
        setIngredientsList((prev) => [...prev, data || payload].sort((a, b) => a.name.localeCompare(b.name)));
      }

      setShowAddIngModal(false);
      setEditingIngredient(null);
      // Clear form
      setIngName("");
      setIngFunction("");
      setIngStatus("safe");
      setIngScope("Global");
      setIngMaxConc("No limit");
      setIngNotes("");
    } catch (err: any) {
      toast.error(err.message || "Failed to save ingredient.");
    } finally {
      setIsSavingIng(false);
      toast.dismiss(tid);
    }
  };

  const openEditModal = (ing: any) => {
    setEditingIngredient(ing);
    setIngName(ing.name);
    setIngFunction(ing.function);
    setIngStatus(ing.status);
    setIngScope(ing.scope);
    setIngMaxConc(ing.max_conc || ing.maxConc || "");
    setIngNotes(ing.notes || "");
    setShowAddIngModal(true);
  };

  const handleDeleteIngredient = async (ing: any) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Ingredient",
      message: `Are you sure you want to delete "${ing.name}" from the safety database? This action cannot be undone.`,
      confirmText: "Delete",
      type: "danger",
      onConfirm: async () => {
        const tid = toast.loading(`Deleting ${ing.name}...`);
        try {
          const { error } = await supabase
            .from("safety_ingredients")
            .delete()
            .eq("id", ing.id);

          if (error) throw error;

          toast.success(`${ing.name} deleted successfully.`);
          setIngredientsList((prev) => prev.filter((item) => item.id !== ing.id));
        } catch (err: any) {
          toast.error(err.message || "Failed to delete ingredient.");
        } finally {
          toast.dismiss(tid);
          setConfirmModal((c) => ({ ...c, isOpen: false }));
        }
      }
    });
  };

  const renderNotes = (notes: string, ingName: string) => {
    const isExpanded = expandedNotes[ingName];
    if (!notes) return <span className="text-muted-foreground italic">No advisory notes</span>;
    if (notes.length <= 60) return <span>{notes}</span>;
    return (
      <span className="leading-relaxed">
        {isExpanded ? notes : `${notes.slice(0, 60)}...`}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setExpandedNotes(prev => ({ ...prev, [ingName]: !prev[ingName] }));
          }}
          className="text-accent hover:underline font-semibold ml-1 text-[11px] inline-block cursor-pointer focus:outline-none"
        >
          {isExpanded ? "See less" : "See more"}
        </button>
      </span>
    );
  };

  const tabs: { id: AdminTab; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "safety", label: "Safety Queue", badge: activeFlaggedQueue.filter((f) => f.status === "pending" || f.status === "under_review").length },
    { id: "ingredients", label: "Ingredient DB" },
    { id: "vendors", label: "Vendors" },
    { id: "reviews", label: "Reviews", badge: reviewsList.filter((r) => r.status === "pending").length },
    { id: "team", label: "Team" },
    { id: "payments", label: "Payments" },
    { id: "onboarding", label: "Onboarding Requests", badge: onboardingRequests.filter((r) => r.status === "pending").length },
    { id: "logs", label: "System Logs" },
  ];

  const filteredIngredients = ingredientsList.filter(
    (i) =>
      search === "" ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.function.toLowerCase().includes(search.toLowerCase())
  );

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
          title="Control Center"
          subtitle="Platform Operations, Merchant Verification & Product Safety Control"
          badgeText="PLATFORM ADMIN"
          role="admin"
          showShopLink={false}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative pt-4">
        <div className="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
          {/* Desktop Sidebar (hidden on mobile/tablet) */}
          <aside className="hidden lg:flex bg-card border border-border rounded-xl py-5 px-3 sticky top-24 z-20 h-[calc(100vh-140px)] flex-col justify-between">
            <div className="space-y-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setSearch(""); }}
                  className={cn(
                    "relative w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors rounded-lg font-medium whitespace-nowrap text-left",
                    tab === t.id
                      ? "bg-accent text-white font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <span className="flex items-center gap-2.5">
                    {t.id === "overview" && <BarChart2 className="w-4 h-4" />}
                    {t.id === "safety" && <Shield className="w-4 h-4" />}
                    {t.id === "ingredients" && <Package className="w-4 h-4" />}
                    {t.id === "vendors" && <Store className="w-4 h-4" />}
                    {t.id === "reviews" && <Star className="w-4 h-4" />}
                    {t.id === "team" && <Users className="w-4 h-4" />}
                    {t.id === "payments" && <CreditCard className="w-4 h-4" />}
                    {t.id === "onboarding" && <FileText className="w-4 h-4" />}
                    {t.id === "logs" && <Activity className="w-4 h-4" />}
                    {t.label}
                  </span>
                  {t.badge ? (
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                      tab === t.id ? "bg-white text-accent animate-pulse" : "bg-accent/15 text-accent"
                    )} style={{ fontFamily: "'DM Mono', monospace" }}>
                      {t.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-border mt-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors rounded-lg font-medium whitespace-nowrap text-left"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Mobile Drawer Trigger Header & Drawer */}
          <div className="lg:hidden w-full">
            <div className="bg-card border border-border/80 rounded-xl p-3.5 mb-5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 bg-secondary hover:bg-muted border border-border rounded-lg text-foreground transition-all active:scale-95 flex items-center justify-center"
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-4.5 h-4.5" />
                </button>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] text-accent uppercase tracking-widest font-bold font-mono">
                    <span>Admin Ops</span>
                    <span className="text-muted-foreground/60">/</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {tabs.find((t) => t.id === tab)?.label || "Overview"}
                  </span>
                </div>
              </div>

              {tabs.find((t) => t.id === tab)?.badge ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent font-mono animate-pulse">
                  {tabs.find((t) => t.id === tab)?.badge} Pending
                </span>
              ) : null}
            </div>

            {/* Mobile Navigation Drawer Overlay */}
            {isMobileMenuOpen && (
              <div 
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}

            {/* Mobile Navigation Drawer Panel */}
            <aside className={cn(
              "fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-card border-r border-border p-5 flex flex-col justify-between transition-transform duration-300 ease-out transform",
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-accent" />
                    <span className="font-bold text-foreground text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Admin Menu
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { 
                        setTab(t.id); 
                        setSearch(""); 
                        setIsMobileMenuOpen(false); 
                      }}
                      className={cn(
                        "relative w-full flex items-center justify-between gap-2.5 px-4 py-2.5 text-sm transition-colors rounded-lg font-medium text-left",
                        tab === t.id
                          ? "bg-accent text-white font-semibold shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <span className="flex items-center gap-2.5">
                        {t.id === "overview" && <BarChart2 className="w-4 h-4" />}
                        {t.id === "safety" && <Shield className="w-4 h-4" />}
                        {t.id === "ingredients" && <Package className="w-4 h-4" />}
                        {t.id === "vendors" && <Store className="w-4 h-4" />}
                        {t.id === "reviews" && <Star className="w-4 h-4" />}
                        {t.id === "team" && <Users className="w-4 h-4" />}
                        {t.id === "payments" && <CreditCard className="w-4 h-4" />}
                        {t.id === "onboarding" && <FileText className="w-4 h-4" />}
                        {t.id === "logs" && <Activity className="w-4 h-4" />}
                        {t.label}
                      </span>
                      {t.badge ? (
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                          tab === t.id ? "bg-white text-accent animate-pulse" : "bg-accent/15 text-accent"
                        )} style={{ fontFamily: "'DM Mono', monospace" }}>
                          {t.badge}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border mt-4">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors rounded-lg font-medium whitespace-nowrap text-left"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </aside>
          </div>

        <main className="min-w-0">

      <div className="py-4">

        {/* ---- OVERVIEW ---- */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {dynamicStats.map((s, i) => (
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
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 mb-6">
                <div>
                  <h3 className="font-semibold text-foreground text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Subscribed vendors by plan
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Active tiers based on verified Paystack transaction records
                  </p>
                </div>
                <span className="text-xs bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300 border border-green-200 dark:border-green-800/30 px-3 py-1 rounded-full font-semibold font-mono self-start sm:self-auto">
                  {successfulPayments.length} tracked payments
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    plan: "Basic Plan",
                    price: "₦12,500 / mo",
                    count: basicCount,
                    total: totalVendors || 1,
                    mrr: `₦${(basicCount * 12500).toLocaleString()}`,
                    color: "bg-accent",
                    textColor: "text-accent",
                    badgeColor: "bg-accent/10 text-accent",
                    features: ["Up to 50 skin tests/month", "10 products in catalog", "Shareable test link", "Basic analytics"],
                  },
                  {
                    plan: "Vendor Pro Plan",
                    price: "₦25,000 / mo",
                    count: premiumCount,
                    total: totalVendors || 1,
                    mrr: `₦${(premiumCount * 25000).toLocaleString()}`,
                    color: "bg-emerald-600",
                    textColor: "text-emerald-600",
                    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/25",
                    features: ["Unlimited skin tests", "Unlimited catalog", "White-labeled results", "Website embed widget", "Priority support"],
                  },
                  {
                    plan: "Brand Tier Plan",
                    price: "₦75,000 / mo",
                    count: brandCount,
                    total: totalVendors || 1,
                    mrr: `₦${(brandCount * 75000).toLocaleString()}`,
                    color: "bg-indigo-600",
                    textColor: "text-indigo-600",
                    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25",
                    features: ["Everything in Pro", "REST API key access", "Custom domain for test links", "Multi-user team accounts"],
                  },
                ].map((plan) => {
                  const pct = totalVendors > 0 ? Math.round((plan.count / totalVendors) * 100) : 0;
                  return (
                    <div key={plan.plan} className="border border-border bg-secondary/30 rounded-xl p-5 hover:border-accent/40 hover:shadow-xs transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${plan.badgeColor}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {plan.plan}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground font-mono">{plan.price}</span>
                        </div>
                        
                        <div className="space-y-2 mb-6">
                          {plan.features.map((f) => (
                            <div key={f} className="text-xs text-muted-foreground flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              <CheckCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-border pt-4 mt-auto">
                        <div className="flex items-end justify-between mb-3">
                          <div>
                            <p className="text-3xl font-light text-foreground tracking-tight leading-none mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
                              {plan.count}
                            </p>
                            <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>vendors active</span>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Plan MRR contribution</p>
                            <p className="text-sm font-semibold text-foreground font-mono mt-0.5">{plan.mrr}</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${plan.color}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground font-mono shrink-0 w-10 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Free tier summary strip */}
              <div className="mt-6 px-5 py-4 bg-secondary/50 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground bg-muted-foreground/10 px-2 py-0.5 rounded uppercase" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Free Tier</span>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>— Sandbox vendors (no active recurring payments verified)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-muted rounded-full h-1.5 overflow-hidden shrink-0">
                    <div className="h-full rounded-full bg-muted-foreground/30" style={{ width: `${totalVendors > 0 ? Math.round((freeCount / totalVendors) * 100) : 0}%` }} />
                  </div>
                  <span className="text-xs text-foreground font-semibold font-mono whitespace-nowrap">
                    {freeCount} vendors ({totalVendors > 0 ? Math.round((freeCount / totalVendors) * 100) : 0}%)
                  </span>
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
                  Successful vendor payments · Nigerian Naira (₦)
                </p>
                {/* SVG MRR line chart */}
                {(() => {
                  const w = 480, h = 150, padL = 52, padR = 12, padT = 8, padB = 28;
                  const now = new Date();
                  const dynamicRevenueData = Array.from({ length: 6 }, (_, idx) => {
                    const cursor = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
                    const monthPayments = successfulPayments.filter((p) => {
                      const paidAt = new Date(p.created_at || Date.now());
                      return paidAt.getFullYear() === cursor.getFullYear() && paidAt.getMonth() === cursor.getMonth();
                    });
                    return {
                      month: cursor.toLocaleDateString("en-US", { month: "short" }),
                      mrr: monthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
                    };
                  });
                  const vals = dynamicRevenueData.map((d) => d.mrr);
                  const minV = Math.min(...vals), maxV = Math.max(...vals) || 1;
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
                      {dynamicRevenueData.map((d, i) => (
                        <text key={i} x={padL + i * xStep} y={h - padB + 14} textAnchor="middle" fontSize={10} fill="#7A6355" fontFamily="'Plus Jakarta Sans', sans-serif">
                          {d.month}
                        </text>
                      ))}
                    </svg>
                  );
                })()}
              </div>

              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-medium text-foreground mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Recent payments
                </h3>
                <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Latest successful Paystack subscriptions
                </p>
                <div className="space-y-3">
                  {successfulPayments.slice(0, 5).map((payment) => {
                    const vendor = vendorsList.find((v) => v.id === payment.vendor_id);
                    return (
                      <div 
                        key={payment.id || payment.reference} 
                        onClick={() => setSelectedPayment(payment)}
                        className="flex items-start justify-between gap-3 border-b border-border last:border-0 pb-3 last:pb-0 cursor-pointer hover:bg-secondary/60 p-1.5 rounded transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {vendor?.business_name || "Unknown vendor"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: "'DM Mono', monospace" }}>
                            {payment.plan || "plan"} · {payment.reference || "no reference"}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                            ₦{Number(payment.amount || 0).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {new Date(payment.created_at || Date.now()).toLocaleDateString("en-GB")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {successfulPayments.length === 0 && (
                    <div className="border border-dashed border-border rounded-lg p-4 text-center">
                      <CreditCard className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        No payment records yet. New Paystack callbacks will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tier breakdown */}
              <div className="bg-card border border-border rounded-lg p-5">
                <h3 className="font-medium text-foreground mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Vendors by tier
                </h3>
                <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {totalVendors} total vendors
                </p>
                {/* CSS conic-gradient donut */}
                {(() => {
                  const dynamicTierData = [
                    { name: "Free", value: freeCount, fill: "#EDE3D6" },
                    { name: "Basic", value: basicCount, fill: "#C86B3A" },
                    { name: "Pro", value: premiumCount, fill: "#1A0A05" },
                    { name: "Brand", value: brandCount, fill: "#4f46e5" },
                  ];
                  const total = dynamicTierData.reduce((s, d) => s + d.value, 0) || 1;
                  let cursor = 0;
                  const stops = dynamicTierData.map((d) => {
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
                  {[
                    { name: "Free", value: freeCount, fill: "#EDE3D6" },
                    { name: "Basic", value: basicCount, fill: "#C86B3A" },
                    { name: "Pro", value: premiumCount, fill: "#1A0A05" },
                    { name: "Brand", value: brandCount, fill: "#4f46e5" },
                  ].map((t) => (
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
                Aggregated across all vendors and {scansPlatformWide} scans
              </p>
              {/* CSS horizontal bar chart */}
              {(() => {
                const dynamicConcernsMap = scansList.reduce((acc: Record<string, number>, s) => {
                  if (s.concern) {
                    const cleanConcern = s.concern.charAt(0).toUpperCase() + s.concern.slice(1);
                    acc[cleanConcern] = (acc[cleanConcern] || 0) + 1;
                  }
                  return acc;
                }, {});
                
                const rawConcerns = Object.entries(dynamicConcernsMap).map(([name, value]) => ({
                  name,
                  value,
                  fill: name.toLowerCase().includes("hyperpig") ? "#C86B3A" : name.toLowerCase().includes("acne") ? "#D4854A" : "#B85A2E"
                })).sort((a, b) => b.value - a.value);

                const finalConcerns = rawConcerns.length > 0 ? rawConcerns : [
                  { name: "Hyperpigmentation", value: 0, fill: "#C86B3A" },
                  { name: "Acne", value: 0, fill: "#D4854A" },
                  { name: "Dryness", value: 0, fill: "#B85A2E" },
                ];

                const maxVal = Math.max(...finalConcerns.map((d) => d.value)) || 1;
                return (
                  <div className="space-y-3">
                    {finalConcerns.map((d) => (
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Ingredient safety review queue
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Products auto-flagged by the ingredient safety layer — review and approve or ban.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border px-3 py-2 rounded-lg self-start md:self-auto" style={{ fontFamily: "'DM Mono', monospace" }}>
                <RefreshCw className="w-3 h-3" />
                Last sync: 2 min ago
              </div>
            </div>

            <div className="space-y-3">
              {activeFlaggedQueue.length === 0 && (
                <div className="bg-card border-2 border-dashed border-border rounded-2xl p-8 text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">Safety queue is clear</p>
                  <p className="text-xs text-muted-foreground mt-0.5">No products require safety compliance review at this time.</p>
                </div>
              )}
              {activeFlaggedQueue.map((item) => {
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Ingredient safety database
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
                <div className="relative w-full sm:w-52">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search ingredients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-input-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
                <button 
                  onClick={() => setShowAddIngModal(true)}
                  className="flex items-center justify-center gap-1.5 text-sm bg-accent text-white px-3 py-2.5 rounded-lg hover:bg-accent/90 transition-colors cursor-pointer w-full sm:w-auto font-medium" 
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  + Add ingredient
                </button>
              </div>
            </div>

            {/* Status legend & Compliance Guidelines */}
            <div className="bg-card border border-border rounded-xl p-5 mb-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Regulatory Classification & Action Guidelines
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Use these guidelines to evaluate ingredients identified in vendor catalogs during compliance audits:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    status: "banned",
                    title: "Banned",
                    desc: "Globally prohibited compounds.",
                    action: "Reject and flag the product immediately. Zero tolerance (e.g. Mercury, Lead).",
                  },
                  {
                    status: "restricted",
                    title: "Restricted",
                    desc: "Strict regulatory limits apply.",
                    action: "Verify concentration is within allowable limits (e.g. Hydroquinone ≤ 2%).",
                  },
                  {
                    status: "caution",
                    title: "Caution",
                    desc: "Usage warnings & constraints.",
                    action: "Ensure appropriate warnings (e.g. Retinol/AHA requires sunscreen warning).",
                  },
                  {
                    status: "safe",
                    title: "Safe",
                    desc: "Approved cosmetic ingredients.",
                    action: "Safe for distribution. Eligible for storefront placement and recommendation filters.",
                  },
                ].map((item) => (
                  <div key={item.status} className="bg-secondary/40 border border-border/80 rounded-lg p-3.5 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {item.title}
                        </span>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono", ingredientStatusColors[item.status])}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground/80 leading-normal" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {item.desc}
                      </p>
                    </div>
                    <div className="border-t border-border/50 pt-2 text-[11px] text-muted-foreground leading-normal" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <strong className="text-foreground font-medium block mb-0.5">Audit Action:</strong>
                      {item.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
              {/* Desktop View Table */}
              <div className="hidden md:block">
                <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border bg-secondary/60 text-xs font-semibold text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <span className="col-span-3">Ingredient</span>
                  <span className="col-span-2">Function</span>
                  <span className="col-span-1">Status</span>
                  <span className="col-span-2">Scope</span>
                  <span className="col-span-1 text-center">Max Conc.</span>
                  <span className="col-span-2">Safety / Advisory Notes</span>
                  <span className="col-span-1 pr-2 text-right">Actions</span>
                </div>
                <div className="divide-y divide-border">
                  {filteredIngredients.map((ing) => (
                    <div key={ing.name} className="grid grid-cols-12 gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-all items-start">
                      <p className="col-span-3 text-sm font-semibold text-foreground whitespace-normal break-words leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {ing.name}
                      </p>
                      <p className="col-span-2 text-xs text-muted-foreground leading-relaxed whitespace-normal break-words" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {ing.function}
                      </p>
                      <div className="col-span-1">
                        <span className={cn("text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono inline-block text-center", ingredientStatusColors[ing.status])}>
                          {ing.status}
                        </span>
                      </div>
                      <p className="col-span-2 text-xs text-muted-foreground whitespace-normal break-words" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {ing.scope}
                      </p>
                      <p className="col-span-1 text-xs font-semibold font-mono text-foreground text-center bg-secondary/50 py-0.5 px-1 rounded">{ing.max_conc || ing.maxConc}</p>
                      <p className="col-span-2 text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {renderNotes(ing.notes, ing.name)}
                      </p>
                      <div className="col-span-1 flex items-center justify-end gap-1.5 pr-1">
                        <button
                          onClick={() => openEditModal(ing)}
                          className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-accent transition-colors cursor-pointer"
                          title="Edit ingredient info"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteIngredient(ing)}
                          className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete ingredient record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile View Cards */}
              <div className="block md:hidden divide-y divide-border">
                {filteredIngredients.map((ing) => (
                  <div key={ing.name} className="p-4 hover:bg-secondary/20 transition-all space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground whitespace-normal break-words leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {ing.name}
                        </p>
                        <span className={cn("text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono inline-block mt-1", ingredientStatusColors[ing.status])}>
                          {ing.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(ing)}
                          className="p-1.5 bg-secondary hover:bg-muted rounded-lg text-muted-foreground hover:text-accent transition-colors cursor-pointer"
                          title="Edit ingredient"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteIngredient(ing)}
                          className="p-1.5 bg-secondary hover:bg-muted rounded-lg text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete ingredient"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Function</span>
                        <span className="text-foreground whitespace-normal break-words" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ing.function}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Max Conc</span>
                        <span className="font-mono text-foreground">{ing.max_conc || ing.maxConc}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Scope</span>
                      <span className="text-xs text-muted-foreground whitespace-normal break-words" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{ing.scope}</span>
                    </div>
                    {ing.notes && (
                      <div className="bg-secondary/40 p-2.5 rounded-lg border border-border">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold block mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Advisory Notes</span>
                        <div className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {renderNotes(ing.notes, ing.name)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isLoading ? (
                <div className="px-4 py-16 text-center bg-card">
                  <RefreshCw className="w-5 h-5 mx-auto text-muted-foreground animate-spin mb-2" />
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Loading safety database...</p>
                </div>
              ) : filteredIngredients.length === 0 ? (
                <div className="px-4 py-16 text-center bg-card">
                  <p className="text-xs text-muted-foreground font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No ingredients found.</p>
                </div>
              ) : null}
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
                  {totalVendors} vendors · {dynamicVendors.filter((v) => getVendorStatus(v) === "active").length} active · {dynamicVendors.filter((v) => getVendorStatus(v) === "pending" || getVendorStatus(v) === "flagged").length} pending approval
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
              {/* Desktop Table View */}
              <div className="hidden md:block">
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
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {v.cacNumber && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                CAC {v.cacNumber}
                              </span>
                            )}
                            {v.cacDocumentUrl ? (
                              <a
                                href={v.cacDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-accent hover:underline font-medium"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                              >
                                <FileText className="w-3 h-3" />
                                View CAC document
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                <AlertTriangle className="w-3 h-3" />
                                CAC document missing
                              </span>
                            )}
                          </div>
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
                        <div className="col-span-1 text-right">
                          <p className="text-sm font-mono text-foreground">{v.mrr}</p>
                          {v.paymentReference && (
                            <p className="text-[10px] font-mono text-muted-foreground truncate" title={v.paymentReference}>
                              paid
                            </p>
                          )}
                        </div>
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
                                className="flex items-center gap-1 text-xs bg-secondary border border-border text-foreground px-2.5 py-1 rounded-full hover:bg-muted transition-colors cursor-pointer"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                              >
                                Manage
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              {isDropOpen && (
                                <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                                  <button
                                    onClick={() => {
                                      setVendorAction(v.id, "suspended");
                                      setOpenDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-orange-600 hover:bg-orange-50 transition-colors text-left"
                                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Suspend vendor
                                  </button>
                                  <button
                                    onClick={() => {
                                      setVendorAction(v.id, "banned");
                                      setOpenDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left border-t border-border"
                                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    Ban vendor
                                  </button>
                                  <button
                                    onClick={() => {
                                      setVendorAction(v.id, "removed");
                                      setOpenDropdown(null);
                                    }}
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
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-border">
                {filteredVendors.map((v) => {
                  const status = getVendorStatus(v);
                  const isApproved = status !== "pending";
                  const isDropOpen = openDropdown === v.id;

                  const statusBadge = () => {
                    if (status === "pending") return <span className="inline-flex items-center gap-1 text-[11px] bg-secondary text-muted-foreground font-semibold px-2 py-0.5 rounded-full border border-border"><AlertCircle className="w-3 h-3" />Pending</span>;
                    if (status === "suspended") return <span className="inline-flex items-center gap-1 text-[11px] bg-orange-500/10 text-orange-600 font-semibold px-2 py-0.5 rounded-full border border-orange-500/20"><AlertTriangle className="w-3 h-3" />Suspended</span>;
                    if (status === "banned") return <span className="inline-flex items-center gap-1 text-[11px] bg-red-500/10 text-red-600 font-semibold px-2 py-0.5 rounded-full border border-red-500/20"><Ban className="w-3 h-3" />Banned</span>;
                    if (status === "removed") return <span className="inline-flex items-center gap-1 text-[11px] bg-red-500/5 text-red-400 font-semibold px-2 py-0.5 rounded-full border border-red-500/10"><X className="w-3 h-3" />Removed</span>;
                    if (status === "flagged") return <span className="inline-flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-600 font-semibold px-2 py-0.5 rounded-full border border-amber-500/20"><AlertTriangle className="w-3 h-3" />Flagged</span>;
                    return <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 text-green-600 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20"><CheckCircle className="w-3 h-3" />Active</span>;
                  };

                  return (
                    <div 
                      key={v.id} 
                      className={cn(
                        "p-4 hover:bg-secondary/20 transition-all space-y-3",
                        status === "flagged" ? "bg-amber-50/40" : "",
                        status === "banned" ? "bg-red-50/20 opacity-75" : "",
                        status === "suspended" ? "bg-orange-50/20" : "",
                      )}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{v.name}</h4>
                          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{v.owner}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {statusBadge()}
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium font-mono", tierColors[v.tier] ?? "bg-muted text-muted-foreground")}>
                            {v.tier}
                          </span>
                        </div>
                      </div>

                      {/* Storefront Link & CAC */}
                      <div className="text-xs space-y-1.5 pt-1">
                        {isApproved && (
                          <p className="text-[11px] text-accent font-mono truncate">
                            anovra.africa/shop/{v.name.toLowerCase().replace(/\s+/g, "-")}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap text-[11px]">
                          {v.cacNumber && (
                            <span className="text-muted-foreground font-mono bg-secondary/80 px-1.5 py-0.5 rounded border border-border">
                              CAC: {v.cacNumber}
                            </span>
                          )}
                          {v.cacDocumentUrl ? (
                            <a
                              href={v.cacDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-accent hover:underline font-semibold"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View Certificate
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              CAC certificate missing
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metrics stats */}
                      <div className="grid grid-cols-3 gap-2 bg-secondary/30 p-2 rounded-lg border border-border/60 text-center">
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase font-bold block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Products</span>
                          <span className="text-xs font-semibold font-mono text-foreground">{v.products}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase font-bold block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Scans</span>
                          <span className="text-xs font-semibold font-mono text-foreground">{v.scans.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase font-bold block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>MRR</span>
                          <span className="text-xs font-semibold font-mono text-foreground">{v.mrr}</span>
                        </div>
                      </div>

                      {/* Footer & Meta Info */}
                      <div className="flex justify-between items-center gap-3 pt-2 flex-wrap">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          <Calendar className="w-3 h-3" /> Joined {v.joined}
                        </span>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {!isApproved ? (
                            <button
                              onClick={() => setVendorAction(v.id, "active")}
                              className="flex items-center gap-1 text-[11px] bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-colors font-semibold"
                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                              <Check className="w-3 h-3" /> Approve Account
                            </button>
                          ) : (
                            <div className="relative">
                              <button
                                onClick={() => setOpenDropdown(isDropOpen ? null : v.id)}
                                className="flex items-center gap-1 text-[11px] bg-secondary border border-border text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors font-medium cursor-pointer"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                              >
                                Manage Partner
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              {isDropOpen && (
                                <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
                                  <button
                                    onClick={() => {
                                      setVendorAction(v.id, "suspended");
                                      setOpenDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-orange-600 hover:bg-orange-50 transition-colors text-left"
                                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Suspend merchant
                                  </button>
                                  <button
                                    onClick={() => {
                                      setVendorAction(v.id, "banned");
                                      setOpenDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left border-t border-border"
                                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    Ban brand account
                                  </button>
                                  <button
                                    onClick={() => {
                                      setVendorAction(v.id, "removed");
                                      setOpenDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors text-left border-t border-border"
                                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Remove merchant
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredVendors.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No vendors match your search.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- REVIEWS ---- */}
        {tab === "reviews" && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Storefront reviews
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Approve customer ratings before they affect public storefront scores.
                </p>
              </div>
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {reviewsList.filter((r) => r.status === "pending").length} pending
              </span>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="divide-y divide-border">
                {reviewsList.length > 0 ? reviewsList.map((review) => {
                  const vendorProfile = vendorsList.find((vendor) => vendor.id === review.vendor_id);
                  return (
                    <div key={review.id} className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {vendorProfile?.business_name || "Vendor storefront"}
                          </p>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            review.status === "approved" ? "bg-green-50 text-green-700" :
                            review.status === "rejected" ? "bg-red-50 text-red-700" :
                            "bg-amber-50 text-amber-700"
                          )}>
                            {review.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Star key={value} className={`w-4 h-4 ${Number(review.rating) >= value ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                          ))}
                          <span className="text-xs font-mono text-muted-foreground ml-1">{review.rating}/5</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {review.review_text || "No review text provided."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 font-mono">
                          {new Date(review.created_at || Date.now()).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            const { error } = await supabase.from("storefront_reviews").update({ status: "approved" }).eq("id", review.id);
                            if (error) {
                              toast.error(error.message);
                              return;
                            }
                            const { data: customer } = await supabase.from("profiles").select("name, email").eq("id", review.customer_id).maybeSingle();
                            if (customer?.email) {
                              await sendEmailNotification("review_approved", {
                                name: customer.name || "there",
                                email: customer.email,
                              });
                            }
                            setReviewsList((prev) => prev.map((item) => item.id === review.id ? { ...item, status: "approved" } : item));
                            toast.success("Review approved.");
                          }}
                          className="px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={async () => {
                            const { error } = await supabase.from("storefront_reviews").update({ status: "rejected" }).eq("id", review.id);
                            if (error) {
                              toast.error(error.message);
                              return;
                            }
                            const { data: customer } = await supabase.from("profiles").select("name, email").eq("id", review.customer_id).maybeSingle();
                            if (customer?.email) {
                              await sendEmailNotification("review_rejected", {
                                name: customer.name || "there",
                                email: customer.email,
                              });
                            }
                            setReviewsList((prev) => prev.map((item) => item.id === review.id ? { ...item, status: "rejected" } : item));
                            toast.success("Review rejected.");
                          }}
                          className="px-3 py-1.5 bg-secondary text-foreground border border-border text-xs font-semibold rounded-lg hover:bg-muted transition-colors"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-10 text-center text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    No storefront reviews have been submitted yet.
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

            {/* Sub-tab navigation */}
            <div className="flex border-b border-border mb-6 overflow-x-auto gap-2 scrollbar-none">
              {[
                { id: "accounts", label: "Team Accounts" },
                { id: "announcements", label: "Announcements" },
                { id: "resources", label: "Resources & Docs" },
                { id: "targets", label: "Performance Targets" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setTeamSubTab(sub.id as any)}
                  className={cn(
                    "px-4 py-2 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer",
                    teamSubTab === sub.id
                      ? "border-accent text-accent"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {teamSubTab === "accounts" && (
              <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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
                  className="flex items-center justify-center gap-1.5 text-sm bg-accent text-white px-4 py-2.5 rounded-lg hover:bg-accent/90 transition-colors font-medium w-full sm:w-auto"
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
                      placeholder="e.g. Team member"
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
                      <option value="Representative">Sales Representative (Ambassador)</option>
                      <option value="Operations">Operations Staff</option>
                      <option value="Manager">Workspace Manager</option>
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
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              toast.error("ID file is too large. Maximum size is 10MB.");
                              e.target.value = "";
                              return;
                            }
                            setIdDocFile(file);
                            setTeamForm((f) => ({ ...f, idFileName: file.name }));
                          }
                        }}
                      />
                      <Upload className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: teamForm.idFileName ? "var(--accent)" : "var(--muted-foreground)" }}>
                        {teamForm.idFileName || "Upload ID document"}
                      </span>
                    </label>
                    <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>PDF, JPG, PNG (Max 10MB)</p>
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
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("Headshot image is too large. Maximum size is 5MB.");
                              e.target.value = "";
                              return;
                            }
                            setHeadshotFile(file);
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
                    <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>JPG, PNG, WEBP (Max 5MB)</p>
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
                    className="flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-1 sm:flex-initial whitespace-nowrap"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline">Create account &amp; generate login</span>
                    <span className="sm:hidden">Create account</span>
                  </button>
                  <button
                    onClick={() => setShowTeamForm(false)}
                    className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors flex-1 sm:flex-initial text-center font-medium border border-transparent hover:border-border/30"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Team member list */}
            <div className="space-y-3">
              {isLoading && (
                <div className="bg-card border border-border border-dashed rounded-xl p-10 text-center w-full my-4 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground font-medium animate-pulse" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Loading team accounts...
                  </p>
                </div>
              )}

              {isCreatingTeam && (
                <div className="bg-card border border-border border-dashed rounded-xl p-8 text-center w-full my-4 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground font-medium animate-pulse" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Saving new staff member and dispatching onboarding credentials...
                  </p>
                </div>
              )}

              {!isLoading && teamMembers.length > 0 && (
                teamMembers.map((m) => (
                  <div key={m.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
                    {(() => {
                      const src = m.headshotUrl || (m as any).headshot_url;
                      return src && !src.startsWith("blob:") ? (
                        <img
                          src={src}
                          alt={m.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-secondary"
                        />
                      ) : null;
                    })()}
                    {(!m.headshotUrl && !(m as any).headshot_url || (m.headshotUrl || (m as any).headshot_url || "").startsWith("blob:")) && (
                      <div className="w-12 h-12 rounded-full flex-shrink-0 bg-accent/10 text-accent flex items-center justify-center font-bold text-sm">
                        {m.name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "TM"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{m.name}</p>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium",
                              m.role === "Marketing" ? "bg-blue-100 text-blue-700" :
                              m.role === "Sales" || m.role === "Representative" ? "bg-accent/15 text-accent" :
                              m.role === "Manager" ? "bg-emerald-100 text-emerald-800" :
                              m.role === "Operations" ? "bg-orange-100 text-orange-800" :
                              "bg-purple-100 text-purple-700"
                            )} style={{ fontFamily: "'DM Mono', monospace" }}>
                              {m.role}
                            </span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium",
                              m.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                              {m.status === "active" ? "Active" : "Suspended"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            <span>{m.phone}</span>
                            <span>{m.email}</span>
                            <span className="font-mono">{m.username}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          <Calendar className="w-3 h-3" />
                          {new Date(m.createdAt || (m as any).created_at || Date.now()).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-border/40">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate max-w-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          <Shield className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                          <span>ID verified · </span>
                          <span className="font-mono truncate max-w-[150px] sm:max-w-[200px]" title={m.idFileName || (m as any).id_file_name}>
                            {m.idFileName || (m as any).id_file_name || "id_document.pdf"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3.5 flex-wrap">
                          <button
                            onClick={() => {
                              const creds = generateCredentials(m.name);
                              setNewCredentials({ ...creds, name: m.name });
                            }}
                            className="text-xs text-accent hover:underline font-semibold"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            Regenerate login
                          </button>
                          <button
                            onClick={async () => {
                              const newStatus = m.status === "active" ? "suspended" : "active";
                              const { error } = await supabase
                                .from("admin_team")
                                .update({ status: newStatus })
                                .eq("id", m.id);
                              if (error) {
                                toast.error(error.message);
                                return;
                              }
                              setTeamMembers((prev) =>
                                prev.map((item) => (item.id === m.id ? { ...item, status: newStatus } : item))
                              );
                              toast.success(`Account successfully ${newStatus === "active" ? "activated" : "suspended"}.`);
                            }}
                            className={cn(
                              "text-xs hover:underline font-semibold",
                              m.status === "active" ? "text-amber-600 hover:text-amber-700" : "text-green-600 hover:text-green-700"
                            )}
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            {m.status === "active" ? "Suspend" : "Activate"}
                          </button>
                          <button
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: "Remove Team Member",
                                message: `Are you sure you want to remove ${m.name} from the platform team? They will lose dashboard access immediately.`,
                                confirmText: "Remove Member",
                                type: "danger",
                                onConfirm: async () => {
                                  const { error } = await supabase
                                    .from("admin_team")
                                    .delete()
                                    .eq("id", m.id);
                                  if (error) {
                                    toast.error(error.message);
                                    return;
                                  }
                                  setTeamMembers((prev) => prev.filter((item) => item.id !== m.id));
                                  toast.success("Account successfully removed from team.");
                                  setConfirmModal((c) => ({ ...c, isOpen: false }));
                                }
                              });
                            }}
                            className="text-xs text-red-600 hover:text-red-700 hover:underline font-semibold"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {!isLoading && teamMembers.length === 0 && !isCreatingTeam && !showTeamForm && (
                <div className="bg-card border border-border border-dashed rounded-xl p-10 text-center w-full my-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    No team members added yet
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Team members will appear here when you add them. You can see added staff awaiting acceptance, and their roles will be shown once they register.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {teamSubTab === "announcements" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Team Announcements
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Publish updates, notifications, and announcements directly to all staff portals
                </p>
              </div>
              {!showAnnForm && (
                <button
                  onClick={() => setShowAnnForm(true)}
                  className="w-full sm:w-auto text-center text-xs bg-accent text-white px-3 py-2.5 rounded-lg hover:bg-accent/90 transition-colors font-semibold cursor-pointer"
                >
                  + New Announcement
                </button>
              )}
            </div>

            {showAnnForm && (
              <form onSubmit={handlePublishAnnouncement} className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-2">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">Create Announcement</h4>
                  <button type="button" onClick={() => setShowAnnForm(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">Announcement Title</label>
                  <input
                    type="text"
                    required
                    value={annForm.title}
                    onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                    placeholder="e.g. Sales targets update"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">Body Content</label>
                  <textarea
                    required
                    rows={4}
                    value={annForm.body}
                    onChange={(e) => setAnnForm({ ...annForm, body: e.target.value })}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                    placeholder="Type announcement details here..."
                  />
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAnnForm(false)}
                    className="w-full sm:w-auto text-center px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary rounded-lg transition-colors border border-transparent hover:border-border/30 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPublishingAnn}
                    className="w-full sm:w-auto text-center bg-accent text-white px-4 py-2 text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isPublishingAnn ? "Publishing..." : "Publish announcement"}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {announcements.length > 0 ? (
                announcements.map((a) => (
                  <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm text-foreground truncate max-w-full">{a.title}</h4>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(a.created_at).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed break-words">{a.body}</p>
                    </div>
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: "Delete Announcement",
                          message: `Are you sure you want to delete the announcement "${a.title}"? This cannot be undone.`,
                          confirmText: "Delete",
                          type: "danger",
                          onConfirm: () => {
                            handleDeleteAnnouncement(a.id);
                            setConfirmModal((c) => ({ ...c, isOpen: false }));
                          }
                        });
                      }}
                      className="text-muted-foreground hover:text-red-600 p-1.5 rounded hover:bg-secondary transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-border rounded-xl p-10 text-center text-sm text-muted-foreground bg-card">
                  No announcements have been published yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {teamSubTab === "resources" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Team Resources &amp; Documentation
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload and share training material, assets, and guidelines with your staff portal
                </p>
              </div>
              {!showResForm && (
                <button
                  onClick={() => setShowResForm(true)}
                  className="w-full sm:w-auto text-center text-xs bg-accent text-white px-3 py-2.5 rounded-lg hover:bg-accent/90 transition-colors font-semibold cursor-pointer"
                >
                  + Upload Resource
                </button>
              )}
            </div>

            {showResForm && (
              <form onSubmit={handleAddResource} className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-2">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">Upload Resource</h4>
                  <button type="button" onClick={() => setShowResForm(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">Resource Title</label>
                    <input
                      type="text"
                      required
                      value={resForm.title}
                      onChange={(e) => setResForm({ ...resForm, title: e.target.value })}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                      placeholder="e.g. Vendor onboarding guide"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">Short Description</label>
                    <input
                      type="text"
                      value={resForm.description}
                      onChange={(e) => setResForm({ ...resForm, description: e.target.value })}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                      placeholder="Brief description of file contents"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">Select File</label>
                    <input
                      type="file"
                      required
                      onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-muted-foreground file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accent/15 file:text-accent hover:file:bg-accent/25 file:cursor-pointer"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">PDF, JPG, PNG, DOCX, ZIP files supported (Max 10MB)</p>
                  </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowResForm(false)}
                    className="w-full sm:w-auto text-center px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary rounded-lg transition-colors border border-transparent hover:border-border/30 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingRes}
                    className="w-full sm:w-auto text-center bg-accent text-white px-4 py-2 text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isUploadingRes ? "Uploading..." : "Upload resource"}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {resources.length > 0 ? (
                resources.map((r) => (
                  <div key={r.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-foreground truncate max-w-full">{r.title}</h4>
                        <p className="text-xs text-muted-foreground break-words">{r.description || "No description provided"}</p>
                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground font-mono mt-1.5">
                          <span className="bg-secondary px-1.5 py-0.5 rounded">{r.file_type}</span>
                          <span>·</span>
                          <span>{r.file_size}</span>
                          <span>·</span>
                          <a href={r.file_url} target="_blank" rel="noreferrer" className="text-accent hover:underline inline-flex items-center gap-0.5 font-semibold">
                            View File <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setConfirmModal({
                          isOpen: true,
                          title: "Delete Resource",
                          message: `Are you sure you want to delete "${r.title}"? This will remove the file from all staff portals immediately.`,
                          confirmText: "Delete",
                          type: "danger",
                          onConfirm: () => {
                            handleDeleteResource(r.id);
                            setConfirmModal((c) => ({ ...c, isOpen: false }));
                          }
                        });
                      }}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-muted-foreground hover:text-red-600 p-2 sm:p-1.5 rounded border border-border sm:border-transparent hover:bg-secondary transition-colors cursor-pointer flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs sm:hidden font-semibold">Delete Resource</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-border rounded-xl p-10 text-center text-sm text-muted-foreground bg-card">
                  No training resources have been uploaded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Targets Tab */}
        {teamSubTab === "targets" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                Performance Targets Management
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set and manage monthly key performance indicator targets for staff field officers
              </p>
            </div>

            {editingTargetsMember && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="bg-foreground text-primary-foreground p-5">
                    <h3 className="text-lg font-light" style={{ fontFamily: "'Fraunces', serif" }}>
                      Edit Targets: {editingTargetsMember.name}
                    </h3>
                    <p className="text-xs text-white/50 mt-1">Set monthly goal levels for the current period</p>
                  </div>
                  <form onSubmit={handleSaveTargets} className="p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">Vendors Onboarded Target</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={targetForm.vendors_onboarded}
                        onChange={(e) => setTargetForm({ ...targetForm, vendors_onboarded: Number(e.target.value) })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">Scans via Link Target</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={targetForm.scans_via_link}
                        onChange={(e) => setTargetForm({ ...targetForm, scans_via_link: Number(e.target.value) })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">Revenue generated Target (₦)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={targetForm.revenue_generated}
                        onChange={(e) => setTargetForm({ ...targetForm, revenue_generated: Number(e.target.value) })}
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingTargetsMember(null)}
                        className="w-full sm:w-auto text-center px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary rounded-lg transition-colors border border-transparent hover:border-border/30 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={targetForm.saving}
                        className="w-full sm:w-auto text-center bg-accent text-white px-4 py-2 text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {targetForm.saving ? "Saving..." : "Save targets"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="divide-y divide-border">
                {teamMembers.length > 0 ? (
                  teamMembers.map((m) => {
                    const mTargets = targets.filter((t) => t.team_member_id === m.id);
                    const vendorsTarget = mTargets.find((t) => t.metric === "vendors_onboarded")?.target || 0;
                    const scansTarget = mTargets.find((t) => t.metric === "scans_via_link")?.target || 0;
                    const revTarget = mTargets.find((t) => t.metric === "revenue_generated")?.target || 0;

                    return (
                      <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm text-foreground">{m.name}</h4>
                          <p className="text-xs text-muted-foreground">{m.role}</p>
                          <div className="flex flex-wrap gap-x-2 gap-y-1.5 text-[10px] text-muted-foreground font-mono mt-2">
                            <span className="bg-secondary px-1.5 py-0.5 rounded border border-border">Vendors Goal: {vendorsTarget}</span>
                            <span className="bg-secondary px-1.5 py-0.5 rounded border border-border">Scans Goal: {scansTarget}</span>
                            <span className="bg-secondary px-1.5 py-0.5 rounded border border-border">Revenue Goal: ₦{Number(revTarget).toLocaleString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setEditingTargetsMember(m);
                            setTargetForm({
                              vendors_onboarded: Number(vendorsTarget),
                              scans_via_link: Number(scansTarget),
                              revenue_generated: Number(revTarget),
                              saving: false,
                            });
                          }}
                          className="w-full sm:w-auto text-center text-xs text-accent hover:underline font-semibold bg-accent/10 hover:bg-accent/15 px-3 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          Edit Targets
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">No team members found.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )}


        {tab === "payments" && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Subscription Transactions
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Monitor vendor payment logs and merchant plans verified by Paystack checkout integrations.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto flex-shrink-0">
                <div className="relative w-full sm:w-52">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-input-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-full"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
                <button
                  onClick={downloadPaymentsCSV}
                  className="flex items-center justify-center gap-1.5 text-sm bg-accent text-white px-3.5 py-2.5 rounded-lg hover:bg-accent/90 transition-colors cursor-pointer w-full sm:w-auto font-medium"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary text-xs font-semibold text-muted-foreground border-b border-border" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <th className="p-4">Transaction Reference</th>
                      <th className="p-4">Vendor</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Billing Plan</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((p) => {
                        const vendor = vendorsList.find((v) => v.id === p.vendor_id);
                        return (
                          <tr key={p.id} className="hover:bg-secondary/40 transition-colors">
                            <td className="p-4 font-mono text-xs text-foreground font-semibold">{p.reference || p.id.slice(0, 8)}</td>
                            <td className="p-4">
                              <div className="font-medium text-foreground">{vendor?.business_name || "Unknown Business"}</div>
                              <div className="text-xs text-muted-foreground">{vendor?.email || "No Email"}</div>
                            </td>
                            <td className="p-4 font-semibold text-foreground">
                              {p.currency === "NGN" ? "₦" : "$"}
                              {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-4">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-accent/10 text-accent uppercase font-mono">
                                {p.tier_name || "Vendor Pro"}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-muted-foreground">
                              {new Date(p.created_at || Date.now()).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                "text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1",
                                p.status === "success" || p.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", p.status === "success" || p.status === "completed" ? "bg-green-600 animate-pulse" : "bg-amber-50")} />
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground text-xs">
                          No payment transactions recorded in the database yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---- ONBOARDING REQUESTS ---- */}
        {tab === "onboarding" && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Merchant Onboarding Tickets
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Manage store setups, catalog upload requests, and customer support tickets filed by vendor merchants.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {onboardingRequests.length > 0 ? (
                onboardingRequests.map((req) => {
                  const vendor = vendorsList.find((v) => v.id === req.vendor_id);
                  return (
                    <div key={req.id} className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 bg-secondary text-foreground rounded-md font-mono">
                            {req.request_type || "brand_onboarding"}
                          </span>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium text-capitalize",
                            req.status === "pending" ? "bg-amber-100 text-amber-700" :
                            req.status === "contacted" ? "bg-blue-100 text-blue-700" :
                            req.status === "scheduled" ? "bg-purple-100 text-purple-700" :
                            req.status === "completed" ? "bg-green-100 text-green-700" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {req.status}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            Filed {new Date(req.created_at).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                        <h4 className="font-semibold text-foreground text-sm mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {vendor?.business_name || "Unknown Merchant"}
                        </h4>
                        <p className="text-xs text-muted-foreground font-mono mb-2">
                          Merchant Email: {vendor?.email || "No Email"}
                        </p>
                        <div className="bg-secondary/40 border border-border/50 rounded-lg p-3 text-xs text-foreground max-w-2xl leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {req.notes || "No additional notes provided by merchant."}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-2 md:self-center shrink-0">
                        <select
                          value={req.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            const { error } = await supabase
                              .from("onboarding_requests")
                              .update({ status: newStatus })
                              .eq("id", req.id);
                            if (error) {
                              toast.error(error.message);
                              return;
                            }
                            setOnboardingRequests((prev) =>
                              prev.map((item) => (item.id === req.id ? { ...item, status: newStatus } : item))
                            );
                            toast.success(`Ticket status updated to ${newStatus}`);
                          }}
                          className="bg-card border border-border rounded-lg text-xs font-semibold px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-card border border-border border-dashed rounded-xl p-10 text-center w-full my-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    No onboarding requests found
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    When brand owners submit onboarding requests, they will populate here in real-time.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- SYSTEM LOGS ---- */}
        {tab === "logs" && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Operational Activity Logs
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Audit outbound notification logs and webhook integrations to verify platform communications.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Email Delivery logs */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground text-sm mb-3 border-b border-border pb-2.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Email Onboarding Logs
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {emailLogs.length > 0 ? (
                    emailLogs.map((log) => (
                      <div key={log.id} className="bg-secondary/40 border border-border/40 rounded-lg p-3 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-foreground truncate max-w-[150px]">{log.recipient}</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-mono",
                            log.status === "success" || log.status === "sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {log.status}
                          </span>
                        </div>
                        <div className="text-muted-foreground mb-1"><strong className="text-foreground">Subject:</strong> {log.subject}</div>
                        {log.error_message && (
                          <div className="text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200/50 rounded p-1.5 mt-1 font-mono">
                            Err: {log.error_message}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground text-right mt-1 font-mono">
                          {new Date(log.created_at).toLocaleTimeString()} · {new Date(log.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-8">No Resend notification logs recorded.</p>
                  )}
                </div>
              </div>

              {/* Webhook Delivery logs */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground text-sm mb-3 border-b border-border pb-2.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Verification Webhook Logs
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {webhookLogs.length > 0 ? (
                    webhookLogs.map((log) => (
                      <div key={log.id} className="bg-secondary/40 border border-border/40 rounded-lg p-3 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-foreground font-semibold">Status Code: {log.response_status || "N/A"}</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-mono",
                            log.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {log.success ? "success" : "failed"}
                          </span>
                        </div>
                        {log.error_message && (
                          <div className="text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200/50 rounded p-1.5 mb-1.5 font-mono">
                            {log.error_message}
                          </div>
                        )}
                        <div className="text-muted-foreground max-h-20 overflow-y-auto p-1 bg-code-background rounded font-mono text-[10px] bg-secondary/80 border border-border">
                          Response: {log.response_body || "Empty body response."}
                        </div>
                        <div className="text-[10px] text-muted-foreground text-right mt-1 font-mono">
                          {new Date(log.created_at).toLocaleTimeString()} · {new Date(log.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-8">No external API webhook events logged.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
        </main>
        </div>
      </div>

      {/* PREMIUM CONFIRM MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 flex items-start gap-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                confirmModal.type === "danger" ? "bg-red-100 text-red-600" :
                confirmModal.type === "warning" ? "bg-amber-100 text-amber-600" :
                "bg-blue-100 text-blue-600"
              )}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {confirmModal.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {confirmModal.message}
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-secondary/40 border-t border-border flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmModal((c) => ({ ...c, isOpen: false }))}
                className="px-4 py-2 border border-border rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {confirmModal.cancelText || "Cancel"}
              </button>
              <button
                onClick={() => confirmModal.onConfirm()}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors cursor-pointer",
                  confirmModal.type === "danger" ? "bg-red-600 hover:bg-red-700" :
                  confirmModal.type === "warning" ? "bg-amber-600 hover:bg-amber-700" :
                  "bg-accent hover:bg-accent/90"
                )}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD INGREDIENT MODAL */}
      {showAddIngModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                {editingIngredient !== null ? "Edit Safety Ingredient" : "Add New Safety Ingredient"}
              </h3>
              <button 
                onClick={() => {
                  setShowAddIngModal(false);
                  setEditingIngredient(null);
                  setIngName("");
                  setIngFunction("");
                  setIngStatus("safe");
                  setIngScope("Global");
                  setIngMaxConc("No limit");
                  setIngNotes("");
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Salicylic Acid"
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Function *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acne treatment"
                    value={ingFunction}
                    onChange={(e) => setIngFunction(e.target.value)}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Safety Status *
                  </label>
                  <select
                    value={ingStatus}
                    onChange={(e) => setIngStatus(e.target.value as any)}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <option value="safe">Safe (Approved)</option>
                    <option value="caution">Caution (Warnings apply)</option>
                    <option value="restricted">Restricted (Concentration limits)</option>
                    <option value="banned">Banned (Globally prohibited)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Regulatory Scope
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Global + NAFDAC"
                    value={ingScope}
                    onChange={(e) => setIngScope(e.target.value)}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Max Concentration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2% OTC"
                    value={ingMaxConc}
                    onChange={(e) => setIngMaxConc(e.target.value)}
                    className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Regulatory &amp; Advisory Notes
                </label>
                <textarea
                  placeholder="Enter details on safety profiles, warnings, side effects, or chemical background."
                  value={ingNotes}
                  onChange={(e) => setIngNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-input-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-secondary/50">
              <button
                onClick={() => {
                  setShowAddIngModal(false);
                  setEditingIngredient(null);
                  setIngName("");
                  setIngFunction("");
                  setIngStatus("safe");
                  setIngScope("Global");
                  setIngMaxConc("No limit");
                  setIngNotes("");
                }}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddIngredientSubmit}
                disabled={isSavingIng || !ingName.trim() || !ingFunction.trim()}
                className="bg-accent text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {isSavingIng ? "Saving..." : (editingIngredient !== null ? "Update Ingredient" : "Add to Database")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT TRANSACTION DETAIL MODAL */}
      {selectedPayment && (() => {
        const vendor = vendorsList.find(v => v.id === selectedPayment.vendor_id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]">
            <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Payment Details
                </h3>
                <button 
                  onClick={() => setSelectedPayment(null)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-center flex-col items-center py-4 bg-secondary/30 rounded-xl border border-border mb-2">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Transaction Amount</span>
                  <p className="text-3xl font-bold text-foreground font-mono">
                    ₦{Number(selectedPayment.amount || 0).toLocaleString()}
                  </p>
                  <span className="mt-2 text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-3 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                    {selectedPayment.status || "success"}
                  </span>
                </div>

                <div className="space-y-3 divide-y divide-border/60 text-sm">
                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Skincare Brand</span>
                    <span className="font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{vendor?.business_name || "Unknown vendor"}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Brand Owner</span>
                    <span className="text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{vendor?.name || "Vendor Partner"}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Email Address</span>
                    <span className="text-foreground font-mono">{vendor?.email || "No email"}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Subscribed Tier</span>
                    <span className="text-foreground capitalize font-bold">{selectedPayment.plan || "Premium"}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Paystack Ref</span>
                    <span className="text-foreground font-mono text-xs">{selectedPayment.reference || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <span className="text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Transaction Date</span>
                    <span className="text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {new Date(selectedPayment.created_at || Date.now()).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border flex justify-end bg-secondary/50">
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="w-full bg-accent text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-accent/90 transition-colors cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* BACK TO TOP FLOATING ACTION BUTTON */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "fixed bottom-6 right-6 z-40 p-3 bg-accent text-white rounded-full shadow-lg transition-all duration-300 hover:bg-accent/95 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring active:scale-95 cursor-pointer flex items-center justify-center border border-accent/20",
          showBackToTop ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-75 pointer-events-none"
        )}
        aria-label="Back to top"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}
