import { useState, useEffect, useRef } from "react";
import {
  Camera, Upload, Shield, BarChart2, Package, Users, TrendingUp,
  AlertTriangle, ChevronRight, CheckCircle, ArrowRight, MessageCircle,
  Zap, Globe, Lock, ChevronDown, ChevronUp, Star, FlaskConical, Leaf,
  ExternalLink, Scan, Activity, Eye, X, Check, Info, Store,
} from "lucide-react";
import { MapPin } from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { toast } from "sonner";

// ---- SKIN CONDITIONS SLIDER ----

// ---- SKIN CONDITIONS SLIDER ----

const SKIN_CONDITIONS = [
  // Cycle 1: Face -> Upper body -> Full body
  { name: "Acne", desc: "Bacterial breakouts & blemishes", image: "/concerns/acne.jpg" },
  { name: "Dehydration", desc: "Moisture-depleted, dull skin", image: "/concerns/dehydration.jpg" },
  { name: "Dry Skin", desc: "Tight, flaky, dehydrated skin", image: "/concerns/dry-skin.jpg" },

  // Cycle 2: Face -> Upper body -> Full body
  { name: "Hyperpigmentation", desc: "Uneven darkening of skin patches", image: "/concerns/hyperpigmentation.jpg" },
  { name: "Eczema-related", desc: "Itchy, inflamed skin patches", image: "/concerns/eczema.jpg" },
  { name: "Uneven Skin Tone", desc: "Inconsistent pigmentation across skin", image: "/concerns/uneven-skin-tone.jpg" },

  // Cycle 3: Face -> Upper body -> Full body
  { name: "Dark Spots", desc: "Post-inflammatory marks & spots", image: "/concerns/dark-spots.jpg" },
  { name: "Premature Ageing", desc: "Early texture & firmness loss", image: "/concerns/premature-aging.jpg" },
  { name: "Skin Irritation", desc: "Redness, stinging & inflammation", image: "/concerns/skin-irritation.jpg" },

  // Interleaved Remaining: Face -> Full body -> Face -> Full body -> Face -> Face -> Face
  { name: "Melasma", desc: "Hormonal pigmentation patches", image: "/concerns/melasma.jpg" },
  { name: "Sensitive Skin", desc: "Reactive, easily irritated skin", image: "/concerns/sensitive-skin.jpg" },
  { name: "Fine Lines & Wrinkles", desc: "Early signs of skin ageing", image: "/concerns/fine-lines-wrinkles.jpg" },
  { name: "Sun Damage", desc: "UV-induced discolouration & ageing", image: "/concerns/sun-damage.jpg" },
  { name: "Enlarged Pores", desc: "Visibly open pores & rough texture", image: "/concerns/enlarged-pores.jpg" },
  { name: "Oily Skin", desc: "Excess sebum & shine", image: "/concerns/oily-skin.jpg" },
  { name: "Combination Skin", desc: "Mixed oily & dry skin zones", image: "/concerns/combination-skin.jpg" },
];

