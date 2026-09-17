import { useState, useEffect, useRef } from "react";
import {
  Camera, Upload, Shield, ChevronDown, ChevronUp, ChevronRight,
  CheckCircle, ArrowRight, MessageCircle, Zap, Globe, Lock,
  Scan, Activity, X, Check, Info, Store, Search, Star, AlertTriangle,
  ScanFace, Badge, Bone, Hand, Footprints, PersonStanding, ScanSearch, Sparkles, Smile
} from "lucide-react";
import type { View } from "./types";
import { cn } from "./types";
import { supabase } from "./utils/supabase";
import { dispatchVendorWebhook, sendEmailNotification } from "./utils/notifications";
import { toast } from "sonner";

// ---- SKIN TEST DATA ----

const SKIN_AREAS = [
  { name: "Face", desc: "Cheeks, forehead, chin, nose", photo: "1531746020798-e6953c6e8e04", guide: "oval", icon: ScanFace },
  { name: "Neck", desc: "Throat, nape, décolletage", photo: "1603291000179-afd74889979c", guide: "oval", icon: Badge },
  { name: "Back", desc: "Upper or lower back", photo: "1541752857837-f8a0154fd092", guide: "rect", icon: Bone },
  { name: "Hands", desc: "Knuckles, palms, wrists", photo: "1558618666-fcd25c85cd64", guide: "rect", icon: Hand },
  { name: "Legs", desc: "Thighs, shins, calves", photo: "1523297736436-356615162cc8", guide: "rect", icon: Footprints },
  { name: "Whole Body", desc: "Full-body video scan — face, torso, limbs and all visible skin areas analysed together", photo: "1707161256359-0919306e0d3c", guide: "rect", icon: PersonStanding },
  { name: "Other area", desc: "Any other visible skin area not listed above", photo: "1577746838851-816a43ca8733", guide: "rect", icon: ScanSearch },
];

const ANALYSIS_STEPS_LABELS = [
  "Normalising image exposure and white balance…",
  "Evaluating skin texture and surface detail…",
  "Scoring pigmentation and tone evenness…",
  "Detecting acne severity and blemishes…",
  "Assessing redness, dryness and oiliness…",
  "Measuring pore visibility and fine lines…",
  "Checking skin tone consistency…",
  "Detecting visible inflammation…",
  "Generating personalised skin report…",
  "Searching verified vendor products…",
  "Ranking recommendations by match score…",
  "Applying ingredient safety checks…",
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

type SeverityLevel = "Low" | "Mild" | "Moderate" | "Elevated";

type ScanSeverity = {
  label: string;
  level: SeverityLevel;
  score: number;
};

type SkinStep = 1 | 2 | 3 | 4 | 5;
type CaptureQuality = {
  brightness: number;
  sharpness: number;
  faceOk: boolean | null;
  guidance: string;
  ready: boolean;
};

const titleFromSlug = (slug: string) =>
  slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ") || "";

const getScanSlugFromUrl = () => {
  const hash = window.location.hash;
  const queryMatch = hash.match(/[?&]vendor=([^&]+)/);
  const hashSlug = hash.includes("/scan/")
    ? hash.split("/scan/")[1]?.split("?")[0]
    : "";
  return queryMatch?.[1] || hashSlug || sessionStorage.getItem("active_scan_slug") || "";
};

type MatchedProduct = {
  id: string;
  rank: number;
  score: number;
  name: string;
  brand: string;
  price: string;
  priceVal: number;
  photo: string;
  images: string[];
  category: string;
  description: string;
  benefits: string[];
  usageInstructions: string;
  precautions: string;
  skinTypes: string[];
  ingredients: string[];
  matchReasons: string[];
  vendorName: string;
  whatsappUrl: string | null;
};

const parseJsonMeta = <T,>(text: string, key: string, fallback: T): T => {
  const match = text.match(new RegExp(`<!--${key}:([\\s\\S]*?)-->`));
  if (!match) return fallback;
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    return fallback;
  }
};

const cleanProductDescription = (text: string) =>
  text
    .replace(/<!--IMAGES:([\s\S]*?)-->/g, "")
    .replace(/<!--BENEFITS:([\s\S]*?)-->/g, "")
    .replace(/<!--USAGE:([\s\S]*?)-->/g, "")
    .replace(/<!--PRECAUTIONS:([\s\S]*?)-->/g, "")
    .replace(/<!--SKINTYPES:([\s\S]*?)-->/g, "")
    .replace(/<!--KEY_INGREDIENTS:([\s\S]*?)-->/g, "")
    .replace(/<!--ACTIVE_INGREDIENTS:([\s\S]*?)-->/g, "")
    .trim();

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s/+-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

const buildWhatsappUrl = (phone: string | null | undefined, productName: string) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Hi, I'd like to order ${productName}`)}`;
};

