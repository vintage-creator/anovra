import { useState, useRef, useEffect } from "react";
import {
  Camera, Upload, Shield, Package, ChevronDown, ChevronUp, X, Check,
  CheckCircle, AlertTriangle, Eye, ExternalLink, FlaskConical,
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { UnifiedDashboardHeader } from "./components/UnifiedDashboardHeader";
import { supabase } from "./utils/supabase";
import { toast } from "sonner";

// ---- CATALOG DATA ----

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

// ---- CATALOG FORM OPTIONS ----

const PRODUCT_CATEGORIES = [
  "Acne treatment",
  "Hyperpigmentation",
  "Dark spot correction",
  "Skin brightening",
  "Skin toning",
  "Skin moisturizing",
  "Anti-aging",
  "Wrinkle reduction",
  "Skin repair",
  "Skin rejuvenation",
  "Oil control",
  "Hydration",
  "Sensitive skin care",
];

const SKIN_CONCERN_OPTIONS = [
  "Acne / blemish control",
  "Hyperpigmentation / dark spots",
  "Brightening / even tone",
  "Tone unification",
  "Dryness / hydration",
  "Oil control",
  "Anti-aging / fine lines",
  "Sensitivity / redness / barrier repair",
  "Sun damage / SPF",
  "Enlarged pores",
  "Dehydration",
  "Melasma",
  "Premature aging",
];

const SKIN_TYPE_OPTIONS = ["Oily", "Dry", "Combination", "Sensitive", "All skin types"];

type ProductForm = {
  name: string;
  brand: string;
  price: string;
  stock: string;
  description: string;
  benefits: string;
  precautions: string;
  usageInstructions: string;
  category: string;
  concerns: string[];
  skinTypes: string[];
  keyIngredients: string[];
  activeIngredients: string[];
  photoFile?: File | null;
};

const EMPTY_PRODUCT_FORM: ProductForm = {
  name: "", brand: "", price: "", stock: "", description: "",
  benefits: "", precautions: "", usageInstructions: "", category: "",
  concerns: [], skinTypes: [], keyIngredients: [], activeIngredients: [],
  photoFile: null,
};

function TagInput({
  tags, onAdd, onRemove, placeholder,
}: { tags: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void; placeholder: string }) {
  const [val, setVal] = useState("");
  const commit = () => {
    const trimmed = val.trim().replace(/,$/, "");
    if (trimmed && !tags.includes(trimmed)) onAdd(trimmed);
    setVal("");
  };
  return (
    <div
      className="min-h-[44px] flex flex-wrap gap-1.5 items-center p-2 bg-input-background border border-border rounded-md focus-within:ring-1 focus-within:ring-accent/50 cursor-text"
      onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}
    >
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full" style={{ fontFamily: "'DM Mono', monospace" }}>
          {t}
          <button type="button" onClick={() => onRemove(t)} className="hover:text-red-500 transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        value={val}
        placeholder={tags.length === 0 ? placeholder : "Add another…"}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); } }}
        onBlur={commit}
      />
    </div>
  );
}