function SkinConditionsSlider() {
  const [idx, setIdx] = useState(0);
  const [selectedCondition, setSelectedCondition] = useState<typeof SKIN_CONDITIONS[0] | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const CARD_W = 188; // card width + gap

  const clampedScroll = (next: number) => {
    const max = SKIN_CONDITIONS.length - 1;
    const clamped = Math.max(0, Math.min(next, max));
    setIdx(clamped);
    if (trackRef.current) {
      trackRef.current.scrollTo({ left: clamped * CARD_W, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => {
        const next = (prev + 1) % SKIN_CONDITIONS.length;
        if (trackRef.current) {
          trackRef.current.scrollTo({ left: next * CARD_W, behavior: "smooth" });
        }
        return next;
      });
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 bg-[#28170D] overflow-hidden relative border-y border-amber-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10 flex items-end justify-between">
        <div>
          <p
            className="text-xs tracking-[0.2em] uppercase text-emerald-400 mb-3"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            Skin Intelligence
          </p>
          <h2
            className="text-3xl sm:text-4xl font-light text-amber-50 leading-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            16 African skin concerns
            <br />
            <em className="text-emerald-400 not-italic">Anovra detects & addresses.</em>
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => clampedScroll(idx - 1)}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-emerald-400 hover:text-emerald-400 transition-colors"
            aria-label="Previous skin concern"
          >
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          <button
            onClick={() => clampedScroll(idx + 1)}
            className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-emerald-400 hover:text-emerald-400 transition-colors"
            aria-label="Next skin concern"
          >
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        </div>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-scroll pl-4 sm:pl-[calc((100vw-80rem)/2+1.5rem)] pr-6 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {SKIN_CONDITIONS.map((c, i) => (
          <div
            key={c.name}
            onClick={() => setSelectedCondition(c)}
            className="flex-none w-44 cursor-pointer group"
          >
            <div
              className="relative overflow-hidden rounded-xl mb-3 border border-white/10 shadow-md bg-secondary/20"
              style={{ height: 250 }}
            >
              <img
                src={c.image}
                alt={c.name}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              {/* Active indicator dot */}
              {i === idx && (
                <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white/40" />
              )}
              <div className="absolute bottom-2.5 left-2.5 right-2.5">
                <span className="text-[10px] bg-[#008236] text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  View Card
                </span>
              </div>
            </div>
            <p
              className="text-amber-50 font-medium text-sm leading-snug mb-1 group-hover:text-emerald-400 transition-colors"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {c.name}
            </p>
            <p
              className="text-amber-200/60 text-xs leading-relaxed"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {c.desc}
            </p>
          </div>
        ))}
        {/* Trailing spacer so last card isn't flush right */}
        <div className="flex-none w-6" />
      </div>

      {/* Dot pagination */}
      <div className="flex justify-center gap-1.5 mt-8 px-4">
        {SKIN_CONDITIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => clampedScroll(i)}
            className={`rounded-full transition-all duration-300 ${
              i === idx ? "w-6 h-1.5 bg-emerald-500" : "w-1.5 h-1.5 bg-white/25 hover:bg-white/40"
            }`}
          />
        ))}
      </div>

      {/* Lightbox Modal for viewing full skin concern infographic card */}
      {selectedCondition && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedCondition(null)}
        >
          <div
            className="relative bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedCondition(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-muted text-foreground transition-colors z-10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-4">
              <h3
                className="text-2xl sm:text-3xl font-light text-foreground"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {selectedCondition.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{selectedCondition.desc}</p>
            </div>
            <div className="rounded-xl overflow-hidden border border-border bg-black/5">
              <img
                src={selectedCondition.image}
                alt={selectedCondition.name}
                className="w-full h-auto object-contain max-h-[70vh] mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ---- RECOMMENDATION ENGINE SECTION ----

const ENGINE_FACTORS = [
  {
    icon: <Activity className="w-5 h-5" />,
    label: "Skin concern detected",
    desc: "Acne, hyperpigmentation, dryness — the exact condition identified from the scan drives the first filter.",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
  },
  {
    icon: <Users className="w-5 h-5" />,
    label: "Skin type",
    desc: "Oily, dry, combination, or sensitive — incompatible formulas are excluded before a single product is ranked.",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-400",
  },
  {
    icon: <BarChart2 className="w-5 h-5" />,
    label: "Severity",
    desc: "Mild versus severe concerns call for different active concentrations. Severity scores fine-tune which products rank highest.",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-400",
  },
  {
    icon: <FlaskConical className="w-5 h-5" />,
    label: "Ingredients required",
    desc: "The engine maps detected concerns to clinically backed actives — niacinamide, kojic acid, retinol — and surfaces products that contain them.",
    color: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-400",
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    label: "Ingredients to avoid",
    desc: "Known sensitisers and NAFDAC-flagged compounds are cross-referenced. Products with banned ingredients are silently excluded.",
    color: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-400",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    label: "Product compatibility",
    desc: "Layering conflicts — retinol with AHAs, vitamin C with niacinamide at high pH — are caught and the safer combination is preferred.",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-400",
  },
  {
    icon: <Package className="w-5 h-5" />,
    label: "Vendor inventory",
    desc: "Only in-stock products from the vendor's active catalogue are surfaced. Out-of-stock items never appear in results.",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-400",
  },
  {
    icon: <MapPin className="w-5 h-5" />,
    label: "Geographic availability",
    desc: "Location filters ensure recommended products can actually reach the customer — country, state, and city-level routing supported.",
    color: "bg-teal-50 text-teal-700 border-teal-200",
    dot: "bg-teal-400",
  },
];

function RecommendationEngineSection() {
  const [active, setActive] = useState(0);
  const [showEngineDetails, setShowEngineDetails] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setActive((i) => (i + 1) % ENGINE_FACTORS.length), 2600);
    return () => clearInterval(t);
  }, []);

  const f = ENGINE_FACTORS[active];
  const previewFactors = ENGINE_FACTORS.slice(0, 4);

  return (
    <section className="py-16 sm:py-20 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="max-w-2xl mb-8">
          <p
            className="text-xs tracking-[0.2em] uppercase text-emerald-600 font-semibold mb-3"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            How recommendations work
          </p>
          <h2
            className="text-4xl font-light text-foreground leading-tight mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Eight signals.
            <br />
            <em className="text-emerald-600 not-italic">One precise match.</em>
          </h2>
          <p className="text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            When a customer completes a skin test, Anovra compares their result with product safety, ingredients, stock, and location, then explains why each recommendation fits.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {previewFactors.map((factor) => (
            <div key={factor.label} className="rounded-2xl border border-border bg-card p-4 shadow-xs">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${factor.color}`}>
                {factor.icon}
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {factor.label}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {factor.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-y border-border py-5 mb-8">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center sm:text-left">
            {[
              { value: "8", label: "Signals" },
              { value: "<2s", label: "Match time" },
              { value: "100%", label: "Safety checked" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>{s.value}</p>
                <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.label}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowEngineDetails((open) => !open)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#008236]/25 bg-[#008236]/8 px-4 py-2.5 text-sm font-bold text-[#008236] hover:bg-[#008236]/12 transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {showEngineDetails ? "Hide matching logic" : "Explore matching logic"}
            {showEngineDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showEngineDetails && (
        <>
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — factor list */}
          <div className="space-y-1.5">
            {ENGINE_FACTORS.map((factor, i) => (
              <button
                key={factor.label}
                type="button"
                onClick={() => setActive(i)}
                className={`w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                  i === active
                    ? "bg-foreground border-foreground text-primary-foreground shadow-lg"
                    : "border-transparent hover:border-border hover:bg-muted/50"
                }`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${i === active ? "bg-emerald-500 scale-125" : "bg-border"}`} />
                <span
                  className={`text-sm font-medium transition-colors ${i === active ? "text-primary-foreground" : "text-foreground"}`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {factor.label}
                </span>
                {i === active && (
                  <ChevronRight className="w-4 h-4 ml-auto text-emerald-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Right — active factor detail card */}
          <div className="lg:sticky lg:top-8">
            <div className="relative">
              {/* Background glow */}
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500/8 via-transparent to-transparent rounded-3xl blur-xl" />

              <div className="relative bg-card border border-border rounded-2xl p-8 shadow-sm">
                {/* Step counter */}
                <div className="flex items-center justify-between mb-6">
                  <span
                    className="text-xs tracking-widest text-muted-foreground uppercase"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    Factor {active + 1} of {ENGINE_FACTORS.length}
                  </span>
                  {/* Progress dots */}
                  <div className="flex gap-1">
                    {ENGINE_FACTORS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-300 ${i === active ? "w-5 bg-emerald-500" : "w-1 bg-border"}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border mb-5 ${f.color}`}>
                  {f.icon}
                </div>

                {/* Label */}
                <h3
                  className="text-2xl font-light text-foreground mb-3 leading-snug"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {f.label}
                </h3>

                {/* Description */}
                <p
                  className="text-muted-foreground leading-relaxed mb-8"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {f.desc}
                </p>

                {/* Simulated mini-output */}
                <div className="bg-secondary rounded-xl p-4 space-y-2">
                  <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
                    engine output sample
                  </p>
                  {[active === 0
                    ? ["Acne", "Hyperpigmentation", "Dark spots"]
                    : active === 1
                    ? ["Oily skin ✓", "Combination skin ✓", "Sensitive skin ✗"]
                    : active === 2
                    ? ["Severity: Moderate (6.2 / 10)", "Priority: Anti-acne tier 2"]
                    : active === 3
                    ? ["Niacinamide", "Salicylic acid", "Zinc PCA"]
                    : active === 4
                    ? ["Mercury → blocked", "Hydroquinone >2% → blocked"]
                    : active === 5
                    ? ["Retinol + AHA → conflict flagged", "Vitamin C + Niacinamide → safe"]
                    : active === 6
                    ? ["In stock: 14 products", "Out of stock: 3 excluded"]
                    : ["Lagos, Nigeria → 12 available", "Abuja → 8 available"]
                  ].flat().map((line) => (
                    <div key={line} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${f.dot}`} />
                      <span className="text-xs text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                        {line}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Nav arrows */}
                <div className="flex items-center justify-between mt-6">
                  <button
                    type="button"
                    onClick={() => setActive((i) => (i - 1 + ENGINE_FACTORS.length) % ENGINE_FACTORS.length)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <ChevronDown className="w-3.5 h-3.5 rotate-90" /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setActive((i) => (i + 1) % ENGINE_FACTORS.length)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Next <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stat strip */}
        <div className="mt-16 pt-10 border-t border-border grid grid-cols-3 gap-6 text-center">
          {[
            { value: "8", label: "Signals evaluated per match", note: "simultaneously" },
            { value: "<2s", label: "Time to full recommendation", note: "after scan completes" },
            { value: "100%", label: "NAFDAC-checked", note: "before any result is shown" },
          ].map((s) => (
            <div key={s.value}>
              <p
                className="text-3xl font-light text-foreground mb-1"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {s.value}
              </p>
              <p className="text-sm text-foreground mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {s.label}
              </p>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                {s.note}
              </p>
            </div>
          ))}
        </div>
        </>
        )}
      </div>
    </section>
  );
}