export function SkinTestView({ setView }: { setView?: (v: View) => void }) {
  const [step, setStep] = useState<SkinStep>(1);
  const [activeScanSlug] = useState(getScanSlugFromUrl);
  const [selectedArea, setSelectedArea] = useState("");
  const [uploadMode, setUploadMode] = useState<"image" | "video" | null>("image");
  const [progress, setProgress] = useState(0);
  const [expandedCard, setExpandedCard] = useState<number | null>(0);
  const [expandedSection, setExpandedSection] = useState<{ card: number; section: string } | null>(null);
  const [filters, setFilters] = useState({ country: "", state: "", city: "", vendor: "", category: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [vendorProfile, setVendorProfile] = useState<any | null>(null);
  const [matchedProducts, setMatchedProducts] = useState<MatchedProduct[]>([]);
  const [matchingProducts, setMatchingProducts] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [captureQuality, setCaptureQuality] = useState<CaptureQuality>({
    brightness: 0,
    sharpness: 0,
    faceOk: null,
    guidance: "Open the camera and position the skin area inside the guide.",
    ready: false,
  });

  const exitScan = () => {
    stopCamera();
    setView?.("userdashboard");
  };

  // Gemini scan state
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<{
    concern: string;
    result: string;
    score: number;
    severity?: ScanSeverity[];
    benefits: string[];
  } | null>(null);
  const [analyzingError, setAnalyzingError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qualityTimerRef = useRef<number | null>(null);
  const vendorDisplayName = vendorProfile?.business_name || vendorProfile?.name || titleFromSlug(activeScanSlug);
  const hasVendorBrand = Boolean(vendorDisplayName);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const compressImageFile = async (file: File, quality = 0.82) => {
    const dataUrl = await fileToDataUrl(file);
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
      image.src = dataUrl;
    });
    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, dataUrl };
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return { file, dataUrl };
    const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
    return { file: compressed, dataUrl: canvas.toDataURL("image/jpeg", quality) };
  };

  const getImageQuality = async (canvas: HTMLCanvasElement): Promise<CaptureQuality> => {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { brightness: 0, sharpness: 0, faceOk: null, guidance: "Camera preview is unavailable. Try uploading a photo instead.", ready: false };
    }
    const sampleWidth = 120;
    const sampleHeight = Math.max(1, Math.round((canvas.height / canvas.width) * sampleWidth));
    const sample = document.createElement("canvas");
    sample.width = sampleWidth;
    sample.height = sampleHeight;
    const sampleCtx = sample.getContext("2d");
    if (!sampleCtx) {
      return { brightness: 0, sharpness: 0, faceOk: null, guidance: "Camera preview is unavailable. Try uploading a photo instead.", ready: false };
    }
    sampleCtx.drawImage(canvas, 0, 0, sampleWidth, sampleHeight);
    const pixels = sampleCtx.getImageData(0, 0, sampleWidth, sampleHeight).data;
    let brightnessTotal = 0;
    let diffTotal = 0;
    let diffCount = 0;
    const greys: number[] = [];
    for (let i = 0; i < pixels.length; i += 4) {
      const grey = pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114;
      greys.push(grey);
      brightnessTotal += grey;
    }
    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 1; x < sampleWidth; x += 1) {
        const idx = y * sampleWidth + x;
        diffTotal += Math.abs(greys[idx] - greys[idx - 1]);
        diffCount += 1;
      }
    }
    const brightness = Math.round(brightnessTotal / greys.length);
    const sharpness = Math.round(diffTotal / Math.max(1, diffCount));
    let faceOk: boolean | null = null;
    let faceGuidance = "";
    const FaceDetector = (window as any).FaceDetector;
    if (selectedArea === "Face" && FaceDetector) {
      try {
        const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        const faces = await detector.detect(canvas);
        if (!faces.length) {
          faceOk = false;
          faceGuidance = "Centre your face inside the oval guide.";
        } else {
          const box = faces[0].boundingBox;
          const centreX = box.x + box.width / 2;
          const centreY = box.y + box.height / 2;
          const centred = Math.abs(centreX - canvas.width / 2) < canvas.width * 0.18 && Math.abs(centreY - canvas.height / 2) < canvas.height * 0.18;
          const sizeOk = box.width > canvas.width * 0.28 && box.width < canvas.width * 0.78;
          faceOk = centred && sizeOk;
          if (!sizeOk) faceGuidance = box.width <= canvas.width * 0.28 ? "Move closer to the camera." : "Move slightly back from the camera.";
          if (sizeOk && !centred) faceGuidance = "Centre your face inside the oval guide.";
        }
      } catch {
        faceOk = null;
      }
    }
    const lightOk = brightness >= 70 && brightness <= 220;
    const sharpOk = sharpness >= 9;
    const ready = lightOk && sharpOk && faceOk !== false;
    const guidance = !lightOk
      ? (brightness < 70 ? "Improve lighting before capture." : "Reduce harsh light or glare.")
      : !sharpOk
        ? "Hold still until the preview looks sharper."
        : faceGuidance || (ready ? "Looks good. Hold still and capture." : "Position the skin area inside the guide.");
    return { brightness, sharpness, faceOk, guidance, ready };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Enforce allowed file type formats (JPEG, PNG, WEBP)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported format. Please select a JPEG, PNG, or WEBP image.");
      return;
    }

    // Enforce maximum file upload size (5MB limit)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error("File size exceeds 5MB limit. Please upload a smaller photo.");
      return;
    }

    try {
      const prepared = await compressImageFile(file);
      setSelectedFile(prepared.file);
      setImageBase64(prepared.dataUrl);
      setStep(3);
    } catch {
      toast.error("Could not prepare that image. Please try another photo.");
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const stopCamera = () => {
    if (qualityTimerRef.current) {
      window.clearInterval(qualityTimerRef.current);
      qualityTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError("");
    setCameraStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera is not available on this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: selectedArea === "Face" ? "user" : "environment",
          width: { ideal: 1280 },
          height: { ideal: 1600 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      qualityTimerRef.current = window.setInterval(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return;
        const width = video.videoWidth || 720;
        const height = video.videoHeight || 960;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, width, height);
        const quality = await getImageQuality(canvas);
        setCaptureQuality(quality);
      }, 700);
    } catch (err: any) {
      setCameraError(err.message || "Camera permission was denied. You can upload a photo instead.");
      toast.error(err.message || "Camera permission was denied. You can upload a photo instead.");
    } finally {
      setCameraStarting(false);
    }
  };

  const captureFromCamera = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      toast.error("Camera is not ready yet.");
      return;
    }
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 960;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    const quality = await getImageQuality(canvas);
    setCaptureQuality(quality);
    if (!quality.ready) {
      toast.error(quality.guidance);
      return;
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) {
      toast.error("Could not capture the image. Please try again.");
      return;
    }
    const file = new File([blob], `skin-scan-${Date.now()}.jpg`, { type: "image/jpeg" });
    setSelectedFile(file);
    setImageBase64(canvas.toDataURL("image/jpeg", 0.82));
    stopCamera();
    setStep(3);
  };

  useEffect(() => {
    if (step !== 2) stopCamera();
    return () => {
      if (step !== 2) stopCamera();
    };
  }, [step]);

  useEffect(() => {
    const slug = activeScanSlug;
    const hostname = window.location.hostname;
    const isSystemDomain = [
      "anovra.africa",
      "www.anovra.africa",
      "localhost",
      "127.0.0.1"
    ].includes(hostname) || 
    hostname === "anovra-api.vercel.app" ||
    hostname.endsWith(".vercel.app") ||
    hostname.endsWith(".local") || 
    hostname.includes("webcontainer") || 
    hostname.includes("stackblitz");

    if (slug || !isSystemDomain) {
      if (slug) {
        sessionStorage.setItem("active_scan_slug", slug);
      }
      const fetchVendor = async () => {
        try {
          let query = supabase.from("profiles").select("id, name, business_name, white_label, plan, phone, created_at, slug, account_type, branch_status, verification_status, parent_brand_id");
          
          if (!isSystemDomain) {
            query = query.eq("custom_domain", hostname);
          } else {
            query = query.or(`slug.eq.${slug},business_name.ilike.${slug.replace(/-/g, " ")}`);
          }

          const { data, error } = await query.maybeSingle();
            
          if (error && error.message.includes("white_label")) {
            // Fallback: Query base columns only if settings columns do not exist
            let fallbackQuery = supabase.from("profiles").select("id, name, business_name, plan, phone, created_at, slug, account_type, branch_status, verification_status, parent_brand_id");
            if (!isSystemDomain) {
              fallbackQuery = fallbackQuery.eq("custom_domain", hostname);
            } else {
              fallbackQuery = fallbackQuery.or(`slug.eq.${slug},business_name.ilike.${slug.replace(/-/g, " ")}`);
            }
            const { data: baseData } = await fallbackQuery.maybeSingle();
            if ((baseData?.account_type === "branch" && baseData.branch_status !== "active") || ["suspended", "banned"].includes(baseData?.verification_status || "")) {
              setVendorProfile(null);
              setTrialExpired(true);
              return;
            }
            if (baseData?.account_type === "branch" && baseData.parent_brand_id) {
              const { data: parentBrand } = await supabase.from("profiles").select("verification_status").eq("id", baseData.parent_brand_id).maybeSingle();
              if (["suspended", "banned"].includes(parentBrand?.verification_status || "")) {
                setVendorProfile(null);
                setTrialExpired(true);
                return;
              }
            }
            if (baseData) {
              setVendorProfile({
                ...baseData,
                white_label: false
              });
              const joinedYear = baseData.created_at ? new Date(baseData.created_at) : new Date();
              const daysDiff = (Date.now() - joinedYear.getTime()) / (1000 * 60 * 60 * 24);
              if ((baseData.plan || "free") === "free" && daysDiff > 14) {
                setTrialExpired(true);
              }
            }
          } else if (data) {
            if ((data.account_type === "branch" && data.branch_status !== "active") || ["suspended", "banned"].includes(data.verification_status || "")) {
              setVendorProfile(null);
              setTrialExpired(true);
              return;
            }
            if (data.account_type === "branch" && data.parent_brand_id) {
              const { data: parentBrand } = await supabase.from("profiles").select("verification_status").eq("id", data.parent_brand_id).maybeSingle();
              if (["suspended", "banned"].includes(parentBrand?.verification_status || "")) {
                setVendorProfile(null);
                setTrialExpired(true);
                return;
              }
            }
            setVendorProfile(data);
            const joinedYear = data.created_at ? new Date(data.created_at) : new Date();
            const daysDiff = (Date.now() - joinedYear.getTime()) / (1000 * 60 * 60 * 24);
            if ((data.plan || "free") === "free" && daysDiff > 14) {
              setTrialExpired(true);
            }
          }
        } catch (e) {
          console.error("Failed to fetch white-label status:", e);
        }
      };
      fetchVendor();
    }
  }, [activeScanSlug]);

  const healthScore = scanResult ? scanResult.score : 68;
  const scanId = scanResult
    ? `T-${Math.abs(`${scanResult.concern}-${scanResult.score}-${selectedArea}`.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)).toString().padStart(4, "0").slice(-4)}`
    : "Pending";
  const visibleSeverity = scanResult?.severity?.length
    ? scanResult.severity
    : SKIN_REPORT_CONCERNS.map((c) => ({
      label: c.label,
      level: (scanResult && c.label.toLowerCase().includes(scanResult.concern.toLowerCase().split(" ")[0])
        ? "Moderate"
        : "Low") as SeverityLevel,
      score: scanResult && c.label.toLowerCase().includes(scanResult.concern.toLowerCase().split(" ")[0])
        ? Math.max(50, scanResult.score)
        : 15,
    }));

  useEffect(() => {
    if (!scanResult || !vendorProfile?.id) {
      setMatchedProducts([]);
      return;
    }

    const fetchMatchedProducts = async () => {
      setMatchingProducts(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("vendor_id", vendorProfile.id)
          .eq("nafdac_status", "approved");

        if (error) throw error;

        const queryText = [
          scanResult.concern,
          scanResult.result,
          ...(scanResult.benefits || []),
          ...(scanResult.severity || []).filter((item) => item.score >= 30).map((item) => item.label),
        ].join(" ");
        const queryTokens = new Set(tokenize(queryText));
        const vendorName = vendorProfile.business_name || vendorProfile.name || "Vendor";

        const formatted = (data || []).map((product) => {
          const descriptionText = product.description || "";
          const images = parseJsonMeta<string[]>(descriptionText, "IMAGES", []);
          const benefitsText = parseJsonMeta<string>(descriptionText, "BENEFITS", "");
          const usageInstructions = parseJsonMeta<string>(descriptionText, "USAGE", "");
          const precautions = parseJsonMeta<string>(descriptionText, "PRECAUTIONS", "");
          const skinTypes = parseJsonMeta<string[]>(descriptionText, "SKINTYPES", []);
          const keyIngredients = parseJsonMeta<string[]>(descriptionText, "KEY_INGREDIENTS", []);
          const activeIngredients = parseJsonMeta<string[]>(descriptionText, "ACTIVE_INGREDIENTS", []);
          const ingredients = [...keyIngredients, ...activeIngredients];
          const cleanDescription = cleanProductDescription(descriptionText);
          const benefits = benefitsText
            .split("\n")
            .map((benefit) => benefit.replace(/^[•\-\*]\s*/, "").trim())
            .filter(Boolean);
          const searchable = [
            product.name,
            product.brand,
            product.category,
            cleanDescription,
            benefitsText,
            usageInstructions,
            precautions,
            skinTypes.join(" "),
            ingredients.join(" "),
          ].join(" ");
          const productTokens = new Set(tokenize(searchable));
          const overlap = [...queryTokens].filter((token) => productTokens.has(token));
          const severityBoost = (scanResult.severity || []).reduce((sum, item) => {
            return productTokens.has(item.label.toLowerCase().split(" ")[0]) ? sum + Math.min(18, Math.round(item.score / 5)) : sum;
          }, 0);
          const categoryBoost = product.category && queryText.toLowerCase().includes(String(product.category).toLowerCase()) ? 12 : 0;
          const score = Math.max(45, Math.min(98, 58 + overlap.length * 5 + severityBoost + categoryBoost));
          const matchReasons = overlap.slice(0, 3).map((token) => `Matches ${token} signals from your scan`);

          return {
            id: product.id,
            rank: 0,
            score,
            name: product.name,
            brand: product.brand || vendorName,
            price: `₦${Number(product.price || 0).toLocaleString()}`,
            priceVal: Number(product.price || 0),
            photo: product.image_url || images[0] || "",
            images,
            category: product.category || "Skincare",
            description: cleanDescription,
            benefits,
            usageInstructions,
            precautions,
            skinTypes,
            ingredients,
            matchReasons,
            vendorName,
            whatsappUrl: buildWhatsappUrl(vendorProfile.phone, product.name),
          };
        })
          .sort((a, b) => b.score - a.score)
          .slice(0, 6)
          .map((product, index) => ({ ...product, rank: index + 1 }));

        setMatchedProducts(formatted);
      } catch (err) {
        console.error("Failed to match live catalogue products:", err);
        setMatchedProducts([]);
      } finally {
        setMatchingProducts(false);
      }
    };

    fetchMatchedProducts();
  }, [scanResult, vendorProfile]);

  useEffect(() => {
    if (step !== 3) return;
    
    setProgress(0);
    setAnalyzingError(null);
    setScanResult(null);

    // 1. Animate progress bar to simulate processing visually
    let progressVal = 0;
    const interval = setInterval(() => {
      progressVal = Math.min(92, progressVal + 2.5);
      setProgress(progressVal);
    }, 110);

    // 2. Invoke real Gemini Multimodal analysis Edge Function
    const runAnalysis = async () => {
      try {
        let finalImageUrl = "";
        
        // Upload photo to Supabase Storage skin-scans bucket
        if (selectedFile) {
          const fileExt = selectedFile.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("skin-scans")
            .upload(filePath, selectedFile, {
              cacheControl: '3600',
              upsert: true
            });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("skin-scans")
              .getPublicUrl(filePath);
            finalImageUrl = publicUrl;
          } else {
            console.warn("Storage upload failed, falling back to base64 payload:", uploadError.message);
          }
        }

        const payload: { imageUrl?: string; imageBase64?: string; mimeType: string; skinArea: string } = {
          mimeType: selectedFile?.type || "image/jpeg",
          skinArea: selectedArea || "Face"
        };

        if (finalImageUrl) {
          payload.imageUrl = finalImageUrl;
        } else if (imageBase64) {
          payload.imageBase64 = imageBase64;
        } else {
          throw new Error("No image data available for analysis.");
        }

        const { data: resultData, error: invokeError } = await supabase.functions.invoke("analyse-skin", {
          body: payload
        });
        if (invokeError) throw invokeError;
        if (!resultData || !resultData.concern) throw new Error("Could not extract diagnostic skin report.");

        clearInterval(interval);
        setProgress(100);
        setScanResult(resultData);

        // Record referral scan completed event if ref exists
        const storedRef = sessionStorage.getItem("referral_code");
        if (storedRef) {
          try {
            const { data: staffMember } = await supabase
              .from("admin_team")
              .select("id")
              .or(`username.eq."${storedRef}",id.like."${storedRef}%"`)
              .maybeSingle();
            if (staffMember) {
              await supabase.from("team_referral_events").insert([{
                team_member_id: staffMember.id,
                event_type: "scan_completed",
                city: "Nigeria",
                metadata: { device: navigator.userAgent }
              }]);
            }
          } catch (e) {
            console.warn("Failed to record referral scan event:", e);
          }
        }

        // Record scan dynamically in user scan history if authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const vendorId = vendorProfile?.id || null;
            const { data: scanRow } = await supabase.from("scans").insert([{
              customer_id: user.id,
              vendor_id: vendorId,
              concern: resultData.concern,
              result: resultData.result,
              city: filters.city || "Lagos",
              score: resultData.score,
              severity: resultData.severity || [],
              benefits: resultData.benefits || [],
              skin_area: selectedArea || "Face",
              image_quality: {
                brightness: captureQuality.brightness,
                sharpness: captureQuality.sharpness,
                guided_capture: Boolean(selectedFile?.name?.startsWith("skin-scan-")),
              }
            }]).select().maybeSingle();
            await dispatchVendorWebhook(vendorId, "scan.completed", {
              scan_id: scanRow?.id,
              concern: resultData.concern,
              result: resultData.result,
              skin_area: selectedArea || "Face",
              city: filters.city || "Lagos",
            });
            if (user.email) {
              await sendEmailNotification("customer_scan_completed", {
                name: user.user_metadata?.full_name || "there",
                email: user.email,
                link: "https://anovra.africa/#/userdashboard",
              });
            }
          } catch (dbErr) {
            console.warn("Could not insert scan into database history:", dbErr);
          }
        }

        setTimeout(() => setStep(4), 800);
      } catch (err: any) {
        console.error("AI analysis failed:", err);
        clearInterval(interval);
        
        let friendlyMsg = "We encountered a temporary connection issue. Please check your internet connection and try again.";
        const msg = String(err.message || "");
        if (msg.includes("Failed to send a request") || msg.includes("fetch") || msg.includes("net::ERR")) {
          friendlyMsg = "Unable to connect to the skin scanner engine. Please check your internet connection and try again.";
        } else if (msg.includes("400") || msg.includes("Bad Request") || msg.includes("Payload Too Large")) {
          friendlyMsg = "The photo uploaded is too large or has an unsupported format. Please try a smaller file (under 5MB) in PNG/JPEG format.";
        }
        setAnalyzingError(friendlyMsg);
      }
    };

    runAnalysis();

    return () => clearInterval(interval);
  }, [step, selectedFile, imageBase64, vendorProfile, filters.city]);

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

  const STEP_LABELS = ["Select area", "Capture", "Analysing", "Skin report", "Results"];

  const activeFilters = Object.values(filters).filter(Boolean).length;
  const vendorOptions = Array.from(new Set(matchedProducts.map((product) => product.vendorName).filter(Boolean)));
  const categoryOptions = Array.from(new Set(matchedProducts.map((product) => product.category).filter(Boolean)));
  const filteredMatchedProducts = matchedProducts.filter((product) => {
    const vendorOk = !filters.vendor || product.vendorName === filters.vendor;
    const categoryOk = !filters.category || product.category === filters.category;
    return vendorOk && categoryOk;
  });

  if (trialExpired) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-5 border border-amber-500/20">
          <Lock className="w-8 h-8 text-amber-600 animate-pulse" />
        </div>
        <h2 className="text-2xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
          Skin test unavailable
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          This partner's 14-day trial access has ended, so their customer skin test link is temporarily unavailable.
        </p>
        {setView && (
          <button
            onClick={() => setView("landing")}
            className="px-5 py-2.5 bg-[#008236] text-white rounded-lg text-sm font-medium hover:bg-[#006c2c] transition-colors cursor-pointer shadow-xs"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Go back home
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header Bar */}
      <div className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <button
              onClick={exitScan}
              className="flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008236] rounded-lg p-1 transition-transform active:scale-95"
              aria-label="Anovra Home"
            >
              <img
                src="/logo.png"
                alt="Anovra Logo"
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </button>
            <div className="hidden sm:flex items-center gap-2 border-l border-border pl-4">
              <div>
                <span className="block text-sm font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                  {hasVendorBrand ? `${vendorDisplayName} skin test` : "Customer skin test"}
                </span>
                {hasVendorBrand && (
                  <span className="block text-[10px] text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Powered by Anovra
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono bg-[#008236]/15 text-[#008236] border border-[#008236]/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#008236] animate-pulse" /> AI READY
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={exitScan}
              className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-[#C86B3A] transition-colors cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Exit
            </button>
          </div>
        </div>

        {/* Step progress bar */}
        <div className="border-t border-border bg-[#FAF7F2]/60 py-3">
          <div className="max-w-xl mx-auto px-4">
            <div className="flex items-center gap-1">
              {STEP_LABELS.map((label, i) => {
                const s = i + 1;
                return (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                          step > s ? "bg-[#008236] text-white" : step === s ? "bg-[#C86B3A] text-white" : "bg-muted text-muted-foreground"
                        )}
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        {step > s ? <Check className="w-3.5 h-3.5 text-white" /> : s}
                      </div>
                      <span
                        className={cn("text-[9px] hidden sm:block whitespace-nowrap", step === s ? "text-foreground font-semibold" : "text-muted-foreground")}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {label}
                      </span>
                    </div>
                    {s < STEP_LABELS.length && (
                      <div className={cn("flex-1 h-0.5 mx-1 transition-colors", step > s ? "bg-[#008236]" : "bg-border")} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ---- STEP 1: Select Skin Area ---- */}
      {step === 1 && (
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-8 text-center sm:text-left">
            <p className="text-xs tracking-widest text-[#C86B3A] font-semibold uppercase mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Step 1 of 5</p>
            <h2 className="text-3xl sm:text-4xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              Select skin area to analyse
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {hasVendorBrand
                ? `${vendorDisplayName} uses Anovra's AI engine to evaluate visible skin areas and recommend safer product matches.`
                : "Anovra's AI engine can evaluate any visible area. Tap an option below to proceed."}
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {SKIN_AREAS.map((area) => {
              const isSelected = selectedArea === area.name;
              const AreaIcon = area.icon;
              return (
                <button
                  key={area.name}
                  onClick={() => setSelectedArea(area.name)}
                  className={cn(
                    "group flex items-start gap-4 p-4 rounded-2xl border-2 text-left bg-card transition-all duration-300 cursor-pointer hover:shadow-md",
                    isSelected
                      ? "border-[#008236] bg-[#008236]/5 ring-1 ring-[#008236]/20"
                      : "border-border hover:border-[#008236]/40"
                  )}
                >
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                    isSelected
                      ? "bg-[#008236] text-white shadow-sm"
                      : "bg-[#008236]/8 text-[#008236] group-hover:bg-[#008236]/12"
                  )}>
                    <AreaIcon className="w-5 h-5" strokeWidth={1.9} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{area.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{area.desc}</p>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#008236] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedArea === "Whole Body" && (
            <div className="mb-8 flex items-start gap-2.5 p-3.5 bg-[#C86B3A]/10 border border-[#C86B3A]/20 rounded-2xl">
              <Info className="w-4 h-4 text-[#C86B3A] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#C86B3A] leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <strong>Tip:</strong> Uploading or capturing a short 5-10 second video works best for full body scans so the AI can evaluate multiple skin zones.
              </p>
            </div>
          )}

          <button
            onClick={() => setStep(2)}
            disabled={!selectedArea}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all text-sm cursor-pointer",
              selectedArea ? "bg-[#008236] text-white hover:bg-[#006c2c] shadow-sm hover:shadow" : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Continue to capture
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---- STEP 2: Upload Media ---- */}
      {step === 2 && (
        <div className="max-w-xl mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-xs tracking-widest text-[#C86B3A] font-semibold uppercase mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Step 2 of 5 · {selectedArea}</p>
            <h2 className="text-3xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              Capture your skin photo
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              This guided scan helps customers capture a clear image, then matches the result with approved products from the connected storefront.
            </p>
          </div>

          {/* Guided camera viewfinder */}
          <div className="relative bg-foreground rounded-2xl overflow-hidden mb-5 border-2 border-border/80 shadow-lg" style={{ aspectRatio: "3/4", maxHeight: 340 }}>
            {cameraActive ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className={cn("w-full h-full object-cover", selectedArea === "Face" && "scale-x-[-1]")}
              />
            ) : (
              <div className="relative w-full h-full overflow-hidden bg-[#101614] flex flex-col items-center justify-center text-center px-6">
                <div className="absolute inset-0 opacity-45" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#008236]/25 to-transparent" />
                <div className="absolute inset-x-8 top-12 bottom-12 rounded-[2rem] border border-white/10 shadow-[0_0_60px_rgba(0,130,54,0.22)]" />
                <div className="absolute left-10 right-10 top-1/2 h-px bg-[#008236] shadow-[0_0_22px_rgba(0,130,54,0.9)] animate-scan" />
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#008236] animate-pulse" />
                  <span className="text-[10px] uppercase tracking-wider text-white/75" style={{ fontFamily: "'DM Mono', monospace" }}>Awaiting image</span>
                </div>
                <div className="relative z-10 w-24 h-28 rounded-full border border-white/45 bg-white/5 shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] flex items-center justify-center mb-5">
                  <div className="absolute -inset-3 rounded-full border border-dashed border-[#008236]/60 animate-spin" style={{ animationDuration: "9s" }} />
                  <Camera className="w-9 h-9 text-white/85" />
                </div>
                <p className="relative z-10 text-sm text-white font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Live camera preview</p>
                {cameraError && (
                  <p className="relative z-10 text-xs text-red-200 bg-red-500/20 border border-red-300/20 rounded-lg px-3 py-2 mt-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {cameraError}
                  </p>
                )}
              </div>
            )}
            {/* Glowing Scan Line */}
            {cameraActive && <div className="animate-scan" />}

            {/* Guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {SKIN_AREAS.find((a) => a.name === selectedArea)?.guide === "oval" ? (
                <div className={cn("border-2 rounded-full transition-colors", captureQuality.ready ? "border-[#008236]" : "border-white/60")} style={{ width: 150, height: 190 }} />
              ) : (
                <div className={cn("border-2 rounded-xl transition-colors", captureQuality.ready ? "border-[#008236]" : "border-white/60")} style={{ width: 190, height: 210 }} />
              )}
            </div>
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#008236] rounded-tl" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#008236] rounded-tr" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#008236] rounded-bl" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#008236] rounded-br" />
            {cameraActive && <div className="absolute bottom-4 inset-x-0 flex justify-center">
              <span className={cn("text-xs text-white bg-black/65 px-3.5 py-1.5 rounded-full font-medium border", captureQuality.ready ? "border-[#008236]/60" : "border-white/10")} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {captureQuality.guidance}
              </span>
            </div>}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {/* Quality checklist */}
          {cameraActive && <div className="bg-[#FAF7F2] border border-border/60 rounded-2xl p-4.5 mb-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Image quality checklist</p>
              <span className={cn("text-[10px] px-2 py-1 rounded-full font-mono", captureQuality.ready ? "bg-[#008236]/10 text-[#008236]" : "bg-[#C86B3A]/10 text-[#C86B3A]")}>
                {captureQuality.ready ? "Ready" : "Adjust"}
              </span>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Good natural or ring-light lighting", ok: !cameraActive || (captureQuality.brightness >= 70 && captureQuality.brightness <= 220) },
                { label: "Camera 20-30 cm from skin", ok: !cameraActive || captureQuality.faceOk !== false },
                { label: "In focus and steady", ok: !cameraActive || captureQuality.sharpness >= 9 },
                { label: "Bare skin where possible for best accuracy", ok: true },
              ].map((tip) => (
                <div key={tip.label} className="flex items-start gap-2">
                  <CheckCircle className={cn("w-4 h-4 flex-shrink-0 mt-0.5", tip.ok ? "text-[#008236]" : "text-[#C86B3A]")} />
                  <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{tip.label}</p>
                </div>
              ))}
            </div>
          </div>}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {cameraActive ? (
              <button
                onClick={captureFromCamera}
                className="flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006c2c] text-white font-bold py-3.5 rounded-xl transition-all text-sm shadow-sm cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Camera className="w-4 h-4 text-white" />
                Capture photo
              </button>
            ) : (
              <button
                onClick={startCamera}
                disabled={cameraStarting}
                className="flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006c2c] text-white font-bold py-3.5 rounded-xl transition-all text-sm shadow-sm cursor-pointer disabled:opacity-60"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                <Camera className="w-4 h-4 text-white" />
                {cameraStarting ? "Opening camera…" : "Open camera"}
              </button>
            )}
            <button
              onClick={triggerFileSelect}
              className="flex items-center justify-center gap-2 bg-white border-2 border-[#C86B3A] text-[#C86B3A] hover:bg-[#C86B3A]/5 font-bold py-3.5 rounded-xl transition-colors text-sm cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Upload className="w-4 h-4" />
              Upload file
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mb-4 animate-fade-in" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Supported formats: PNG, JPG, JPEG, WEBP · Maximum size: 5MB
          </p>

          <div className="flex items-start gap-2 p-3.5 bg-secondary/50 rounded-xl">
            <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Your image is processed securely for this analysis and product match. Scan records are only available to the customer account and the connected vendor where applicable.
            </p>
          </div>
        </div>
      )}

      {/* ---- STEP 3: AI Analysis ---- */}
      {step === 3 && (
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          {analyzingError ? (
            <div className="bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AI scan interrupted</h3>
              <p className="text-xs text-red-700 dark:text-red-400 mb-6 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {analyzingError}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-[#008236] hover:bg-[#006c2c] text-white font-bold py-3 rounded-xl transition-all text-xs cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Choose another photo
                </button>
                <button
                  onClick={() => {
                    // Force a restart of the analysis
                    setStep(1);
                    setTimeout(() => {
                      setStep(3);
                    }, 50);
                  }}
                  className="w-full bg-white border border-border text-foreground hover:bg-secondary font-bold py-3 rounded-xl transition-all text-xs cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Retry analysis
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-28 h-28 rounded-full bg-[#008236]/10 flex items-center justify-center mx-auto mb-8 relative">
                <Activity className="w-12 h-12 text-[#008236] animate-pulse" />
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 112 112">
                  <circle cx="56" cy="56" r="52" fill="none" stroke="rgba(200,107,58,0.15)" strokeWidth="4" />
                  <circle
                    cx="56" cy="56" r="52" fill="none" stroke="#008236" strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.08s linear" }}
                  />
                </svg>
              </div>

              <p className="text-xs tracking-widest text-[#C86B3A] font-semibold uppercase mb-3" style={{ fontFamily: "'DM Mono', monospace" }}>AI scan active</p>
              <h2 className="text-2xl font-light text-foreground mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
                Analysing your {selectedArea.toLowerCase()}…
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
                        "text-xs py-1.5 px-2 rounded-full border transition-all duration-300",
                        evaluated ? "border-[#008236]/40 bg-[#008236]/10 text-[#008236] font-medium" : "border-border bg-secondary text-muted-foreground"
                      )}
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {evaluated && <span className="mr-1">✓</span>}{attr}
                    </div>
                  );
                })}
              </div>

              <div className="w-full bg-muted rounded-full h-1.5 max-w-xs mx-auto">
                <div className="bg-[#008236] h-1.5 rounded-full transition-all duration-100" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: "'DM Mono', monospace" }}>{Math.round(progress)}%</p>

              <p className="text-xs text-muted-foreground mt-8 max-w-xs mx-auto leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Results are AI-powered personalised recommendations — not a medical diagnosis.
              </p>
            </>
          )}
        </div>
      )}

      {/* ---- STEP 4: Skin Report ---- */}
      {step === 4 && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p className="text-xs tracking-widest text-[#C86B3A] font-semibold uppercase mb-4" style={{ fontFamily: "'DM Mono', monospace" }}>Step 4 of 5 · Skin Report</p>

          {/* Report header card - Brand Green Gradient */}
          <div className="bg-gradient-to-br from-[#008236] to-[#005a25] text-white rounded-3xl p-6 sm:p-8 mb-6 shadow-xl border border-[#008236]/20">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs text-white/60 mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>ANALYSIS COMPLETE · Scan ID {scanId}</p>
                <h2 className="text-3xl font-light mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Your skin report</h2>
                <p className="text-sm text-white/80" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Area: <span className="text-white font-bold">{selectedArea}</span>
                </p>
              </div>
              {/* Health score gauge */}
              <div className="flex-shrink-0 relative w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none" stroke="#C86B3A" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - healthScore / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>{healthScore}</span>
                  <span className="text-[9px] text-white/60 uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>score</span>
                </div>
              </div>
            </div>

            {/* Skin type + condition */}
            <div className="flex flex-wrap gap-3 mb-6">
              {[
                { label: "Skin Type", value: scanResult ? scanResult.result : "Combination (oily T-zone, dry cheeks)" },
                { label: "Skin Condition", value: scanResult ? scanResult.concern : "Mild inflammatory, post-acne pigmentation" },
              ].map((item) => (
                <div key={item.label} className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 flex-1 min-w-[200px]">
                  <p className="text-[10px] text-white/50 mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>{item.label.toUpperCase()}</p>
                  <p className="text-sm text-white font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Concerns with severity bars */}
            <div>
              <p className="text-xs text-white/60 mb-3.5 uppercase tracking-wider font-semibold" style={{ fontFamily: "'DM Mono', monospace" }}>Detected skin concerns & severity</p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3.5">
                {visibleSeverity.map((c) => {
                  const level = c.level;
                  const severity = Math.max(0, Math.min(100, c.score));
                  return (
                    <div key={c.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-white/90" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{c.label}</span>
                        <span className="text-xs font-bold" style={{ color: level === "Good" || level === "Normal" || level === "Low" ? "#A7F3D0" : level === "Mild" || level === "Moderate" ? "#FDBA74" : "#FCA5A5", fontFamily: "'DM Mono', monospace" }}>{level}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/15">
                        <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${severity}%`, backgroundColor: level === "Good" || level === "Normal" || level === "Low" ? "#10B981" : level === "Mild" || level === "Moderate" ? "#C86B3A" : "#EF4444" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Personalised recommendations summary */}
          <div className="bg-[#008236]/10 border border-[#008236]/20 rounded-2xl p-4.5 mb-5">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-[#008236] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Personalised recommendations ready
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {scanResult 
                    ? `Based on your scan, Anovra's engine has identified products targeting ${scanResult.concern.toLowerCase()} (${scanResult.result}). Target benefits: ${scanResult.benefits.join(', ')}.`
                    : "Based on your scan, Anovra's engine has identified products targeting hyperpigmentation, T-zone oil control, and barrier repair. 3 products from verified vendors matched your skin profile."}
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl mb-6">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              This is an AI-generated skin assessment — not a medical diagnosis. For persistent or severe conditions, consult a registered dermatologist.
            </p>
          </div>

          <button
            onClick={() => setStep(5)}
            className="w-full flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006c2c] text-white py-3.5 rounded-xl transition-all font-bold text-sm shadow-md cursor-pointer"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            View matched products
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* ---- STEP 5: Recommendations + Filter + Purchase ---- */}
      {step === 5 && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs tracking-widest text-[#C86B3A] font-semibold uppercase mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>Step 5 of 5 · Matched Products</p>
              <h2 className="text-3xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                Products for your skin
              </h2>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all flex-shrink-0 cursor-pointer",
                showFilters || activeFilters > 0 ? "border-[#008236] bg-[#008236]/10 text-[#008236]" : "border-border bg-card text-foreground hover:border-[#008236]/40"
              )}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Search className="w-3.5 h-3.5" />
              Filter
              {activeFilters > 0 && (
                <span className="bg-[#008236] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-mono ml-0.5">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="bg-card border-2 border-border/80 rounded-2xl p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-3.5">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider" style={{ fontFamily: "'DM Mono', monospace" }}>Filter recommendations</p>
                {activeFilters > 0 && (
                  <button
                    onClick={() => setFilters({ country: "", state: "", city: "", vendor: "", category: "" })}
                    className="text-xs text-[#C86B3A] font-semibold hover:underline cursor-pointer"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {([
                  { key: "vendor", label: "Vendor", options: vendorOptions },
                  { key: "category", label: "Product Category", options: categoryOptions },
                ]).map((f) => (
                  <div key={f.key}>
                    <label className="text-[11px] font-bold text-muted-foreground mb-1 block uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.label}</label>
                    <select
                      value={filters[f.key]}
                      onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })}
                      className="w-full bg-[#FAF7F2] border border-border rounded-xl px-2.5 py-2 text-sm text-foreground focus:outline-none focus:border-[#008236] focus:ring-1 focus:ring-[#008236]/30 cursor-pointer"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <option value="">All</option>
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              {activeFilters > 0 && (
                <p className="text-xs text-muted-foreground mt-3.5 flex items-center gap-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <Globe className="w-4 h-4 text-[#008236]" />
                  Showing vendors available in your selected location
                </p>
              )}
            </div>
          )}

          {/* Product recommendation cards */}
          <div className="space-y-4.5 mb-6">
            {matchingProducts && (
              <div className="bg-card border border-border rounded-2xl p-6 text-center">
                <div className="w-10 h-10 rounded-full border-4 border-[#008236]/20 border-t-[#008236] animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Matching products from {vendorDisplayName || "this vendor"}...
                </p>
              </div>
            )}

            {!matchingProducts && filteredMatchedProducts.length === 0 && (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  No live catalogue matches yet
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  This vendor does not have approved products matching your scan in the live catalogue yet.
                </p>
              </div>
            )}

            {!matchingProducts && filteredMatchedProducts.map((rec, i) => (
              <div key={rec.id} className="bg-card border-2 border-border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300">
                {/* Card header */}
                <button
                  className="w-full p-4 flex items-start gap-4.5 text-left hover:bg-secondary/25 transition-colors cursor-pointer"
                  onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                >
                  {rec.photo ? (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-secondary border border-border">
                      <img
                        src={rec.photo}
                        alt={rec.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 bg-secondary border border-border text-muted-foreground">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-[#C86B3A]/10 text-[#C86B3A] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">#{rec.rank} match</span>
                      <span className="text-xs text-muted-foreground font-semibold font-mono">{rec.score}% score</span>
                    </div>
                    <h4 className="font-semibold text-foreground text-sm leading-snug mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{rec.name}</h4>
                    <p className="text-xs text-muted-foreground font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{rec.brand} · <span className="text-[#008236] font-semibold">{rec.price}</span></p>
                  </div>
                  {expandedCard === i ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />}
                </button>

                {expandedCard === i && (
                  <div className="border-t-2 border-border/80">
                    {/* Why recommended */}
                    <div className="p-4.5 border-b border-border/60 bg-[#FAF7F2]/40">
                      <p className="text-xs font-bold text-[#C86B3A] uppercase tracking-wider mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Why we recommended this</p>
                      <p className="text-sm text-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {rec.matchReasons.length > 0
                          ? `${rec.matchReasons.join(". ")}.`
                          : `${rec.name} is in ${vendorDisplayName || "this vendor"}'s approved catalogue and is the closest available match for ${scanResult?.concern.toLowerCase() || "your scan result"}.`}
                      </p>
                    </div>

                    {/* Product details grid */}
                    <div className="grid grid-cols-2 gap-0 border-b border-border/60">
                      {[
                        { label: "Suitable skin type", value: rec.skinTypes.length > 0 ? rec.skinTypes.join(", ") : "See product details" },
                        { label: "Availability", value: "Approved catalogue product" },
                        { label: "Category", value: rec.category },
                        { label: "Price", value: rec.price },
                      ].map((item) => (
                        <div key={item.label} className="p-3.5 border-r border-b border-border/60 last:border-r-0 last:border-b-0 odd:border-r">
                          <p className="text-[11px] font-bold text-muted-foreground mb-0.5 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.label}</p>
                          <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Expandable sections */}
                    {[
                      rec.description && { key: "description", label: "Description", icon: <Info className="w-4 h-4 text-[#008236]" />, content: (
                        <p className="text-xs text-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{rec.description}</p>
                      )},
                      rec.benefits.length > 0 && { key: "benefits", label: "Benefits", icon: <CheckCircle className="w-4 h-4 text-[#008236]" />, content: (
                        <ul className="space-y-2">
                          {rec.benefits.map((b) => (
                            <li key={b} className="flex items-start gap-2 text-xs text-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              <Check className="w-4 h-4 text-[#008236] flex-shrink-0 mt-0.5" />{b}
                            </li>
                          ))}
                        </ul>
                      )},
                      rec.usageInstructions && { key: "usage", label: "How to use", icon: <Star className="w-4 h-4 text-[#C86B3A]" />, content: (
                        <p className="text-xs text-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{rec.usageInstructions}</p>
                      )},
                      rec.ingredients.length > 0 && { key: "ingredients", label: "Ingredients", icon: <Sparkles className="w-4 h-4 text-[#C86B3A]" />, content: (
                        <div className="flex flex-wrap gap-1.5">
                          {rec.ingredients.map((ingredient) => (
                            <span key={ingredient} className="text-[11px] bg-[#008236]/10 text-[#008236] px-2 py-0.5 rounded-full font-medium">
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      )},
                      rec.precautions && { key: "precautions", label: "Precautions", icon: <AlertTriangle className="w-4 h-4 text-amber-600" />, content: (
                        <p className="text-xs text-amber-800 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{rec.precautions}</p>
                      )},
                    ].filter(Boolean).map((section: any) => (
                      <div key={section.key} className="border-b border-border/60 last:border-b-0">
                        <button
                          className="w-full px-4.5 py-3 flex items-center justify-between hover:bg-secondary/40 transition-colors cursor-pointer"
                          onClick={() => toggleSection(rec.rank, section.key)}
                        >
                          <span className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {section.icon}{section.label}
                          </span>
                          {expandedSection?.card === rec.rank && expandedSection.section === section.key
                            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        {expandedSection?.card === rec.rank && expandedSection.section === section.key && (
                          <div className="px-4.5 pb-4.5">{section.content}</div>
                        )}
                      </div>
                    ))}

                    {/* Vendor info + Purchase CTA */}
                    <div className="p-4.5 bg-[#FAF7F2]">
                      <div className="flex items-center gap-2 mb-3.5">
                        <Store className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Sold by <strong className="text-foreground">{rec.vendorName}</strong> · Live catalogue item
                        </span>
                        <span className="ml-auto flex items-center gap-1 text-xs text-[#008236] font-semibold" style={{ fontFamily: "'DM Mono', monospace" }}>
                          <CheckCircle className="w-3.5 h-3.5" /> In stock
                        </span>
                      </div>
                      {rec.whatsappUrl ? (
                        <a
                          href={rec.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BB5A] text-white py-3.5 rounded-xl transition-all font-bold text-sm shadow-sm"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          <MessageCircle className="w-4 h-4 text-white" />
                          Order via WhatsApp
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground py-3.5 rounded-xl font-bold text-sm cursor-not-allowed"
                          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          Vendor contact unavailable
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl mb-6">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              AI-generated recommendations only. Not a medical diagnosis. Consult a dermatologist for persistent or severe conditions.
            </p>
          </div>

          <button
            onClick={resetFlow}
            className="w-full py-3.5 border-2 border-[#C86B3A] text-[#C86B3A] hover:bg-[#C86B3A]/5 rounded-xl font-bold text-sm transition-all cursor-pointer"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Start a new analysis
          </button>
        </div>
      )}
    </div>
  );
}
