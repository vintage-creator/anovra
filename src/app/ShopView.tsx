import { useState, useEffect } from "react";
import {
  Star, ChevronRight, X, Check, CheckCircle, MessageCircle, ExternalLink,
  Search, Store, Globe, MapPin, Shield, Zap, Lock, Package, Scan,
} from "lucide-react";
import type { View } from "./types";
import { supabase } from "./utils/supabase";
import { toast } from "sonner";

// ---- CATALOG PRODUCTS (shared data) ----

const catalogProducts: any[] = [];

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const titleFromSlug = (slug: string) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "Vintage";

const isPlaceholderName = (value?: string | null) =>
  !value || ["my brand", "israel abazie", "my skincare brand"].includes(value.trim().toLowerCase());

const getShopSlugFromUrl = () => {
  const hashSlug = window.location.hash.includes("/shop/")
    ? window.location.hash.split("/shop/")[1]?.split("?")[0]
    : "";
  const storedSlug = sessionStorage.getItem("active_shop_slug") || "";
  const slug = hashSlug || storedSlug || "vintage";
  return slug === "israel-abazie" ? "vintage" : slug;
};

// ---- SHOP VIEW ----

export function ShopView({ setView }: { setView: (v: View) => void }) {
  const [activeSlug] = useState(getShopSlugFromUrl);
  const [isPreviewMode] = useState(() => sessionStorage.getItem("shop_preview_mode") === "true");
  const [vendor, setVendor] = useState<any>(() => {
    const snapshot = sessionStorage.getItem("active_shop_snapshot");
    if (snapshot) {
      try {
        const parsed = JSON.parse(snapshot);
        return {
          name: isPlaceholderName(parsed.name) ? titleFromSlug(activeSlug) : parsed.name,
          tagline: parsed.tagline || "Science-backed skincare for African skin",
          location: parsed.location || "Lagos, Nigeria",
          rating: 4.8,
          reviews: 312,
          since: parsed.since || "2023",
          is_verified: parsed.is_verified || false
        };
      } catch (e) {}
    }

    return {
      name: titleFromSlug(activeSlug),
      tagline: "Science-backed skincare for African skin",
      location: "Lagos, Nigeria",
      rating: 4.8,
      reviews: 312,
      since: "2023",
      is_verified: false
    };
  });
  const [productsList, setProductsList] = useState<any[]>([]);
  const [filter, setFilter] = useState("All");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [addedToCart, setAddedToCart] = useState<string | number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const activeProducts = productsList.filter((p) => p.status === "active");
  const allConcerns = ["All", ...Array.from(new Set(activeProducts.flatMap((p) => p.concerns || [])))];
  const shopSlug = slugify(vendor.name || titleFromSlug(activeSlug)) || activeSlug;
  const shopUrl = `https://anovra.africa/#/shop/${shopSlug}`;

  useEffect(() => {
    const loadProducts = async () => {
      const cacheKey = `cached_shop_products_${activeSlug}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setProductsList(JSON.parse(cached));
      }

      try {
        sessionStorage.setItem("active_shop_slug", activeSlug);
        
        // 1. Fetch profiles to match by business name slug
        const { data: profiles } = await supabase.from("profiles").select("*");
        let targetProfile = profiles?.find((p) => {
          const businessName = isPlaceholderName(p.business_name) ? "" : p.business_name || "";
          const fallbackName = isPlaceholderName(p.name) ? "" : p.name || "";
          return [businessName, fallbackName].some((name) => slugify(name) === activeSlug);
        });

        // Dashboard previews should use the signed-in vendor. Public shop links should not.
        const { data: { user } } = await supabase.auth.getUser();
        if (!targetProfile && user && isPreviewMode) {
          const { data: loggedProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          if (loggedProfile) {
            targetProfile = loggedProfile;
          }
        }

        let query = supabase.from("products").select("*").eq("nafdac_status", "approved");
        
        if (targetProfile) {
          query = query.eq("vendor_id", targetProfile.id);
          
          const joinedYear = targetProfile.created_at ? new Date(targetProfile.created_at).getFullYear() : 2023;
          let taglineVal = targetProfile.tagline || "Science-backed skincare for African skin";
          let locationVal = targetProfile.location || "Lagos, Nigeria";
          let sinceVal = targetProfile.since || String(joinedYear);
          
          if (user && user.id === targetProfile.id && user.user_metadata) {
            if (user.user_metadata.tagline) taglineVal = user.user_metadata.tagline;
            if (user.user_metadata.location) locationVal = user.user_metadata.location;
            if (user.user_metadata.since) sinceVal = user.user_metadata.since;
          }

          const displayName = isPlaceholderName(targetProfile.business_name)
            ? titleFromSlug(activeSlug)
            : targetProfile.business_name;

          setVendor({
            name: displayName || titleFromSlug(activeSlug),
            tagline: taglineVal,
            location: locationVal,
            rating: 4.8,
            reviews: 312,
            since: sinceVal,
            is_verified: targetProfile.is_verified || false
          });
        } else {
          query = query.eq("vendor_id", "00000000-0000-0000-0000-000000000000");
          setVendor((current: any) => ({
            ...current,
            name: titleFromSlug(activeSlug),
            is_verified: false,
          }));
        }

        const { data, error } = await query;

        if (data && data.length > 0) {
          const formatted = data.map((p) => {
            const descriptionText = p.description || "";
            const imagesMatch = descriptionText.match(/<!--IMAGES:([\s\S]*?)-->/);
            const benefitsMatch = descriptionText.match(/<!--BENEFITS:([\s\S]*?)-->/);
            const usageMatch = descriptionText.match(/<!--USAGE:([\s\S]*?)-->/);
            const precautionsMatch = descriptionText.match(/<!--PRECAUTIONS:([\s\S]*?)-->/);
            const skinTypesMatch = descriptionText.match(/<!--SKINTYPES:([\s\S]*?)-->/);
            const keyMatch = descriptionText.match(/<!--KEY_INGREDIENTS:([\s\S]*?)-->/);
            const activeMatch = descriptionText.match(/<!--ACTIVE_INGREDIENTS:([\s\S]*?)-->/);

            let parsedImages: string[] = [];
            let benefits = "";
            let usageInstructions = "";
            let precautions = "";
            let skinTypes: string[] = [];
            let keyIngredients: string[] = [];
            let activeIngredients: string[] = [];
            let cleanDescription = descriptionText;

            if (imagesMatch) {
              try { parsedImages = JSON.parse(imagesMatch[1]); } catch (e) {}
            }
            if (benefitsMatch) {
              try { benefits = JSON.parse(benefitsMatch[1]); } catch (e) {}
            }
            if (usageMatch) {
              try { usageInstructions = JSON.parse(usageMatch[1]); } catch (e) {}
            }
            if (precautionsMatch) {
              try { precautions = JSON.parse(precautionsMatch[1]); } catch (e) {}
            }
            if (skinTypesMatch) {
              try { skinTypes = JSON.parse(skinTypesMatch[1]); } catch (e) {}
            }
            if (keyMatch) {
              try { keyIngredients = JSON.parse(keyMatch[1]); } catch (e) {}
            }
            if (activeMatch) {
              try { activeIngredients = JSON.parse(activeMatch[1]); } catch (e) {}
            }

            cleanDescription = cleanDescription
              .replace(/<!--IMAGES:([\s\S]*?)-->/g, "")
              .replace(/<!--BENEFITS:([\s\S]*?)-->/g, "")
              .replace(/<!--USAGE:([\s\S]*?)-->/g, "")
              .replace(/<!--PRECAUTIONS:([\s\S]*?)-->/g, "")
              .replace(/<!--SKINTYPES:([\s\S]*?)-->/g, "")
              .replace(/<!--KEY_INGREDIENTS:([\s\S]*?)-->/g, "")
              .replace(/<!--ACTIVE_INGREDIENTS:([\s\S]*?)-->/g, "")
              .trim();

            if (parsedImages.length === 0 && p.image_url) {
              parsedImages = [p.image_url];
            }
            return {
              id: p.id,
              name: p.name,
              brand: p.brand || "Own Brand",
              concerns: [p.category || "General"],
              skinTypes: skinTypes.length > 0 ? skinTypes : ["All"],
              price: `₦${Number(p.price).toLocaleString()}`,
              priceVal: p.price,
              status: "active",
              photo: p.image_url || "https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=200&auto=format&fit=crop",
              images: parsedImages,
              description: cleanDescription,
              benefits,
              usageInstructions,
              precautions,
              keyIngredients,
              activeIngredients,
              ingredients: [...keyIngredients, ...activeIngredients],
            };
          });
          setProductsList(formatted);
          sessionStorage.setItem(cacheKey, JSON.stringify(formatted));
        } else {
          setProductsList([]);
          sessionStorage.setItem(cacheKey, JSON.stringify([]));
        }
      } catch (err) {
        console.error("Failed to query live shop items:", err);
        setProductsList([]);
      } finally {
        setGenerating(false);
      }
    };
    loadProducts();
  }, [activeSlug, isPreviewMode]);

  const openSkinTest = () => {
    sessionStorage.setItem("active_scan_slug", activeSlug);
    setView("skintest");
  };

  const handleAddToCart = async (product: any) => {
    setAddedToCart(product.id);
    try {
      let sessionId = localStorage.getItem("anovra_session");
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem("anovra_session", sessionId);
      }

      const { error } = await supabase
        .from("cart_items")
        .insert([
          {
            session_id: sessionId,
            product_id: typeof product.id === "string" ? product.id : null,
            quantity: 1,
          }
        ]);

      if (error && typeof product.id === "string") throw error;
      toast.success(`${product.name} added to cart!`);
    } catch (err: any) {
      console.warn("Cart database insertion error:", err.message);
    } finally {
      setTimeout(() => setAddedToCart(null), 2000);
    }
  };

  const filtered = activeProducts.filter((p) => {
    const matchesFilter = filter === "All" || p.concerns.includes(filter);
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const copy = () => {
    navigator.clipboard?.writeText(shopUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (generating) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
        <div className="text-center">
          <p className="text-lg font-light text-foreground mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
            Loading storefront preview…
          </p>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Retrieving catalog & brand information
          </p>
        </div>
        <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full animate-[grow_1.8s_ease-out_forwards]" style={{ animation: "none", transition: "width 1.6s ease-out", width: "100%" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Preview bar, only shown inside the vendor dashboard preview. */}
      {isPreviewMode && (
        <div className="sticky top-0 z-30 bg-foreground text-primary-foreground py-2 px-4 border-b border-white/10 shadow-md">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-green-400" />
              <span className="text-xs font-mono opacity-80">
                Preview: {shopUrl}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copy}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <ExternalLink className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy link"}
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem("shop_preview_mode");
                  setView("dashboard");
                }}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-accent hover:bg-accent/90 transition-colors font-semibold cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {!isPreviewMode && (
        <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md transition-all">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20 gap-4">
            <button
              onClick={() => setView("landing")}
              className="flex items-center group rounded-lg p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008236] transition-transform active:scale-95 cursor-pointer"
              aria-label="Anovra Home"
            >
              <img
                src="/logo.png"
                alt="Anovra"
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </button>
            <div className="flex items-center gap-3 border-l border-border pl-4 min-w-0">
              <div className="hidden sm:flex w-8 h-8 rounded-lg bg-[#008236]/10 text-[#008236] items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-right sm:text-left min-w-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <p className="text-xs font-semibold text-foreground truncate">
                  Secure storefront
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Powered by <span className="font-semibold text-[#008236]">Anovra</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shop Header */}
      <div className="bg-foreground text-primary-foreground py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Logo container */}
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Fraunces', serif" }}>
                  {vendor.name[0]}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-light" style={{ fontFamily: "'Fraunces', serif" }}>
                    {vendor.name}
                  </h1>
                  {vendor.is_verified && (
                    <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                      <CheckCircle className="w-3 h-3" /> Verified vendor
                    </span>
                  )}
                </div>
                <p className="text-sm opacity-60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {vendor.tagline}
                </p>
                <div className="flex items-center gap-4 text-xs opacity-50 flex-wrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{vendor.location}</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    {vendor.rating} ({vendor.reviews} reviews)
                  </span>
                  <span>{activeProducts.length} product{activeProducts.length !== 1 ? "s" : ""} · Since {vendor.since}</span>
                </div>
              </div>
            </div>

            <button
              onClick={openSkinTest}
              className="flex-shrink-0 flex items-center gap-2 bg-accent text-white px-5 py-3 rounded-xl font-medium text-sm hover:bg-accent/90 transition-colors shadow-lg cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Scan className="w-4 h-4" />
              Get my skin match
            </button>
          </div>
        </div>
      </div>

      {/* AI skin test banner */}
      <div className="bg-accent/8 border-b border-accent/20 py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-accent shrink-0" />
            <p className="text-sm text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <span className="font-medium">Not sure which product is right for you?</span>{" "}
              <span className="text-muted-foreground">Take a 90-second AI skin test and get matched to the exact products your skin needs.</span>
            </p>
          </div>
          <button
            onClick={openSkinTest}
            className="text-xs font-medium text-accent border border-accent/40 px-3 py-1.5 rounded-lg hover:bg-accent hover:text-white transition-colors cursor-pointer"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Start free skin test →
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
            {allConcerns.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`flex-shrink-0 text-sm px-4 py-2 rounded-full border transition-all cursor-pointer ${
                  filter === c
                    ? "bg-foreground text-primary-foreground border-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-input-background border border-border rounded-full text-sm placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-accent/50 text-foreground"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: "'DM Mono', monospace" }}>
          {filtered.length} product{filtered.length !== 1 ? "s" : ""} {filter !== "All" ? `for "${filter}"` : "available"}
        </p>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filtered.map((product) => (
            <div
              key={product.id}
              onClick={() => { setSelectedProduct(product); setActiveImgIdx(0); }}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer"
            >
              {/* Product image */}
              <div className="relative aspect-square bg-secondary overflow-hidden">
                <img
                  src={product.photo}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  {product.skinTypes.slice(0, 2).map((t) => (
                    <span key={t} className="text-xs bg-white/90 text-foreground px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Product info */}
              <div className="p-4 flex flex-col flex-1">
                <p className="text-xs text-muted-foreground mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {product.brand}
                </p>
                <h3
                  className="font-medium text-foreground text-sm leading-snug mb-2 flex-1 hover:text-accent transition-colors"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {product.name}
                </h3>

                {/* Concern tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {product.concerns.slice(0, 2).map((c) => (
                    <span key={c} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                      {c}
                    </span>
                  ))}
                  {product.concerns.length > 2 && (
                    <span className="text-xs text-muted-foreground px-1">+{product.concerns.length - 2}</span>
                  )}
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between gap-2 mt-auto">
                  <p className="text-lg font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                    {product.price}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                      addedToCart === product.id
                        ? "bg-green-500 text-white"
                        : "bg-accent text-white hover:bg-accent/90"
                    }`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {addedToCart === product.id ? (
                      <><Check className="w-3.5 h-3.5" /> Added</>
                    ) : (
                      <><Package className="w-3.5 h-3.5" /> Add to cart</>
                    )}
                  </button>
                </div>

                {/* Skin match CTA */}
                <button
                  onClick={(e) => { e.stopPropagation(); openSkinTest(); }}
                  className="mt-2 w-full text-xs text-center text-accent underline underline-offset-2 hover:text-accent/80 transition-colors cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Check if this matches my skin →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No products for this concern yet</p>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Try "All" or take the skin test to get personalized matches.</p>
          </div>
        )}

        {/* Footer trust bar */}
        <div className="border-t border-border pt-8 grid sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: <Shield className="w-5 h-5" />, label: "NAFDAC verified", desc: "Every product passes ingredient safety review" },
            { icon: <Zap className="w-5 h-5" />, label: "AI-matched products", desc: "Recommendations based on your actual skin scan" },
            { icon: <Lock className="w-5 h-5" />, label: "Secure & private", desc: "Your scan data is never stored or shared" },
          ].map((t) => (
            <div key={t.label} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                {t.icon}
              </div>
              <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t.label}</p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Product Details Modal overlay */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/60">
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">{selectedProduct.brand}</p>
                <h3 className="font-semibold text-foreground text-base leading-tight mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {selectedProduct.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)} 
                className="w-8 h-8 rounded-full hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Product Gallery & Core Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Image Gallery */}
                <div className="space-y-3">
                  <div className="aspect-square bg-muted rounded-2xl overflow-hidden border border-border">
                    <img 
                      src={selectedProduct.images?.[activeImgIdx] || selectedProduct.photo} 
                      alt={selectedProduct.name} 
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                    />
                  </div>
                  {/* Thumbnail slider */}
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {selectedProduct.images.map((imgUrl: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImgIdx(idx)}
                          className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-colors cursor-pointer ${activeImgIdx === idx ? "border-accent" : "border-transparent"}`}
                        >
                          <img src={imgUrl} alt="thumbnail" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Pricing & Verification */}
                <div className="flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Retail Price</p>
                      <p className="text-2xl font-light text-foreground mt-1" style={{ fontFamily: "'Fraunces', serif" }}>
                        {selectedProduct.price}
                      </p>
                    </div>

                    {/* NAFDAC Verification Badge */}
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          NAFDAC Safety Screened
                        </p>
                        <p className="text-[11px] text-emerald-700/80 mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          This product has been screened against prohibited steroid levels and mercury toxins.
                        </p>
                      </div>
                    </div>

                    {/* Concerns & Skin Types Tags */}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-2">Suitable Skin Types</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedProduct.skinTypes?.map((t: string) => (
                          <span key={t} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-md font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart CTA */}
                  <div className="pt-4 md:pt-0">
                    <button
                      onClick={() => {
                        handleAddToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-lg cursor-pointer"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <Package className="w-4 h-4" />
                      Add to cart
                    </button>
                  </div>
                </div>
              </div>

              <hr className="border-border/60" />

              {/* Detailed fields: Description, Ingredients, Benefits, Usage, Warnings */}
              <div className="space-y-4">
                
                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Description
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedProduct.description || "No description provided."}
                  </p>
                </div>

                {/* Key Ingredients */}
                {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Key Ingredients
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProduct.ingredients.map((ing: string, i: number) => (
                        <span key={i} className="text-[11px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Benefits */}
                {selectedProduct.benefits && (
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Product Benefits
                    </h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-1">
                      {selectedProduct.benefits.split("\n").filter((b: string) => b.trim()).map((b: string, i: number) => (
                        <span key={i} className="block text-sm text-muted-foreground">
                          • {b.replace(/^[•\-\*]\s*/, "")}
                        </span>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Usage Instructions */}
                {selectedProduct.usageInstructions && (
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Usage Instructions
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedProduct.usageInstructions}
                    </p>
                  </div>
                )}

                {/* Precautions & Warnings */}
                {selectedProduct.precautions && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Precautions & Warnings
                    </h4>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      {selectedProduct.precautions}
                    </p>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
