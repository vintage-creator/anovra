import { useState, useEffect } from "react";
import {
  Camera, Upload, Shield, ChevronDown, ChevronUp, ChevronRight,
  CheckCircle, ArrowRight, MessageCircle, Zap, Globe, Lock,
  Scan, Activity, X, Check, Info, Store, Search, Star, AlertTriangle,
  User, UserCheck, Square, Hand, Maximize2, MapPin, Sparkles, Smile
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";

// ---- SKIN TEST DATA ----

const SKIN_AREAS = [
  { name: "Face", desc: "Cheeks, forehead, chin, nose", photo: "1531746020798-e6953c6e8e04", guide: "oval", icon: <User className="w-5 h-5 text-emerald-600 shrink-0" /> },
  { name: "Neck", desc: "Throat, nape, décolletage", photo: "1603291000179-afd74889979c", guide: "oval", icon: <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" /> },
  { name: "Back", desc: "Upper or lower back", photo: "1541752857837-f8a0154fd092", guide: "rect", icon: <Square className="w-5 h-5 text-emerald-600 shrink-0" /> },
  { name: "Hands", desc: "Knuckles, palms, wrists", photo: "1558618666-fcd25c85cd64", guide: "rect", icon: <Hand className="w-5 h-5 text-emerald-600 shrink-0" /> },
  { name: "Legs", desc: "Thighs, shins, calves", photo: "1523297736436-356615162cc8", guide: "rect", icon: <Activity className="w-5 h-5 text-emerald-600 shrink-0" /> },
  { name: "Whole Body", desc: "Full-body video scan — face, torso, limbs and all visible skin areas analysed together", photo: "1707161256359-0919306e0d3c", guide: "rect", icon: <Maximize2 className="w-5 h-5 text-emerald-600 shrink-0" /> },
  { name: "Other area", desc: "Any other visible skin area not listed above", photo: "1577746838851-816a43ca8733", guide: "rect", icon: <MapPin className="w-5 h-5 text-emerald-600 shrink-0" /> },
];

const ANALYSIS_STEPS_LABELS = [
  "Normalising image exposure and white balance...",
  "Evaluating skin texture and surface detail...",
  "Scoring pigmentation and tone evenness...",
  "Detecting acne severity and blemishes...",
  "Assessing redness, dryness and oiliness...",
  "Measuring pore visibility and fine lines...",
  "Checking skin tone consistency...",
  "Detecting visible inflammation...",
  "Generating personalised skin report...",
  "Searching verified vendor products...",
  "Ranking recommendations by match score...",
  "Applying ingredient safety checks...",
];

const SKIN_REPORT_CONCERNS = [
  { label: "Hyperpigmentation", severity: 62, level: "Moderate", color: "#F59E0B" },
  { label: "Acne / Blemishes", severity: 38, level: "Mild", color: "#EAB308" },
  { label: "T-Zone Oiliness", severity: 70, level: "Elevated", color: "#F59E0B" },
  { label: "Fine Lines", severity: 22, level: "Low", color: "#22C55E" },
  { label: "Skin Hydration", severity: 20, level: "Normal", color: "#22C55E" },
  { label: "Pore Visibility", severity: 45, level: "Mild", color: "#EAB308" },
  { label: "Redness", severity: 18, level: "Low", color: "#22C55E" },
  { label: "Barrier Health", severity: 15, level: "Good", color: "#22C55E" },
  { label: "Visible Texture", severity: 34, level: "Mild", color: "#EAB308" },
  { label: "Skin Tone Evenness", severity: 55, level: "Moderate", color: "#F59E0B" },
  { label: "Dryness", severity: 28, level: "Mild", color: "#EAB308" },
  { label: "Inflammation Signs", severity: 12, level: "Low", color: "#22C55E" },
];

const recommendations = [
  {
    rank: 1,
    score: 94,
    name: "Niacinamide 10% + Zinc 1% Serum",
    brand: "Veraski",
    price: "₦4,500",
    photo: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop&auto=format",
    why: "Your scan detected moderate hyperpigmentation across both cheeks and elevated sebum levels in the T-zone. Niacinamide directly targets both — it blocks melanin transfer to reduce dark spots while regulating sebum production without stripping moisture.",
    benefits: [
      "Visibly reduces hyperpigmentation and dark spots within 4–8 weeks",
      "Regulates excess oil production without drying skin",
      "Strengthens the skin barrier — critical in humid Lagos climate",
      "Well-tolerated by darker skin tones; no bleaching effect",
    ],
    howToUse: "Apply 3–4 drops to clean, dry skin morning and night. Press gently — do not rub. Follow immediately with a moisturiser. In the AM, always finish with SPF 30+. Do not layer with Vitamin C at the same time; use them in alternating AM/PM routines. Expect visible results at 4 weeks, best results at 8–12 weeks.",
    disadvantages: [
      "May cause mild initial tingling on very sensitive skin in the first week",
      "High-strength formula — start with once daily for 7 days before twice daily",
    ],
    warnings: [
      "Patch test 24 hours before first use — apply to inner wrist",
      "Always use broad-spectrum SPF 30+ when using niacinamide during the day",
      "Discontinue and consult a dermatologist if irritation persists beyond 1 week",
      "Not a medical treatment — for persistent acne or severe hyperpigmentation, see a dermatologist",
    ],
    waLink: "https://wa.me/2348012345678?text=Hi%2C%20I'd%20like%20to%20order%20the%20Niacinamide%20Serum",
  },
  {
    rank: 2,
    score: 81,
    name: "Kojic Acid & Turmeric Brightening Cream",
    brand: "GlowAfrique",
    price: "₦6,200",
    photo: "https://images.unsplash.com/photo-1601049541271-20f4e4e04360?w=300&h=300&fit=crop&auto=format",
    why: "The scan found post-inflammatory hyperpigmentation (PIH) spots consistent with previous acne marks on the forehead and chin. Kojic acid combined with turmeric extract is clinically shown to reduce PIH in darker skin tones while maintaining evenness.",
    benefits: [
      "Targets post-acne dark marks (PIH) directly",
      "Turmeric extract has anti-inflammatory properties that calm active spots",
      "Shea butter base provides hydration — no dry-down effect",
      "Ethically formulated; no mercury, no banned hydroquinone concentrations",
    ],
    howToUse: "Apply a pea-sized amount to affected areas only in the PM routine. Avoid full-face application initially. Use 3–4 nights per week for the first month, then nightly if tolerated. Do not use directly before sun exposure — always use SPF in the morning. Timeline: visible improvement in 6–10 weeks.",
    disadvantages: [
      "Turmeric extract can cause temporary yellowing on very light skin tones",
      "Not recommended for use around the eye area",
      "Heavier cream texture — may feel occlusive in hot and humid conditions",
    ],
    warnings: [
      "Photosensitising ingredient — nighttime use only, always pair with morning SPF",
      "Patch test required before first use",
      "Avoid during pregnancy — consult your doctor first",
      "If irritation, redness or unusual breakout occurs, discontinue use",
    ],
    waLink: "https://wa.me/2348012345678?text=Hi%2C%20I'd%20like%20to%20order%20the%20Brightening%20Cream",
  },
  {
    rank: 3,
    score: 73,
    name: "SPF 50+ Invisible Sunscreen Fluid",
    brand: "SunGuard NG",
    price: "₦7,500",
    photo: "https://images.unsplash.com/photo-1585232350010-2e7c7b6427eb?w=300&h=300&fit=crop&auto=format",
    why: "Sun exposure is the primary cause of the pigmentation pattern detected in your scan and will worsen any dark spots without daily SPF protection. This product is formulated for darker skin tones — no white cast, lightweight fluid that works under makeup.",
    benefits: [
      "SPF 50+/PA++++ — clinically proven broad-spectrum protection",
      "Zero white cast on deeper skin tones — tested on Fitzpatrick IV–VI",
      "Contains niacinamide for ongoing tone-evenness support while protecting",
      "Lightweight, non-comedogenic — won't clog pores or worsen acne",
    ],
    howToUse: "Apply generously to face and neck every morning as the final step, after moisturiser and before makeup. Use at least a ¼ teaspoon (1.25 ml) for the face — most people under-apply SPF. Re-apply every 2 hours when outdoors. Do not skip even on cloudy or indoor days.",
    disadvantages: [
      "Higher price point for daily sunscreen",
      "Fluid formula may not give enough coverage if you prefer a more matte finish",
    ],
    warnings: [
      "This does not replace medical treatment for sun damage or melanoma — see a dermatologist for unusual moles or lesions",
      "Reapply after swimming or heavy sweating",
      "SPF is not optional when using any skin-brightening or acid-containing products",
    ],
    waLink: "https://wa.me/2348012345678?text=Hi%2C%20I'd%20like%20to%20order%20the%20SPF%2050%2B%20Sunscreen",
  },
];

type SkinStep = 1 | 2 | 3 | 4 | 5;

export function SkinTestView({ setView }: { setView?: (v: View) => void }) {
  const [step, setStep] = useState<SkinStep>(1);
  const [selectedArea, setSelectedArea] = useState("");
  const [uploadMode, setUploadMode] = useState<"image" | "video" | null>(null);
  const [progress, setProgress] = useState(0);
  const [expandedCard, setExpandedCard] = useState<number | null>(0);
  const [expandedSection, setExpandedSection] = useState<{ card: number; section: string } | null>(null);
  const [filters, setFilters] = useState({ country: "", state: "", city: "", vendor: "", category: "" });
  const [showFilters, setShowFilters] = useState(false);

  const healthScore = 68;

  useEffect(() => {
    if (step !== 3) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep(4), 600);
          return 100;
        }
        return p + 0.9;
      });
    }, 55);
    return () => clearInterval(interval);
  }, [step]);

  const currentAnalysisStep = Math.min(
    Math.floor((progress / 100) * ANALYSIS_STEPS_LABELS.length),
    ANALYSIS_STEPS_LABELS.length - 1
  );

  function toggleSection(cardRank: number, section: string) {
    if (expandedSection?.card === cardRank && expandedSection?.section === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection({ card: cardRank, section });
    }
  }

  function resetFlow() {
    setStep(1);
    setSelectedArea("");
    setUploadMode(null);
    setExpandedCard(null);
    setExpandedSection(null);
    setFilters({ country: "", state: "", city: "", vendor: "", category: "" });
    setShowFilters(false);
  }

  const STEP_LABELS = ["Select Area", "Upload", "Analysing", "Skin Report", "Results"];

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Step progress bar */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <button
              onClick={() => setView?.("landing")}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg transition-transform hover:scale-105 active:scale-95 shrink-0"
              aria-label="Anovra Home"
            >
              <img src="/logo.png" alt="Anovra Logo" className="h-8 sm:h-10 w-auto object-contain" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                Anovra Skin Test Engine
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> AI ACTIVE
              </span>
            </div>
            <button onClick={() => setView?.("landing")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
          <div className="flex items-center gap-1">
            {STEP_LABELS.map((label, i) => {
              const s = i + 1;
              return (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1 min-w-0">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                        step > s ? "bg-accent text-white" : step === s ? "bg-foreground text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                    </div>
                    <span
                      className={cn("text-[10px] hidden sm:block whitespace-nowrap", step === s ? "text-foreground font-medium" : "text-muted-foreground")}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {label}
                    </span>
                  </div>
                  {s < STEP_LABELS.length && (
                    <div className={cn("flex-1 h-px mx-1 transition-colors", step > s ? "bg-accent" : "bg-border")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---- STEP 1: Select Skin Area ---- */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8">
            <p className="text-xs tracking-widest text-accent uppercase mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Step 1 of 5</p>
            <h2 className="text-3xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              Which skin area would you like analysed?
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Anovra can analyse any visible skin area — face, body, or limbs.
            </p>
          </div>

          {/* Dropdown selector */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>
              Select skin area
            </label>
            <div className="relative">
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className={cn(
                  "w-full appearance-none px-4 py-3.5 pr-10 rounded-xl border-2 bg-card text-foreground text-sm font-medium cursor-pointer outline-none transition-all",
                  selectedArea ? "border-accent" : "border-border",
                  "focus:border-accent"
                )}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <option value="" disabled>Choose an area to analyse…</option>
                {SKIN_AREAS.map((area) => (
                  <option key={area.name} value={area.name}>
                    {area.name} — {area.desc}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Selected area preview card */}
          {selectedArea && (() => {
            const area = SKIN_AREAS.find((a) => a.name === selectedArea)!;
            return (
              <div className="mb-8 rounded-2xl border-2 border-emerald-500 overflow-hidden flex gap-0 shadow-xs">
                <div className="relative w-28 flex-shrink-0">
                  <img
                    src={`https://images.unsplash.com/photo-${area.photo}?w=224&h=168&fit=crop&auto=format`}
                    alt={area.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20" />
                </div>
                <div className="flex-1 p-4 bg-card flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1.5">
                    {area.icon}
                    <p className="font-semibold text-foreground text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{area.name}</p>
                    <span className="ml-auto w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {area.desc}
                  </p>
                  {area.name === "Whole Body" && (
                    <div className="mt-2.5 flex items-start gap-1.5 p-2 bg-accent/8 rounded-lg">
                      <Info className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-accent leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Upload a short video for best results — the engine maps concerns across all visible skin zones simultaneously.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {!selectedArea && (
            <div className="mb-8 rounded-2xl border-2 border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Select a skin area above to see a preview and continue
              </p>
            </div>
          )}

          <button
            onClick={() => setStep(2)}
            disabled={!selectedArea}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium transition-all text-sm",
              selectedArea ? "bg-accent text-white hover:bg-accent/90" : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Continue with {selectedArea || "selected area"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---- STEP 2: Upload Media ---- */}
      {step === 2 && (
        <div className="max-w-xl mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-xs tracking-widest text-accent uppercase mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Step 2 of 5 · {selectedArea}</p>
            <h2 className="text-3xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              Upload your skin image or video
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              High-quality, well-lit media gives the most accurate analysis. Anovra accepts both photos and short videos.
            </p>
          </div>

          {/* Upload mode selector */}
          <div className="flex gap-3 mb-5">
            {(["image", "video"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setUploadMode(mode)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                  uploadMode === mode ? "border-accent bg-accent/10 text-accent" : "border-border bg-card text-foreground hover:border-accent/30"
                )}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {mode === "image" ? <Camera className="w-4 h-4" /> : <Scan className="w-4 h-4" />}
                {mode === "image" ? "Image / Photo" : "Short video"}
              </button>
            ))}
          </div>

          {/* Viewfinder */}
          <div className="relative bg-foreground rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: "3/4", maxHeight: 340 }}>
            <img
              src={`https://images.unsplash.com/photo-${SKIN_AREAS.find((a) => a.name === selectedArea)?.photo ?? "1531746020798-e6953c6e8e04"}?w=480&h=640&fit=crop&auto=format`}
              alt="Viewfinder"
              className="w-full h-full object-cover opacity-65"
            />
            {/* Guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {SKIN_AREAS.find((a) => a.name === selectedArea)?.guide === "oval" ? (
                <div className="border-2 border-white/60 rounded-full" style={{ width: 140, height: 180 }} />
              ) : (
                <div className="border-2 border-white/60 rounded-xl" style={{ width: 180, height: 200 }} />
              )}
            </div>
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-accent rounded-tl" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-accent rounded-tr" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-accent rounded-bl" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-accent rounded-br" />
            <div className="absolute bottom-4 inset-x-0 flex justify-center">
              <span className="text-xs text-white/80 bg-black/50 px-3 py-1 rounded-full" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {selectedArea === "Face" ? "Align face within oval guide" : `Position your ${selectedArea.toLowerCase()} within the frame`}
              </span>
            </div>
          </div>

          {/* Quality checklist */}
          <div className="bg-secondary rounded-xl p-4 mb-5">
            <p className="text-xs font-medium text-foreground mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Image quality checklist</p>
            <div className="space-y-2">
              {[
                "Good natural or ring-light lighting — avoid harsh shadows",
                "Camera 20–30 cm from skin — close enough for detail",
                "In focus and steady — no motion blur",
                "Bare skin — remove makeup if possible for best accuracy",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{tip}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setStep(3)}
              className="flex items-center justify-center gap-2 bg-emerald-500 text-amber-950 font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors text-sm shadow-sm"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Camera className="w-4 h-4" />
              {uploadMode === "video" ? "Record video directly" : "Take photo directly"}
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center justify-center gap-2 bg-secondary border border-border text-foreground font-semibold py-3 rounded-xl hover:bg-muted transition-colors text-sm"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Upload className="w-4 h-4" />
              {uploadMode === "video" ? "Upload video file" : "Upload image file"}
            </button>
          </div>

          <div className="flex items-start gap-2 p-3 bg-secondary rounded-lg">
            <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Your image is analysed in real-time and never stored. We do not share your data with any third party.
            </p>
          </div>
        </div>
      )}

      {/* ---- STEP 3: AI Analysis ---- */}
      {step === 3 && (
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="w-28 h-28 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-8 relative">
            <Activity className="w-12 h-12 text-accent" />
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="52" fill="none" stroke="rgba(200,107,58,0.15)" strokeWidth="4" />
              <circle
                cx="56" cy="56" r="52" fill="none" stroke="#C86B3A" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.08s linear" }}
              />
            </svg>
          </div>

          <p className="text-xs tracking-widest text-accent uppercase mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>AI Engine Active</p>
          <h2 className="text-2xl font-light text-foreground mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
            Analysing your {selectedArea.toLowerCase()}...
          </h2>

          <div className="min-h-[2rem] mb-6">
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {ANALYSIS_STEPS_LABELS[currentAnalysisStep]}
            </p>
          </div>

          {/* Characteristics being evaluated */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-8">
            {["Texture", "Pigmentation", "Acne", "Pores", "Wrinkles", "Fine Lines", "Redness", "Dryness", "Oiliness", "Tone", "Inflammation", "Blemishes"].map((attr, idx) => {
              const evaluated = idx < Math.floor((progress / 100) * 12);
              return (
                <div
                  key={attr}
                  className={cn(
                    "text-xs py-1 px-2 rounded-full border transition-all duration-300",
                    evaluated ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-secondary text-muted-foreground"
                  )}
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {evaluated && <span className="mr-1">✓</span>}{attr}
                </div>
              );
            })}
          </div>

          <div className="w-full bg-muted rounded-full h-1.5 max-w-xs mx-auto">
            <div className="bg-accent h-1.5 rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: "'DM Mono', monospace" }}>{Math.round(progress)}%</p>

          <p className="text-xs text-muted-foreground mt-8 max-w-xs mx-auto leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Results are AI-powered personalised recommendations — not a medical diagnosis.
          </p>
        </div>
      )}

      {/* ---- STEP 4: Skin Report ---- */}
      {step === 4 && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-xs tracking-widest text-accent uppercase mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>Step 4 of 5 · Skin Report</p>

          {/* Report header card */}
          <div className="bg-foreground text-primary-foreground rounded-2xl p-6 mb-5">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs text-white/40 mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>ANALYSIS COMPLETE · Scan ID T-2848</p>
                <h2 className="text-2xl font-light mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Your skin report</h2>
                <p className="text-sm text-white/60" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Area: <span className="text-white">{selectedArea}</span>
                </p>
              </div>
              {/* Health score gauge */}
              <div className="flex-shrink-0 relative w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none" stroke="#C86B3A" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - healthScore / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>{healthScore}</span>
                  <span className="text-[9px] text-white/50 uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>score</span>
                </div>
              </div>
            </div>

            {/* Skin type + condition */}
            <div className="flex flex-wrap gap-3 mb-5">
              {[
                { label: "Skin Type", value: "Combination (oily T-zone, dry cheeks)" },
                { label: "Skin Condition", value: "Mild inflammatory, post-acne pigmentation" },
              ].map((item) => (
                <div key={item.label} className="bg-white/5 rounded-xl px-4 py-3 flex-1 min-w-[200px]">
                  <p className="text-xs text-white/40 mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>{item.label.toUpperCase()}</p>
                  <p className="text-sm text-white font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Concerns with severity bars */}
            <div>
              <p className="text-xs text-white/40 mb-3 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Detected skin concerns & severity</p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {SKIN_REPORT_CONCERNS.map((c) => (
                  <div key={c.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/70" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{c.label}</span>
                      <span className="text-xs font-medium" style={{ color: c.color, fontFamily: "'DM Mono', monospace" }}>{c.level}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/10">
                      <div className="h-1 rounded-full transition-all duration-700" style={{ width: `${c.severity}%`, backgroundColor: c.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Personalised recommendations summary */}
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Personalised recommendations ready
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Based on your scan, Anovra&apos;s engine has identified products targeting hyperpigmentation, T-zone oil control, and barrier repair. 3 products from verified vendors matched your skin profile.
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              This is an AI-generated skin assessment — not a medical diagnosis. For persistent or severe conditions, consult a registered dermatologist.
            </p>
          </div>

          <button
            onClick={() => setStep(5)}
            className="w-full flex items-center justify-center gap-2 bg-accent text-white py-3.5 rounded-xl hover:bg-accent/90 transition-colors font-medium text-sm"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            View matched products
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---- STEP 5: Recommendations + Filter + Purchase ---- */}
      {step === 5 && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs tracking-widest text-accent uppercase mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>Step 5 of 5 · Matched Products</p>
              <h2 className="text-2xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                3 products for your skin
              </h2>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex-shrink-0",
                showFilters || activeFilters > 0 ? "border-accent bg-accent/10 text-accent" : "border-border bg-card text-foreground hover:border-accent/40"
              )}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Search className="w-3.5 h-3.5" />
              Filter
              {activeFilters > 0 && (
                <span className="bg-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-mono ml-0.5">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="bg-card border border-border rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-foreground uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Filter recommendations</p>
                {activeFilters > 0 && (
                  <button
                    onClick={() => setFilters({ country: "", state: "", city: "", vendor: "", category: "" })}
                    className="text-xs text-accent hover:underline"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {([
                  { key: "country", label: "Country", options: ["Nigeria", "Ghana", "Kenya", "South Africa"] },
                  { key: "state", label: "State / Region", options: ["Lagos", "Abuja FCT", "Rivers", "Kano"] },
                  { key: "city", label: "City", options: ["Lagos Island", "Victoria Island", "Lekki", "Ikeja"] },
                  { key: "vendor", label: "Vendor", options: ["Veraski", "GlowAfrique", "SunGuard NG", "SkinHQ"] },
                  { key: "category", label: "Product Category", options: ["Serums", "Creams", "SPF / Sunscreen", "Cleansers", "Toners"] },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground mb-1 block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.label}</label>
                    <select
                      value={filters[f.key]}
                      onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })}
                      className="w-full bg-input-background border border-border rounded-lg px-2.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <option value="">All</option>
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {activeFilters > 0 && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <Globe className="w-3.5 h-3.5" />
                  Showing vendors available in your selected location
                </p>
              )}
            </div>
          )}

          {/* Product recommendation cards */}
          <div className="space-y-4 mb-6">
            {recommendations.map((rec, i) => (
              <div key={rec.rank} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Card header */}
                <button
                  className="w-full p-4 flex items-start gap-3 text-left hover:bg-secondary/50 transition-colors"
                  onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                >
                  <img src={rec.photo} alt={rec.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-secondary" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-accent/10 text-accent px-1.5 py-0.5 rounded">#{rec.rank} match</span>
                      <span className="text-xs text-muted-foreground font-mono">{rec.score}% score</span>
                    </div>
                    <h4 className="font-medium text-foreground text-sm leading-snug mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{rec.name}</h4>
                    <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{rec.brand} · {rec.price}</p>
                  </div>
                  {expandedCard === i ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />}
                </button>

                {expandedCard === i && (
                  <div className="border-t border-border">
                    {/* Why recommended */}
                    <div className="p-4 border-b border-border">
                      <p className="text-xs font-medium text-accent uppercase tracking-wide mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Why we recommended this</p>
                      <p className="text-sm text-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{rec.why}</p>
                    </div>

                    {/* Product details grid */}
                    <div className="grid grid-cols-2 gap-0 border-b border-border">
                      {[
                        { label: "Suitable skin type", value: "Combination / Oily" },
                        { label: "Availability", value: "In stock · Ships Lagos" },
                        { label: "Expected results", value: "4–8 weeks with consistent use" },
                        { label: "Price", value: rec.price },
                      ].map((item) => (
                        <div key={item.label} className="p-3 border-r border-b border-border last:border-r-0">
                          <p className="text-xs text-muted-foreground mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.label}</p>
                          <p className="text-xs font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Expandable sections */}
                    {[
                      { key: "benefits", label: "Benefits", icon: <CheckCircle className="w-3.5 h-3.5 text-green-600" />, content: (
                        <ul className="space-y-1.5">
                          {rec.benefits.map((b) => (
                            <li key={b} className="flex items-start gap-2 text-sm text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />{b}
                            </li>
                          ))}
                        </ul>
                      )},
                      { key: "howToUse", label: "How to use for real results", icon: <Star className="w-3.5 h-3.5 text-accent" />, content: (
                        <p className="text-sm text-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{rec.howToUse}</p>
                      )},
                      { key: "disadvantages", label: "Disadvantages", icon: <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />, content: (
                        <ul className="space-y-1.5">
                          {rec.disadvantages.map((d) => (
                            <li key={d} className="flex items-start gap-2 text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              <X className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />{d}
                            </li>
                          ))}
                        </ul>
                      )},
                      { key: "warnings", label: "Warnings", icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />, content: (
                        <ul className="space-y-1.5">
                          {rec.warnings.map((w) => (
                            <li key={w} className="flex items-start gap-2 text-sm text-amber-700" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />{w}
                            </li>
                          ))}
                        </ul>
                      )},
                    ].map((section) => (
                      <div key={section.key} className="border-b border-border last:border-b-0">
                        <button
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                          onClick={() => toggleSection(rec.rank, section.key)}
                        >
                          <span className="flex items-center gap-2 text-sm font-medium text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {section.icon}{section.label}
                          </span>
                          {expandedSection?.card === rec.rank && expandedSection.section === section.key
                            ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                            : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                        </button>
                        {expandedSection?.card === rec.rank && expandedSection.section === section.key && (
                          <div className="px-4 pb-4">{section.content}</div>
                        )}
                      </div>
                    ))}

                    {/* Vendor info + Purchase CTA */}
                    <div className="p-4 bg-secondary/40">
                      <div className="flex items-center gap-2 mb-3">
                        <Store className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Sold by <strong className="text-foreground">{rec.brand}</strong> · Verified vendor
                        </span>
                        <span className="ml-auto flex items-center gap-1 text-xs text-green-600" style={{ fontFamily: "'DM Mono', monospace" }}>
                          <CheckCircle className="w-3 h-3" /> In stock
                        </span>
                      </div>
                      <a
                        href={rec.waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl hover:bg-[#20BB5A] transition-colors font-medium text-sm"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Order via WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-5">
            <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              AI-generated recommendations only. Not a medical diagnosis. Consult a dermatologist for persistent or severe conditions.
            </p>
          </div>

          <button
            onClick={resetFlow}
            className="w-full py-3 border border-border rounded-xl text-sm text-muted-foreground hover:bg-secondary transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Start a new analysis
          </button>
        </div>
      )}
    </div>
  );
}
