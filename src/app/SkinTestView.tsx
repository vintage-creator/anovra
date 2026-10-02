import { useState, useEffect, useRef } from "react";
import {
  Camera, Upload, Shield, ChevronDown, ChevronUp, ChevronRight,
  CheckCircle, ArrowRight, MessageCircle, Zap, Globe, Lock,
  Scan, Activity, X, Check, Info, Store, Search, Star, AlertTriangle,
  ScanFace, Badge, Bone, Hand, Footprints, PersonStanding, ScanSearch, Smile,
  Droplets, Heart, RefreshCw, Eye, Download, ClipboardList
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

type ScanFinding = { name: string; percentage: number; level: SeverityLevel; confidence: number };
type TreatmentAdvice = {
  name: string; what_to_do: string; why: string; frequency: string; timeline: string;
  avoid: string[]; see_a_dermatologist_if: string;
  ingredient_targets: { ingredient: string; concentration: string; note: string }[];
};
type ApiCapture = {
  confidence?: number; threshold?: number; frames_used?: number; frames_received?: number;
  lighting?: { brightness?: number; glare_pct?: number; verdict?: string };
};

const captureGuidance = (reason: { message: string; guidance: string }, area: string) => {
  if (/does not look like the area|area you selected/i.test(reason.message)) {
    return {
      title: "The photo may not show the selected skin area",
      detail: `Take a clear photo of your ${area.toLowerCase()}, or choose the area shown in your photo.`,
    };
  }
  if (/edited|retouched|filter/i.test(reason.message)) {
    return {
      title: "Use an original, unfiltered photo",
      detail: "Filters and retouching can hide skin details. Take a new photo here or upload the original.",
    };
  }
  return { title: reason.message, detail: reason.guidance };
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
  return queryMatch?.[1] || hashSlug || "";
};

type MatchedProduct = {
  id: string;
  rank: number;
  score: number;
  name: string;
  brand: string;
  price: string;
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
  vendorSlug: string;
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
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [filterAttested, setFilterAttested] = useState(false);

  // Questionnaire state
  const [questionnaire, setQuestionnaire] = useState({
    skinFeel: "",
    mainConcern: "",
    ageRange: "",
    sensitivities: "",
    pregnantOrBreastfeeding: false,
  });

  // Staged Analysis Progress
  const [analysisPhase, setAnalysisPhase] = useState(1);
  const [analysisElapsed, setAnalysisElapsed] = useState(0);
  const [rejectionDetail, setRejectionDetail] = useState<{ reasons: { message: string; guidance: string }[]; capture?: ApiCapture } | null>(null);

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
    conditions?: ScanFinding[];
    capture?: ApiCapture;
    skinType?: string;
    treatmentPlan?: TreatmentAdvice[];
    findingConfidence?: number | null;
    productsWithheld?: boolean;
    clinicalReferralAdvised?: boolean;
    providersResponding?: number;
    disclaimer?: string;
  } | null>(null);
  const [analyzingError, setAnalyzingError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraStartingRef = useRef(false);
  const autoCameraAttemptedRef = useRef(false);
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
    if (cameraStartingRef.current || streamRef.current) return;
    cameraStartingRef.current = true;
    setCameraError("");
    setCameraStarting(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is unavailable here. Try a secure connection or upload a photo.");
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: selectedArea === "Face" ? "user" : "environment",
            width: { ideal: 1280 },
            height: { ideal: 1600 },
          },
          audio: false,
        });
      } catch (error) {
        if (!(error instanceof DOMException) || !["NotFoundError", "OverconstrainedError"].includes(error.name)) throw error;
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
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
    } catch (err: unknown) {
      stopCamera();
      const name = err instanceof DOMException ? err.name : "";
      const message = name === "NotFoundError" || name === "OverconstrainedError"
        ? "No camera was found on this device. Connect a camera or upload a photo instead."
        : name === "NotAllowedError" || name === "SecurityError"
          ? "Camera access was blocked. Allow access in your browser settings or upload a photo."
          : name === "NotReadableError" || name === "AbortError"
            ? "The camera is in use by another app. Close it there and try again, or upload a photo."
            : err instanceof Error && err.message.startsWith("Camera access is unavailable")
              ? err.message
              : "Could not start the camera. Please try again or upload a photo.";
      setCameraError(message);
    } finally {
      cameraStartingRef.current = false;
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
    if (step !== 2) {
      autoCameraAttemptedRef.current = false;
      stopCamera();
    } else if (imageBase64) {
      autoCameraAttemptedRef.current = false;
    } else if (!autoCameraAttemptedRef.current) {
      autoCameraAttemptedRef.current = true;
      void startCamera();
    }
    return () => {
      if (step !== 2) stopCamera();
    };
  }, [step, imageBase64]);

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

  const visibleSeverity = scanResult?.conditions || [];
  const findingConfidence = scanResult?.findingConfidence;
  const productsWithheld = Boolean(scanResult?.productsWithheld || findingConfidence == null || findingConfidence < 65);

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
              ...(questionnaire.pregnantOrBreastfeeding ? { pregnantOrBreastfeeding: true } : {}),
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
          setRejectionDetail({
            reasons: (resultData.rejectReasons || []).map((item: { message?: string; guidance?: string }) => ({
              message: item.message || "The image could not be assessed.",
              guidance: item.guidance || "Retake the photo in even light with the area fully visible.",
            })),
            capture: resultData.capture,
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

        setMatchedProducts((!resultData.productsWithheld && Array.isArray(resultData.products) ? resultData.products : []).filter((match: any) =>
          typeof match.score === "number" && Number.isFinite(match.score)
        ).map((match: any, index: number) => {
          const product = productById.get(match.id);
          const description = String(product?.description || "");
          const images = parseJsonMeta<string[]>(description, "IMAGES", []);
          return {
            id: match.id,
            rank: Number(match.rank || index + 1),
            score: match.score,
            name: match.name,
            brand: match.brand || product?.brand || vendorDisplayName || "",
            price: Number.isFinite(Number(match.price ?? product?.price))
              ? `₦${Number(match.price ?? product?.price).toLocaleString()}` : "Price on request",
            photo: match.image_url || product?.image_url || images[0] || "",
            images,
            category: product?.category || "Skincare",
            description: cleanProductDescription(description) || String(match.why || ""),
            benefits: Array.isArray(match.benefits) ? match.benefits : [],
            usageInstructions: match.how_to_use || "",
            precautions: Array.isArray(match.warnings) ? match.warnings.join(" ") : String(match.warnings || ""),
            skinTypes: parseJsonMeta<string[]>(description, "SKINTYPES", []),
            ingredients: [
              ...parseJsonMeta<string[]>(description, "KEY_INGREDIENTS", []),
              ...parseJsonMeta<string[]>(description, "ACTIVE_INGREDIENTS", []),
            ],
            matchReasons: match.why ? [match.why] : [],
            vendorName: match.vendor_name || vendorDisplayName || "Anovra partner",
            vendorSlug: match.vendor_slug || activeScanSlug,
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
              matched_products: !resultData.productsWithheld && Array.isArray(resultData.products) ? resultData.products : [],
              ingredient_fallback: resultData.ingredientFallback || [],
              treatment_plan: resultData.treatmentPlan || [],
              skin_area: selectedArea || "Face",
              image_quality: {
                brightness: captureQuality.brightness,
                sharpness: captureQuality.sharpness,
                guided_capture: Boolean(selectedFile?.name?.startsWith("skin-scan-")),
                api_capture: resultData.capture || null,
                finding_confidence: resultData.findingConfidence ?? null,
                conditions: resultData.conditions || [],
                products_withheld: Boolean(resultData.productsWithheld),
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
                link: `${window.location.origin}/#/userdashboard`,
              });
            }
          } catch (dbErr) {
            console.warn("Could not insert scan into database history:", dbErr);
          }
        }

        // Show the cosmetic report and catalogue matches.
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

  async function downloadReport() {
    if (!scanResult || downloadingReport) return;
    setDownloadingReport(true);
    try {
      const { downloadSkinReportPdf } = await import("./utils/skinReportPdf");
      await downloadSkinReportPdf({
        area: selectedArea,
        scanId,
        skinType: scanResult.skinType,
        confidence: scanResult.findingConfidence,
        capture: scanResult.capture,
        findings: scanResult.conditions || [],
        treatment: scanResult.treatmentPlan || [],
        ingredients: ingredientFallback,
        products: matchedProducts,
        productsWithheld,
        disclaimer: scanResult.disclaimer || "This is a cosmetic skin assessment, not a medical diagnosis. For persistent acne, unusual skin changes, or anything painful or distressing, see a registered dermatologist.",
      });
    } catch (error) {
      console.error("Could not create skin report PDF:", error);
      toast.error("Could not download the report. Please try again.");
    } finally {
      setDownloadingReport(false);
    }
  }

  const STEP_LABELS = ["Skin area", "Capture", "Intake", "AI analysis", "Skin report"];

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
                  {currentUserRole === "brand" ? "Customer scan preview" : hasVendorBrand ? "Powered by Anovra" : "Skin analysis"}
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
                ? `${vendorDisplayName} uses Anovra's AI to assess visible skin features and match approved catalogue products.`
                : "Choose a visible skin area for a cosmetic assessment."}
            </p>
            {hasVendorBrand && currentUserRole === "guest" && (
              <p className="mt-2 text-xs text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                You can scan as a guest. Your report will appear here, but it will not be saved to an account.
              </p>
            )}
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
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
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
              <div className="flex items-start gap-3 rounded-lg border border-[#cfe7d6] bg-[#f1faf3] p-4" role="status">
                <CheckCircle className="w-5 h-5 shrink-0 text-[#008236]" />
                <div><p className="text-sm font-semibold text-[#07532e]">Photo captured</p><p className="text-xs text-[#3e5d49] mt-1">We will confirm image quality before analysing. If the photo is unsuitable, you will see what to adjust and can retake it.</p></div>
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
                    Natural light and authentic skin texture help the analysis assess visible features more reliably.
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
                  "relative w-full aspect-[4/5] sm:aspect-[4/3] max-h-[68dvh] rounded-2xl overflow-hidden mb-4 border-2 shadow-lg transition-colors",
                  cameraActive ? "border-[#008236]/70 bg-black" : "border-border/80 bg-[#101614]"
                )}
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
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#008236]/20 to-transparent" />
                    <div className="absolute left-10 right-10 top-1/2 h-px bg-[#008236]/70 shadow-[0_0_18px_rgba(0,130,54,0.8)] animate-scan" />
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

              {!cameraActive && (
                <div className={cn("mb-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm", cameraError ? "border border-red-200 bg-red-50 text-red-800" : "bg-muted/60 text-muted-foreground")} role="status">
                  {cameraError ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> : <Camera className="w-4 h-4 shrink-0 mt-0.5" />}
                  <p>{cameraError || (cameraStarting ? "Connecting to your camera…" : "Position the selected skin area inside the guide, or upload a photo below.")}</p>
                </div>
              )}

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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
                          Try camera again
                        </>
                      )}
                    </button>
                )}
                <button
                  onClick={triggerFileSelect}
                  className="flex items-center justify-center gap-2 bg-card border-2 border-[#C86B3A] text-[#C86B3A] hover:bg-[#C86B3A]/8 font-bold py-4 rounded-xl transition-colors text-sm cursor-pointer active:scale-[0.98]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <Upload className="w-4 h-4" />
                  Upload photo
                </button>
              </div>
            </>
          )}

          <div className="flex items-start gap-2.5 p-3.5 bg-secondary/50 rounded-lg">
            <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              We use your photo to check the image and analyse your skin. The photo is not saved to your customer profile. Your results are saved to your account and, if you use a shop's test link, can be viewed by that shop.
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
              Skin and sensitivity details
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Your answers help personalise the analysis and flag ingredient sensitivities.
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
              disabled={!questionnaire.skinFeel || !questionnaire.mainConcern || !questionnaire.ageRange}
              className="flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006c2c] text-white py-4 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="max-w-xl mx-auto px-4 py-8 sm:py-16 text-center">
          {/* Quality Rejection Screen */}
          {rejectionDetail ? (
            <section className="bg-card border border-amber-200 rounded-lg p-4 sm:p-7 shadow-sm text-left" role="status" aria-labelledby="capture-rejected-title">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 shrink-0 rounded-lg bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase text-amber-700 font-semibold mb-1">Photo check</p>
                  <h3 id="capture-rejected-title" className="text-xl sm:text-2xl font-light text-foreground leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                    Please try another photo
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-5">Your skin analysis has not started. Fix the issues below, then take or upload a new photo.</p>
              {rejectionDetail.capture?.confidence != null && (
                <div className="mb-5 rounded-lg border border-border bg-muted/40 p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                    <span className="font-semibold text-foreground">Photo check confidence</span>
                    <span className="font-medium text-amber-800">{Math.round(rejectionDetail.capture.confidence)}%{rejectionDetail.capture.threshold != null ? ` · ${Math.round(rejectionDetail.capture.threshold)}% needed` : ""}</span>
                  </div>
                  {rejectionDetail.capture.threshold != null && (
                    <div className="h-1.5 mt-2 rounded-full bg-amber-100 overflow-hidden" aria-hidden="true">
                      <div className="h-full bg-amber-600 rounded-full" style={{ width: `${Math.max(0, Math.min(100, rejectionDetail.capture.confidence))}%` }} />
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2 mb-6">
                {(rejectionDetail.reasons.length ? rejectionDetail.reasons : [{ message: "The skin area was not clear enough.", guidance: "Retake the photo in even light with the whole area visible." }]).map((reason, index) => (
                  <div key={index} className="p-3 sm:p-4 bg-amber-50/60 border border-amber-200 rounded-lg">
                    <p className="text-sm font-semibold text-foreground">{captureGuidance(reason, selectedArea).title}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{captureGuidance(reason, selectedArea).detail}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setRejectionDetail(null);
                    setImageBase64(null);
                    setSelectedFile(null);
                    setStep(2);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#008236] hover:bg-[#006c2c] text-white py-3.5 rounded-lg font-bold text-sm transition-colors cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <Camera className="w-4 h-4" />
                  Retake photo
                </button>
                <button
                  onClick={() => {
                    setRejectionDetail(null);
                    setImageBase64(null);
                    setSelectedFile(null);
                    setStep(1);
                  }}
                  className="w-full py-3.5 rounded-lg border border-border text-foreground hover:bg-secondary font-semibold text-sm transition-colors cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Change skin area
                </button>
              </div>
              <button onClick={resetFlow} className="mt-4 text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4">Start over</button>
            </section>
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
                Skin analysis in progress
              </p>
              <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
                Analysing your {selectedArea.toLowerCase()}…
              </h2>

              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
                Checking photo quality, reviewing visible skin features and preparing your cosmetic report.
              </p>

              {/* Progress Milestones */}
              <div className="space-y-3 max-w-md mx-auto text-left bg-[#FAF7F2] p-4.5 rounded-2xl border border-border mb-6">
                {[
                  { phase: 1, label: "Checking the photo", done: analysisPhase > 1, active: analysisPhase === 1 },
                  { phase: 2, label: "Reviewing visible skin features", done: analysisPhase > 2, active: analysisPhase === 2 },
                  { phase: 3, label: "Preparing guidance", done: analysisPhase > 3, active: analysisPhase === 3 },
                  { phase: 4, label: "Checking catalogue matches", done: false, active: analysisPhase === 4 },
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
                <span>Elapsed time: {analysisElapsed}s · please keep this page open</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- STEP 5: Skin report and product matches ---- */}
      {step === 5 && (
        <div className="scan-report max-w-3xl mx-auto px-4 py-8">
          <style>{`@media print { body * { visibility: hidden !important; } body .scan-report, body .scan-report * { visibility: visible !important; } .scan-report { position: absolute; left: 0; top: 0; width: 100%; max-width: none; color: #1c3125; } .scan-report .print-hide { display: none !important; } .scan-report article, .scan-report section { break-inside: avoid; } }`}</style>
          <div className="bg-[#07532e] text-white rounded-lg p-6 sm:p-8 mb-5 border border-[#07532e]">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs text-white/60 mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
                  COSMETIC SKIN ASSESSMENT{scanId ? ` · ID ${scanId}` : ""}
                </p>
                <h2 className="text-3xl font-light mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
                  Your personalised skin report
                </h2>
                <p className="text-sm text-white/80" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Area assessed: <span className="text-white font-bold">{selectedArea}</span>
                </p>
              </div>

              {scanResult?.capture?.confidence != null && <div className="shrink-0 text-right"><strong className="text-2xl">{Math.round(scanResult.capture.confidence)}%</strong><p className="text-xs text-white/75">Photo quality</p></div>}
            </div>

            {/* Badges: Skin Type & Primary Condition */}
            <div className="flex flex-wrap gap-3 mb-6">
              {[
                { label: "Skin type", value: scanResult?.skinType || "Not determined" },
                { label: "Main visible concern", value: scanResult?.concern || "No concern identified" },
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
                Visible findings
              </p>
              {visibleSeverity.length === 0 ? (
                <p className="text-sm text-white/80">No visible concerns were returned by the analysis.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3.5">
                  {visibleSeverity.map((c) => {
                    const level = c.level;
                    const severity = Math.max(0, Math.min(100, c.percentage));
                    return (
                      <div key={c.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-white/90" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{c.name}</span>
                          <span className="text-xs font-bold font-mono text-white">{Math.round(severity)}% · {level}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/15">
                          <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${severity}%`, backgroundColor: level === "Low" ? "#86efac" : level === "Mild" ? "#fcd34d" : "#fdba74" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="mt-4 text-xs text-white/70">Percentages describe estimated visible severity, not a diagnosis. Finding confidence: {findingConfidence == null ? "unavailable" : `${Math.round(findingConfidence)}% average`} {scanResult?.providersResponding ? `· ${scanResult.providersResponding} AI responses` : ""}.</p>
            </div>
          </div>

          {scanResult?.capture && <section className="border border-border bg-white rounded-lg p-5 sm:p-6 mb-6" aria-label="Capture quality">
            <div className="flex items-center gap-2 mb-3"><CheckCircle className="w-5 h-5 text-[#008236]" /><h3 className="font-semibold text-foreground">Photo accepted</h3></div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {scanResult.capture.confidence != null && <span>Capture confidence <strong className="text-foreground">{Math.round(scanResult.capture.confidence)}%</strong>{scanResult.capture.threshold != null && ` · threshold ${Math.round(scanResult.capture.threshold)}%`}</span>}
              {scanResult.capture.lighting?.brightness != null && <span>Brightness {Math.round(scanResult.capture.lighting.brightness)}</span>}
              {scanResult.capture.lighting?.glare_pct != null && <span>Glare {Math.round(scanResult.capture.lighting.glare_pct)}%</span>}
              {scanResult.capture.lighting?.verdict && <span>Lighting {scanResult.capture.lighting.verdict}</span>}
              {scanResult.capture.frames_used != null && <span>{scanResult.capture.frames_used} of {scanResult.capture.frames_received ?? scanResult.capture.frames_used} frames used</span>}
            </div>
          </section>}

          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4"><ClipboardList className="w-5 h-5 text-[#94613f]" /><h3 className="text-xl text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>Care guidance for your findings</h3></div>
            {scanResult?.treatmentPlan?.length ? <div className="grid gap-3">{scanResult.treatmentPlan.map((plan) => <article key={plan.name} className="border border-border bg-white rounded-lg p-5">
              <h4 className="font-semibold text-foreground mb-2">{plan.name}</h4>
              <p className="text-sm text-foreground">{plan.what_to_do}</p>
              {plan.why && <p className="text-sm text-muted-foreground mt-2">{plan.why}</p>}
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-muted-foreground">{plan.frequency && <span><strong>How often:</strong> {plan.frequency}</span>}{plan.timeline && <span><strong>Expected timeframe:</strong> {plan.timeline}</span>}</div>
              {plan.ingredient_targets?.length > 0 && <div className="mt-3"><p className="text-xs font-semibold text-foreground mb-1">Ingredients to discuss or look for</p><div className="flex flex-wrap gap-2">{plan.ingredient_targets.map((target) => <span key={`${target.ingredient}-${target.concentration}`} title={target.note || undefined} className="px-2.5 py-1 text-xs rounded-md bg-[#edf7ef] text-[#07532e]">{target.ingredient}{target.concentration ? ` · ${target.concentration}` : ""}</span>)}</div></div>}
              {plan.avoid?.length > 0 && <p className="text-xs text-muted-foreground mt-3"><strong>Avoid:</strong> {plan.avoid.join("; ")}</p>}
              {plan.see_a_dermatologist_if && <p className="text-xs text-[#8a452b] mt-2"><strong>See a dermatologist if:</strong> {plan.see_a_dermatologist_if}</p>}
            </article>)}</div> : <p className="text-sm text-muted-foreground">The analysis did not return a care plan for this photo.</p>}
          </section>

          {/* Matched Products from Connected Storefront */}
          <div className="mb-8">
            {productsWithheld && <div className="border-l-4 border-[#ad623a] bg-[#fff8f2] p-5 mb-5 rounded-r-lg">
              <h3 className="font-semibold text-foreground">Product matches are paused</h3>
              <p className="text-sm text-muted-foreground mt-1">{scanResult?.clinicalReferralAdvised ? "This result needs professional review." : "The average confidence in the visible findings is below 65%, or was not supplied."} You can read the assessment, retake your photo, or consult a licensed dermatologist for a closer assessment. We have not recommended products from partner catalogues for this scan.</p>
            </div>}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs tracking-widest text-[#C86B3A] font-semibold uppercase mb-1 font-mono">Storefront Matching</p>
                <h3 className="text-2xl font-light text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  {hasVendorBrand ? `${vendorDisplayName}'s matched catalogue` : "Matched partner products"}
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
              {productsWithheld ? null : filteredMatchedProducts.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                    <Droplets className="w-6 h-6 text-[#C86B3A]" />
                  </div>
                  <h4 className="text-base font-semibold text-foreground mb-1">What to look for</h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4 leading-relaxed">
                    No approved catalogue product matched this report. These ingredient targets came from the analysis; check suitability with a qualified professional before buying.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                    {ingredientFallback.map((ing) => (
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
                        {rec.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{rec.description}</p>}
                      </div>
                      {expandedCard === i ? <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />}
                    </button>

                    {expandedCard === i && (
                      <div className="border-t border-border">
                        <div className="p-4.5 bg-[#FAF7F2]/60 border-b border-border">
                          <p className="text-[11px] font-bold text-[#C86B3A] uppercase tracking-wider mb-1 font-mono">Why it matched</p>
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
                          {rec.vendorSlug ? (
                            <a href={`#/shop/${encodeURIComponent(rec.vendorSlug)}?product=${encodeURIComponent(rec.id)}`} className="inline-flex items-center gap-2 bg-[#008236] hover:bg-[#006c2c] text-white px-4 py-2.5 rounded-lg font-bold text-xs transition-colors">
                              View product <ArrowRight className="w-4 h-4" />
                            </a>
                          ) : rec.whatsappUrl ? (
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
              {scanResult?.disclaimer || "This is a cosmetic skin assessment, not a medical diagnosis. For persistent acne, unusual skin changes, or anything painful or distressing, see a registered dermatologist."}
            </p>
          </div>

          <div className="print-hide border-t border-border pt-5">
            <p className="text-sm text-muted-foreground mb-3">Need a clearer photo, or want to assess a different area?</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { analysisStartedRef.current = false; setImageBase64(null); setSelectedFile(null); setScanResult(null); setMatchedProducts([]); setStep(2); }} className="inline-flex items-center gap-2 px-4 py-3 border border-border rounded-lg font-semibold text-sm hover:bg-secondary"><Camera className="w-4 h-4" />Retake photo</button>
              <button onClick={resetFlow} className="inline-flex items-center gap-2 px-4 py-3 border border-border rounded-lg font-semibold text-sm hover:bg-secondary"><RefreshCw className="w-4 h-4" />Start over</button>
              <button onClick={downloadReport} disabled={downloadingReport} className="inline-flex items-center gap-2 px-4 py-3 bg-[#008236] text-white rounded-lg font-semibold text-sm hover:bg-[#006c2c] disabled:opacity-60"><Download className="w-4 h-4" />{downloadingReport ? "Preparing PDF…" : "Download PDF"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