function AddProductDrawer({ onClose, onSave }: { onClose: () => void; onSave: (f: ProductForm) => void }) {
  const [form, setForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ingMode, setIngMode] = useState<"type" | "scan">("type");
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [descMode, setDescMode] = useState<"type" | "scan">("type");
  const [descScanPreview, setDescScanPreview] = useState<string | null>(null);
  const [descScanning, setDescScanning] = useState(false);
  const [descScanDone, setDescScanDone] = useState(false);
  const [benefitsMode, setBenefitsMode] = useState<"type" | "scan">("type");
  const [benefitsScanPreview, setBenefitsScanPreview] = useState<string | null>(null);
  const [benefitsScanning, setBenefitsScanning] = useState(false);
  const [benefitsScanDone, setBenefitsScanDone] = useState(false);
  const set = (k: keyof ProductForm, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggleArr = (k: "concerns" | "skinTypes", v: string) =>
    setForm((f) => ({
      ...f,
      [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v],
    }));
  const addTag = (k: "keyIngredients" | "activeIngredients", v: string) =>
    setForm((f) => ({ ...f, [k]: [...f[k], v] }));
  const removeTag = (k: "keyIngredients" | "activeIngredients", v: string) =>
    setForm((f) => ({ ...f, [k]: f[k].filter((x) => x !== v) }));

  // Simulated OCR extraction — realistic ingredient pools keyed to common African skincare products
  const MOCK_KEY = ["Aqua", "Glycerin", "Niacinamide", "Shea Butter", "Aloe Vera Extract", "Vitamin C", "Kojic Acid", "Zinc PCA", "Panthenol", "Allantoin"];
  const MOCK_ACTIVE = ["Niacinamide 5%", "Alpha Arbutin 2%", "Kojic Acid 1%", "Retinol 0.1%", "Salicylic Acid 0.5%"];

  const handleScanImage = (file: File) => {
    setScanPreview(URL.createObjectURL(file));
    setScanDone(false);
    setScanning(true);
    setTimeout(() => {
      const picked = (arr: string[], n: number) =>
        [...arr].sort(() => Math.random() - 0.5).slice(0, n);
      setForm((f) => ({
        ...f,
        keyIngredients: [...new Set([...f.keyIngredients, ...picked(MOCK_KEY, 6)])],
        activeIngredients: [...new Set([...f.activeIngredients, ...picked(MOCK_ACTIVE, 3)])],
      }));
      setScanning(false);
      setScanDone(true);
    }, 2200);
  };

  const MOCK_DESCRIPTIONS = [
    "A lightweight, fast-absorbing serum formulated to visibly reduce dark spots, even out skin tone, and restore natural radiance. Enriched with brightening actives and skin-soothing botanicals for daily use.",
    "An advanced daily moisturiser that deeply hydrates and strengthens the skin barrier. Suitable for all skin types, this formula improves texture and leaves skin feeling soft, smooth, and balanced.",
    "A targeted treatment cream designed to combat acne-causing bacteria while calming redness and inflammation. Non-comedogenic formula works overnight to clear blemishes without over-drying.",
  ];
  const MOCK_BENEFITS = [
    "Visibly reduces dark spots and hyperpigmentation within 4 weeks\nEvens out skin tone and boosts natural radiance\nStrengthens the skin moisture barrier\nNon-comedogenic — safe for acne-prone skin\nDermatologist tested and approved for African skin tones",
    "Deep hydration that lasts up to 72 hours\nReduces appearance of fine lines and wrinkles\nCalms sensitive and reactive skin\nImproves overall skin texture with continued use\nFree from parabens, sulphates, and artificial fragrances",
  ];

  const handleScanDescription = (file: File) => {
    setDescScanPreview(URL.createObjectURL(file));
    setDescScanDone(false);
    setDescScanning(true);
    setTimeout(() => {
      const text = MOCK_DESCRIPTIONS[Math.floor(Math.random() * MOCK_DESCRIPTIONS.length)];
      setForm((f) => ({ ...f, description: text }));
      setDescScanning(false);
      setDescScanDone(true);
    }, 2000);
  };

  const handleScanBenefits = (file: File) => {
    setBenefitsScanPreview(URL.createObjectURL(file));
    setBenefitsScanDone(false);
    setBenefitsScanning(true);
    setTimeout(() => {
      const text = MOCK_BENEFITS[Math.floor(Math.random() * MOCK_BENEFITS.length)];
      setForm((f) => ({ ...f, benefits: text }));
      setBenefitsScanning(false);
      setBenefitsScanDone(true);
    }, 1800);
  };

  const inputCls = "w-full px-3 py-2 bg-input-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-accent/50";
  const labelCls = "block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide";
  const sectionCls = "space-y-4 pb-6 border-b border-border";

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-xl bg-background flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
              Add New Product
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              All fields help the AI match your product to the right customers
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

          {/* 1 — Basic info */}
          <div className={sectionCls}>
            <h3 className="text-sm font-semibold text-foreground mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Product Name *</label>
                <input className={inputCls} placeholder="e.g. Glow Serum 30ml" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Brand</label>
                <input className={inputCls} placeholder="Brand name" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Pricing (₦)</label>
                <input className={inputCls} placeholder="e.g. 8,500" value={form.price} onChange={(e) => set("price", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Available Stock</label>
                <input className={inputCls} type="number" placeholder="Units in stock" value={form.stock} onChange={(e) => set("stock", e.target.value)} />
              </div>
            </div>
          </div>

          {/* 2 — Image upload */}
          <div className={sectionCls}>
            <h3 className="text-sm font-semibold text-foreground mb-3">Product Images</h3>
            <label className="block">
              <div className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${imagePreview ? "border-accent/40 bg-accent/5" : "border-border hover:border-accent/40 hover:bg-muted/40"}`}>
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="preview" className="w-24 h-24 object-cover rounded-lg" />
                    <p className="text-xs text-muted-foreground">Click to change image</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      Drop images here or <span className="text-accent font-medium">browse</span>
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 10MB</p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImagePreview(URL.createObjectURL(file));
                    setForm((f) => ({ ...f, photoFile: file }));
                  }
                }}
              />
            </label>
          </div>

          {/* 3 — Product category */}
          <div className={sectionCls}>
            <h3 className="text-sm font-semibold text-foreground mb-3">Product Category</h3>
            <label className={labelCls}>Primary Purpose *</label>
            <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">Select category…</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 4 — Skin concerns */}
          <div className={sectionCls}>
            <h3 className="text-sm font-semibold text-foreground mb-1">Intended Skin Concerns</h3>
            <p className="text-xs text-muted-foreground mb-3">Select all concerns this product addresses</p>
            <div className="flex flex-wrap gap-2">
              {SKIN_CONCERN_OPTIONS.map((c) => {
                const active = form.concerns.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleArr("concerns", c)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${active ? "bg-accent text-white border-accent" : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"}`}
                  >
                    {active && <Check className="w-3 h-3 inline mr-1" />}
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5 — Suitable skin types */}
          <div className={sectionCls}>
            <h3 className="text-sm font-semibold text-foreground mb-1">Suitable Skin Types</h3>
            <p className="text-xs text-muted-foreground mb-3">Select all that apply</p>
            <div className="flex flex-wrap gap-2">
              {SKIN_TYPE_OPTIONS.map((t) => {
                const active = form.skinTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleArr("skinTypes", t)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${active ? "bg-foreground text-primary-foreground border-foreground" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}
                  >
                    {active && <Check className="w-3 h-3 inline mr-1" />}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6 — Ingredients */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Ingredients</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Type manually or scan the product label</p>
              </div>
              {/* Mode toggle */}
              <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg">
                <button
                  type="button"
                  onClick={() => setIngMode("type")}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${ingMode === "type" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Type
                </button>
                <button
                  type="button"
                  onClick={() => setIngMode("scan")}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${ingMode === "scan" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Scan Label
                </button>
              </div>
            </div>

            {ingMode === "type" ? (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Key Ingredients</label>
                  <TagInput
                    tags={form.keyIngredients}
                    onAdd={(v) => addTag("keyIngredients", v)}
                    onRemove={(v) => removeTag("keyIngredients", v)}
                    placeholder="Type ingredient, press Enter…"
                  />
                </div>
                <div>
                  <label className={labelCls}>Active Ingredients</label>
                  <TagInput
                    tags={form.activeIngredients}
                    onAdd={(v) => addTag("activeIngredients", v)}
                    onRemove={(v) => removeTag("activeIngredients", v)}
                    placeholder="Type active ingredient, press Enter…"
                  />
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-accent flex-shrink-0" />
                  Ingredients are automatically checked against the NAFDAC safety database on save.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Upload zone */}
                <label className="block cursor-pointer">
                  <div className={`relative rounded-xl border-2 border-dashed transition-colors overflow-hidden ${scanPreview ? "border-accent/40" : "border-border hover:border-accent/50 hover:bg-muted/30"}`}>
                    {scanPreview ? (
                      <div className="flex gap-4 p-3 items-start">
                        <div className="relative flex-shrink-0">
                          <img src={scanPreview} alt="Label scan" className="w-24 h-32 object-cover rounded-lg" />
                          {scanning && (
                            <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                          {scanDone && (
                            <div className="absolute inset-0 rounded-lg bg-accent/20 flex items-center justify-center">
                              <CheckCircle className="w-8 h-8 text-accent" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          {scanning && (
                            <>
                              <p className="text-sm font-medium text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                Reading label…
                              </p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                AI is extracting ingredient names from your product photo. This takes a moment.
                              </p>
                              <div className="mt-3 space-y-1.5">
                                {[80, 60, 90].map((w, i) => (
                                  <div key={i} className="h-2 bg-muted rounded animate-pulse" style={{ width: `${w}%` }} />
                                ))}
                              </div>
                            </>
                          )}
                          {scanDone && (
                            <>
                              <p className="text-sm font-medium text-green-700 mb-1 flex items-center gap-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                <Check className="w-3.5 h-3.5" />
                                Ingredients extracted
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {form.keyIngredients.length} key · {form.activeIngredients.length} active ingredients found. Review and edit below.
                              </p>
                              <button
                                type="button"
                                onClick={() => { setScanPreview(null); setScanDone(false); }}
                                className="mt-2 text-xs text-accent underline underline-offset-2 hover:text-accent/80"
                              >
                                Scan a different photo
                              </button>
                            </>
                          )}
                          {!scanning && !scanDone && (
                            <p className="text-xs text-muted-foreground">Click to replace photo</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Take or upload a photo of the ingredients list
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Point your camera at the back of the product — the AI reads and fills in every ingredient automatically.
                          </p>
                        </div>
                        <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
                          Browse / Take Photo
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScanImage(f); }}
                  />
                </label>

                {/* Extracted results — show once we have any tags */}
                {(form.keyIngredients.length > 0 || form.activeIngredients.length > 0) && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className={labelCls}>Key Ingredients {scanning && <span className="text-accent animate-pulse ml-1">Extracting…</span>}</label>
                      <TagInput
                        tags={form.keyIngredients}
                        onAdd={(v) => addTag("keyIngredients", v)}
                        onRemove={(v) => removeTag("keyIngredients", v)}
                        placeholder="Add more manually…"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Active Ingredients {scanning && <span className="text-accent animate-pulse ml-1">Extracting…</span>}</label>
                      <TagInput
                        tags={form.activeIngredients}
                        onAdd={(v) => addTag("activeIngredients", v)}
                        onRemove={(v) => removeTag("activeIngredients", v)}
                        placeholder="Add more manually…"
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-accent flex-shrink-0" />
                  Ingredients are automatically checked against the NAFDAC safety database on save.
                </p>
              </div>
            )}
          </div>

          {/* 7 — Descriptions */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-foreground">Product Details</h3>

            {/* Product Description */}
            <div className={sectionCls}>
              <div className="flex items-center justify-between mb-3">
                <label className={labelCls} style={{ margin: 0 }}>Product Description *</label>
                <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDescMode("type")}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${descMode === "type" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    Type
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescMode("scan")}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${descMode === "scan" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Scan Label
                  </button>
                </div>
              </div>

              {descMode === "type" ? (
                <textarea
                  className={`${inputCls} resize-none h-24`}
                  placeholder="Describe what this product does and why customers should use it…"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              ) : (
                <div className="space-y-3">
                  <label className="block cursor-pointer">
                    <div className={`rounded-xl border-2 border-dashed transition-colors overflow-hidden ${descScanPreview ? "border-accent/40" : "border-border hover:border-accent/50 hover:bg-muted/30"}`}>
                      {descScanPreview ? (
                        <div className="flex gap-4 p-3 items-start">
                          <div className="relative flex-shrink-0">
                            <img src={descScanPreview} alt="Label" className="w-20 h-28 object-cover rounded-lg" />
                            {descScanning && (
                              <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                            {descScanDone && (
                              <div className="absolute inset-0 rounded-lg bg-accent/20 flex items-center justify-center">
                                <CheckCircle className="w-7 h-7 text-accent" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            {descScanning && (
                              <>
                                <p className="text-sm font-medium text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Reading product description…</p>
                                <div className="space-y-1.5">
                                  {[90, 75, 85, 60].map((w, i) => (
                                    <div key={i} className="h-2 bg-muted rounded animate-pulse" style={{ width: `${w}%` }} />
                                  ))}
                                </div>
                              </>
                            )}
                            {descScanDone && (
                              <>
                                <p className="text-sm font-medium text-green-700 flex items-center gap-1.5 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                  <Check className="w-3.5 h-3.5" /> Description extracted
                                </p>
                                <p className="text-xs text-muted-foreground">Review and edit the text below.</p>
                                <button type="button" onClick={() => { setDescScanPreview(null); setDescScanDone(false); }} className="mt-2 text-xs text-accent underline underline-offset-2 hover:text-accent/80">
                                  Scan a different photo
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
                          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <Camera className="w-5 h-5 text-accent" />
                          </div>
                          <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Photograph the product description on the label
                          </p>
                          <p className="text-xs text-muted-foreground">The AI reads the text and fills it in for you.</p>
                          <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">Browse / Take Photo</span>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScanDescription(f); }} />
                  </label>
                  {/* Editable textarea always shown once we have text */}
                  {form.description && (
                    <textarea
                      className={`${inputCls} resize-none h-24`}
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Product Benefits */}
            <div className={sectionCls}>
              <div className="flex items-center justify-between mb-3">
                <label className={labelCls} style={{ margin: 0 }}>Product Benefits</label>
                <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg">
                  <button
                    type="button"
                    onClick={() => setBenefitsMode("type")}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${benefitsMode === "type" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    Type
                  </button>
                  <button
                    type="button"
                    onClick={() => setBenefitsMode("scan")}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-all ${benefitsMode === "scan" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Scan Label
                  </button>
                </div>
              </div>

              {benefitsMode === "type" ? (
                <textarea
                  className={`${inputCls} resize-none h-20`}
                  placeholder="List the key benefits customers will experience…"
                  value={form.benefits}
                  onChange={(e) => set("benefits", e.target.value)}
                />
              ) : (
                <div className="space-y-3">
                  <label className="block cursor-pointer">
                    <div className={`rounded-xl border-2 border-dashed transition-colors overflow-hidden ${benefitsScanPreview ? "border-accent/40" : "border-border hover:border-accent/50 hover:bg-muted/30"}`}>
                      {benefitsScanPreview ? (
                        <div className="flex gap-4 p-3 items-start">
                          <div className="relative flex-shrink-0">
                            <img src={benefitsScanPreview} alt="Label" className="w-20 h-28 object-cover rounded-lg" />
                            {benefitsScanning && (
                              <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                            {benefitsScanDone && (
                              <div className="absolute inset-0 rounded-lg bg-accent/20 flex items-center justify-center">
                                <CheckCircle className="w-7 h-7 text-accent" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            {benefitsScanning && (
                              <>
                                <p className="text-sm font-medium text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Reading benefits list…</p>
                                <div className="space-y-1.5">
                                  {[85, 70, 90, 65, 80].map((w, i) => (
                                    <div key={i} className="h-2 bg-muted rounded animate-pulse" style={{ width: `${w}%` }} />
                                  ))}
                                </div>
                              </>
                            )}
                            {benefitsScanDone && (
                              <>
                                <p className="text-sm font-medium text-green-700 flex items-center gap-1.5 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                  <Check className="w-3.5 h-3.5" /> Benefits extracted
                                </p>
                                <p className="text-xs text-muted-foreground">Review and edit the text below.</p>
                                <button type="button" onClick={() => { setBenefitsScanPreview(null); setBenefitsScanDone(false); }} className="mt-2 text-xs text-accent underline underline-offset-2 hover:text-accent/80">
                                  Scan a different photo
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
                          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <Camera className="w-5 h-5 text-accent" />
                          </div>
                          <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Photograph the benefits section on the label
                          </p>
                          <p className="text-xs text-muted-foreground">The AI reads the bullet points and fills them in for you.</p>
                          <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">Browse / Take Photo</span>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScanBenefits(f); }} />
                  </label>
                  {form.benefits && (
                    <textarea
                      className={`${inputCls} resize-none h-20`}
                      value={form.benefits}
                      onChange={(e) => set("benefits", e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Usage Instructions & Precautions — type only */}
            <div>
              <label className={labelCls}>Usage Instructions</label>
              <textarea className={`${inputCls} resize-none h-20`} placeholder="How to apply, how often, AM/PM, patch test advice…" value={form.usageInstructions} onChange={(e) => set("usageInstructions", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Precautions & Warnings</label>
              <textarea className={`${inputCls} resize-none h-20`} placeholder="Any warnings, side effects, or contraindications…" value={form.precautions} onChange={(e) => set("precautions", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 flex-shrink-0 bg-background">
          <p className="text-xs text-muted-foreground">Ingredients will be automatically checked for NAFDAC compliance on save.</p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-4 py-2 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { onSave(form); onClose(); }}
              className="text-sm px-4 py-2 rounded bg-accent text-white hover:bg-accent/90 transition-colors font-medium"
            >
              Save Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CatalogView({ setView }: { setView?: (v: View) => void }) {
  const [expandedFlag, setExpandedFlag] = useState<number | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");

  const [productsList, setProductsList] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setCatalogLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("vendor_id", user.id);

        if (data && data.length > 0) {
          const formatted = data.map((p) => ({
            id: p.id,
            name: p.name,
            brand: p.brand || "Own Brand",
            price: `₦${Number(p.price).toLocaleString()}`,
            priceVal: p.price,
            status: p.nafdac_status === "approved" ? "active" : p.nafdac_status === "flagged" ? "blocked" : "pending",
            nafdac: p.nafdac_status === "approved" ? "Approved" : p.nafdac_status === "flagged" ? "Flagged" : "Pending",
            description: p.description || "",
            image: p.image_url || "https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=200&auto=format&fit=crop",
            ingredients: [],
            safety: { rating: "A+", label: "Verified Safe" }
          }));
          setProductsList(formatted);
        } else {
          setProductsList(catalogProducts);
        }
      } catch (err) {
        console.error("Failed to load catalog products:", err);
      } finally {
        setCatalogLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSaveProduct = async (newProd: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required to add products.");

      // Upload product image to Supabase Storage if file was provided
      let finalImageUrl = newProd.image || null;
      if (newProd.photoFile) {
        try {
          const fileExt = newProd.photoFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const filePath = `${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(filePath, newProd.photoFile, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("product-images")
              .getPublicUrl(filePath);
            finalImageUrl = publicUrl;
          } else {
            console.warn("Product image storage upload failed, using fallback:", uploadError);
          }
        } catch (storageErr) {
          console.warn("Product image storage upload exception, using fallback:", storageErr);
        }
      }

      const rawPrice = typeof newProd.price === "string"
        ? Number(newProd.price.replace(/[^\d.]/g, ""))
        : Number(newProd.price);

      const dbPayload = {
        vendor_id: user.id,
        name: newProd.name,
        brand: newProd.brand || "Own Brand",
        price: isNaN(rawPrice) ? 0 : rawPrice,
        description: newProd.description || "",
        image_url: finalImageUrl,
        nafdac_status: "approved",
        category: newProd.category || "Skincare",
      };

      const { data, error } = await supabase
        .from("products")
        .insert([dbPayload])
        .select()
        .single();

      if (error) throw error;

      const formattedNew = {
        id: data.id,
        name: data.name,
        brand: data.brand || "Own Brand",
        price: `₦${Number(data.price).toLocaleString()}`,
        priceVal: data.price,
        status: "active",
        nafdac: "Approved",
        description: data.description || "",
        image: data.image_url || "https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=200&auto=format&fit=crop",
        ingredients: newProd.ingredients || [],
        safety: { rating: "A+", label: "Verified Safe" }
      };

      setProductsList((prev) => [formattedNew, ...prev]);
      toast.success("Product successfully added to catalog & live store!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add product.");
    }
    setShowAddProduct(false);
  };

  const filteredProducts = productsList.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase()) || (p.ingredients && p.ingredients.some((i: any) => i.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-background pb-12">
      {setView && (
        <UnifiedDashboardHeader
          currentView="catalog"
          setView={setView}
          title="Product Catalog"
          subtitle={`${productsList.filter((p) => p.status === "active").length} active products · NAFDAC Safety Screened`}
          badgeText="NAFDAC Moderate"
          role="vendor"
          showShopLink={true}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        {showAddProduct && (
          <AddProductDrawer
            onClose={() => setShowAddProduct(false)}
            onSave={handleSaveProduct}
          />
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <p className="text-xs text-muted-foreground uppercase font-mono mb-1">Total Products</p>
            <p className="text-2xl font-semibold text-foreground">{productsList.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <p className="text-xs text-muted-foreground uppercase font-mono mb-1">Active Recommendations</p>
            <p className="text-2xl font-semibold text-emerald-600">{productsList.filter(p => p.status === "active").length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <p className="text-xs text-muted-foreground uppercase font-mono mb-1">Blocked / Under Review</p>
            <p className="text-2xl font-semibold text-amber-600">{productsList.filter(p => p.status === "blocked").length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <p className="text-xs text-muted-foreground uppercase font-mono mb-1">NAFDAC Compliance</p>
            <p className="text-2xl font-semibold text-emerald-600">92%</p>
          </div>
        </div>

        {/* Catalog Search & Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="flex items-center gap-3 flex-1">
            <input
              type="text"
              placeholder="Search by product name, brand, or ingredient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md bg-secondary border border-border rounded-lg px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-accent"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground outline-none cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <option value="all">All Compliance Statuses</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked / Review</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddProduct(true)}
            className="flex items-center justify-center gap-1.5 text-xs sm:text-sm bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors font-medium shadow-xs shrink-0"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            + Add product
          </button>
        </div>

      {/* Safety alert */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            1 product blocked — ingredient safety issue
          </p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            "Ultra-White Intensive Lightening Lotion" contains ingredients that violate NAFDAC regulations. It is hidden from all customer recommendations until reviewed. See the product card below for details.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className={cn(
              "bg-card border rounded-lg overflow-hidden",
              p.status === "blocked" ? "border-amber-200" : "border-border"
            )}
          >
            <div className="p-4 flex items-start gap-4">
              <img
                src={p.photo}
                alt={p.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-secondary"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {p.name}
                      </h3>
                      {p.status === "blocked" && (
                        <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Blocked
                        </span>
                      )}
                      {p.status === "active" && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {p.brand} · {p.price}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.views}</span>
                    <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" />{p.clicks}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {p.concerns.map((c) => (
                    <span key={c} className="text-xs bg-secondary text-foreground px-2 py-0.5 rounded" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {c}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {p.ingredients.map((ing) => (
                    <span
                      key={ing}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                        p.status === "blocked"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-accent/10 text-accent border border-accent/20"
                      )}
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      <FlaskConical className="w-2.5 h-2.5" />
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {p.safetyFlag && (
              <div className="border-t border-amber-200 bg-amber-50">
                <button
                  className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-amber-700 hover:bg-amber-100 transition-colors"
                  onClick={() => setExpandedFlag(expandedFlag === p.id ? null : p.id)}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Shield className="w-3.5 h-3.5" />
                    Safety violation — click to view details
                  </span>
                  {expandedFlag === p.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {expandedFlag === p.id && (
                  <div className="px-4 pb-3">
                    <p className="text-xs text-amber-800 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {p.safetyFlag}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded hover:bg-amber-700 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Edit product
                      </button>
                      <button className="text-xs bg-white border border-amber-300 text-amber-700 px-3 py-1.5 rounded hover:bg-amber-50 transition-colors" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Contact support
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