// ---- LANDING ----

export function LandingView({ setView }: { setView: (v: View) => void }) {
  const [workflowAudience, setWorkflowAudience] = useState<"vendors" | "customers">("vendors");
  const [pricingAudience, setPricingAudience] = useState<"vendors" | "customers">("vendors");
  const openSignup = (kind: "vendor" | "brand" = "vendor") => {
    sessionStorage.setItem("signup_account_kind", kind);
    setView("signup");
  };

  const features = [
    {
      icon: <Scan className="w-5 h-5" />,
      title: "AI Selfie Analysis",
      desc: "Fine-tuned on African skin tones (Fitzpatrick IV–VI). Detects hyperpigmentation, acne, oiliness, dryness, and fine lines with clinical accuracy.",
    },
    {
      icon: <Package className="w-5 h-5" />,
      title: "Smart Product Catalogue",
      desc: "Vendors build their catalogue once. The AI maps every customer's skin analysis to the right products automatically — no manual sorting.",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Ingredient Safety Layer",
      desc: "Every product is screened against NAFDAC's banned substances list. Mercury, high-dose hydroquinone, and restricted steroids are blocked automatically.",
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: "WhatsApp-First CTAs",
      desc: "Recommendation cards link directly to the vendor's WhatsApp — how most Nigerian and African vendors actually sell. Frictionless.",
    },
    {
      icon: <BarChart2 className="w-5 h-5" />,
      title: "Vendor Analytics",
      desc: "See which concerns your customers have most, which products get clicked, where customers drop off. Know your market, not just your sales.",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "One-Line Embed",
      desc: "Drop a single <script> tag on your Shopify, WordPress, or custom site. Your customers take the skin test without ever leaving your brand.",
    },
  ];

  const tiers = [
    {
      name: "Basic",
      price: "₦12,500",
      sub: "per month",
      features: [
        "Up to 50 skin tests/month",
        "10 products in catalogue",
        "Anovra branding on results page",
        "Shareable test link",
        "Basic analytics",
      ],
      cta: "Start 14-day free trial",
      highlight: false,
    },
    {
      name: "Vendor Pro",
      price: "₦25,000",
      sub: "per month",
      features: [
        "Unlimited skin tests",
        "Unlimited product catalogue",
        "White-labelled results page",
        "Website embed widget",
        "Full analytics dashboard",
        "Priority support via WhatsApp",
      ],
      cta: "Start 14-day free trial",
      highlight: true,
    },
    {
      name: "Brand",
      price: "₦75,000",
      sub: "per month",
      features: [
        "Everything in Vendor Pro",
        "REST API access",
        "Custom domain for test link",
        "Multi-user team accounts",
        "SLA support",
        "Dedicated onboarding",
      ],
      cta: "Start 14-day free trial",
      highlight: false,
    },
  ];
  const workflows = {
    vendors: {
      eyebrow: "For skincare vendors",
      title: "Serve customers with better recommendations in three steps",
      accent: "emerald",
      steps: [
        { step: "01", title: "Set up your catalogue", desc: "Add your products once, including ingredients, pricing, stock, and the concerns each product helps with." },
        { step: "02", title: "Share one storefront link", desc: "Use your Anovra shop or skin-test link on WhatsApp, Instagram, your website, or in-store QR codes." },
        { step: "03", title: "Guide ready-to-buy customers", desc: "Customers scan their skin, see why a product fits, and contact you with more confidence." },
      ],
    },
    customers: {
      eyebrow: "For skincare customers",
      title: "Find products that make sense for your skin",
      accent: "amber",
      steps: [
        { step: "01", title: "Take a quick skin test", desc: "Take or upload a clear photo of the area you want to understand." },
        { step: "02", title: "Review your AI report", desc: "Get a plain-English report that explains your concern, skin type, severity, and ingredient guidance." },
        { step: "03", title: "Shop matched products", desc: "Browse approved products matched to your result, vendor availability, and location." },
      ],
    },
  };
  const activeWorkflow = workflows[workflowAudience];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-emerald-500/20">
              <Leaf className="w-3.5 h-3.5" />
              Built for African skin. Regulated for African markets.
            </span>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-light leading-[1.12] text-foreground mb-6"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Understand Your Skin.
              <br />
              <em className="text-[#008236] not-italic font-normal">Make Smarter</em> Skincare Decisions
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8 max-w-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Looking for personalised skincare recommendations, or a better way to serve your customers? Anovra helps individuals and skincare businesses understand skin needs, match safer products, and make every recommendation feel more personal.
            </p>
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl">
                <button
                  onClick={() => setView("skintest")}
                  className="min-h-12 flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006c2c] text-white font-bold px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all text-center cursor-pointer whitespace-nowrap"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Analyse my skin
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => openSignup("vendor")}
                  className="min-h-12 flex items-center justify-center gap-2 border-2 border-[#008236] bg-transparent hover:bg-[#008236]/10 text-[#008236] dark:text-emerald-400 font-bold px-6 py-3.5 rounded-xl transition-all text-center cursor-pointer whitespace-nowrap"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Start a storefront
                </button>
              </div>
              <button
                onClick={() => openSignup("brand")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-[#008236] transition-colors cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Managing multiple outlets? Register Brand HQ
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative block">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/80 bg-card group">
              <img
                src="/hero-image.jpg"
                alt="AI African Skin Analysis Platform - Anovra"
                className="w-full h-[340px] sm:h-[420px] object-cover object-top transition-transform duration-700 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              {/* Overlay Analysis Card */}
              <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-md rounded-xl p-4 border border-border shadow-xl">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/20">
                    <Activity className="w-4.5 h-4.5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">AI Skin Analysis Active</p>
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Fitzpatrick IV–VI Verified
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Detected: Moderate facial hyperpigmentation, refined T-zone texture
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      <span className="text-xs bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-medium border border-emerald-500/20">
                        3 Products Matched
                      </span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-medium">
                        NAFDAC Safe ✓
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Live Scans Stat Pill */}
            <div className="absolute -left-3 sm:-left-6 top-6 bg-card/95 backdrop-blur-md border border-border/80 rounded-xl p-3 shadow-xl hidden sm:block">
              <p className="text-2xl font-bold text-foreground leading-none" style={{ fontFamily: "'Fraunces', serif" }}>
                12,847
              </p>
              <p className="text-xs text-muted-foreground font-medium mt-1">AI Scans Completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety trust bar - Rich Brown Background */}
      <div className="bg-[#381B0E] text-amber-100 py-3.5 border-y border-amber-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium">
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> NAFDAC ingredient compliance</span>
          <span className="text-amber-200/30">·</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> Facial data not stored beyond session</span>
          <span className="text-amber-200/30">·</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Medical disclaimer on every result</span>
          <span className="text-amber-200/30">·</span>
          <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-400" /> Trained on Fitzpatrick IV–VI skin tones</span>
        </div>
      </div>

      {/* Features grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-12">
          <h2
            className="text-4xl font-light text-foreground mb-3"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Everything a vendor needs,
            <br />
            <em className="text-emerald-600 not-italic">nothing they don't.</em>
          </h2>
          <p className="text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Designed specifically for the Nigerian and African skincare market — not adapted from a western tool.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="group p-6 bg-card border border-border rounded-xl hover:border-emerald-500/40 hover:shadow-lg transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-[#008236] group-hover:text-white transition-colors duration-200">
                {f.icon}
              </div>
              <h3
                className="font-semibold text-foreground mb-2 text-base group-hover:text-emerald-600 transition-colors duration-200"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Skin Conditions Slider */}
      <SkinConditionsSlider />

      {/* How it works */}
      <section className="py-16 sm:py-20 bg-secondary/80 border-y border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-emerald-600 font-semibold mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>
                How it works
              </p>
              <h2 className="text-3xl sm:text-4xl font-light text-foreground leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                Choose the flow that fits you.
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-card p-1 shadow-xs">
              {[
                { id: "vendors" as const, label: "Vendors" },
                { id: "customers" as const, label: "Customers" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setWorkflowAudience(item.id)}
                  className={cn(
                    "min-h-10 rounded-xl px-4 text-sm font-bold transition-colors",
                    workflowAudience === item.id
                      ? "bg-[#008236] text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span
                  className={cn(
                    "inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border mb-3",
                    workflowAudience === "vendors"
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                  )}
                >
                  {activeWorkflow.eyebrow}
                </span>
                <h3 className="text-2xl sm:text-3xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  {activeWorkflow.title}
                </h3>
              </div>
              <button
                onClick={() => workflowAudience === "vendors" ? openSignup("vendor") : setView("skintest")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#008236] px-5 py-3 text-sm font-bold text-white hover:bg-[#006c2c] transition-colors"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {workflowAudience === "vendors" ? "Start storefront" : "Take skin test"}
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {activeWorkflow.steps.map((s) => (
                <div key={s.step} className="relative rounded-2xl border border-border/80 bg-background p-5">
                  <p
                    className={cn(
                      "text-4xl font-light leading-none mb-3",
                      workflowAudience === "vendors" ? "text-emerald-600/30" : "text-amber-600/35"
                    )}
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    {s.step}
                  </p>
                  <h4 className="font-semibold text-foreground mb-2 text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Recommendation Engine */}
      <RecommendationEngineSection />

      {/* Brand HQ */}
      <section className="py-20 bg-background border-y border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <div>
            <span
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#008236] font-semibold mb-4"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              <Users className="w-4 h-4" />
              For established brands
            </span>
            <h2
              className="text-3xl sm:text-4xl font-light text-foreground leading-tight mb-4"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Register your skincare brand. Manage every outlet from one HQ.
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-xl mb-7" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Give each branch its own storefront and skin test link while HQ tracks performance, controls access, and keeps product quality consistent.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mb-8">
              {[
                { icon: <Store className="w-4 h-4" />, title: "Branch storefronts", text: "Dedicated shop and scan links for each outlet." },
                { icon: <BarChart2 className="w-4 h-4" />, title: "HQ analytics", text: "Compare scans, catalogue activity, and revenue." },
                { icon: <Shield className="w-4 h-4" />, title: "Access control", text: "Add, pause, or reactivate branch accounts." },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center mb-3">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => openSignup("brand")}
                className="inline-flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006c2c] text-white font-bold px-6 py-3.5 rounded-xl shadow-md transition-all"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Register your brand
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-[#FAF7F2] p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  Brand network
                </p>
                <h3 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Tulip Naturals HQ
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                14-day trial
              </span>
            </div>
            <div className="space-y-3">
              {[
                { name: "Tulip Lagos Island", slug: "tulip-lagos-island", scans: "128 scans", status: "Active" },
                { name: "Tulip Abuja", slug: "tulip-abuja", scans: "94 scans", status: "Active" },
                { name: "Tulip Port Harcourt", slug: "tulip-port-harcourt", scans: "41 scans", status: "Review" },
              ].map((branch) => (
                <div key={branch.slug} className="rounded-2xl border border-border bg-white p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-bold text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {branch.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                        anovra.africa/#/shop/{branch.slug}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-semibold">{branch.scans}</span>
                      <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-semibold">{branch.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-[#FAF7F2] text-foreground rounded-3xl p-6 sm:p-12 shadow-sm border border-border/80">
          <h2
            className="text-3xl sm:text-4xl font-light text-foreground mb-3 text-center"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Transparent pricing in naira.
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-12" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Start with a 14-day free trial, then choose the plan that fits how you use Anovra.
          </p>

          <div className="max-w-md mx-auto mb-10 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-white p-1 shadow-xs">
            {[
              { id: "vendors" as const, label: "For vendors" },
              { id: "customers" as const, label: "For customers" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPricingAudience(item.id)}
                className={cn(
                  "min-h-11 rounded-xl px-4 text-sm font-bold transition-colors",
                  pricingAudience === item.id
                    ? "bg-[#008236] text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Vendor Plans */}
          {pricingAudience === "vendors" && (
          <div>
            <div className="flex items-center gap-4 mb-7 max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#008236]/10 text-[#008236] border border-[#008236]/20 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-light text-foreground mb-0.5" style={{ fontFamily: "'Fraunces', serif" }}>For Skincare Vendors</h3>
                  <p className="text-xs uppercase tracking-widest text-[#008236] font-semibold" style={{ fontFamily: "'DM Mono', monospace" }}>Vendor Plans</p>
                </div>
              </div>
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-xs text-[#008236] bg-[#008236]/10 border border-[#008236]/30 px-3 py-1 rounded-full font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                14-day free trial on every plan
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {tiers.map((t) => (
                <div
                  key={t.name}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-6 flex flex-col transition-all duration-300",
                    t.highlight
                      ? "bg-white text-foreground border-2 border-[#008236] shadow-2xl sm:scale-105 ring-4 ring-[#008236]/10"
                      : t.name === "Basic"
                        ? "bg-gradient-to-br from-white via-white to-emerald-50/80 text-foreground border-2 border-emerald-200 hover:border-[#008236]/70"
                        : "bg-gradient-to-br from-white via-white to-teal-50/80 text-foreground border-2 border-teal-200 hover:border-teal-500"
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-1.5",
                      t.highlight ? "bg-[#008236]" : t.name === "Basic" ? "bg-emerald-400" : "bg-teal-500"
                    )}
                  />
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p
                      className={cn("text-xs font-bold uppercase tracking-wider", t.highlight ? "text-[#008236]" : "text-muted-foreground")}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {t.name}
                    </p>
                    {t.highlight && (
                      <span className="rounded-full bg-[#008236]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#008236] border border-[#008236]/20">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-light mb-0.5" style={{ fontFamily: "'Fraunces', serif" }}>
                    {t.price}
                  </p>
                  <p className="text-xs mb-3 text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t.sub}</p>
                  <span className="mb-6 inline-flex w-fit rounded-full bg-[#008236]/10 px-2.5 py-1 text-[11px] font-bold text-[#008236] border border-[#008236]/20">
                    14-day free trial
                  </span>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[#008236]" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => openSignup(t.name === "Brand" ? "brand" : "vendor")}
                    className={cn(
                      "w-full py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm",
                      t.highlight
                        ? "bg-[#008236] text-white hover:bg-[#006c2c]"
                        : t.name === "Basic"
                          ? "bg-[#008236] text-white hover:bg-[#006c2c]"
                          : "bg-[#008236] text-white hover:bg-[#006c2c]"
                    )}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {t.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* User / Consumer Plans */}
          {pricingAudience === "customers" && (
          <div>
            <div className="flex items-center gap-4 mb-7 max-w-4xl mx-auto">
              <div>
                <h3 className="text-2xl font-light text-foreground mb-0.5" style={{ fontFamily: "'Fraunces', serif" }}>For Skin Care Customers</h3>
                <p className="text-xs uppercase tracking-widest text-[#C86B3A] font-semibold" style={{ fontFamily: "'DM Mono', monospace" }}>Consumer Plans</p>
              </div>
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-xs text-amber-800 bg-[#C86B3A]/10 border border-[#C86B3A]/30 px-2.5 py-1 rounded-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                14-day free trial on every plan
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {[
                {
                  name: "Glow Pass",
                  price: "₦1,500",
                  sub: "per month",
                  highlight: false,
                  features: [
                    "1 full skin analysis per month",
                    "Top 3 product recommendations",
                    "Basic skin type & concern report",
                    "Ingredient safety check",
                    "Results shared via link",
                  ],
                  cta: "Start 14-day free trial",
                },
                {
                  name: "Glow Pass+",
                  price: "₦3,500",
                  sub: "per month",
                  highlight: true,
                  features: [
                    "Unlimited skin analyses",
                    "Full product recommendation list",
                    "Detailed skin health report",
                    "Save & track your skin history",
                    "Personalised ingredient glossary",
                    "Priority product matching",
                  ],
                  cta: "Start 14-day free trial",
                },
                {
                  name: "Premium Glow",
                  price: "₦7,000",
                  sub: "per month",
                  highlight: false,
                  features: [
                    "Everything in Glow Pass+",
                    "Monthly skin progress report & score",
                    "Direct chat with certified skin advisers",
                    "Exclusive discounts from Anovra vendors",
                    "Family skin profiles (up to 5 members)",
                    "Early access to new AI features",
                    "Personalised skincare routine builder",
                  ],
                  cta: "Start 14-day free trial",
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className={cn(
                    "rounded-2xl border p-6 flex flex-col transition-all duration-300",
                    t.highlight
                      ? "bg-[#C86B3A] text-white border-2 border-[#C86B3A] shadow-2xl sm:scale-105"
                      : "bg-[#008236] text-white border-2 border-[#008236] hover:shadow-lg"
                  )}
                >
                  <p
                    className="text-xs font-bold mb-3 uppercase tracking-wider text-white/80"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {t.name}
                  </p>
                  <p className="text-3xl font-light mb-0.5 text-white" style={{ fontFamily: "'Fraunces', serif" }}>
                    {t.price}
                  </p>
                  <p className="text-xs mb-3 text-white/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t.sub}</p>
                  <span className="mb-6 inline-flex w-fit rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white border border-white/20">
                    14-day free trial
                  </span>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/90" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={cn(
                      "w-full py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer",
                      t.highlight
                        ? "bg-[#FAF7F2] text-[#C86B3A] hover:bg-white"
                        : "bg-[#FAF7F2] text-[#008236] hover:bg-white"
                    )}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {t.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Results are cosmetic recommendations only. Consult a registered dermatologist for persistent skin conditions.
          </p>
        </div>
      </footer>
    </div>
  );
}
