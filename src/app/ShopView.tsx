import { useState, useEffect } from "react";
import {
  Star, ChevronRight, X, Check, CheckCircle, MessageCircle, ExternalLink,
  Search, Store, Globe, MapPin, Shield, Zap, Lock, Package, Scan,
} from "lucide-react";
import type { View } from "./types";

// ---- CATALOG PRODUCTS (shared data) ----

const catalogProducts = [
  {
    id: 1,
    name: "Niacinamide 10% + Zinc 1% Serum",
    brand: "Veraski",
    concerns: ["Acne/Blemishes", "Oil Control", "Brightening"],
    skinTypes: ["Oily", "Combination"],
    price: "₦4,500",
    ingredients: ["Niacinamide", "Zinc PCA", "Hyaluronic Acid", "Panthenol"],
    status: "active",
    photo: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&h=200&fit=crop&auto=format",
    safetyFlag: null,
    views: 1240,
    clicks: 387,
  },
  {
    id: 2,
    name: "Kojic Acid & Turmeric Brightening Cream",
    brand: "GlowAfrique",
    concerns: ["Hyperpigmentation", "Brightening", "Tone Evenness"],
    skinTypes: ["All"],
    price: "₦6,200",
    ingredients: ["Kojic Acid", "Turmeric Extract", "Vitamin C", "Shea Butter"],
    status: "active",
    photo: "https://images.unsplash.com/photo-1601049541271-20f4e4e04360?w=200&h=200&fit=crop&auto=format",
    safetyFlag: null,
    views: 987,
    clicks: 312,
  },
  {
    id: 3,
    name: "Deep Moisture Barrier Repair Cream",
    brand: "Veraski",
    concerns: ["Dryness/Hydration", "Sensitivity/Barrier Repair"],
    skinTypes: ["Dry", "Sensitive"],
    price: "₦5,800",
    ingredients: ["Ceramide NP", "Hyaluronic Acid", "Shea Butter", "Niacinamide"],
    status: "active",
    photo: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=200&h=200&fit=crop&auto=format",
    safetyFlag: null,
    views: 743,
    clicks: 201,
  },
  {
    id: 4,
    name: "Ultra-White Intensive Lightening Lotion",
    brand: "ClearGlo",
    concerns: ["Brightening"],
    skinTypes: ["All"],
    price: "₦3,800",
    ingredients: ["Hydroquinone 4%", "Mercury Chloride", "Clobetasol Propionate"],
    status: "blocked",
    photo: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=200&h=200&fit=crop&auto=format",
    safetyFlag: "Contains mercury chloride (banned globally) and clobetasol propionate (restricted corticosteroid). Hydroquinone at 4% exceeds NAFDAC's 2% limit. Product blocked from recommendations pending review.",
    views: 0,
    clicks: 0,
  },
  {
    id: 5,
    name: "SPF 50+ Invisible Sunscreen Fluid",
    brand: "SunGuard NG",
    concerns: ["Sun Damage/SPF", "Brightening"],
    skinTypes: ["All"],
    price: "₦7,500",
    ingredients: ["Zinc Oxide", "Titanium Dioxide", "Niacinamide", "Hyaluronic Acid"],
    status: "active",
    photo: "https://images.unsplash.com/photo-1585232350010-2e7c7b6427eb?w=200&h=200&fit=crop&auto=format",
    safetyFlag: null,
    views: 2105,
    clicks: 789,
  },
];

// ---- SHOP VIEW ----

const SHOP_VENDOR = {
  name: "Veraski",
  slug: "veraski-ng",
  tagline: "Science-backed skincare for African skin",
  location: "Lagos, Nigeria",
  rating: 4.8,
  reviews: 312,
  since: "2023",
  banner: "1531746020798-e6953c6e8e04",
  avatar: "1531746020798-e6953c6e8e04",
};

export function ShopView({ setView }: { setView: (v: View) => void }) {
  const activeProducts = catalogProducts.filter((p) => p.status === "active");
  const allConcerns = ["All", ...Array.from(new Set(activeProducts.flatMap((p) => p.concerns)))];
  const [filter, setFilter] = useState("All");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(true);
  const [addedToCart, setAddedToCart] = useState<number | null>(null);

  const shopUrl = `anovra.africa/shop/${SHOP_VENDOR.slug}`;

  useEffect(() => {
    const t = setTimeout(() => setGenerating(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const filtered = filter === "All" ? activeProducts : activeProducts.filter((p) => p.concerns.includes(filter));

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
            Generating your shop…
          </p>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Publishing {activeProducts.length} products to your storefront
          </p>
        </div>
        <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full animate-[grow_1.8s_ease-out_forwards]" style={{ animation: "none", transition: "width 1.6s ease-out", width: "100%" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Top admin bar */}
      <div className="bg-foreground text-primary-foreground py-2 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Anovra" className="h-5 w-auto object-contain shrink-0 bg-white/10 p-0.5 rounded" />
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>
              {shopUrl}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copy}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <ExternalLink className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              onClick={() => setView("dashboard")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded bg-accent hover:bg-accent/90 transition-colors"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              ← Back to dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Shop header */}
      <div className="bg-foreground text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Logo placeholder */}
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Fraunces', serif" }}>
                {SHOP_VENDOR.name[0]}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl font-light" style={{ fontFamily: "'Fraunces', serif" }}>
                  {SHOP_VENDOR.name}
                </h1>
                <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                  <CheckCircle className="w-3 h-3" /> Verified vendor
                </span>
              </div>
              <p className="text-sm text-white/60 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {SHOP_VENDOR.tagline}
              </p>
              <div className="flex items-center gap-4 text-xs text-white/50 flex-wrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{SHOP_VENDOR.location}</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {SHOP_VENDOR.rating} ({SHOP_VENDOR.reviews} reviews)
                </span>
                <span>{activeProducts.length} products · Since {SHOP_VENDOR.since}</span>
              </div>
            </div>
            <button
              onClick={() => setView("skintest")}
              className="flex-shrink-0 flex items-center gap-2 bg-accent text-white px-5 py-3 rounded-xl font-medium text-sm hover:bg-accent/90 transition-colors shadow-lg"
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
            <Zap className="w-4 h-4 text-accent flex-shrink-0" />
            <p className="text-sm text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              <span className="font-medium">Not sure which product is right for you?</span>{" "}
              <span className="text-muted-foreground">Take a 90-second AI skin test and get matched to the exact products your skin needs.</span>
            </p>
          </div>
          <button
            onClick={() => setView("skintest")}
            className="flex-shrink-0 text-xs font-medium text-accent border border-accent/40 px-3 py-1.5 rounded-lg hover:bg-accent hover:text-white transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Start free skin test →
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Concern filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {allConcerns.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`flex-shrink-0 text-sm px-4 py-2 rounded-full border transition-all ${
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

        {/* Results count */}
        <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: "'DM Mono', monospace" }}>
          {filtered.length} product{filtered.length !== 1 ? "s" : ""} {filter !== "All" ? `for "${filter}"` : "available"}
        </p>

        {/* Product grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
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
                  className="font-medium text-foreground text-sm leading-snug mb-2 flex-1"
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
                    onClick={() => { setAddedToCart(product.id); setTimeout(() => setAddedToCart(null), 2000); }}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-all ${
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
                  onClick={() => setView("skintest")}
                  className="mt-2 w-full text-xs text-center text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
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
    </div>
  );
}
