import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import {
  Activity, AlertCircle, ArrowRight, ArrowUpRight, BarChart2, Building2, Check, CheckCircle2, ChevronRight, Copy, CreditCard, Edit,
  ExternalLink, Eye, Filter, GripVertical, HelpCircle, Image as ImageIcon, Info, LayoutDashboard, LayoutGrid, Link as LinkIcon, List, Loader2,
  LogOut, Mail, MapPin, Menu, Package, PanelLeftClose, PanelLeftOpen, Phone, Plus, RefreshCw, Scan, Search, ShieldCheck, Sparkles,
  Tag, Trash2, Upload, Users, X,
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { supabase } from "./utils/supabase";
import { toast } from "sonner";
import { UnifiedDashboardHeader } from "./components/UnifiedDashboardHeader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip";

type BrandTab = "overview" | "branches" | "products" | "activity";
type ProductFormState = {
  id: string;
  branchId: string;
  name: string;
  brand: string;
  price: string;
  category: string;
  imageUrl: string;
  description: string;
};
type BranchEditState = {
  branchId: string;
  branchName: string;
  branchEmail: string;
  location: string;
  phone: string;
};
type CreatedBranchState = {
  name: string;
  email: string;
  password?: string;
  shop?: string;
  scan?: string;
  emailSent?: boolean;
};

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function getFunctionErrorMessage(error: any, fallback: string) {
  const rawMessage = error?.message || "";
  let detail = rawMessage;

  try {
    if (error?.context instanceof Response) {
      const payload = await error.context.clone().json();
      detail = payload?.error || payload?.message || detail;
    }
  } catch {
    // Keep the original Supabase message when the function body is not JSON.
  }

  const lower = detail.toLowerCase();
  if (lower.includes("already") && (lower.includes("registered") || lower.includes("exists") || lower.includes("email"))) {
    return "This email address is already connected to an Anovra account. Use a different branch email or edit the existing branch instead.";
  }
  if (lower.includes("valid branch email") || lower.includes("valid email")) {
    return "Enter a valid branch email address.";
  }
  if (lower.includes("branch name")) {
    return "Enter the branch name before creating the account.";
  }
  if (lower.includes("only brand admins")) {
    return "Only Brand HQ admins can create or manage branches.";
  }
  if (lower.includes("branch membership not found")) {
    return "This branch could not be found under your Brand HQ account.";
  }

  return detail && !detail.includes("non-2xx") ? detail : fallback;
}

export function BrandDashboardView({ setView }: { setView: (v: View) => void }) {
  const [tab, setTab] = useState<BrandTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState("");
  const [brandProfile, setBrandProfile] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchProfiles, setBranchProfiles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingBranchId, setSavingBranchId] = useState("");
  const [deletingProductId, setDeletingProductId] = useState("");
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [editingBranch, setEditingBranch] = useState<BranchEditState | null>(null);
  const [createdBranch, setCreatedBranch] = useState<CreatedBranchState | null>(null);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [branchPanelHidden, setBranchPanelHidden] = useState(false);
  const [branchPanelWidth, setBranchPanelWidth] = useState(360);
  const [form, setForm] = useState({
    branchName: "",
    branchEmail: "",
    location: "",
    phone: "",
    password: "",
  });
  const blankProductForm: ProductFormState = {
    id: "",
    branchId: "",
    name: "",
    brand: "",
    price: "",
    category: "Skincare",
    imageUrl: "",
    description: "",
  };
  const [productForm, setProductForm] = useState<ProductFormState>(blankProductForm);

  const brandSlug = slugify(brandProfile?.slug || brandProfile?.business_name || brandProfile?.name || "brand");
  const brandUrl = `https://anovra.africa/#/brand/${brandSlug}`;
  const navItems = [
    { id: "overview" as BrandTab, label: "Overview", icon: LayoutDashboard },
    { id: "branches" as BrandTab, label: "Branches", icon: Building2 },
    { id: "products" as BrandTab, label: "Products", icon: Package },
    { id: "activity" as BrandTab, label: "Activity", icon: Activity },
  ];

  const selectTab = (nextTab: BrandTab) => {
    setTab(nextTab);
    setMobileMenuOpen(false);
  };

  const loadBrandData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setView("signin");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      setBrandProfile(profile);

      const { data: branchRows, error: branchError } = await supabase
        .from("brand_branches")
        .select("*")
        .eq("brand_id", user.id)
        .order("created_at", { ascending: false });
      if (branchError) throw branchError;

      const rows = branchRows || [];
      setBranches(rows);
      const branchIds = rows.map((branch: any) => branch.branch_id).filter(Boolean);
      if (!branchIds.length) {
        setBranchProfiles([]);
        setProducts([]);
        setScans([]);
        setPayments([]);
        return;
      }

      const [profileRes, productRes, scanRes, paymentRes] = await Promise.all([
        supabase.from("profiles").select("*").in("id", branchIds),
        supabase.from("products").select("*").in("vendor_id", branchIds),
        supabase.from("scans").select("*").in("vendor_id", branchIds).order("created_at", { ascending: false }),
        supabase.from("payments").select("*").in("vendor_id", branchIds).order("created_at", { ascending: false }),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (productRes.error) throw productRes.error;
      if (scanRes.error) throw scanRes.error;
      if (paymentRes.error) throw paymentRes.error;

      setBranchProfiles(profileRes.data || []);
      setProducts(productRes.data || []);
      setScans(scanRes.data || []);
      setPayments(paymentRes.data || []);
    } catch (error: any) {
      toast.error(error.message || "Could not load brand workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrandData();
  }, []);

  useEffect(() => {
    if (!productForm.branchId && branches.length) {
      const firstActiveBranch = branches.find((branch) => branch.status === "active") || branches[0];
      setProductForm((prev) => ({ ...prev, branchId: firstActiveBranch.branch_id }));
    }
    if (!selectedBranchId && branches.length) {
      setSelectedBranchId(branches[0].branch_id);
    }
  }, [branches, productForm.branchId]);

  const enrichedBranches = useMemo(() => {
    return branches.map((branch) => {
      const profile = branchProfiles.find((item) => item.id === branch.branch_id) || {};
      const branchProducts = products.filter((product) => product.vendor_id === branch.branch_id);
      const branchScans = scans.filter((scan) => scan.vendor_id === branch.branch_id);
      const branchPayments = payments.filter((payment) => payment.vendor_id === branch.branch_id);
      const revenue = branchPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const slug = branch.branch_slug || profile.slug || slugify(branch.branch_name);
      return {
        ...branch,
        profile,
        slug,
        productRows: branchProducts,
        scanRows: branchScans,
        paymentRows: branchPayments,
        products: branchProducts.length,
        approvedProducts: branchProducts.filter((product) => product.nafdac_status === "approved").length,
        scans: branchScans.length,
        revenue,
        shopUrl: `https://anovra.africa/#/shop/${slug}`,
        scanUrl: `https://anovra.africa/#/scan/${slug}`,
      };
    });
  }, [branches, branchProfiles, products, scans, payments]);

  const stats = [
    { label: "Branches", value: String(branches.length), sub: `${branches.filter((b) => b.status === "active").length} active`, icon: Building2 },
    { label: "Products", value: String(products.length), sub: `${products.filter((p) => p.nafdac_status === "approved").length} approved`, icon: Package },
    { label: "Customer scans", value: String(scans.length), sub: "Across all branches", icon: Scan },
    { label: "Revenue tracked", value: `₦${payments.reduce((sum, p) => sum + Number(p.amount || 0), 0).toLocaleString()}`, sub: "Successful branch payments", icon: BarChart2 },
  ];

  const copy = async (value: string, key: string) => {
    await navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 1800);
  };

  const startBranchPanelResize = (event: any) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = branchPanelWidth;
    const handleMove = (moveEvent: PointerEvent) => {
      const nextWidth = startWidth + moveEvent.clientX - startX;
      setBranchPanelWidth(Math.min(500, Math.max(300, nextWidth)));
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const createBranch = async () => {
    if (form.branchName.trim().length < 2 || !form.branchEmail.includes("@")) {
      toast.error("Enter a branch name and valid email address.");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-brand-branch", {
        body: {
          action: "create",
          branchName: form.branchName,
          branchEmail: form.branchEmail,
          location: form.location,
          phone: form.phone,
          password: form.password || undefined,
        },
      });
      if (error) throw new Error(await getFunctionErrorMessage(error, "Could not create branch account."));
      setForm({ branchName: "", branchEmail: "", location: "", phone: "", password: "" });
      setCreatedBranch({
        name: data?.branch?.branch_name || form.branchName,
        email: data?.credentials?.email || form.branchEmail,
        password: data?.credentials?.password,
        shop: data?.links?.shop,
        scan: data?.links?.scan,
        emailSent: Boolean(data?.email_sent),
      });
      setShowCreateBranch(false);
      toast.success("Branch account created. Login details are ready.");
      await loadBrandData();
    } catch (error: any) {
      toast.error(error.message || "Could not create branch.");
    } finally {
      setCreating(false);
    }
  };

  const updateBranchStatus = async (branchId: string, status: "active" | "inactive" | "suspended") => {
    if (status !== "active") {
      const label = status === "suspended" ? "suspend this branch" : "remove this branch from active access";
      const confirmed = window.confirm(`Are you sure you want to ${label}? The branch team will not be able to sign in while this status is applied.`);
      if (!confirmed) return;
    }

    setSavingBranchId(branchId);
    try {
      const { error } = await supabase.functions.invoke("manage-brand-branch", {
        body: { action: "update", branchId, status },
      });
      if (error) throw new Error(await getFunctionErrorMessage(error, "Could not update branch access."));
      toast.success(status === "active" ? "Branch access restored." : "Branch access updated.");
      await loadBrandData();
    } catch (error: any) {
      toast.error(error.message || "Could not update branch.");
    } finally {
      setSavingBranchId("");
    }
  };

  const openBranchEdit = (branch: any) => {
    setEditingBranch({
      branchId: branch.branch_id,
      branchName: branch.branch_name || "",
      branchEmail: branch.branch_email || "",
      location: branch.location || "",
      phone: branch.phone || "",
    });
    setSelectedBranchId(branch.branch_id);
  };

  const saveBranchEdits = async () => {
    if (!editingBranch) return;
    if (editingBranch.branchName.trim().length < 2 || !editingBranch.branchEmail.includes("@")) {
      toast.error("Enter a branch name and valid email address.");
      return;
    }

    setSavingBranchId(editingBranch.branchId);
    try {
      const { error } = await supabase.functions.invoke("manage-brand-branch", {
        body: {
          action: "update",
          branchId: editingBranch.branchId,
          branchName: editingBranch.branchName,
          branchEmail: editingBranch.branchEmail,
          location: editingBranch.location,
          phone: editingBranch.phone,
        },
      });
      if (error) throw new Error(await getFunctionErrorMessage(error, "Could not update branch information."));
      toast.success("Branch information updated.");
      setEditingBranch(null);
      await loadBrandData();
    } catch (error: any) {
      toast.error(error.message || "Could not update branch information.");
    } finally {
      setSavingBranchId("");
    }
  };

  const resetProductForm = (branchId = productForm.branchId) => {
    setProductForm({ ...blankProductForm, branchId });
    setProductImageFile(null);
  };

  const uploadProductImage = async () => {
    if (productImageFile) {
      const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
      if (!allowedMimes.includes(productImageFile.type.toLowerCase()) && !productImageFile.type.startsWith("image/")) {
        throw new Error("Upload a valid product image (PNG, JPG, WEBP, or GIF).");
      }
      if (productImageFile.size > 5 * 1024 * 1024) {
        throw new Error("Product image must be 5MB or smaller.");
      }

      const fileExt = productImageFile.name.split(".").pop() || "jpg";
      const fileName = `brand-hq/${productForm.branchId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, productImageFile, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName);
      return publicUrl;
    }

    const trimmedUrl = productForm.imageUrl?.trim() || "";
    if (!trimmedUrl || trimmedUrl === "https://" || trimmedUrl === "http://") {
      return null;
    }

    if (!trimmedUrl.startsWith("https://")) {
      throw new Error("Product image URL must start with https://");
    }

    try {
      new URL(trimmedUrl);
    } catch {
      throw new Error("Please provide a valid https:// image URL.");
    }

    return trimmedUrl;
  };

  const saveBranchProduct = async () => {
    if (!productForm.branchId) {
      toast.error("Create or select a branch before adding products.");
      return;
    }
    if (productForm.name.trim().length < 2) {
      toast.error("Enter a product name.");
      return;
    }

    const price = Number(productForm.price.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a valid product price.");
      return;
    }

    setSavingProduct(true);
    try {
      const selectedBranch = branches.find((branch) => branch.branch_id === productForm.branchId);
      if (!selectedBranch) throw new Error("Selected branch could not be found.");
      if (selectedBranch.status !== "active") throw new Error("Products can only be added to active branches.");
      const imageUrl = await uploadProductImage();

      const payload = {
        vendor_id: productForm.branchId,
        name: productForm.name.trim(),
        brand: productForm.brand.trim() || brandProfile?.business_name || "Brand catalogue",
        price,
        category: productForm.category.trim() || "Skincare",
        description: productForm.description.trim(),
        image_url: imageUrl,
        nafdac_status: "pending",
      };

      const request = productForm.id
        ? supabase.from("products").update(payload).eq("id", productForm.id).eq("vendor_id", productForm.branchId)
        : supabase.from("products").insert([payload]);
      const { error } = await request;
      if (error) throw error;

      resetProductForm(productForm.branchId);
      toast.success(productForm.id ? "Product updated for Anovra safety review." : "Product added for Anovra safety review.");
      await loadBrandData();
    } catch (error: any) {
      toast.error(error.message || "Could not save product.");
    } finally {
      setSavingProduct(false);
    }
  };

  const editProduct = (product: any) => {
    setProductForm({
      id: product.id,
      branchId: product.vendor_id,
      name: product.name || "",
      brand: product.brand || "",
      price: String(product.price || ""),
      category: product.category || "Skincare",
      imageUrl: product.image_url || "",
      description: product.description || "",
    });
    setProductImageFile(null);
    setTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = async (product: any) => {
    const confirmed = window.confirm(`Delete ${product.name}? This removes it from the branch catalogue.`);
    if (!confirmed) return;

    setDeletingProductId(product.id);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id)
        .eq("vendor_id", product.vendor_id);
      if (error) throw error;
      if (productForm.id === product.id) resetProductForm(productForm.branchId);
      toast.success("Product deleted.");
      await loadBrandData();
    } catch (error: any) {
      toast.error(error.message || "Could not delete product.");
    } finally {
      setDeletingProductId("");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setView("landing");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading brand workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <UnifiedDashboardHeader
        currentView="branddashboard"
        setView={setView}
        title={brandProfile?.business_name || brandProfile?.name || "Brand Dashboard"}
        subtitle="Manage branches, sales, scans, and catalogue activity across your organisation"
        badgeText="Brand Admin"
        role="admin"
        showShopLink={false}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <div className="lg:hidden mb-4 flex items-center justify-between gap-3 bg-card border border-border rounded-2xl p-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Brand workspace</p>
            <p className="text-sm font-semibold text-foreground truncate">{brandProfile?.business_name || brandProfile?.name}</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shrink-0"
            aria-label="Open brand menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              className="absolute inset-0 bg-black/45"
              aria-label="Close brand menu"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-[min(86vw,320px)] bg-card border-r border-border shadow-2xl p-4 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between mb-4">
                <img src="/logo.png" alt="Anovra" className="h-11 w-auto object-contain" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center"
                  aria-label="Close brand menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <BrandSidebar
                brandName={brandProfile?.business_name || brandProfile?.name}
                navItems={navItems}
                tab={tab}
                copied={copied}
                brandUrl={brandUrl}
                copy={copy}
                setTab={selectTab}
                signOut={signOut}
              />
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[248px_1fr] gap-6 items-start">
          <aside className="hidden lg:block self-start lg:sticky lg:top-24 h-[calc(100vh-7.5rem)] bg-card border border-border rounded-2xl p-3 flex flex-col justify-between overflow-hidden shadow-xs">
            <BrandSidebar
              brandName={brandProfile?.business_name || brandProfile?.name}
              navItems={navItems}
              tab={tab}
              copied={copied}
              brandUrl={brandUrl}
              copy={copy}
              setTab={selectTab}
              signOut={signOut}
            />
          </aside>

          <main className="space-y-6">
            {tab === "overview" && (
              <>
                <section className="bg-card border border-border rounded-2xl p-5 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Organisation command centre</p>
                      <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1" style={{ fontFamily: "'Fraunces', serif" }}>
                        Branch performance at a glance
                      </h2>
                      <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                        Add branches once, let each branch operate as a vendor, and monitor scans, products, and sales from one brand-level dashboard.
                      </p>
                    </div>
                    <button onClick={() => { setTab("branches"); setShowCreateBranch(true); }} className="inline-flex items-center justify-center gap-2 bg-accent text-white px-4 py-3 rounded-xl text-sm font-semibold">
                      <Plus className="w-4 h-4" />
                      Add branch
                    </button>
                  </div>
                </section>

                <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                        <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-3">
                          <Icon className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-light text-foreground mt-1" style={{ fontFamily: "'Fraunces', serif" }}>{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                      </div>
                    );
                  })}
                </section>

                <OverviewBranchDirectory
                  branches={enrichedBranches}
                  onSelectBranch={(branchId) => {
                    setSelectedBranchId(branchId);
                    setTab("branches");
                  }}
                  onAddBranch={() => {
                    setTab("branches");
                    setShowCreateBranch(true);
                  }}
                  onViewAll={() => setTab("branches")}
                  copy={copy}
                  copied={copied}
                />
              </>
            )}

            {tab === "branches" && (
              <div className="space-y-6">
                <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Branch network</p>
                      <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1" style={{ fontFamily: "'Fraunces', serif" }}>
                        Manage every branch from one place
                      </h2>
                      <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                        Create branch accounts, share their shop and scan links, control access, and review each branch's catalogue, sales, and scan activity.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowCreateBranch((value) => !value);
                        setEditingBranch(null);
                      }}
                      className="inline-flex items-center justify-center gap-2 bg-accent text-white px-4 py-3 rounded-xl text-sm font-semibold self-start xl:self-auto"
                    >
                      {showCreateBranch ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {showCreateBranch ? "Close form" : "Add branch"}
                    </button>
                  </div>
                </section>

                {createdBranch && (
                  <BranchCreatedCard
                    branch={createdBranch}
                    copied={copied}
                    copy={copy}
                    onDismiss={() => setCreatedBranch(null)}
                  />
                )}

                {showCreateBranch && (
                <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">New branch</p>
                      <h2 className="text-xl sm:text-2xl font-light text-foreground mt-1" style={{ fontFamily: "'Fraunces', serif" }}>Create branch account</h2>
                      <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                        Add a branch, outlet, or distributor under this Brand HQ. The branch receives vendor access, a storefront, and a dedicated skin test link.
                      </p>
                    </div>
                    <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-accent/10 text-accent items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <Input label="Branch name" value={form.branchName} onChange={(value) => setForm((prev) => ({ ...prev, branchName: value }))} placeholder="Tulip Abuja" />
                    <Input label="Branch email" value={form.branchEmail} onChange={(value) => setForm((prev) => ({ ...prev, branchEmail: value }))} placeholder="abuja@brand.com" />
                    <Input label="Location" value={form.location} onChange={(value) => setForm((prev) => ({ ...prev, location: value }))} placeholder="Abuja, Nigeria" />
                    <Input label="Phone" value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} placeholder="+234..." />
                    <Input label="Temporary password" value={form.password} onChange={(value) => setForm((prev) => ({ ...prev, password: value }))} placeholder="Auto-generate if blank" />
                    <div className="rounded-xl bg-muted/40 border border-border p-3 flex items-start gap-3">
                      <Mail className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        The branch gets an email with its login details when email delivery is configured.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={createBranch}
                    disabled={creating}
                    className="mt-4 inline-flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create branch account
                  </button>
                </section>
                )}

                {editingBranch && (
                  <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Branch profile</p>
                        <h2 className="text-xl sm:text-2xl font-light text-foreground mt-1" style={{ fontFamily: "'Fraunces', serif" }}>
                          Edit branch information
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                          Keep the branch record, storefront label, and branch login email aligned from Brand HQ.
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingBranch(null)}
                        className="w-9 h-9 rounded-xl bg-muted text-foreground flex items-center justify-center self-start"
                        aria-label="Close branch editor"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                      <Input label="Branch name" value={editingBranch.branchName} onChange={(value) => setEditingBranch((prev) => prev ? { ...prev, branchName: value } : prev)} placeholder="Tulip Abuja" />
                      <Input label="Branch email" value={editingBranch.branchEmail} onChange={(value) => setEditingBranch((prev) => prev ? { ...prev, branchEmail: value } : prev)} placeholder="abuja@brand.com" />
                      <Input label="Location" value={editingBranch.location} onChange={(value) => setEditingBranch((prev) => prev ? { ...prev, location: value } : prev)} placeholder="Abuja, Nigeria" />
                      <Input label="Phone" value={editingBranch.phone} onChange={(value) => setEditingBranch((prev) => prev ? { ...prev, phone: value } : prev)} placeholder="+234..." />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        onClick={saveBranchEdits}
                        disabled={savingBranchId === editingBranch.branchId}
                        className="inline-flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
                      >
                        {savingBranchId === editingBranch.branchId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Save changes
                      </button>
                      <button onClick={() => setEditingBranch(null)} className="inline-flex items-center justify-center gap-2 bg-muted text-foreground px-4 py-2.5 rounded-xl text-sm font-semibold">
                        Cancel
                      </button>
                    </div>
                  </section>
                )}
                <div
                  className={cn(
                    "grid gap-4 items-start",
                    branchPanelHidden ? "xl:grid-cols-1" : "xl:grid-cols-[var(--branch-panel-width)_12px_minmax(0,1fr)]"
                  )}
                  style={{ "--branch-panel-width": `${branchPanelWidth}px` } as any}
                >
                  {!branchPanelHidden && (
                    <BranchTable
                      branches={enrichedBranches}
                      selectedBranchId={selectedBranchId}
                      onSelect={setSelectedBranchId}
                      onCollapse={() => setBranchPanelHidden(true)}
                    />
                  )}
                  {!branchPanelHidden && (
                    <button
                      onPointerDown={startBranchPanelResize}
                      className="hidden xl:flex h-[72vh] sticky top-28 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted items-center justify-center cursor-col-resize"
                      aria-label="Resize branch panel"
                      title="Drag to resize branch panel"
                    >
                      <GripVertical className="w-4 h-4" />
                    </button>
                  )}
                  <div className="min-w-0 space-y-3">
                    {branchPanelHidden && (
                      <button
                        onClick={() => setBranchPanelHidden(false)}
                        className="inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
                      >
                        <PanelLeftOpen className="w-4 h-4" />
                        Show branches
                      </button>
                    )}
                    <BranchDetail
                      branch={enrichedBranches.find((branch) => branch.branch_id === selectedBranchId) || enrichedBranches[0]}
                      onEditProduct={editProduct}
                      onDeleteProduct={deleteProduct}
                      onEditBranch={openBranchEdit}
                      onStatus={updateBranchStatus}
                      deletingProductId={deletingProductId}
                      savingBranchId={savingBranchId}
                      copy={copy}
                      copied={copied}
                      setView={setView}
                    />
                  </div>
                </div>
              </div>
            )}

            {tab === "products" && (
              <ProductCatalogueSection
                branches={branches}
                enrichedBranches={enrichedBranches}
                brandProfile={brandProfile}
                products={products}
                productForm={productForm}
                setProductForm={setProductForm}
                productImageFile={productImageFile}
                setProductImageFile={setProductImageFile}
                savingProduct={savingProduct}
                deletingProductId={deletingProductId}
                saveBranchProduct={saveBranchProduct}
                resetProductForm={resetProductForm}
                editProduct={editProduct}
                deleteProduct={deleteProduct}
                setTab={setTab}
              />
            )}

            {tab === "activity" && (
              <section className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h2 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Branch customer activity</h2>
                  <p className="text-xs text-muted-foreground mt-1">Scan activity is attributed to the branch URL the customer used.</p>
                </div>
                <div className="divide-y divide-border">
                  {scans.length ? scans.slice(0, 30).map((scan) => {
                    const branch = enrichedBranches.find((item) => item.branch_id === scan.vendor_id);
                    return (
                      <div key={scan.id} className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{scan.concern || "Skin scan"}</p>
                          <p className="text-xs text-muted-foreground">{branch?.branch_name || "Branch"} · {new Date(scan.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</p>
                        </div>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">{scan.result || "Completed"}</span>
                      </div>
                    );
                  }) : <EmptyState title="No branch scans yet" text="Customer scans will appear after branch scan links are used." />}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function BranchCreatedCard({
  branch,
  copied,
  copy,
  onDismiss,
}: {
  branch: CreatedBranchState;
  copied: string;
  copy: (value: string, key: string) => void;
  onDismiss: () => void;
}) {
  const credentials = [
    { label: "Login email", value: branch.email, key: "created-email" },
    ...(branch.password ? [{ label: "Temporary password", value: branch.password, key: "created-password" }] : []),
  ];

  return (
    <section className="bg-[#F2FFF7] border border-emerald-200 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
            <Check className="w-3.5 h-3.5" />
            Branch account created
          </div>
          <h2 className="text-xl sm:text-2xl font-light text-foreground mt-3" style={{ fontFamily: "'Fraunces', serif" }}>
            {branch.name} is ready to use
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            {branch.emailSent
              ? "An email with the login details has been sent to the branch manager. You can still copy the credentials below if you want to share them directly."
              : "Email delivery is not confirmed yet, so copy the credentials below and share them with the branch manager. They can sign in as a vendor, manage their catalogue, and use their own shop and scan links."}
          </p>
        </div>
        <button onClick={onDismiss} className="w-9 h-9 rounded-xl bg-white/80 text-foreground border border-emerald-100 flex items-center justify-center shrink-0" aria-label="Dismiss branch created message">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-5 grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        {credentials.map((item) => (
          <div key={item.key} className="bg-white/85 border border-emerald-100 rounded-xl p-3 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{item.label}</p>
            <div className="mt-2 flex items-center justify-between gap-2 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{item.value}</p>
              <button onClick={() => copy(item.value, item.key)} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0" aria-label={`Copy ${item.label}`}>
                {copied === item.key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
        {branch.shop && (
          <LinkCopyCard label="Storefront" value={branch.shop} copyKey="created-shop" copied={copied} copy={copy} />
        )}
        {branch.scan && (
          <LinkCopyCard label="Skin test link" value={branch.scan} copyKey="created-scan" copied={copied} copy={copy} />
        )}
      </div>
    </section>
  );
}

function LinkCopyCard({
  label,
  value,
  copyKey,
  copied,
  copy,
}: {
  label: string;
  value: string;
  copyKey: string;
  copied: string;
  copy: (value: string, key: string) => void;
}) {
  return (
    <div className="bg-white/85 border border-emerald-100 rounded-xl p-3 min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-2 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
        <button onClick={() => copy(value, copyKey)} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0" aria-label={`Copy ${label}`}>
          {copied === copyKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

function BrandSidebar({
  brandName,
  navItems,
  tab,
  copied,
  brandUrl,
  copy,
  setTab,
  signOut,
}: {
  brandName?: string;
  navItems: { id: BrandTab; label: string; icon: ElementType }[];
  tab: BrandTab;
  copied: string;
  brandUrl: string;
  copy: (value: string, key: string) => void;
  setTab: (tab: BrandTab) => void;
  signOut: () => void;
}) {
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="space-y-3">
        <div className="px-3 py-3 border-b border-border mb-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Brand workspace</p>
          <p className="text-sm font-semibold text-foreground mt-1 truncate">{brandName || "Brand"}</p>
          <button onClick={() => copy(brandUrl, "brand-url")} className="mt-2 text-xs text-accent inline-flex items-center gap-1 font-semibold">
            {copied === "brand-url" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            Copy brand page
          </button>
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                  tab === item.id ? "bg-accent text-white font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-3 border-t border-border mt-auto">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-mono">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-input-background border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{text}</p>
    </div>
  );
}

function OverviewBranchDirectory({
  branches,
  onSelectBranch,
  onAddBranch,
  onViewAll,
  copy,
  copied,
}: {
  branches: any[];
  onSelectBranch: (branchId: string) => void;
  onAddBranch: () => void;
  onViewAll: () => void;
  copy: (value: string, key: string) => void;
  copied: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"revenue" | "scans" | "products" | "name">("revenue");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const filteredAndSortedBranches = useMemo(() => {
    return branches
      .filter((branch) => {
        const matchesQuery =
          !searchQuery.trim() ||
          branch.branch_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          branch.branch_email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || branch.status === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "revenue") return (b.revenue || 0) - (a.revenue || 0);
        if (sortBy === "scans") return (b.scans || 0) - (a.scans || 0);
        if (sortBy === "products") return (b.products || 0) - (a.products || 0);
        if (sortBy === "name") return (a.branch_name || "").localeCompare(b.branch_name || "");
        return 0;
      });
  }, [branches, searchQuery, statusFilter, sortBy]);

  const activeCount = branches.filter((b) => b.status === "active").length;

  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Directory Header */}
      <div className="px-5 sm:px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl sm:text-2xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
            Branch directory & locations
          </h2>
          <span className="text-xs text-accent font-semibold bg-accent/10 px-2.5 py-0.5 rounded-full">
            {branches.length} {branches.length === 1 ? "branch" : "branches"} ({activeCount} active)
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Overview of all registered branch storefronts, activity metrics, and direct links across your organisation.
        </p>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="p-4 sm:p-5 bg-muted/20 border-b border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by branch name, location, or email..."
              className="w-full bg-background border border-border rounded-xl pl-9 pr-8 py-2 text-xs text-foreground outline-none focus:border-accent transition-colors"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-accent cursor-pointer"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <option value="all">All statuses ({branches.length})</option>
            <option value="active">Active only ({activeCount})</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-accent cursor-pointer"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <option value="revenue">Sort: Highest Revenue</option>
            <option value="scans">Sort: Most Scans</option>
            <option value="products">Sort: Most Products</option>
            <option value="name">Sort: Alphabetical (A-Z)</option>
          </select>
        </div>

        {/* View Mode Toggle (Grid vs Table) */}
        <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1 shrink-0 self-end md:self-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors",
              viewMode === "grid" ? "bg-accent text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
            title="Grid view"
            aria-label="Grid view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Cards</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors",
              viewMode === "table" ? "bg-accent text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
            title="Table view"
            aria-label="Table view"
          >
            <List className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Table</span>
          </button>
        </div>
      </div>

      {/* Directory Content: Grid View or Table View */}
      {filteredAndSortedBranches.length ? (
        viewMode === "grid" ? (
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5 sm:gap-6">
            {filteredAndSortedBranches.map((branch) => {
              const isActive = branch.status === "active";
              const isSuspended = branch.status === "suspended";

              return (
                <div
                  key={branch.id || branch.branch_id}
                  className="bg-background border border-border rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-accent/40 hover:shadow-sm transition-all group"
                >
                  <div className="space-y-3.5">
                    {/* Top row: Name, Location & Status */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                          {branch.branch_name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-accent shrink-0" />
                          <span className="truncate">{branch.location || "Location not set"}</span>
                        </p>
                      </div>

                      <span
                        className={cn(
                          "text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full shrink-0",
                          isActive
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : isSuspended
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-muted text-muted-foreground border border-border"
                        )}
                      >
                        {branch.status || "active"}
                      </span>
                    </div>

                    {/* Contact details */}
                    <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border/60">
                      <p className="truncate flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                        <span className="truncate">{branch.branch_email}</span>
                      </p>
                      {branch.phone && (
                        <p className="truncate flex items-center gap-1.5 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                          <span>{branch.phone}</span>
                        </p>
                      )}
                    </div>

                    {/* 3 Metric Tiles */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="bg-muted/30 border border-border/70 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-mono">Products</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5">{branch.products || 0}</p>
                        <span className="text-[9px] text-muted-foreground block">{branch.approvedProducts || 0} approved</span>
                      </div>

                      <div className="bg-muted/30 border border-border/70 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-mono">Scans</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5">{branch.scans || 0}</p>
                        <span className="text-[9px] text-muted-foreground block">Customer</span>
                      </div>

                      <div className="bg-muted/30 border border-border/70 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-mono">Revenue</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5 font-mono">
                          ₦{Number(branch.revenue || 0).toLocaleString()}
                        </p>
                        <span className="text-[9px] text-muted-foreground block">Tracked</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-2">
                    <button
                      onClick={() => onSelectBranch(branch.branch_id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                    >
                      <span>Manage branch</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copy(branch.shopUrl, `shop-${branch.branch_id}`)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors"
                        title="Copy branch storefront URL"
                      >
                        {copied === `shop-${branch.branch_id}` ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Copied
                          </span>
                        ) : (
                          "Shop link"
                        )}
                      </button>
                      <button
                        onClick={() => copy(branch.scanUrl, `scan-${branch.branch_id}`)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground font-medium transition-colors"
                        title="Copy skin test QR URL"
                      >
                        {copied === `scan-${branch.branch_id}` ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Copied
                          </span>
                        ) : (
                          "Scan link"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-mono uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5 font-semibold">Branch & Location</th>
                  <th className="py-3.5 px-4 font-semibold">Contact</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Catalogue</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Scans</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Revenue Tracked</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAndSortedBranches.map((branch) => {
                  const isActive = branch.status === "active";
                  const isSuspended = branch.status === "suspended";

                  return (
                    <tr key={branch.id || branch.branch_id} className="hover:bg-muted/15 transition-colors">
                      <td className="py-3.5 px-5 min-w-44">
                        <p className="font-semibold text-sm text-foreground">{branch.branch_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-accent shrink-0" />
                          <span>{branch.location || "Location not set"}</span>
                        </p>
                      </td>
                      <td className="py-3.5 px-4 min-w-44">
                        <p className="text-foreground">{branch.branch_email}</p>
                        {branch.phone && <p className="text-muted-foreground font-mono text-[11px] mt-0.5">{branch.phone}</p>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-foreground">{branch.products || 0}</span>
                        <span className="text-muted-foreground block text-[10px]">{branch.approvedProducts || 0} approved</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-foreground">
                        {branch.scans || 0}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                        ₦{Number(branch.revenue || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={cn(
                            "text-[10px] uppercase font-mono font-semibold px-2.5 py-0.5 rounded-full",
                            isActive
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : isSuspended
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-muted text-muted-foreground border border-border"
                          )}
                        >
                          {branch.status || "active"}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectBranch(branch.branch_id)}
                            className="px-3 py-1.5 rounded-lg bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-colors inline-flex items-center gap-1"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => copy(branch.shopUrl, `shop-${branch.branch_id}`)}
                            className="px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground font-medium text-xs transition-colors"
                            title="Copy storefront link"
                          >
                            {copied === `shop-${branch.branch_id}` ? "Copied" : "Shop"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <EmptyState
          title={branches.length ? "No matching branches found" : "No branches registered yet"}
          text={
            branches.length
              ? "Try adjusting your search keywords or status filter."
              : "Add your first branch or retail outlet to start managing its performance."
          }
        />
      )}
    </section>
  );
}

function BranchTable({
  branches,
  selectedBranchId,
  onSelect,
  onCollapse,
}: {
  branches: any[];
  selectedBranchId: string;
  onSelect: (branchId: string) => void;
  onCollapse?: () => void;
}) {
  const [filterText, setFilterText] = useState("");

  const visibleBranches = useMemo(() => {
    if (!filterText.trim()) return branches;
    const query = filterText.toLowerCase();
    return branches.filter(
      (b) =>
        b.branch_name?.toLowerCase().includes(query) ||
        b.location?.toLowerCase().includes(query) ||
        b.branch_email?.toLowerCase().includes(query)
    );
  }, [branches, filterText]);

  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm xl:sticky xl:top-28">
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Branches</h2>
            <span className="text-xs bg-muted font-mono px-2 py-0.5 rounded-md text-muted-foreground">
              {branches.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Select a branch to review its catalogue, sales, scans, and access controls.</p>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="hidden xl:flex w-9 h-9 rounded-xl bg-muted text-muted-foreground hover:text-foreground items-center justify-center shrink-0"
            aria-label="Hide branch panel"
            title="Hide branch panel"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Search for multiple branches */}
      {branches.length > 2 && (
        <div className="p-3 border-b border-border bg-muted/20">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter branches..."
              className="w-full bg-background border border-border rounded-xl pl-8 pr-7 py-1.5 text-xs text-foreground outline-none focus:border-accent"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
            {filterText && (
              <button
                onClick={() => setFilterText("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="p-3 space-y-3 max-h-[calc(100vh-18rem)] overflow-y-auto">
        {visibleBranches.length ? visibleBranches.map((branch) => (
          <button
            key={branch.id || branch.branch_id}
            onClick={() => onSelect(branch.branch_id)}
            className={cn(
              "w-full rounded-2xl border p-4 transition-all text-left group",
              selectedBranchId === branch.branch_id
                ? "border-accent bg-accent/5 shadow-sm"
                : "border-border bg-background hover:border-accent/35 hover:bg-muted/20"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                  {branch.branch_name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 min-w-0">
                  <MapPin className="w-3 h-3 text-accent shrink-0" />
                  <span className="truncate">{branch.location || "Location not set"}</span>
                </p>
              </div>
              <span className={cn("text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full capitalize shrink-0", branch.status === "active" ? "bg-green-50 text-green-700" : branch.status === "suspended" ? "bg-red-50 text-red-700" : "bg-muted text-muted-foreground")}>{branch.status}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 truncate">{branch.branch_email}</p>

            {/* Mini metrics bar */}
            <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span>{branch.products || 0} products</span>
              <span>₦{Number(branch.revenue || 0).toLocaleString()}</span>
            </div>

            <div className="mt-3 border-t border-border pt-2.5 flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono font-semibold">
                {selectedBranchId === branch.branch_id ? "Active selection" : "Click to manage"}
              </span>
              <span className="w-7 h-7 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                <ChevronIndicator selected={selectedBranchId === branch.branch_id} />
              </span>
            </div>
          </button>
        )) : <EmptyState title={branches.length ? "No matching branches" : "No branches yet"} text={branches.length ? "Try clearing your search term." : "Create your first branch to start managing multi-location performance."} />}
      </div>
    </section>
  );
}

function ChevronIndicator({ selected }: { selected: boolean }) {
  return selected ? <Check className="w-3.5 h-3.5 text-accent" /> : <ChevronRight className="w-3.5 h-3.5" />;
}

function BranchDetail({
  branch,
  onEditProduct,
  onDeleteProduct,
  onEditBranch,
  onStatus,
  deletingProductId,
  savingBranchId,
  copy,
  copied,
  setView,
}: {
  branch: any;
  onEditProduct: (product: any) => void;
  onDeleteProduct: (product: any) => void;
  onEditBranch: (branch: any) => void;
  onStatus: (branchId: string, status: "active" | "inactive" | "suspended") => void;
  deletingProductId: string;
  savingBranchId: string;
  copy: (value: string, key: string) => void;
  copied: string;
  setView: (v: View) => void;
}) {
  const [detailTab, setDetailTab] = useState<"products" | "sales" | "scans" | "activity">("products");

  if (!branch) {
    return null;
  }

  const activityRows = [
    ...(branch.productRows || []).map((product: any) => ({
      id: `product-${product.id}`,
      type: "Product",
      title: product.name,
      detail: `${product.nafdac_status || "pending"} · ₦${Number(product.price || 0).toLocaleString()}`,
      date: product.updated_at || product.created_at,
      icon: Package,
    })),
    ...(branch.scanRows || []).map((scan: any) => ({
      id: `scan-${scan.id}`,
      type: "Scan",
      title: scan.concern || "Customer skin scan",
      detail: scan.result || scan.skin_type || "Completed",
      date: scan.created_at,
      icon: Scan,
    })),
    ...(branch.paymentRows || []).map((payment: any) => ({
      id: `payment-${payment.id}`,
      type: "Sale",
      title: payment.reference || payment.status || "Payment record",
      detail: `₦${Number(payment.amount || 0).toLocaleString()} · ${payment.status || "Tracked"}`,
      date: payment.created_at,
      icon: CreditCard,
    })),
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const openShop = () => {
    sessionStorage.setItem("active_shop_slug", branch.slug);
    setView("shop");
  };

  const openScan = () => {
    sessionStorage.setItem("active_scan_slug", branch.slug);
    setView("skintest");
  };

  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-5 border-b border-border bg-muted/20">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Selected branch</p>
          <h2 className="text-2xl font-light text-foreground mt-1" style={{ fontFamily: "'Fraunces', serif" }}>{branch.branch_name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className={cn("px-2 py-1 rounded-full capitalize font-semibold", branch.status === "active" ? "bg-green-50 text-green-700" : branch.status === "suspended" ? "bg-red-50 text-red-700" : "bg-background text-muted-foreground border border-border")}>{branch.status} access</span>
            <span>{branch.location || "Location not set"}</span>
            <span className="hidden sm:inline">·</span>
            <span>{branch.branch_email}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 lg:justify-end">
          <button onClick={openShop} className="text-xs px-3 py-2.5 rounded-xl bg-accent text-white inline-flex items-center justify-center gap-1.5 font-semibold">
            <ExternalLink className="w-3.5 h-3.5" />
            Open shop
          </button>
          <button onClick={openScan} className="text-xs px-3 py-2.5 rounded-xl bg-foreground text-primary-foreground inline-flex items-center justify-center gap-1.5 font-semibold">
            <Scan className="w-3.5 h-3.5" />
            Test scan
          </button>
        </div>
        </div>
        <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-2">
          <button onClick={() => onEditBranch(branch)} className="text-xs px-3 py-2.5 rounded-xl bg-background border border-border text-foreground inline-flex items-center justify-center gap-1.5 font-semibold">
            <Edit className="w-3.5 h-3.5" />
            Edit branch
          </button>
          <button onClick={() => copy(branch.shopUrl, `${branch.id}-detail-shop`)} className="text-xs px-3 py-2.5 rounded-xl bg-background border border-border text-foreground inline-flex items-center justify-center gap-1.5 font-semibold">
            {copied === `${branch.id}-detail-shop` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            Copy shop link
          </button>
          <button onClick={() => copy(branch.scanUrl, `${branch.id}-detail-scan`)} className="text-xs px-3 py-2.5 rounded-xl bg-background border border-border text-foreground inline-flex items-center justify-center gap-1.5 font-semibold">
            {copied === `${branch.id}-detail-scan` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            Copy scan link
          </button>
          {branch.status !== "inactive" && (
            <button onClick={() => onStatus(branch.branch_id, "inactive")} disabled={savingBranchId === branch.branch_id} className="text-xs px-3 py-2.5 rounded-xl bg-amber-50 text-amber-800 inline-flex items-center justify-center gap-1.5 font-semibold disabled:opacity-60">
              {savingBranchId === branch.branch_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Remove access
            </button>
          )}
        </div>
      </div>

      <div className="p-5 grid xl:grid-cols-[0.9fr_1.1fr] gap-5">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 xl:grid-cols-1 gap-3">
            <Metric label="Products" value={branch.products} />
            <Metric label="Approved products" value={branch.approvedProducts} />
            <Metric label="Scans" value={branch.scans} />
            <Metric label="Sales records" value={branch.paymentRows?.length || 0} />
            <Metric label="Revenue" value={`₦${branch.revenue.toLocaleString()}`} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "products", label: "Products", icon: Package },
              { id: "sales", label: "Sales", icon: CreditCard },
              { id: "scans", label: "Scans", icon: Scan },
              { id: "activity", label: "Activity", icon: Activity },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setDetailTab(item.id as typeof detailTab)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                    detailTab === item.id ? "bg-accent text-white" : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {detailTab === "products" && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Branch products</h3>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {branch.productRows?.length ? branch.productRows.map((product: any) => (
                <div key={product.id} className="px-3 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-border bg-muted shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">₦{Number(product.price || 0).toLocaleString()} · {product.nafdac_status || "pending"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => onEditProduct(product)} className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center" aria-label={`Edit ${product.name}`}>
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDeleteProduct(product)} disabled={deletingProductId === product.id} className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center disabled:opacity-60" aria-label={`Delete ${product.name}`}>
                      {deletingProductId === product.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )) : <div className="px-3 py-6 text-center text-xs text-muted-foreground">No products for this branch yet.</div>}
            </div>
          </div>
          )}

          {detailTab === "sales" && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Branch sales</h3>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {branch.paymentRows?.length ? branch.paymentRows.map((payment: any) => (
                <div key={payment.id} className="px-3 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{payment.reference || payment.status || "Payment"}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(payment.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-foreground">₦{Number(payment.amount || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{payment.status || "Tracked"}</p>
                  </div>
                </div>
              )) : <div className="px-3 py-6 text-center text-xs text-muted-foreground">No sales records for this branch yet.</div>}
            </div>
          </div>
          )}

          {detailTab === "scans" && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Customer scan activity</h3>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {branch.scanRows?.length ? branch.scanRows.map((scan: any) => (
                <div key={scan.id} className="px-3 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{scan.concern || "Skin scan"}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(scan.created_at).toLocaleDateString("en-GB", { dateStyle: "medium" })}</p>
                  </div>
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-1 rounded-full">{scan.result || "Completed"}</span>
                </div>
              )) : <div className="px-3 py-6 text-center text-xs text-muted-foreground">No customer scans for this branch yet.</div>}
            </div>
          </div>
          )}

          {detailTab === "activity" && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Branch activity timeline</h3>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {activityRows.length ? activityRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.id} className="px-3 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{row.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{row.type} · {row.detail}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">{row.date ? new Date(row.date).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "No date"}</p>
                  </div>
                );
              }) : <div className="px-3 py-6 text-center text-xs text-muted-foreground">No branch activity yet.</div>}
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-muted/50 rounded-xl px-2 py-2">
      <p className="text-xs font-semibold text-foreground truncate">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

const PRODUCT_CATEGORIES = [
  "Skincare",
  "Cleanser",
  "Toner",
  "Serum",
  "Moisturizer",
  "Sunscreen",
  "Face Oil",
  "Eye Cream",
  "Exfoliant / Peel",
  "Face Mask",
  "Body Care",
  "Lip Care",
  "Hair Care",
  "Fragrance",
  "Treatment",
];

function ProductCatalogueSection({
  branches,
  enrichedBranches,
  brandProfile,
  products,
  productForm,
  setProductForm,
  productImageFile,
  setProductImageFile,
  savingProduct,
  deletingProductId,
  saveBranchProduct,
  resetProductForm,
  editProduct,
  deleteProduct,
  setTab,
}: {
  branches: any[];
  enrichedBranches: any[];
  brandProfile: any;
  products: any[];
  productForm: ProductFormState;
  setProductForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  productImageFile: File | null;
  setProductImageFile: (f: File | null) => void;
  savingProduct: boolean;
  deletingProductId: string;
  saveBranchProduct: () => Promise<void>;
  resetProductForm: (branchId?: string) => void;
  editProduct: (product: any) => void;
  deleteProduct: (product: any) => Promise<void>;
  setTab: (tab: BrandTab) => void;
}) {
  const [imageTab, setImageTab] = useState<"upload" | "url">(
    productForm.imageUrl && !productImageFile ? "url" : "upload"
  );
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [urlImageError, setUrlImageError] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(
    Boolean(productForm.category && !PRODUCT_CATEGORIES.includes(productForm.category))
  );
  const [branchTooltipOpen, setBranchTooltipOpen] = useState(false);
  const [imageTooltipOpen, setImageTooltipOpen] = useState(false);
  const [summaryTooltipOpen, setSummaryTooltipOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Keep local file preview in sync
  useEffect(() => {
    if (productImageFile) {
      const objectUrl = URL.createObjectURL(productImageFile);
      setFilePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setFilePreview(null);
    }
  }, [productImageFile]);

  // When editing a product, update custom category state and tab
  useEffect(() => {
    if (productForm.imageUrl && !productImageFile) {
      setImageTab("url");
    }
    if (productForm.category && !PRODUCT_CATEGORIES.includes(productForm.category)) {
      setShowCustomCategory(true);
    }
  }, [productForm.id, productForm.imageUrl, productForm.category, productImageFile]);

  // Validate URL format
  const isHttpsUrl = useMemo(() => {
    const trimmed = productForm.imageUrl?.trim() || "";
    if (!trimmed.startsWith("https://") || trimmed.length <= 8) return false;
    try {
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  }, [productForm.imageUrl]);

  const activeImagePreview = useMemo(() => {
    if (imageTab === "upload" && filePreview) {
      return filePreview;
    }
    if (imageTab === "url" && isHttpsUrl && !urlImageError) {
      return productForm.imageUrl.trim();
    }
    if (productForm.imageUrl && !productImageFile && !urlImageError) {
      return productForm.imageUrl.trim();
    }
    return null;
  }, [imageTab, filePreview, isHttpsUrl, urlImageError, productForm.imageUrl, productImageFile]);

  const currentBranch = useMemo(() => {
    return branches.find((b) => b.branch_id === productForm.branchId) || branches[0];
  }, [branches, productForm.branchId]);

  // Filter catalogue
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (branchFilter !== "all" && product.vendor_id !== branchFilter) return false;
      if (statusFilter !== "all" && (product.nafdac_status || "pending") !== statusFilter) return false;
      if (categoryFilter !== "all" && product.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = product.name?.toLowerCase().includes(q);
        const matchBrand = product.brand?.toLowerCase().includes(q);
        const matchCat = product.category?.toLowerCase().includes(q);
        const matchDesc = product.description?.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchCat && !matchDesc) return false;
      }
      return true;
    });
  }, [products, branchFilter, statusFilter, categoryFilter, searchQuery]);

  const handleFileSelection = (file: File | null) => {
    if (!file) {
      setProductImageFile(null);
      return;
    }
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"];
    if (!allowedMimes.includes(file.type.toLowerCase()) && !file.type.startsWith("image/")) {
      toast.error("Unsupported file format. Please upload PNG, JPG, JPEG, WEBP, or GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed size is 5MB.`);
      return;
    }
    setProductImageFile(file);
    toast.success(`Image selected: ${file.name}`);
  };

  const handleUrlTabClick = () => {
    setImageTab("url");
    setUrlImageError(false);
    if (!productForm.imageUrl || !productForm.imageUrl.startsWith("https://")) {
      setProductForm((prev) => ({
        ...prev,
        imageUrl: prev.imageUrl && prev.imageUrl.startsWith("http") ? prev.imageUrl : "https://",
      }));
    }
  };

  const handleUploadTabClick = () => {
    setImageTab("upload");
  };

  const clearImage = () => {
    setProductImageFile(null);
    setProductForm((prev) => ({ ...prev, imageUrl: "" }));
    setUrlImageError(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* 1. Header & Main Form Card */}
      <section className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider text-accent font-mono font-semibold bg-accent/10 px-2.5 py-0.5 rounded-full">
                Brand HQ Catalogue
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                Safety Review Workflow
              </span>
              {productForm.id && (
                <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">
                  Editing Product
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-2" style={{ fontFamily: "'Fraunces', serif" }}>
              {productForm.id ? "Edit branch product" : "Add a product to a branch"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
              Brand HQ can add products to any active branch catalogue. New items are submitted for Anovra safety review before they appear publicly in branch storefronts.
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {branches.length ? (
          <div className="mt-6 space-y-6">
            <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px] gap-8 items-stretch">
              {/* Left Column: Form Section Containers */}
              <div className="space-y-6 flex flex-col justify-between">
                {/* Branch & Identification Group */}
                <div className="bg-muted/20 border border-border/70 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-mono font-semibold flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-accent" /> Branch & Identification
                      </h3>

                      {/* Interactive Tooltip for Branch & Identification */}
                      <div
                        className="relative inline-block"
                        onMouseEnter={() => setBranchTooltipOpen(true)}
                        onMouseLeave={() => setBranchTooltipOpen(false)}
                      >
                        <button
                          type="button"
                          onClick={() => setBranchTooltipOpen((prev) => !prev)}
                          className="w-4 h-4 rounded-full bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors focus:outline-none"
                          aria-label="Branch & Identification guidelines"
                        >
                          <Info className="w-3 h-3" />
                        </button>

                        {branchTooltipOpen && (
                          <div className="absolute left-0 top-full mt-2 z-50 w-72 p-3.5 bg-card text-foreground border border-border rounded-xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
                            <div className="flex items-center gap-1.5 font-semibold text-xs text-accent mb-1.5">
                              <Building2 className="w-4 h-4" /> Branch & Identification
                            </div>
                            <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                              <p>• <strong>Target Branch:</strong> Select the storefront catalogue this item belongs to.</p>
                              <p>• <strong>Brand Label:</strong> Your registered brand name as displayed to shoppers.</p>
                              <p>• <strong>Product Name & Price:</strong> Official commercial name and retail price in Nigerian Naira (₦).</p>
                              <p>• <strong>Category:</strong> Accurate category classification for search and discovery.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">Required fields *</span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Branch Select */}
                    <label className="block">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-foreground">Target Branch *</span>
                        {currentBranch?.location && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-accent" /> {currentBranch.location}
                          </span>
                        )}
                      </div>
                      <select
                        value={productForm.branchId}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, branchId: event.target.value }))}
                        className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all cursor-pointer"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {branches.map((branch) => (
                          <option key={branch.branch_id} value={branch.branch_id} disabled={branch.status !== "active"}>
                            {branch.branch_name} {branch.status !== "active" ? `(${branch.status})` : ""}
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* Brand Label */}
                    <label className="block">
                      <span className="block text-xs font-semibold text-foreground mb-1.5">Brand Label</span>
                      <input
                        value={productForm.brand}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, brand: event.target.value }))}
                        placeholder={brandProfile?.business_name || "Anovra Demo Brand"}
                        className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      />
                    </label>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 pt-1">
                    {/* Product Name */}
                    <label className="block">
                      <span className="block text-xs font-semibold text-foreground mb-1.5">Product Name *</span>
                      <input
                        value={productForm.name}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="e.g. Vitamin C Radiance Serum"
                        className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all font-medium"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      />
                    </label>

                    {/* Price */}
                    <label className="block">
                      <span className="block text-xs font-semibold text-foreground mb-1.5">Price (NGN) *</span>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono font-semibold">
                          ₦
                        </span>
                        <input
                          type="text"
                          value={productForm.price}
                          onChange={(event) => {
                            const val = event.target.value.replace(/[^\d.]/g, "");
                            setProductForm((prev) => ({ ...prev, price: val }));
                          }}
                          placeholder="8500"
                          className="w-full bg-background border border-border rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-mono text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        />
                      </div>
                    </label>
                  </div>

                  {/* Clean Category Selection */}
                  <div className="pt-1">
                    <span className="block text-xs font-semibold text-foreground mb-1.5">Category *</span>
                    {!showCustomCategory ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={productForm.category || "Skincare"}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "custom") {
                              setShowCustomCategory(true);
                              setProductForm((prev) => ({ ...prev, category: "" }));
                            } else {
                              setProductForm((prev) => ({ ...prev, category: val }));
                            }
                          }}
                          className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all cursor-pointer"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          {PRODUCT_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="custom">+ Custom category...</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={productForm.category}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value }))}
                          placeholder="Enter custom category (e.g. Body Scrub)"
                          className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomCategory(false);
                            setProductForm((prev) => ({ ...prev, category: "Skincare" }));
                          }}
                          className="text-xs px-3 py-2.5 bg-muted text-foreground rounded-xl hover:bg-secondary shrink-0 font-medium transition-colors"
                        >
                          Use list
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Image Section with Tabs, Info Tooltip, and Format Specs */}
                <div className="bg-muted/20 border border-border/70 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 relative">
                      <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-mono font-semibold flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-accent" /> Product Image
                      </h3>

                      {/* Interactive Tooltip Button & Popover */}
                      <div
                        className="relative inline-block"
                        onMouseEnter={() => setImageTooltipOpen(true)}
                        onMouseLeave={() => setImageTooltipOpen(false)}
                      >
                        <button
                          type="button"
                          onClick={() => setImageTooltipOpen((prev) => !prev)}
                          className="w-4 h-4 rounded-full bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors focus:outline-none"
                          aria-label="Image guidelines"
                        >
                          <Info className="w-3 h-3" />
                        </button>

                        {imageTooltipOpen && (
                          <div className="absolute left-0 top-full mt-2 z-50 w-72 p-3.5 bg-card text-foreground border border-border rounded-xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
                            <div className="flex items-center gap-1.5 font-semibold text-xs text-accent mb-1.5">
                              <ShieldCheck className="w-4 h-4" /> Image Specifications
                            </div>
                            <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                              <p>• <strong>Accepted Formats:</strong> PNG, JPG, JPEG, WEBP, GIF</p>
                              <p>• <strong>Max File Size:</strong> 5 MB</p>
                              <p>• <strong>Direct URL:</strong> Secure <code className="text-accent font-mono text-[11px]">https://</code> link</p>
                              <p className="text-[11px] text-foreground/80 pt-1 border-t border-border mt-2">
                                Images appear on the branch storefront once approved in safety review.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Format & Size Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center text-[10px] uppercase font-mono font-medium px-2 py-0.5 rounded-md bg-background border border-border text-muted-foreground">
                        PNG, JPG, WEBP, GIF
                      </span>
                      <span className="inline-flex items-center text-[10px] uppercase font-mono font-medium px-2 py-0.5 rounded-md bg-accent/10 text-accent font-semibold">
                        Max 5MB
                      </span>
                    </div>
                  </div>

                  {/* Tabs: Upload Image vs Image URL */}
                  <div className="flex items-center gap-1.5 p-1 bg-background border border-border rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={handleUploadTabClick}
                      className={cn(
                        "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        imageTab === "upload"
                          ? "bg-accent text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Image
                    </button>
                    <button
                      type="button"
                      onClick={handleUrlTabClick}
                      className={cn(
                        "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        imageTab === "url"
                          ? "bg-accent text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      Image URL
                    </button>
                  </div>

                  {/* Tab 1: Upload File */}
                  {imageTab === "upload" && (
                    <div className="space-y-3 animate-in fade-in-50 duration-200">
                      {productImageFile ? (
                        <div className="bg-background border border-border rounded-xl p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {filePreview && (
                              <img
                                src={filePreview}
                                alt="Upload preview"
                                className="w-14 h-14 object-cover rounded-xl border border-border bg-muted shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{productImageFile.name}</p>
                              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                {(productImageFile.size / (1024 * 1024)).toFixed(2)} MB · {productImageFile.type || "Image"}
                              </p>
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium mt-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Ready for upload
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <label className="text-xs px-2.5 py-1.5 rounded-lg bg-muted text-foreground hover:bg-secondary font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors">
                              <RefreshCw className="w-3 h-3" />
                              Change
                              <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                                className="sr-only"
                                onChange={(e) => handleFileSelection(e.target.files?.[0] || null)}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={clearImage}
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center transition-colors"
                              aria-label="Remove image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="relative group block cursor-pointer">
                          <div className="border-2 border-dashed border-border group-hover:border-accent/60 group-hover:bg-accent/5 rounded-2xl p-6 text-center transition-all bg-background">
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                              <Upload className="w-5 h-5" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                              Click to upload product image or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PNG, JPG, JPEG, WEBP, or GIF (max 5MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                            className="sr-only"
                            onChange={(e) => handleFileSelection(e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Image URL */}
                  {imageTab === "url" && (
                    <div className="space-y-3 animate-in fade-in-50 duration-200">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-foreground">Direct Image URL</span>
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type="url"
                            value={productForm.imageUrl}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (!val.startsWith("https://") && !val.startsWith("http")) {
                                val = "https://" + val.replace(/^https?:\/\//, "");
                              }
                              setUrlImageError(false);
                              setProductForm((prev) => ({ ...prev, imageUrl: val }));
                            }}
                            placeholder="https://"
                            className={cn(
                              "w-full bg-background border rounded-xl pl-3.5 pr-20 py-2.5 text-sm text-foreground outline-none transition-all font-mono",
                              isHttpsUrl
                                ? "border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                : "border-border focus:border-accent focus:ring-1 focus:ring-accent"
                            )}
                          />
                          {productForm.imageUrl && productForm.imageUrl !== "https://" && (
                            <button
                              type="button"
                              onClick={() => {
                                setProductForm((prev) => ({ ...prev, imageUrl: "https://" }));
                                setUrlImageError(false);
                              }}
                              className="absolute right-2 text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground hover:text-foreground font-medium"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* URL Validation State */}
                      <div className="flex items-center justify-between text-xs">
                        {isHttpsUrl ? (
                          <p className="text-emerald-700 font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid HTTPS image link
                          </p>
                        ) : (
                          <p className="text-muted-foreground flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Enter a valid HTTPS image link
                          </p>
                        )}
                      </div>

                      {/* Live Preview for Image URL if entered */}
                      {isHttpsUrl && (
                        <div className="bg-background border border-border rounded-xl p-3 flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl border border-border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                            {urlImageError ? (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <img
                                src={productForm.imageUrl.trim()}
                                alt="URL preview"
                                onError={() => setUrlImageError(true)}
                                onLoad={() => setUrlImageError(false)}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground">
                              {urlImageError ? "Image link could not be loaded" : "Image URL active"}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate font-mono mt-0.5">
                              {productForm.imageUrl}
                            </p>
                            {urlImageError && (
                              <p className="text-[10px] text-red-600 mt-1">
                                Check that the URL is public and links directly to an image file.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Product Summary / Description */}
                <div className="bg-muted/20 border border-border/70 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-mono font-semibold">
                        Product Summary & Notes
                      </h3>

                      {/* Interactive Tooltip for Product Summary */}
                      <div
                        className="relative inline-block"
                        onMouseEnter={() => setSummaryTooltipOpen(true)}
                        onMouseLeave={() => setSummaryTooltipOpen(false)}
                      >
                        <button
                          type="button"
                          onClick={() => setSummaryTooltipOpen((prev) => !prev)}
                          className="w-4 h-4 rounded-full bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center transition-colors focus:outline-none"
                          aria-label="Summary guidelines"
                        >
                          <Info className="w-3 h-3" />
                        </button>

                        {summaryTooltipOpen && (
                          <div className="absolute left-0 top-full mt-2 z-50 w-72 p-3.5 bg-card text-foreground border border-border rounded-xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
                            <div className="flex items-center gap-1.5 font-semibold text-xs text-accent mb-1.5">
                              <Info className="w-4 h-4" /> Summary & Description
                            </div>
                            <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                              <p>• <strong>Key Actives:</strong> Mention main active ingredients (e.g. Niacinamide, Hyaluronic Acid, Vitamin C).</p>
                              <p>• <strong>Skin Types:</strong> Note suitable skin types (e.g. all skin types, sensitive, dry, oily).</p>
                              <p>• <strong>Usage:</strong> Briefly describe application routine (e.g. morning/night, apply 2-3 drops).</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {productForm.description.length} characters
                    </span>
                  </div>
                  <textarea
                    value={productForm.description}
                    onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Describe the product, key active ingredients, suitable skin types, and suggested usage routine."
                    className="w-full min-h-28 bg-background border border-border rounded-xl p-3.5 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none leading-relaxed"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
              </div>

              {/* Right Column: Live Storefront Card Preview spanning the exact height of the form sections */}
              <div className="h-full flex flex-col justify-between space-y-3 lg:sticky lg:top-28">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono font-semibold flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-accent" /> Storefront Preview
                  </p>
                  <span className="text-[10px] bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded-full">
                    Live View
                  </span>
                </div>

                {/* Full-Height Preview Card Container that stops exactly level with Product Summary */}
                <div className="flex-1 flex flex-col justify-between bg-background border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    {/* Preview Image Frame */}
                    <div className="aspect-[4/3] bg-muted/60 relative flex items-center justify-center overflow-hidden border-b border-border">
                      {activeImagePreview ? (
                        <img
                          src={activeImagePreview}
                          alt={productForm.name || "Preview"}
                          onError={() => setUrlImageError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-6 text-center text-muted-foreground">
                          <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground/60" />
                          </div>
                          <p className="text-xs font-medium">No product image selected</p>
                          <span className="text-[10px] text-muted-foreground/75">Upload a photo or enter an image URL</span>
                        </div>
                      )}

                      {/* Safety Status Pill */}
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/90 text-white font-semibold backdrop-blur-sm shadow-sm flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Safety Review Pending
                        </span>
                      </div>

                      {/* Branch Pill */}
                      <div className="absolute bottom-3 left-3">
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-black/65 text-white font-medium backdrop-blur-sm flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-accent" /> {currentBranch?.branch_name || "Branch"}
                        </span>
                      </div>
                    </div>

                    {/* Preview Details */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground uppercase font-mono tracking-wider font-semibold truncate">
                          {productForm.brand || brandProfile?.business_name || "Brand Name"}
                        </span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium shrink-0">
                          {productForm.category || "Skincare"}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-semibold text-foreground line-clamp-1">
                          {productForm.name || "Product Name"}
                        </h4>
                        <p className="text-xl font-light text-foreground mt-1" style={{ fontFamily: "'Fraunces', serif" }}>
                          ₦{Number(productForm.price || 0).toLocaleString()}
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
                        {productForm.description || "Product summary, active ingredients, and usage notes will appear here once entered."}
                      </p>
                    </div>
                  </div>

                  {/* Footer preview tag */}
                  <div className="p-4 pt-0">
                    <div className="border-t border-border/80 pt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> NAFDAC Verification Queue
                      </span>
                      <span className="font-mono">{currentBranch?.branch_name || "Branch Store"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Action Buttons (positioned cleanly below the aligned form and preview grid) */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
              <button
                onClick={saveBranchProduct}
                disabled={savingProduct}
                className="inline-flex items-center justify-center gap-2 bg-accent text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-accent/90 disabled:opacity-60 transition-all shadow-sm"
              >
                {savingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {productForm.id ? "Save product changes" : "Add product to branch catalogue"}
              </button>

              {productForm.id ? (
                <button
                  onClick={() => resetProductForm(productForm.branchId)}
                  className="inline-flex items-center justify-center gap-2 bg-muted text-foreground hover:bg-secondary px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel editing
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    resetProductForm(productForm.branchId);
                    setImageTab("upload");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 transition-colors"
                >
                  Clear form
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center mt-6">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-base font-semibold text-foreground">Create a branch first</p>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto">
              Brand products belong to branch storefronts. Create your first active branch to add and manage products.
            </p>
            <button
              onClick={() => setTab("branches")}
              className="mt-4 inline-flex items-center gap-2 text-xs bg-accent text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-accent/90 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add branch
            </button>
          </div>
        )}
      </section>

      {/* 2. Branch Product Catalogue Listing with Search & Filters */}
      <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 sm:px-6 py-5 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                Branch product catalogue
              </h2>
              <span className="text-xs text-accent font-semibold bg-accent/10 px-2.5 py-0.5 rounded-full">
                {products.length} {products.length === 1 ? "product" : "products"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Products are grouped by the branch vendor account that owns them across your network.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 bg-muted/20 border-b border-border flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, brand, or category..."
              className="w-full bg-background border border-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-foreground outline-none focus:border-accent transition-colors"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <option value="all">All branches ({branches.length})</option>
              {branches.map((branch) => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <option value="all">All statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Review</option>
              <option value="flagged">Flagged</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <option value="all">All categories</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {(searchQuery || branchFilter !== "all" || statusFilter !== "all" || categoryFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setBranchFilter("all");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
                className="text-xs px-2.5 py-2 rounded-xl bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Product Items List */}
        <div className="divide-y divide-border">
          {filteredProducts.length ? (
            filteredProducts.map((product) => {
              const branch = enrichedBranches.find((item) => item.branch_id === product.vendor_id);
              const isApproved = product.nafdac_status === "approved";
              const isFlagged = product.nafdac_status === "flagged";

              return (
                <div
                  key={product.id}
                  className="px-5 sm:px-6 py-4 grid md:grid-cols-[minmax(0,1fr)_auto] gap-4 items-center hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-14 h-14 rounded-xl object-cover border border-border bg-muted shrink-0 shadow-xs"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
                          {product.category || "Skincare"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-accent shrink-0" />
                        <span>{branch?.branch_name || "Branch"}</span>
                        <span>·</span>
                        <span>{product.brand || brandProfile?.business_name || "Brand"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:justify-end flex-wrap">
                    <span className="text-sm font-mono font-semibold text-foreground">
                      ₦{Number(product.price || 0).toLocaleString()}
                    </span>

                    <span
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium capitalize",
                        isApproved
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : isFlagged
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      )}
                    >
                      {product.nafdac_status || "pending"}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => editProduct(product)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-muted text-foreground hover:bg-secondary inline-flex items-center gap-1 font-semibold transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(product)}
                        disabled={deletingProductId === product.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 inline-flex items-center gap-1 font-semibold disabled:opacity-60 transition-colors"
                      >
                        {deletingProductId === product.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              title={products.length ? "No matching products found" : "No branch products yet"}
              text={
                products.length
                  ? "Try adjusting your search query or filters to find what you're looking for."
                  : "Add a product from Brand HQ or let branch teams upload their catalogue from their vendor workspace."
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}
