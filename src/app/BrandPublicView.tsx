import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Building2, CheckCircle, Loader2, MapPin, Package, Scan, Search, ShieldCheck, Store,
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { supabase } from "./utils/supabase";

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const titleFromSlug = (slug: string) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Brand";

const getBrandSlugFromUrl = () => {
  const hashSlug = window.location.hash.includes("/brand/")
    ? window.location.hash.split("/brand/")[1]?.split("?")[0]
    : "";
  const storedSlug = sessionStorage.getItem("active_brand_slug") || "";
  return hashSlug || storedSlug || "";
};

export function BrandPublicView({ setView }: { setView: (v: View) => void }) {
  const [activeSlug] = useState(getBrandSlugFromUrl);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadBrand = async () => {
      setLoading(true);
      try {
        if (activeSlug) sessionStorage.setItem("active_brand_slug", activeSlug);

        const { data, error } = await supabase.rpc("get_public_brand_directory", {
          brand_slug: activeSlug,
        });
        if (error) throw error;

        const target = data?.brand;
        if (!target) {
          setNotFound(true);
          return;
        }

        setBrand(target);
        const activeBranches = data?.branches || [];
        setBranches(activeBranches);
        setProducts(activeBranches.flatMap((branch: any) => branch.products || []));
      } catch (error) {
        console.error("Brand page load failed:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadBrand();
  }, [activeSlug]);

  const enrichedBranches = useMemo(() => {
    return branches.map((branch) => {
      const branchProducts = products.filter((product) => product.vendor_id === branch.branch_id);
      const slug = branch.branch_slug || slugify(branch.branch_name);
      return {
        ...branch,
        slug,
        products: branchProducts,
        productCount: branchProducts.length,
        shopUrl: `https://anovra.africa/#/shop/${slug}`,
        scanUrl: `https://anovra.africa/#/scan/${slug}`,
      };
    });
  }, [branches, products]);

  const visibleBranches = enrichedBranches.filter((branch) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [branch.branch_name, branch.location, branch.branch_slug].some((value) =>
      String(value || "").toLowerCase().includes(q)
    );
  });

  const openShop = (slug: string) => {
    sessionStorage.setItem("active_shop_slug", slug);
    window.location.hash = `#/shop/${slug}`;
    setView("shop");
  };

  const openScan = (slug: string) => {
    sessionStorage.setItem("active_scan_slug", slug);
    window.location.hash = `#/scan/${slug}`;
    setView("skintest");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading brand network...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
            Brand not found
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            This brand page is not available. Check the link or return to the product shop.
          </p>
          <button onClick={() => setView("shop")} className="mt-6 inline-flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-xl text-sm font-semibold">
            Open product shop
          </button>
        </div>
      </div>
    );
  }

  const brandName = brand?.business_name || brand?.name || titleFromSlug(activeSlug);
  const tagline = brand?.tagline || "Shop verified branch storefronts and take a skin test with the closest brand location.";

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/92 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <button onClick={() => setView("landing")} className="flex items-center">
            <img src="/logo.png" alt="Anovra" className="h-10 sm:h-12 w-auto object-contain" />
          </button>
          <button onClick={() => setView("shop")} className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-accent">
            <Store className="w-4 h-4" />
            Product shop
          </button>
        </div>
      </header>

      <main>
        <section className="bg-[#28170D] text-amber-50 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(0,130,54,0.15),transparent_50%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-end relative z-10">
            <div>
              <div className="flex items-center gap-4 mb-5">
                {brand?.logo_url ? (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 border border-white/20 shadow-2xl flex items-center justify-center shrink-0 overflow-hidden">
                    <img src={brand.logo_url} alt={brandName} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-700 via-amber-800 to-stone-900 border border-amber-500/40 text-amber-100 flex items-center justify-center shrink-0 shadow-2xl">
                    <span className="text-3xl font-light" style={{ fontFamily: "'Fraunces', serif" }}>
                      {brandName[0]}
                    </span>
                  </div>
                )}
                <div>
                  <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-emerald-300 font-semibold mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    Verified brand network
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-light leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                    {brandName}
                  </h1>
                </div>
              </div>
              <p className="text-sm sm:text-base text-amber-100/78 leading-relaxed max-w-2xl mt-4">
                {tagline}
              </p>
              <div className="flex flex-wrap gap-3 mt-7">
                <span className="inline-flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-3 py-1.5 text-xs font-semibold">
                  <Building2 className="w-3.5 h-3.5" />
                  {branches.length} active {branches.length === 1 ? "branch" : "branches"}
                </span>
                <span className="inline-flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-3 py-1.5 text-xs font-semibold">
                  <Package className="w-3.5 h-3.5" />
                  {products.length} approved {products.length === 1 ? "product" : "products"}
                </span>
                {brand?.location && (
                  <span className="inline-flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-3 py-1.5 text-xs font-semibold">
                    <MapPin className="w-3.5 h-3.5" />
                    {brand.location}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-white/8 border border-white/10 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-300 mb-3">How to shop</p>
              <div className="space-y-3">
                {[
                  { title: "Choose a branch", text: "Find the outlet, distributor, or state location closest to you." },
                  { title: "Take the skin test", text: "Get matched to products from that branch catalogue." },
                  { title: "Shop safely", text: "Only Anovra-approved products appear on public storefronts." },
                ].map((item, index) => (
                  <div key={item.title} className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-emerald-400 text-[#28170D] flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</span>
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-xs text-amber-100/70 mt-0.5">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-accent font-semibold">Branch directory</p>
              <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1" style={{ fontFamily: "'Fraunces', serif" }}>
                Choose where you want to shop or scan
              </h2>
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search branch or location"
                className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>

          {visibleBranches.length ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visibleBranches.map((branch) => (
                <article key={branch.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-foreground truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {branch.branch_name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {branch.location || "Location not set"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 my-5">
                    <div className="rounded-xl bg-muted/40 border border-border px-3 py-3">
                      <p className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>{branch.productCount}</p>
                      <p className="text-xs text-muted-foreground">Approved products</p>
                    </div>
                    <div className="rounded-xl bg-muted/40 border border-border px-3 py-3">
                      <p className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>AI</p>
                      <p className="text-xs text-muted-foreground">Skin test ready</p>
                    </div>
                  </div>

                  {branch.products.length > 0 && (
                    <div className="mb-5">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-2">Featured products</p>
                      <div className="space-y-2">
                        {branch.products.slice(0, 2).map((product: any) => (
                          <div key={product.id} className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-foreground truncate">{product.name}</span>
                            <span className="font-mono text-muted-foreground">₦{Number(product.price || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <button onClick={() => openShop(branch.slug)} className="inline-flex items-center justify-center gap-2 bg-accent text-white px-3 py-2.5 rounded-xl text-sm font-semibold">
                      Shop
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openScan(branch.slug)} className="inline-flex items-center justify-center gap-2 bg-muted text-foreground px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-muted/80">
                      <Scan className="w-3.5 h-3.5" />
                      Skin test
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-2xl p-10 text-center">
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm font-semibold text-foreground">No active branches found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Active branches will appear here once the brand publishes them.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
