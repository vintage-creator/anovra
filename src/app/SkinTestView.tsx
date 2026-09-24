import { useState, useEffect, useRef } from "react";
import {
  Camera, Upload, Shield, ChevronDown, ChevronUp, ChevronRight,
  CheckCircle, ArrowRight, MessageCircle, Zap, Globe, Lock,
  Scan, Activity, X, Check, Info, Store, Search, Star, AlertTriangle,
  ScanFace, Badge, Bone, Hand, Footprints, PersonStanding, ScanSearch, Sparkles, Smile,
  Sun, Moon, Droplets, Heart, RefreshCw, Eye
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

const SKIN_FEEL_OPTIONS = [
  { id: "Oily T-zone, dry cheeks", label: "Combination", desc: "Oily T-zone, dry or normal cheeks" },
  { id: "Oily all over", label: "Oily", desc: "Slick and shiny throughout the face" },
  { id: "Dry or tight", label: "Dry", desc: "Feels tight, flaky, or dehydrated" },
  { id: "Normal / balanced", label: "Balanced", desc: "Comfortable, neither dry nor oily" },
  { id: "Sensitive, reacts easily", label: "Sensitive", desc: "Prone to redness, stinging, or reactions" },
];

const MAIN_CONCERN_OPTIONS = [
  "Dark spots / hyperpigmentation",
  "Acne & breakouts",
  "Uneven skin tone",
  "Dryness & flakiness",
  "Fine lines & texture",
  "Redness / sensitivity",
];

const AGE_RANGE_OPTIONS = [
  "Under 20",
  "20–29",
  "30–39",
  "40–49",
  "50+",
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

const buildWhatsappUrl = (phone: string | null | undefined, productName: string) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Hi, I'd like to order ${productName}`)}`;
};

export function SkinTestView({ setView }: { setView?: (v: View) => void }) {
  const [step, setStep] = useState<SkinStep>(1);
  const [activeScanSlug] = useState(getScanSlugFromUrl);
  const [selectedArea, setSelectedArea] = useState("Face");
  const [expandedCard, setExpandedCard] = useState<number | null>(0);
  const [expandedSection, setExpandedSection] = useState<{ card: number; section: string } | null>(null);
  const [filters, setFilters] = useState({ country: "", state: "", city: "", vendor: "", category: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [vendorProfile, setVendorProfile] = useState<any | null>(null);
  const [matchedProducts, setMatchedProducts] = useState<MatchedProduct[]>([]);
  const [ingredientFallback, setIngredientFallback] = useState<string[]>([]);
  const [scanId, setScanId] = useState("");
  const [trialExpired, setTrialExpired] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [filterAttested, setFilterAttested] = useState(false);

  // Questionnaire state
  const [questionnaire, setQuestionnaire] = useState({
    skinFeel: "Oily T-zone, dry cheeks",
    mainConcern: "Dark spots / hyperpigmentation",
    ageRange: "20–29",
    sensitivities: "",
    pregnantOrBreastfeeding: false,
  });

  // Staged Analysis Progress
  const [analysisPhase, setAnalysisPhase] = useState(1);
  const [analysisElapsed, setAnalysisElapsed] = useState(0);
  const [rejectionDetail, setRejectionDetail] = useState<{ message: string; guidance: string } | null>(null);

  const [captureQuality, setCaptureQuality] = useState<CaptureQuality>({
    brightness: 0,
    sharpness: 0,
    faceOk: null,
    guidance: "Position the skin area inside the guide.",
    ready: false,
  });

  const [currentUserRole, setCurrentUserRole] = useState<"customer" | "vendor" | "brand" | "admin" | "guest">("guest");

  useEffect(() => {
    const detectUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCurrentUserRole("guest");
          return;
        }
        const metaRole = user.app_metadata?.role || user.user_metadata?.role;
        if (metaRole === "admin") {
          setCurrentUserRole("admin");
          return;
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.account_type === "brand") setCurrentUserRole("brand");
        else if (profile?.account_type === "vendor" || profile?.account_type === "branch") setCurrentUserRole("vendor");
        else if (metaRole === "vendor") setCurrentUserRole("vendor");
        else setCurrentUserRole("customer");
      } catch (err) {
        console.warn("Could not detect user role in skin test:", err);
      }
    };
    detectUserRole();
  }, []);

  const exitScan = () => {
    stopCamera();
    if (currentUserRole === "brand") {
      setView?.("branddashboard");
    } else if (currentUserRole === "vendor") {
      setView?.("dashboard");
    } else if (currentUserRole === "admin") {
      setView?.("admin");
    } else if (currentUserRole === "customer") {
      setView?.("userdashboard");
    } else {
      setView?.("landing");
    }
  };

  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanResult, setScanResult] = useState<{
    concern: string;
    result: string;
    score: number;
    severity?: ScanSeverity[];
    benefits: string[];
    treatmentPlan?: any[];
  } | null>(null);
  const [analyzingError, setAnalyzingError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const qualityTimerRef = useRef<number | null>(null);
  const analysisStartedRef = useRef(false);
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
      return { brightness: 0, sharpness: 0, faceOk: null, guidance: "Camera preview is unavailable.", ready: false };
    }
    const sampleWidth = 120;
    const sampleHeight = Math.max(1, Math.round((canvas.height / canvas.width) * sampleWidth));
    const sample = document.createElement("canvas");
    sample.width = sampleWidth;
    sample.height = sampleHeight;
    const sampleCtx = sample.getContext("2d");
    if (!sampleCtx) {
      return { brightness: 0, sharpness: 0, faceOk: null, guidance: "Camera preview is unavailable.", ready: false };
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
      ? (brightness < 70 ? "Lighting is low. Face a light source." : "Reduce harsh light or glare.")
      : !sharpOk
        ? "Hold still until the preview looks sharp."
        : faceGuidance || (ready ? "Looks clear. Tap Capture photo." : "Position the skin area inside the guide.");
    return { brightness, sharpness, faceOk, guidance, ready };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported format. Please select a JPEG, PNG, or WEBP image.");
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error("File size exceeds 5MB limit. Please upload a smaller photo.");
      return;
    }

    try {
      const prepared = await compressImageFile(file);
      setSelectedFile(prepared.file);
      setImageBase64(prepared.dataUrl);
      setFilterAttested(true);
      stopCamera();
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
      const video = videoRef.current;
      if (!video) throw new Error("Camera preview element not ready.");
      video.srcObject = stream;
      await video.play();
      setCameraActive(true);
      qualityTimerRef.current = window.setInterval(async () => {
        const v = videoRef.current;
        const c = canvasRef.current;
        if (!v || !c || v.readyState < 2) return;
        const width = v.videoWidth || 720;
        const height = v.videoHeight || 960;
        c.width = width;
        c.height = height;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(v, 0, 0, width, height);
        const quality = await getImageQuality(c);
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
    setFilterAttested(true);
    stopCamera();
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
          const matchField = slug ? "slug" : "custom_domain";
          const matchVal = slug || hostname;
          const { data, error } = await supabase
            .from("profiles")
            .select("id, name, business_name, slug, logo_url, phone, plan, created_at, is_verified, verification_status, account_type, branch_status, parent_brand_id")
            .eq(matchField, matchVal)
            .maybeSingle();

          if (error || !data) {
            const { data: baseData } = await supabase
              .from("profiles")
              .select("id, name, business_name, slug, logo_url, phone, plan, created_at, is_verified, verification_status, account_type, branch_status, parent_brand_id")
              .eq("id", slug)
              .maybeSingle();
            if (baseData) {
              if (!baseData.is_verified || (baseData.verification_status || "pending") !== "approved" || (baseData.account_type === "branch" && baseData.branch_status !== "active")) {
                setVendorProfile(null);
                setTrialExpired(true);
                return;
              }
              if (baseData.account_type === "branch" && baseData.parent_brand_id) {
                const { data: parentBrand } = await supabase.from("profiles").select("is_verified, verification_status").eq("id", baseData.parent_brand_id).maybeSingle();
                if (!parentBrand?.is_verified || (parentBrand?.verification_status || "pending") !== "approved") {
                  setVendorProfile(null);
                  setTrialExpired(true);
                  return;
                }
              }
              setVendorProfile(baseData);
              const joinedYear = baseData.created_at ? new Date(baseData.created_at) : new Date();
              const daysDiff = (Date.now() - joinedYear.getTime()) / (1000 * 60 * 60 * 24);
              if ((baseData.plan || "free") === "free" && daysDiff > 7) {
                setTrialExpired(true);
              }
            }
          } else if (data) {
            if (!data.is_verified || (data.verification_status || "pending") !== "approved" || (data.account_type === "branch" && data.branch_status !== "active")) {
              setVendorProfile(null);
              setTrialExpired(true);
              return;
            }
            if (data.account_type === "branch" && data.parent_brand_id) {
              const { data: parentBrand } = await supabase.from("profiles").select("is_verified, verification_status").eq("id", data.parent_brand_id).maybeSingle();
              if (!parentBrand?.is_verified || (parentBrand?.verification_status || "pending") !== "approved") {
                setVendorProfile(null);
                setTrialExpired(true);
                return;
              }
            }
            setVendorProfile(data);
            const joinedYear = data.created_at ? new Date(data.created_at) : new Date();
            const daysDiff = (Date.now() - joinedYear.getTime()) / (1000 * 60 * 60 * 24);
            if ((data.plan || "free") === "free" && daysDiff > 7) {
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

  const healthScore = scanResult?.score ?? 0;
  const visibleSeverity = scanResult?.severity || [];

  // Step 4: Run AI analysis and manage realistic clinical milestone progress
  useEffect(() => {
    if (step !== 4 || analysisStartedRef.current) return;
    analysisStartedRef.current = true;
    
    setAnalyzingError(null);
    setRejectionDetail(null);
    setScanResult(null);
    setAnalysisElapsed(0);
    setAnalysisPhase(1);

    const timer = window.setInterval(() => {
      setAnalysisElapsed((prev) => {
        const next = prev + 1;
        if (next < 14) setAnalysisPhase(1);
        else if (next < 28) setAnalysisPhase(2);
        else if (next < 42) setAnalysisPhase(3);
        else setAnalysisPhase(4);
        return next;
      });
    }, 1000);

    const runAnalysis = async () => {
      try {
        if (!imageBase64) throw new Error("Choose a photo before starting your skin test.");

        const { data: resultData, error: invokeError } = await supabase.functions.invoke("analyse-skin", {
          body: {
            imageBase64,
            skinArea: selectedArea,
            vendorId: vendorProfile?.id || null,
            questionnaire: {
              skinFeel: questionnaire.skinFeel,
              mainConcern: questionnaire.mainConcern,
              ageRange: questionnaire.ageRange,
              sensitivities: questionnaire.sensitivities ? [questionnaire.sensitivities] : [],
              pregnantOrBreastfeeding: questionnaire.pregnantOrBreastfeeding,
            }
          }
        });

        if (invokeError) {
          const response = (invokeError as any).context as Response | undefined;
          const detail = await response?.clone().json().catch(() => null);
          throw new Error(detail?.error || invokeError.message);
        }

        // Quality check rejection
        if (resultData?.accepted === false) {
          const reasons = (resultData.rejectReasons || []).map((item: { message?: string; guidance?: string }) =>
            [item.message, item.guidance].filter(Boolean).join(" "));
          setRejectionDetail({
            message: "Our dermatological quality check could not clearly assess your skin.",
            guidance: reasons.join(" ") || "Please retake your photo in clear, even natural lighting and hold steady."
          });
          return;
        }

        if (!resultData?.accepted || !resultData.concern) {
          throw new Error("The scanner returned an incomplete report. Please try again.");
        }

        setScanResult(resultData);
        setIngredientFallback(resultData.ingredientFallback || []);

        const { data: approvedProducts } = vendorProfile?.id
          ? await supabase.from("products").select("*").eq("vendor_id", vendorProfile.id).eq("nafdac_status", "approved")
          : { data: [] };
        const productById = new Map((approvedProducts || []).map((product) => [product.id, product]));

        setMatchedProducts((resultData.products || []).map((match: any, index: number) => {
          const product = productById.get(match.id);
          const description = String(product?.description || "");
          const images = parseJsonMeta<string[]>(description, "IMAGES", []);
          return {
            id: match.id,
            rank: Number(match.rank || index + 1),
            score: Number(match.score || 0),
            name: match.name,
            brand: match.brand || product?.brand || vendorDisplayName || "",
            price: `₦${Number(match.price ?? product?.price ?? 0).toLocaleString()}`,
            priceVal: Number(match.price ?? product?.price ?? 0),
            photo: match.image_url || product?.image_url || images[0] || "",
            images,
            category: product?.category || "Skincare",
            description: cleanProductDescription(description),
            benefits: match.benefits || [],
            usageInstructions: match.how_to_use || "",
            precautions: (match.warnings || []).join(" "),
            skinTypes: parseJsonMeta<string[]>(description, "SKINTYPES", []),
            ingredients: [
              ...parseJsonMeta<string[]>(description, "KEY_INGREDIENTS", []),
              ...parseJsonMeta<string[]>(description, "ACTIVE_INGREDIENTS", []),
            ],
            matchReasons: match.why ? [match.why] : [],
            vendorName: vendorDisplayName || "",
            whatsappUrl: match.purchase_url || buildWhatsappUrl(vendorProfile?.phone, match.name),
          };
        }));

        // Track referral scan completed event if ref exists
        const storedRef = sessionStorage.getItem("referral_code");
        if (storedRef) {
          try {
            await supabase.functions.invoke("track-referral-event", { body: {
              referral_code: storedRef,
              event_type: "scan_completed",
              city: filters.city || "",
              metadata: { device: navigator.userAgent },
            } });
          } catch (e) {
            console.warn("Failed to record referral scan event:", e);
          }
        }

        // Record scan dynamically in user scan history if authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const vendorId = vendorProfile?.id || null;
            const { data: scanRow, error: scanError } = await supabase.from("scans").insert([{
              customer_id: user.id,
              vendor_id: vendorId,
              concern: resultData.concern,
              result: resultData.result,
              city: filters.city || "Unknown",
              score: resultData.score,
              severity: resultData.severity || [],
              benefits: resultData.benefits || [],
              matched_products: resultData.products || [],
              ingredient_fallback: resultData.ingredientFallback || [],
              treatment_plan: resultData.treatmentPlan || [],
              skin_area: selectedArea || "Face",
              image_quality: {
                brightness: captureQuality.brightness,
                sharpness: captureQuality.sharpness,
                guided_capture: Boolean(selectedFile?.name?.startsWith("skin-scan-")),
              }
            }]).select().maybeSingle();
            if (scanError) throw scanError;
            if (scanRow?.id) setScanId(scanRow.id.slice(0, 8).toUpperCase());
            await dispatchVendorWebhook(vendorId, "scan.completed", {
              scan_id: scanRow?.id,
              concern: resultData.concern,
              result: resultData.result,
              skin_area: selectedArea || "Face",
              city: filters.city || "Unknown",
            });
            if (user.email) {
              await sendEmailNotification("customer_scan_completed", {
                name: user.user_metadata?.full_name || "there",
                email: user.email,
                link: "https://anovra-api.vercel.app/#/userdashboard",
              });
            }
          } catch (dbErr) {
            console.warn("Could not insert scan into database history:", dbErr);
          }
        }

        // Transition to unified Dermatology & Product Report
        setStep(5);
      } catch (err: any) {
        console.error("AI analysis failed:", err);
        setAnalyzingError(err.message || "The scanner is temporarily unavailable. Please try again.");
      } finally {
        window.clearInterval(timer);
      }
    };

    runAnalysis();

    return () => {
      window.clearInterval(timer);
    };
  }, [step, selectedFile, imageBase64, vendorProfile, filters.city, questionnaire, selectedArea]);

  function toggleSection(cardRank: number, section: string) {
    if (expandedSection?.card === cardRank && expandedSection?.section === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection({ card: cardRank, section });
    }
  }

  function resetFlow() {
    analysisStartedRef.current = false;
    setStep(1);
    setSelectedArea("Face");
    setImageBase64(null);
    setSelectedFile(null);
    setFilterAttested(false);
    setExpandedCard(0);
    setExpandedSection(null);
    setFilters({ country: "", state: "", city: "", vendor: "", category: "" });
    setShowFilters(false);
    setScanResult(null);
    setMatchedProducts([]);
    setIngredientFallback([]);
    setRejectionDetail(null);
  }

  const STEP_LABELS = ["Skin area", "Capture", "Intake", "AI Analysis", "Dermatology report"];

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
          This partner link is not available yet. The account must be verified by Anovra and have active trial or plan access before customers can use the skin test.
        </p>
        {setView && (
          <button
            onClick={() => setView("landing")}
            className="px-5 py-2.5 bg-[#008236] text-white rounded-lg text-sm font-medium hover:bg-[#006c2c] transition-colors cursor-pointer shadow-xs"
          >
            Return to home
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
              className="flex items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008236] rounded-lg p-1 transition-transform active:scale-95 cursor-pointer"
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
                  {currentUserRole === "brand"
                    ? `Brand Test Mode · ${vendorDisplayName || "Brand Preview"}`
                    : currentUserRole === "vendor"
                      ? `Vendor Preview · ${vendorDisplayName || "Storefront"}`
                      : hasVendorBrand
                        ? `${vendorDisplayName} skin test`
                        : "Customer skin test"}
                </span>
                <span className="block text-[10px] text-muted-foreground mt-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {currentUserRole === "brand" ? "Simulating customer scan experience" : hasVendorBrand ? "Powered by Anovra" : "Clinical Vision AI"}
                </span>
              </div>
              <span className="text-[10px] font-mono bg-[#008236]/15 text-[#008236] border border-[#008236]/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#008236] animate-pulse" />
                {currentUserRole === "brand" ? "BRAND TEST" : currentUserRole === "vendor" ? "VENDOR PREVIEW" : "AI READY"}
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
                ? `${vendorDisplayName} uses Anovra's dermatological vision AI to evaluate visible skin concerns and rank safe, approved products.`
                : "Anovra's clinical AI evaluates any visible skin area. Select the area you wish to assess."}
            </p>
          </div>

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
                      <Check className="w-3.5 h-3.5 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!selectedArea}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all text-sm cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99]",
              selectedArea ? "bg-[#008236] text-white hover:bg-[#006c2c]" : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Continue to photo capture
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ---- STEP 2: Capture Photo & Attestation ---- */}
      {step === 2 && (
        <div className="max-w-xl mx-auto px-4 py-8">
          <div className="mb-5">
            <p className="text-xs tracking-widest text-[#C86B3A] font-semibold uppercase mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Step 2 of 5 · {selectedArea}</p>
            <h2 className="text-3xl font-light text-foreground mb-1.5" style={{ fontFamily: "'Fraunces', serif" }}>
              {imageBase64 ? "Review captured photo" : cameraActive ? "Position your skin in view" : "Capture your skin photo"}
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {imageBase64
                ? "Verify that the skin area is in focus and well lit, then confirm attestation below."
                : cameraActive
                  ? "Align the skin area inside the guide. When the indicator turns green, tap Capture photo."
                  : "Use your device camera for a live guided scan or upload a clear, high-resolution photo."}
            </p>
          </div>

          {/* Captured Preview Mode */}
          {imageBase64 ? (
            <div className="mb-6 space-y-4">
              <div className="relative rounded-2xl overflow-hidden border-2 border-[#008236] shadow-lg bg-black aspect-[3/4] max-h-[380px]">
                <img src={imageBase64} alt="Captured skin" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[11px] font-mono px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
                  <CheckCircle className="w-3.5 h-3.5 text-[#008236]" /> Photo captured
                </div>
              </div>

              {/* Natural photo attestation checkbox (Required by API docs) */}
              <label className="flex items-start gap-3 p-4 bg-[#FAF7F2] border border-border rounded-2xl cursor-pointer hover:bg-secondary/40 transition-colors">
                <input
                  type="checkbox"
                  checked={filterAttested}
                  onChange={(e) => setFilterAttested(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-[#008236] focus:ring-[#008236] border-border"
                />
                <div className="flex-1 text-left">
                  <span className="text-xs font-semibold text-foreground block" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    I confirm this photo has no beauty filter, makeup, or smoothing applied.
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Natural lighting and authentic skin texture ensure accurate clinical scoring and safe ingredient matching.
                  </span>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setImageBase64(null);
                    setSelectedFile(null);
                    setFilterAttested(false);
                  }}
                  className="w-full py-3.5 rounded-xl border border-border text-foreground hover:bg-secondary font-semibold text-xs transition-colors cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Retake photo
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!filterAttested}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm",
                    filterAttested
                      ? "bg-[#008236] text-white hover:bg-[#006c2c]"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Continue to intake questions
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Viewfinder: Video tag ALWAYS mounted in DOM */}
              <div
                className={cn(
                  "relative rounded-2xl overflow-hidden mb-4 border-2 shadow-lg transition-colors",
                  cameraActive ? "border-[#008236]/70 bg-black" : "border-border/80 bg-[#101614]"
                )}
                style={{ aspectRatio: "3/4", maxHeight: 380 }}
              >
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                    selectedArea === "Face" && "scale-x-[-1]",
                    cameraActive ? "opacity-100" : "opacity-0 pointer-events-none"
                  )}
                />

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                    <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#008236]/20 to-transparent" />
                    <div className="absolute left-10 right-10 top-1/2 h-px bg-[#008236]/70 shadow-[0_0_18px_rgba(0,130,54,0.8)] animate-scan" />
                    <div className="relative z-10 w-20 h-24 rounded-full border border-white/30 bg-white/5 flex items-center justify-center mb-4">
                      <div className="absolute -inset-3 rounded-full border border-dashed border-[#008236]/50 animate-spin" style={{ animationDuration: "10s" }} />
                      <Camera className="w-8 h-8 text-white/70" />
                    </div>
                    <p className="relative z-10 text-sm text-white/80 font-semibold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Camera preview</p>
                    <p className="relative z-10 text-[11px] text-white/45" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tap "Open Camera" below or upload a file</p>
                    {cameraError && (
                      <div className="relative z-10 mt-4 flex items-start gap-2 bg-red-500/20 border border-red-300/25 rounded-xl px-3 py-2.5 max-w-xs text-left">
                        <AlertTriangle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-200 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{cameraError}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {SKIN_AREAS.find((a) => a.name === selectedArea)?.guide === "oval" ? (
                    <div className={cn("border-2 rounded-full transition-colors duration-500", captureQuality.ready ? "border-[#008236] shadow-[0_0_16px_rgba(0,130,54,0.5)]" : "border-white/50")} style={{ width: 150, height: 190 }} />
                  ) : (
                    <div className={cn("border-2 rounded-xl transition-colors duration-500", captureQuality.ready ? "border-[#008236] shadow-[0_0_16px_rgba(0,130,54,0.5)]" : "border-white/50")} style={{ width: 190, height: 210 }} />
                  )}
                </div>

                <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#008236] rounded-tl" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#008236] rounded-tr" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#008236] rounded-bl" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#008236] rounded-br" />

                {cameraActive && (
                  <div className="absolute bottom-4 inset-x-0 flex justify-center">
                    <span className={cn("text-xs text-white bg-black/70 px-4 py-1.5 rounded-full font-medium border backdrop-blur-sm", captureQuality.ready ? "border-[#008236]/70" : "border-white/15")} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {captureQuality.guidance}
                    </span>
                  </div>
                )}

                {cameraActive && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#008236] animate-pulse" />
                    <span className="text-[10px] text-white/80 font-mono uppercase tracking-wider">Live</span>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              {cameraActive && (
                <div className="flex items-center gap-2.5 mb-4 px-3.5 py-2.5 bg-card border border-border rounded-xl">
                  <div className={cn("w-2 h-2 rounded-full shrink-0 transition-colors", captureQuality.ready ? "bg-[#008236] animate-pulse" : "bg-[#C86B3A]")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {captureQuality.ready ? "Clear preview — tap Capture photo" : "Adjust lighting & position"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={cn("text-[10px] font-mono", captureQuality.brightness >= 70 && captureQuality.brightness <= 220 ? "text-[#008236]" : "text-[#C86B3A]")}>
                        Light: {captureQuality.brightness}
                      </span>
                      <span className={cn("text-[10px] font-mono", captureQuality.sharpness >= 9 ? "text-[#008236]" : "text-[#C86B3A]")}>
                        Focus: {captureQuality.sharpness}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={stopCamera}
                    className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors font-semibold cursor-pointer shrink-0"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Close
                  </button>
                </div>
              )}

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

              <div className={cn("grid gap-3 mb-4", cameraActive ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
                {cameraActive ? (
                  <button
                    onClick={captureFromCamera}
                    className="flex items-center justify-center gap-2.5 bg-[#008236] hover:bg-[#006c2c] text-white font-bold py-4 rounded-xl transition-all text-sm shadow-md hover:shadow-lg cursor-pointer active:scale-[0.98]"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <Camera className="w-5 h-5" />
                    Capture photo
                  </button>
                ) : (
                  <>
                    <button
                      onClick={startCamera}
                      disabled={cameraStarting}
                      className="flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006c2c] text-white font-bold py-4 rounded-xl transition-all text-sm shadow-sm hover:shadow-md cursor-pointer disabled:opacity-60 active:scale-[0.98]"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {cameraStarting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Opening camera…
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Open camera
                        </>
                      )}
                    </button>
                    <button
                      onClick={triggerFileSelect}
                      className="flex items-center justify-center gap-2 bg-card border-2 border-[#C86B3A] text-[#C86B3A] hover:bg-[#C86B3A]/8 font-bold py-4 rounded-xl transition-colors text-sm cursor-pointer active:scale-[0.98]"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <Upload className="w-4 h-4" />
                      Upload photo
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          <div className="flex items-start gap-2.5 p-3.5 bg-secondary/50 rounded-xl">
            <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Your image is evaluated in memory for this consultation. Scan results are private to your customer account and connected brand partner.
            </p>
          </div>
        </div>
      )}

      {/* ---- STEP 3: Clinical Intake Consultation ---- */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-xs tracking-widest text-[#C86B3A] font-semibold uppercase mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>Step 3 of 5 · Intake</p>
            <h2 className="text-3xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              Clinical intake consultation
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              These clinical priors guide the AI engine to rule out contraindicated ingredients and tailor your treatment regimen.
            </p>
          </div>

          <div className="space-y-6 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
            {/* 1. Skin feel by midday */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                1. How does your skin feel by midday?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SKIN_FEEL_OPTIONS.map((opt) => {
                  const isSelected = questionnaire.skinFeel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setQuestionnaire((prev) => ({ ...prev, skinFeel: opt.id }))}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all cursor-pointer",
                        isSelected
                          ? "border-[#008236] bg-[#008236]/10 text-foreground font-semibold ring-1 ring-[#008236]/30"
                          : "border-border bg-card text-muted-foreground hover:border-[#008236]/30 hover:text-foreground"
                      )}
                    >
                      <p className="text-xs font-semibold">{opt.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Main skin concern */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                2. What is your primary skin concern?
              </label>
              <div className="flex flex-wrap gap-2">
                {MAIN_CONCERN_OPTIONS.map((concern) => {
                  const isSelected = questionnaire.mainConcern === concern;
                  return (
                    <button
                      key={concern}
                      type="button"
                      onClick={() => setQuestionnaire((prev) => ({ ...prev, mainConcern: concern }))}
                      className={cn(
                        "px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer",
                        isSelected
                          ? "border-[#C86B3A] bg-[#C86B3A]/10 text-[#C86B3A] ring-1 ring-[#C86B3A]/30"
                          : "border-border bg-card text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      {concern}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Age bracket */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                3. Your age bracket
              </label>
              <div className="flex flex-wrap gap-2">
                {AGE_RANGE_OPTIONS.map((age) => {
                  const isSelected = questionnaire.ageRange === age;
                  return (
                    <button
                      key={age}
                      type="button"
                      onClick={() => setQuestionnaire((prev) => ({ ...prev, ageRange: age }))}
                      className={cn(
                        "px-4 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer font-mono",
                        isSelected
                          ? "border-[#008236] bg-[#008236] text-white"
                          : "border-border bg-card text-muted-foreground hover:border-[#008236]/30 hover:text-foreground"
                      )}
                    >
                      {age}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Sensitivities & Allergies */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                4. Known sensitivities or allergies (optional)
              </label>
              <input
                type="text"
                value={questionnaire.sensitivities}
                onChange={(e) => setQuestionnaire((prev) => ({ ...prev, sensitivities: e.target.value }))}
                placeholder="e.g. fragrance, essential oils, salicylic acid (or leave empty)"
                className="w-full bg-[#FAF7F2] border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-[#008236] focus:ring-1 focus:ring-[#008236]/20"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                The engine uses this to automatically exclude contraindicated active ingredients from your product recommendations.
              </p>
            </div>

            {/* 5. Pregnancy safety toggle */}
            <label className="flex items-start gap-3 p-3.5 bg-amber-50/50 border border-amber-200/60 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={questionnaire.pregnantOrBreastfeeding}
                onChange={(e) => setQuestionnaire((prev) => ({ ...prev, pregnantOrBreastfeeding: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
              />
              <div className="flex-1">
                <span className="text-xs font-semibold text-amber-900 block">
                  Currently pregnant or breastfeeding
                </span>
                <span className="text-[11px] text-amber-700/80 block mt-0.5">
                  Safely excludes high-potency retinoids, hydroquinone, and prescription-strength actives.
                </span>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setStep(2)}
              className="py-4 rounded-xl border border-border text-foreground hover:bg-secondary font-semibold text-xs transition-colors cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Back to photo
            </button>
            <button
              onClick={() => {
                analysisStartedRef.current = false;
                setStep(4);
              }}
              className="flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006c2c] text-white py-4 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <Zap className="w-4 h-4 text-white" />
              Start AI analysis
            </button>
          </div>
        </div>
      )}

      {/* ---- STEP 4: AI Analysis & Staged Progress Tracker ---- */}
      {step === 4 && (
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          {/* Quality Rejection Screen */}
          {rejectionDetail ? (
            <div className="bg-card border-2 border-amber-300/80 rounded-3xl p-6 sm:p-8 shadow-xl text-left animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-xs font-mono uppercase tracking-wider text-amber-600 font-semibold mb-1">Quality check feedback</p>
              <h3 className="text-xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
                Photo quality adjustment required
              </h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                {rejectionDetail.message}
              </p>
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl mb-6">
                <p className="text-xs font-semibold text-amber-900 mb-1">AI Recommendation:</p>
                <p className="text-xs text-amber-800 leading-relaxed">{rejectionDetail.guidance}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setRejectionDetail(null);
                    setImageBase64(null);
                    setSelectedFile(null);
                    setStep(2);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006c2c] text-white py-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <Camera className="w-4 h-4" />
                  Retake in better light
                </button>
                <button
                  onClick={() => {
                    setRejectionDetail(null);
                    setStep(3);
                  }}
                  className="w-full py-3.5 rounded-xl border border-border text-foreground hover:bg-secondary font-semibold text-xs transition-colors cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Edit intake answers
                </button>
              </div>
            </div>
          ) : analyzingError ? (
            /* General Interrupted Error */
            <div className="bg-card border-2 border-red-200 rounded-3xl p-6 sm:p-8 shadow-xl text-left">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>Analysis interrupted</h3>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                {analyzingError}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    analysisStartedRef.current = false;
                    setStep(2);
                  }}
                  className="flex-1 bg-[#008236] hover:bg-[#006c2c] text-white font-bold py-3.5 rounded-xl transition-all text-xs cursor-pointer shadow-sm"
                >
                  Choose another photo
                </button>
                <button
                  onClick={() => {
                    analysisStartedRef.current = false;
                    setAnalyzingError(null);
                    setStep(4);
                  }}
                  className="flex-1 bg-white border border-border text-foreground hover:bg-secondary font-bold py-3.5 rounded-xl transition-all text-xs cursor-pointer"
                >
                  Retry analysis
                </button>
              </div>
            </div>
          ) : (
            /* Active Neural Progression Tracker */
            <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
              <div className="w-24 h-24 rounded-full bg-[#008236]/10 flex items-center justify-center mx-auto mb-6 relative">
                <Activity className="w-10 h-10 text-[#008236] animate-pulse" />
                <div className="absolute inset-0 rounded-full border-4 border-[#008236]/20 border-t-[#008236] animate-spin" />
              </div>

              <p className="text-xs font-mono uppercase tracking-widest text-[#C86B3A] font-semibold mb-2">
                Dermatological vision ensemble active
              </p>
              <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
                Analysing your {selectedArea.toLowerCase()}…
              </h2>

              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
                Evaluating cellular tone, barrier hydration, and pigmentation markers across our multi-model AI ensemble.
              </p>

              {/* Progress Milestones */}
              <div className="space-y-3 max-w-md mx-auto text-left bg-[#FAF7F2] p-4.5 rounded-2xl border border-border mb-6">
                {[
                  { phase: 1, label: "Calibrating lighting & skin barrier clarity", done: analysisPhase > 1, active: analysisPhase === 1 },
                  { phase: 2, label: "Evaluating dermal conditions (Claude Opus + Gemini)", done: analysisPhase > 2, active: analysisPhase === 2 },
                  { phase: 3, label: "Screening against safety lists & contraindications", done: analysisPhase > 3, active: analysisPhase === 3 },
                  { phase: 4, label: "Formulating regimen & ranking approved catalogue", done: false, active: analysisPhase === 4 },
                ].map((item) => (
                  <div key={item.phase} className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 transition-all",
                      item.done
                        ? "bg-[#008236] text-white"
                        : item.active
                          ? "border-2 border-[#C86B3A] text-[#C86B3A] animate-pulse"
                          : "bg-muted text-muted-foreground"
                    )}>
                      {item.done ? <Check className="w-3 h-3 text-white" /> : item.phase}
                    </div>
                    <span className={cn(
                      "text-xs transition-colors",
                      item.active ? "text-foreground font-semibold" : item.done ? "text-muted-foreground" : "text-muted-foreground/60"
                    )}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-muted-foreground">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Elapsed time: {analysisElapsed}s · average completion ~45–60s</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- STEP 5: Comprehensive Dermatology & Product Report ---- */}
      {step === 5 && (
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Top Banner Card with Health Score */}
          <div className="bg-gradient-to-br from-[#008236] to-[#005a25] text-white rounded-3xl p-6 sm:p-8 mb-6 shadow-xl border border-[#008236]/20">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs text-white/60 mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                  DERMATOLOGY ASSESSMENT COMPLETE{scanId ? ` · ID ${scanId}` : ""}
                </p>
                <h2 className="text-3xl font-light mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
                  Your personalized skin report
                </h2>
                <p className="text-sm text-white/80" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Target area: <span className="text-white font-bold">{selectedArea}</span> · Evaluated against NAFDAC-approved standards
                </p>
              </div>

              {/* Health score circular gauge */}
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
                  <span className="text-xl font-bold text-white font-mono">{healthScore}</span>
                  <span className="text-[9px] text-white/60 uppercase font-mono">score</span>
                </div>
              </div>
            </div>

            {/* Badges: Skin Type & Primary Condition */}
            <div className="flex flex-wrap gap-3 mb-6">
              {[
                { label: "Determined Skin Type", value: scanResult?.result || "Balanced" },
                { label: "Primary Condition", value: scanResult?.concern || "Clear skin profile" },
              ].map((item) => (
                <div key={item.label} className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 flex-1 min-w-[200px]">
                  <p className="text-[10px] text-white/50 mb-0.5 font-mono">{item.label.toUpperCase()}</p>
                  <p className="text-sm text-white font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Severity Breakdown Meters */}
            <div>
              <p className="text-xs text-white/70 mb-3.5 uppercase tracking-wider font-semibold font-mono">
                Detected conditions & severity breakdown
              </p>
              {visibleSeverity.length === 0 ? (
                <p className="text-sm text-white/80">No visible dermal conditions cleared the threshold.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3.5">
                  {visibleSeverity.map((c) => {
                    const level = c.level;
                    const severity = Math.max(0, Math.min(100, c.score));
                    return (
                      <div key={c.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-white/90" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{c.label}</span>
                          <span className="text-xs font-bold font-mono" style={{ color: level === "Good" || level === "Normal" || level === "Low" ? "#A7F3D0" : level === "Mild" || level === "Moderate" ? "#FDBA74" : "#FCA5A5" }}>{level}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/15">
                          <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${severity}%`, backgroundColor: level === "Good" || level === "Normal" || level === "Low" ? "#10B981" : level === "Mild" || level === "Moderate" ? "#C86B3A" : "#EF4444" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Routine Protocol: Morning & Evening */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-xs mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#C86B3A]" />
              <h3 className="text-xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                Targeted daily skincare routine
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Morning */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-border/80">
                <div className="flex items-center gap-2 mb-2.5">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-foreground">Morning Protocol</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#008236] mt-1.5 shrink-0" />
                    <span><strong>Cleanse:</strong> Gentle low-foaming cleanser to balance sebum.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#008236] mt-1.5 shrink-0" />
                    <span><strong>Treat:</strong> Antioxidant active (Vitamin C / Niacinamide) to brighten dark spots.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#008236] mt-1.5 shrink-0" />
                    <span><strong>Protect:</strong> Broad-spectrum SPF 50+ to prevent UV-induced pigmentation.</span>
                  </li>
                </ul>
              </div>

              {/* Evening */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-border/80">
                <div className="flex items-center gap-2 mb-2.5">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-foreground">Evening Protocol</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C86B3A] mt-1.5 shrink-0" />
                    <span><strong>Purify:</strong> Thorough double cleanse to remove pollutants and sunscreen.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C86B3A] mt-1.5 shrink-0" />
                    <span><strong>Repair:</strong> Targeted corrective serum matching your primary concern.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C86B3A] mt-1.5 shrink-0" />
                    <span><strong>Lock:</strong> Ceramide barrier cream to support overnight epidermal recovery.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Matched Products from Connected Storefront */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs tracking-widest text-[#C86B3A] font-semibold uppercase mb-1 font-mono">Storefront Matching</p>
                <h3 className="text-2xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  {hasVendorBrand ? `${vendorDisplayName}'s matched catalogue` : "Recommended skincare treatments"}
                </h3>
              </div>
              {matchedProducts.length > 0 && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all shrink-0 cursor-pointer",
                    showFilters || activeFilters > 0 ? "border-[#008236] bg-[#008236]/10 text-[#008236]" : "border-border bg-card text-foreground hover:border-[#008236]/40"
                  )}
                >
                  <Search className="w-3.5 h-3.5" />
                  Filter
                  {activeFilters > 0 && (
                    <span className="bg-[#008236] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-mono ml-0.5">
                      {activeFilters}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Filter drawer if enabled */}
            {showFilters && (
              <div className="bg-card border border-border rounded-2xl p-4 mb-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">Filter catalogue</p>
                  {activeFilters > 0 && (
                    <button
                      onClick={() => setFilters({ country: "", state: "", city: "", vendor: "", category: "" })}
                      className="text-xs text-[#C86B3A] font-semibold hover:underline cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "vendor", label: "Vendor", options: vendorOptions },
                    { key: "category", label: "Category", options: categoryOptions },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block uppercase font-mono">{f.label}</label>
                      <select
                        value={filters[f.key as keyof typeof filters]}
                        onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })}
                        className="w-full bg-[#FAF7F2] border border-border rounded-xl px-2.5 py-2 text-xs text-foreground outline-none focus:border-[#008236]"
                      >
                        <option value="">All</option>
                        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products List or Fallback */}
            <div className="space-y-4">
              {filteredMatchedProducts.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                    <Droplets className="w-6 h-6 text-[#C86B3A]" />
                  </div>
                  <h4 className="text-base font-semibold text-foreground mb-1">Recommended Active Ingredients</h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4 leading-relaxed">
                    This connected storefront has no active product stock matching your exact condition profile. You can look for formulations containing these proven clinical ingredients:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                    {(ingredientFallback.length ? ingredientFallback : ["Niacinamide (5%)", "Azelaic Acid (10%)", "Ceramides NP", "Zinc PCA", "Hyaluronic Acid"]).map((ing) => (
                      <span key={ing} className="px-3 py-1 bg-[#008236]/10 text-[#008236] border border-[#008236]/20 rounded-full text-xs font-semibold">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                filteredMatchedProducts.map((rec, i) => (
                  <div key={rec.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300">
                    <button
                      className="w-full p-4.5 flex items-start gap-4 text-left hover:bg-secondary/25 transition-colors cursor-pointer"
                      onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                    >
                      {rec.photo ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-secondary border border-border">
                          <img src={rec.photo} alt={rec.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 bg-secondary border border-border text-muted-foreground">
                          <Store className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold bg-[#C86B3A]/10 text-[#C86B3A] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                            #{rec.rank} Match
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold font-mono">{rec.score}% match score</span>
                        </div>
                        <h4 className="font-semibold text-foreground text-sm leading-snug mb-0.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {rec.name}
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium">
                          {rec.brand} · <span className="text-[#008236] font-bold">{rec.price}</span>
                        </p>
                      </div>
                      {expandedCard === i ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />}
                    </button>

                    {expandedCard === i && (
                      <div className="border-t border-border">
                        <div className="p-4.5 bg-[#FAF7F2]/60 border-b border-border">
                          <p className="text-[11px] font-bold text-[#C86B3A] uppercase tracking-wider mb-1 font-mono">Dermatological rationale</p>
                          <p className="text-xs text-foreground leading-relaxed">
                            {rec.matchReasons.length > 0
                              ? rec.matchReasons.join(". ")
                              : `${rec.name} aligns with your reported skin profile and target condition.`}
                          </p>
                        </div>

                        {rec.ingredients.length > 0 && (
                          <div className="p-4 border-b border-border">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 font-mono">Active Ingredients</p>
                            <div className="flex flex-wrap gap-1.5">
                              {rec.ingredients.map((ing) => (
                                <span key={ing} className="text-[11px] bg-[#008236]/10 text-[#008236] px-2.5 py-0.5 rounded-full font-medium">
                                  {ing}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="p-4 bg-[#FAF7F2] flex items-center justify-between gap-3">
                          <div className="text-xs text-muted-foreground">
                            Sold by <strong className="text-foreground">{rec.vendorName}</strong>
                          </div>
                          {rec.whatsappUrl ? (
                            <a
                              href={rec.whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20BB5A] text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Order via WhatsApp
                            </a>
                          ) : (
                            <button
                              disabled
                              className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold cursor-not-allowed"
                            >
                              Direct order unavailable
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Clinical Disclaimer */}
          <div className="flex items-start gap-2.5 p-4 bg-secondary/40 border border-border rounded-2xl mb-8">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              This report is a cosmetic and lifestyle dermatological recommendation powered by Anovra AI. It does not replace in-person medical diagnosis by a registered physician or dermatologist.
            </p>
          </div>

          {/* Reset / Start New Consultation */}
          <button
            onClick={resetFlow}
            className="w-full py-4 border-2 border-[#C86B3A] text-[#C86B3A] hover:bg-[#C86B3A]/8 rounded-2xl font-bold text-sm transition-all cursor-pointer shadow-xs active:scale-[0.99]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Start a new skin analysis
          </button>
        </div>
      )}
    </div>
  );
}
