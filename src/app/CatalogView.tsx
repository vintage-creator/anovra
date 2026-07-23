import { useState, useRef, useEffect } from "react";
import {
  Camera, Upload, Shield, Package, ChevronDown, ChevronUp, X, Check,
  CheckCircle, AlertTriangle, Eye, ExternalLink, FlaskConical,
  Plus, Clock,
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { UnifiedDashboardHeader } from "./components/UnifiedDashboardHeader";
import { supabase } from "./utils/supabase";
import { toast } from "sonner";

// ---- CATALOG DATA ----

const catalogProducts: any[] = [];

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
  id?: string;
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
  photoFiles?: File[] | null;
  images?: string[] | null;
};

const EMPTY_PRODUCT_FORM: ProductForm = {
  name: "", brand: "", price: "", stock: "", description: "",
  benefits: "", precautions: "", usageInstructions: "", category: "",
  concerns: [], skinTypes: [], keyIngredients: [], activeIngredients: [],
  photoFiles: [],
  images: [],
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

function AddProductDrawer({ onClose, onSave, initialData }: { onClose: () => void; onSave: (f: ProductForm) => void; initialData?: any }) {
  const [form, setForm] = useState<ProductForm>(() => {
    if (initialData) {
      return {
        id: initialData.id,
        name: initialData.name || "",
        brand: initialData.brand || "",
        price: initialData.priceVal ? String(initialData.priceVal) : (initialData.price ? String(initialData.price).replace(/[^\d.]/g, "") : ""),
        stock: initialData.stock ? String(initialData.stock) : "",
        description: initialData.description || "",
        benefits: initialData.benefits || "",
        precautions: initialData.precautions || "",
        usageInstructions: initialData.usageInstructions || "",
        category: initialData.category || "",
        concerns: initialData.concerns || [],
        skinTypes: initialData.skinTypes || [],
        keyIngredients: initialData.ingredients || [],
        activeIngredients: initialData.activeIngredients || [],
        photoFiles: [],
        images: initialData.images || (initialData.image ? [initialData.image] : []),
      };
    }
    return EMPTY_PRODUCT_FORM;
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    initialData?.images || (initialData?.image ? [initialData.image] : [])
  );
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

  const extractTextWithGemini = async (file: File, type: "ingredients" | "description" | "benefits") => {
    const imageBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
    });

    const { data, error } = await supabase.functions.invoke("extract-product-label", {
      body: {
        imageBase64,
        mimeType: file.type || "image/jpeg",
        type,
      },
    });

    if (error) throw error;
    return data;
  };

  const handleScanImage = async (file: File) => {
    setScanPreview(URL.createObjectURL(file));
    setScanDone(false);
    setScanning(true);
    try {
      const data = await extractTextWithGemini(file, "ingredients");
      setForm((f) => ({
        ...f,
        keyIngredients: [...new Set([...f.keyIngredients, ...(data.keyIngredients || [])])],
        activeIngredients: [...new Set([...f.activeIngredients, ...(data.activeIngredients || [])])],
      }));
      setScanDone(true);
      toast.success("Ingredients successfully extracted via AI!");
    } catch (err: any) {
      console.error(err);
      toast.error("AI extraction failed. Please enter details manually.");
    } finally {
      setScanning(false);
    }
  };

  const handleScanDescription = async (file: File) => {
    setDescScanPreview(URL.createObjectURL(file));
    setDescScanDone(false);
    setDescScanning(true);
    try {
      const data = await extractTextWithGemini(file, "description");
      setForm((f) => ({ ...f, description: data.description || "" }));
      setDescScanDone(true);
      toast.success("Description successfully extracted via AI!");
    } catch (err: any) {
      console.error(err);
      toast.error("AI extraction failed. Please enter description manually.");
    } finally {
      setDescScanning(false);
    }
  };

  const handleScanBenefits = async (file: File) => {
    setBenefitsScanPreview(URL.createObjectURL(file));
    setBenefitsScanDone(false);
    setBenefitsScanning(true);
    try {
      const data = await extractTextWithGemini(file, "benefits");
      setForm((f) => ({ ...f, benefits: data.benefits || "" }));
      setBenefitsScanDone(true);
      toast.success("Benefits list successfully extracted via AI!");
    } catch (err: any) {
      console.error(err);
      toast.error("AI extraction failed. Please enter benefits manually.");
    } finally {
      setBenefitsScanning(false);
    }
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
              {initialData ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {initialData ? "Make adjustments to your product information" : "All fields help the AI match your product to the right customers"}
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
                <label className={labelCls}>Brand / Manufacturer *</label>
                <input className={inputCls} placeholder="Brand name" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Pricing (₦) *</label>
                <input 
                  className={inputCls} 
                  placeholder="e.g. 8,500" 
                  value={form.price} 
                  onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))} 
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Available Stock *</label>
                <input 
                  className={inputCls} 
                  type="number" 
                  min="0" 
                  placeholder="Units in stock" 
                  value={form.stock} 
                  onChange={(e) => set("stock", e.target.value.replace(/[^\d]/g, ""))} 
                />
              </div>
            </div>
          </div>

          {/* 2 — Image upload */}
          <div className={sectionCls}>
            <h3 className="text-sm font-semibold text-foreground mb-1">Product Images *</h3>
            <p className="text-xs text-muted-foreground mb-3">Upload high-resolution shots showing the bottle, texture, and box.</p>
            
            {imagePreviews.length > 0 ? (
              <div className="flex flex-wrap gap-3 items-center">
                {imagePreviews.map((img, idx) => (
                  <div key={idx} className="relative group w-20 h-20">
                    <img src={img} alt="preview" className="w-full h-full object-cover rounded-lg border border-border" />
                    <button
                      type="button"
                      onClick={() => {
                        const updatedPreviews = imagePreviews.filter((_, i) => i !== idx);
                        setImagePreviews(updatedPreviews);
                        setForm(f => {
                          const updatedPhotos = f.photoFiles ? f.photoFiles.filter((_, i) => i !== idx) : [];
                          const updatedImages = f.images ? f.images.filter((_, i) => i !== idx) : [];
                          return {
                            ...f,
                            photoFiles: updatedPhotos,
                            images: updatedImages,
                          };
                        });
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full p-0.5 shadow-md transition-all cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {/* Inline Add More Button */}
                <label className="w-20 h-20 border-2 border-dashed border-border hover:border-accent/40 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-0.5 font-bold">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const validFiles = files.filter((file) => {
                        const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);
                        if (!allowed) toast.error(`${file.name} is not a supported image type.`);
                        if (file.size > 5 * 1024 * 1024) toast.error(`${file.name} is larger than 5MB.`);
                        return allowed && file.size <= 5 * 1024 * 1024;
                      });
                      if (validFiles.length > 0) {
                        const urls = validFiles.map(file => URL.createObjectURL(file));
                        setImagePreviews(prev => [...prev, ...urls]);
                        setForm(f => ({
                          ...f,
                          photoFiles: [...(f.photoFiles || []), ...validFiles]
                        }));
                      }
                    }}
                  />
                </label>
              </div>
            ) : (
              <label className="block">
                <div className="relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border hover:border-accent/40 hover:bg-muted/40 rounded-lg p-6 cursor-pointer transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground animate-bounce" />
                  <p className="text-sm text-muted-foreground text-center">
                    Drop images here or <span className="text-accent font-medium">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Select multiple images (PNG, JPG, WEBP up to 5MB each)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const validFiles = files.filter((file) => {
                      const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type);
                      if (!allowed) toast.error(`${file.name} is not a supported image type.`);
                      if (file.size > 5 * 1024 * 1024) toast.error(`${file.name} is larger than 5MB.`);
                      return allowed && file.size <= 5 * 1024 * 1024;
                    });
                    if (validFiles.length > 0) {
                      const urls = validFiles.map(file => URL.createObjectURL(file));
                      setImagePreviews(urls);
                      setForm(f => ({
                        ...f,
                        photoFiles: validFiles
                      }));
                    }
                  }}
                />
              </label>
            )}
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
            <h3 className="text-sm font-semibold text-foreground mb-1">Suitable Skin Types *</h3>
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
                <h3 className="text-sm font-semibold text-foreground">Ingredients *</h3>
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
                  <label className={labelCls}>Key Ingredients *</label>
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
                      <label className={labelCls}>Key Ingredients * {scanning && <span className="text-accent animate-pulse ml-1">Extracting…</span>}</label>
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
                <label className={labelCls} style={{ margin: 0 }}>Product Benefits *</label>
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
              <label className={labelCls}>Usage Instructions *</label>
              <textarea className={`${inputCls} resize-none h-20`} placeholder="How to apply, how often, AM/PM, patch test advice…" value={form.usageInstructions} onChange={(e) => set("usageInstructions", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Precautions & Warnings *</label>
              <textarea className={`${inputCls} resize-none h-20`} placeholder="Any warnings, side effects, or contraindications…" value={form.precautions} onChange={(e) => set("precautions", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3 flex-shrink-0 bg-background">
          <p className="text-xs text-muted-foreground">Products are submitted for NAFDAC safety review before appearing as approved.</p>
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
              onClick={() => {
                if (imagePreviews.length === 0) {
                  toast.error("At least one Product Image is required.");
                  return;
                }
                if (!form.name.trim()) {
                  toast.error("Product Name is required.");
                  return;
                }
                if (!form.brand.trim()) {
                  toast.error("Brand name is required.");
                  return;
                }
                if (!form.price.trim()) {
                  toast.error("Retail Price is required.");
                  return;
                }
                if (!form.stock.trim()) {
                  toast.error("Available Stock quantity is required.");
                  return;
                }
                if (!form.category) {
                  toast.error("Product Category is required.");
                  return;
                }
                if (form.skinTypes.length === 0) {
                  toast.error("Please select at least one suitable skin type.");
                  return;
                }
                if (form.keyIngredients.length === 0) {
                  toast.error("Please add at least one key ingredient.");
                  return;
                }
                if (!form.description.trim()) {
                  toast.error("Product Description is required.");
                  return;
                }
                if (!form.benefits.trim()) {
                  toast.error("Product Benefits are required.");
                  return;
                }
                if (!form.usageInstructions.trim()) {
                  toast.error("Usage Instructions are required.");
                  return;
                }
                if (!form.precautions.trim()) {
                  toast.error("Precautions & Warnings are required.");
                  return;
                }
                onSave(form);
                onClose();
              }}
              className="text-sm px-4 py-2 rounded bg-accent text-white font-bold hover:bg-accent/90 transition-colors"
            >
              Save Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CatalogView({ setView, role = "Vendor" }: { setView?: (v: View) => void; role?: "Vendor" | "Manager" | "Viewer" }) {
  const [expandedFlag, setExpandedFlag] = useState<number | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");

  const [productsList, setProductsList] = useState<any[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [expandedActiveImgIdx, setExpandedActiveImgIdx] = useState<number>(0);

  useEffect(() => {
    const fetchProducts = async () => {
      const cached = sessionStorage.getItem("cached_vendor_products");
      if (cached) {
        setProductsList(JSON.parse(cached));
      } else {
        setCatalogLoading(true);
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("vendor_id", user.id);

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
              price: `₦${Number(p.price).toLocaleString()}`,
              priceVal: p.price,
              status: p.nafdac_status === "approved" ? "active" : p.nafdac_status === "flagged" ? "blocked" : "pending",
              nafdac: p.nafdac_status === "approved" ? "Approved" : p.nafdac_status === "flagged" ? "Flagged" : "Pending",
              description: cleanDescription,
              image: p.image_url || "https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=200&auto=format&fit=crop",
              images: parsedImages,
              benefits,
              usageInstructions,
              precautions,
              skinTypes,
              keyIngredients,
              activeIngredients,
              ingredients: [...keyIngredients, ...activeIngredients],
              concerns: [p.category || "General"],
              safety: { rating: "A+", label: "Verified Safe" },
              views: p.views || 0,
              clicks: p.clicks || 0,
            };
          });
          setProductsList(formatted);
          sessionStorage.setItem("cached_vendor_products", JSON.stringify(formatted));
        } else {
          setProductsList([]);
          sessionStorage.setItem("cached_vendor_products", JSON.stringify([]));
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
    if (role === "Viewer") {
      toast.error("Viewer role is read-only. You cannot add or edit products.");
      return;
    }
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required to save products.");

      // Upload product images to Supabase Storage if files were provided
      const uploadedUrls = [...(newProd.images || [])];
      let finalImageUrl = uploadedUrls[0] || null;

      if (newProd.photoFiles && newProd.photoFiles.length > 0) {
        for (const file of newProd.photoFiles) {
          try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
            const filePath = `${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from("product-images")
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
              });
              
            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from("product-images")
                .getPublicUrl(filePath);
              uploadedUrls.push(publicUrl);
            } else {
              console.warn("Product image storage upload failed:", uploadError);
              toast.error(`Image upload failed: ${uploadError.message || "Unknown error"}`);
            }
          } catch (storageErr: any) {
            console.warn("Product image storage upload exception:", storageErr);
            toast.error(`Image upload error: ${storageErr.message || "Storage error"}`);
          }
        }
      }

      if (uploadedUrls.length > 0) {
        finalImageUrl = uploadedUrls[0];
      }

      const rawPrice = typeof newProd.price === "string"
        ? Number(newProd.price.replace(/[^\d.]/g, ""))
        : Number(newProd.price);

      // Serialize all uploaded URLs and fields in description metadata
      let finalDesc = newProd.description || "";
      if (uploadedUrls.length > 0) {
        finalDesc += `\n\n<!--IMAGES:${JSON.stringify(uploadedUrls)}-->`;
      }
      finalDesc += `\n<!--BENEFITS:${JSON.stringify(newProd.benefits || "")}-->`;
      finalDesc += `\n<!--USAGE:${JSON.stringify(newProd.usageInstructions || "")}-->`;
      finalDesc += `\n<!--PRECAUTIONS:${JSON.stringify(newProd.precautions || "")}-->`;
      finalDesc += `\n<!--SKINTYPES:${JSON.stringify(newProd.skinTypes || [])}-->`;
      finalDesc += `\n<!--KEY_INGREDIENTS:${JSON.stringify(newProd.keyIngredients || [])}-->`;
      finalDesc += `\n<!--ACTIVE_INGREDIENTS:${JSON.stringify(newProd.activeIngredients || [])}-->`;

      const dbPayload = {
        vendor_id: user.id,
        name: newProd.name,
        brand: newProd.brand || "Own Brand",
        price: isNaN(rawPrice) ? 0 : rawPrice,
        description: finalDesc,
        image_url: finalImageUrl,
        nafdac_status: "pending",
        category: newProd.category || "Skincare",
      };

      let savedData;
      if (newProd.id) {
        // Edit mode (Update)
        const { data, error } = await supabase
          .from("products")
          .update(dbPayload)
          .eq("id", newProd.id)
          .select()
          .single();

        if (error) throw error;
        savedData = data;
      } else {
        // Create mode (Insert)
        const { data, error } = await supabase
          .from("products")
          .insert([dbPayload])
          .select()
          .single();

        if (error) throw error;
        savedData = data;
      }

      const descriptionText = savedData.description || "";
      const imagesMatch = descriptionText.match(/<!--IMAGES:([\s\S]*?)-->/);
      let parsedImages: string[] = [];
      if (imagesMatch) {
        try {
          parsedImages = JSON.parse(imagesMatch[1]);
        } catch (e) {}
      }
      if (parsedImages.length === 0 && savedData.image_url) {
        parsedImages = [savedData.image_url];
      }

      const cleanDescription = descriptionText
        .replace(/<!--IMAGES:([\s\S]*?)-->/g, "")
        .replace(/<!--BENEFITS:([\s\S]*?)-->/g, "")
        .replace(/<!--USAGE:([\s\S]*?)-->/g, "")
        .replace(/<!--PRECAUTIONS:([\s\S]*?)-->/g, "")
        .replace(/<!--SKINTYPES:([\s\S]*?)-->/g, "")
        .replace(/<!--KEY_INGREDIENTS:([\s\S]*?)-->/g, "")
        .replace(/<!--ACTIVE_INGREDIENTS:([\s\S]*?)-->/g, "")
        .trim();

      const formattedProduct = {
        id: savedData.id,
        name: savedData.name,
        brand: savedData.brand || "Own Brand",
        price: `₦${Number(savedData.price).toLocaleString()}`,
        priceVal: savedData.price,
        status: savedData.nafdac_status === "approved" ? "active" : savedData.nafdac_status === "flagged" ? "blocked" : "pending",
        nafdac: savedData.nafdac_status === "approved" ? "Approved" : savedData.nafdac_status === "flagged" ? "Flagged" : "Pending",
        description: cleanDescription,
        image: savedData.image_url || "https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=200&auto=format&fit=crop",
        images: parsedImages,
        benefits: newProd.benefits || "",
        usageInstructions: newProd.usageInstructions || "",
        precautions: newProd.precautions || "",
        skinTypes: newProd.skinTypes || [],
        keyIngredients: newProd.keyIngredients || [],
        activeIngredients: newProd.activeIngredients || [],
        ingredients: [...(newProd.keyIngredients || []), ...(newProd.activeIngredients || [])],
        concerns: [savedData.category || "General"],
        safety: {
          rating: savedData.nafdac_status === "approved" ? "A+" : "Review",
          label: savedData.nafdac_status === "approved" ? "Verified Safe" : "Pending Safety Review"
        },
        views: savedData.views || 0,
        clicks: savedData.clicks || 0,
      };

      if (newProd.id) {
        setProductsList((prev) => {
          const updated = prev.map((p) => p.id === newProd.id ? formattedProduct : p);
          sessionStorage.setItem("cached_vendor_products", JSON.stringify(updated));
          return updated;
        });
        toast.success(savedData.nafdac_status === "approved" ? "Product successfully updated!" : "Product updated and sent for safety review. It will show up on your live storefront once approved.");
      } else {
        setProductsList((prev) => {
          const updated = [formattedProduct, ...prev];
          sessionStorage.setItem("cached_vendor_products", JSON.stringify(updated));
          return updated;
        });
        toast.success("Product added and submitted for NAFDAC safety review. It will show up on your live storefront once approved.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save product.");
    } finally {
      setIsSaving(false);
      setShowAddProduct(false);
      setEditingProduct(null);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (role === "Viewer") {
      toast.error("Viewer role is read-only. You cannot delete products.");
      return;
    }
    const ok = window.confirm("Are you sure you want to remove this product from your catalogue?");
    if (!ok) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setProductsList((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        sessionStorage.setItem("cached_vendor_products", JSON.stringify(updated));
        return updated;
      });
      toast.success("Product successfully removed from catalogue!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product.");
    }
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
        {editingProduct && (
          <AddProductDrawer
            initialData={editingProduct}
            onClose={() => setEditingProduct(null)}
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
            <p className="text-2xl font-semibold text-emerald-600">
              {productsList.length > 0 
                ? Math.round((productsList.filter(p => p.nafdac === "Approved").length / productsList.length) * 100)
                : 100}%
            </p>
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
          {role !== "Viewer" ? (
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center justify-center gap-1.5 text-xs sm:text-sm bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors font-medium shadow-xs shrink-0 cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              + Add product
            </button>
          ) : (
            <button
              disabled
              className="flex items-center justify-center gap-1.5 text-xs sm:text-sm bg-muted text-muted-foreground px-4 py-2 rounded-lg border border-border font-medium shrink-0 cursor-not-allowed"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              title="Viewer role is read-only"
            >
              <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Add product (Locked)
            </button>
          )}
        </div>

      {/* Safety alert */}
      {productsList.some(p => p.status === "blocked") && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {productsList.filter(p => p.status === "blocked").length} product{productsList.filter(p => p.status === "blocked").length > 1 ? "s" : ""} blocked — ingredient safety issue
            </p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {productsList.filter(p => p.status === "blocked").map(p => `"${p.name}"`).join(", ")} contains ingredients that violate NAFDAC regulations. It is hidden from all customer recommendations until reviewed. See the product card below for details.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {catalogLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={`skel-${idx}`} className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
              <div className="p-4 flex items-start gap-4">
                <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-2 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground font-sans border border-dashed border-border rounded-xl">
            No products found matching your search.
          </div>
        ) : (
          filteredProducts.map((p) => (
            <div
              key={p.id}
              className={cn(
                "bg-card border rounded-lg overflow-hidden",
                p.status === "blocked" ? "border-amber-200" : "border-border"
              )}
            >
              <div className="p-4 flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-secondary border border-border">
                  <img
                    src={p.photo || p.image}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
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
                        {p.status === "pending" && (
                          <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                            <Clock className="w-2.5 h-2.5" />
                            Pending Safety Review
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {p.brand} · {p.price}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <div className="flex items-center gap-2 font-mono" style={{ fontFamily: "'DM Mono', monospace" }}>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.views || 0}</span>
                        <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" />{p.clicks || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (expandedProduct === p.id) {
                              setExpandedProduct(null);
                            } else {
                              setExpandedProduct(p.id);
                              setExpandedActiveImgIdx(0);
                            }
                          }}
                          className="text-xs text-emerald-600 hover:underline font-semibold cursor-pointer flex items-center gap-0.5"
                        >
                          {expandedProduct === p.id ? "Hide Details" : "Show Details"}
                        </button>
                        <span className="text-border">|</span>
                        <button
                          onClick={() => setEditingProduct(p)}
                          className="text-xs text-accent hover:underline font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <span className="text-border">|</span>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {p.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(p.concerns || []).map((c) => (
                      <span key={c} className="text-xs bg-secondary text-foreground px-2 py-0.5 rounded" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(p.ingredients || []).map((ing) => (
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

              {/* Expanded details view */}
              {expandedProduct === p.id && (
                <div className="border-t border-border bg-muted/20 p-4 space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left side: Image Gallery */}
                    <div className="md:col-span-4 space-y-2">
                      <div className="aspect-square bg-muted rounded-xl overflow-hidden border border-border">
                        <img 
                          src={p.images?.[expandedActiveImgIdx] || p.photo || p.image} 
                          alt={p.name} 
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                        />
                      </div>
                      {p.images && p.images.length > 1 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                          {p.images.map((imgUrl: string, idx: number) => (
                            <button
                              key={idx}
                              onClick={() => setExpandedActiveImgIdx(idx)}
                              className={cn(
                                "w-10 h-10 rounded-md overflow-hidden border-2 shrink-0 transition-colors cursor-pointer",
                                expandedActiveImgIdx === idx ? "border-accent" : "border-transparent"
                              )}
                            >
                              <img src={imgUrl} alt="thumbnail" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-8 space-y-4">
                      {/* Pending review warning banner */}
                      {p.status === "pending" && (
                        <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-2.5">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-amber-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Pending Administrator Approval</p>
                            <p className="text-[11px] text-amber-700/90 mt-0.5 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              This product is undergoing safety validation. It will not show up on your live storefront or customer recommendations until approved in the Admin Dashboard.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      <div>
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Description</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {p.description || "No description provided."}
                        </p>
                      </div>

                      {/* Benefits & How to Use grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Benefits</h4>
                          {p.benefits ? (
                            <ul className="list-disc pl-4 space-y-1">
                              {p.benefits.split("\n").filter(Boolean).map((b: string, index: number) => (
                                <li key={index} className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                  {b.replace(/^[•\-\*]\s*/, "").trim()}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No benefits listed.</p>
                          )}
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>How to Use</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {p.usageInstructions || "No instructions provided."}
                          </p>
                        </div>
                      </div>

                      {/* Precautions */}
                      {p.precautions && (
                        <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Precautions & Warnings
                          </h4>
                          <p className="text-xs text-amber-700 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {p.precautions}
                          </p>
                        </div>
                      )}

                      {/* Skin Compatibility & Ingredients */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Suitable Skin Types</h4>
                          <div className="flex flex-wrap gap-1">
                            {p.skinTypes && p.skinTypes.length > 0 ? (
                              p.skinTypes.map((t: string) => (
                                <span key={t} className="text-[10px] bg-secondary text-foreground px-2 py-0.5 rounded font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                  {t}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">All skin types</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Active Ingredients</h4>
                          <div className="flex flex-wrap gap-1">
                            {p.activeIngredients && p.activeIngredients.length > 0 ? (
                              p.activeIngredients.map((ing: string) => (
                                <span key={ing} className="text-[10px] bg-emerald-500/10 text-[#008236] border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold" style={{ fontFamily: "'DM Mono', monospace" }}>
                                  {ing}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground italic">None listed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
          ))
        )}
      </div>
      </div>

      {/* Modern glassmorphism saving progress overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fade-in">
          <div className="bg-card border border-border p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 text-center animate-scale-up">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-accent border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {editingProduct ? "Updating Product" : "Adding Product"}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {editingProduct 
                ? "Saving your product changes. Please wait..." 
                : "Adding your products to your catalog. Please wait..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
