import { useState, useRef, useEffect } from "react";
import { Eye, Check, CheckCircle, AlertCircle, Globe, Upload, ChevronDown, Scan, User, Store, ShieldCheck } from "lucide-react";
import type { View } from "./types";
import { toast } from "sonner";
import { supabase } from "./utils/supabase";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Lowercase letter", pass: /[a-z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special character (!@#$…)", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const levels = ["", "Weak", "Fair", "Good", "Strong", "Very strong"];
  const colors = ["", "bg-red-400", "bg-orange-400", "bg-amber-400", "bg-green-400", "bg-green-600"];
  const textColors = ["", "text-red-600", "text-orange-600", "text-amber-600", "text-green-600", "text-green-700"];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-muted"}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score]}`} style={{ fontFamily: "'DM Mono', monospace" }}>
        {levels[score]}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${c.pass ? "bg-green-500" : "bg-muted"}`}>
              {c.pass && <Check className="w-2 h-2 text-white" />}
            </div>
            <span className={`text-xs ${c.pass ? "text-foreground" : "text-muted-foreground"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CACVerifier({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <input
        className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] focus:ring-1 focus:ring-[#008236]/30 transition-all"
        placeholder="e.g. RC-123456 or BN-112233"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      />
    </div>
  );
}


function isSocialUrl(url: string): boolean {
  if (!url) return true;
  let testUrl = url.trim();
  if (!/^https?:\/\//i.test(testUrl)) {
    testUrl = "https://" + testUrl;
  }
  try {
    const u = new URL(testUrl);
    return u.hostname.length > 3 && u.hostname.includes(".");
  } catch {
    return false;
  }
}

export function SignUpView({ setView }: { setView: (v: View) => void }) {
  const [selectedRole, setSelectedRole] = useState<"customer" | "vendor">("customer");
  
  // Vendor state
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    cac: "",
    businessName: "",
    cacDoc: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [cacDocFile, setCacDocFile] = useState<File | null>(null);

  const [socialAccounts, setSocialAccounts] = useState<
    { platform: string; url: string }[]
  >([{ platform: "Instagram", url: "" }]);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPopupModal, setShowPopupModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const addSocialAccount = () => {
    setSocialAccounts((prev) => [...prev, { platform: "Instagram", url: "" }]);
  };

  const updateSocialAccount = (index: number, key: "platform" | "url", val: string) => {
    setSocialAccounts((prev) =>
      prev.map((acc, i) => (i === index ? { ...acc, [key]: val } : acc))
    );
  };

  const removeSocialAccount = (index: number) => {
    if (socialAccounts.length <= 1) return;
    setSocialAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  const passwordsMatch = form.password === form.confirmPassword;
  const passwordScore = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[a-z]/.test(form.password),
    /\d/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ].filter(Boolean).length;

  const validSocialUrls = socialAccounts.every(
    (acc) => !acc.url || isSocialUrl(acc.url)
  );

  // Vendor Step Validations
  const step1Valid = form.fullName.trim().length >= 3 && form.email.includes("@") && form.whatsapp.length === 10;
  const isCacValid = form.cac.trim().length >= 5 && form.cac.trim().length <= 14;
  const step2Valid = isCacValid && form.businessName.trim().length >= 3 && form.cacDoc && socialAccounts[0].url.trim().length >= 3 && validSocialUrls;
  const step3Valid = passwordScore >= 4 && passwordsMatch;
  const canSubmitVendor = step1Valid && step2Valid && step3Valid;

  // Customer Validations
  const isCustomerValid = 
    form.fullName.trim().length > 2 &&
    form.email.includes("@") &&
    passwordScore >= 3 &&
    passwordsMatch;

  const inputCls =
    "w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] focus:ring-1 focus:ring-[#008236]/30 transition-all";
  const labelCls =
    "block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider";

  const handleFormSubmit = async () => {
    if (selectedRole === "customer" && !isCustomerValid) return;
    if (selectedRole === "vendor" && !canSubmitVendor) return;

    setLoading(true);
    try {
      // 1. Upload CAC Document to Supabase Storage if vendor
      let documentUrl = "";
      if (selectedRole === "vendor" && cacDocFile) {
        try {
          const fileExt = cacDocFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const filePath = `${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from("vendor-documents")
            .upload(filePath, cacDocFile, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("vendor-documents")
              .getPublicUrl(filePath);
            documentUrl = publicUrl;
          } else {
            console.warn("Supabase Storage bucket upload failed, using filename fallback:", uploadError);
            documentUrl = cacDocFile.name;
          }
        } catch (storageErr) {
          console.warn("Storage upload exception, using filename fallback:", storageErr);
          documentUrl = cacDocFile.name;
        }
      }

      // 2. Sign up user via Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            role: selectedRole,
            cac_number: selectedRole === "vendor" ? form.cac : null,
            cac_document_url: selectedRole === "vendor" ? documentUrl : null,
            business_name: selectedRole === "vendor" ? form.businessName : null,
            phone: selectedRole === "vendor" ? "+234" + form.whatsapp : null,
            nafdac_number: selectedRole === "vendor" ? form.referralCode : null,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Registration failed: User details could not be generated.");

      // 3. Trigger onboarding email Edge Function for vendors
      if (selectedRole === "vendor") {
        try {
          await supabase.functions.invoke("send-onboarding-email", {
            body: { name: form.fullName, email: form.email },
          });
        } catch (emailErr) {
          console.warn("Failed to dispatch onboarding email:", emailErr);
        }
      }

      toast.success("Account created successfully!");
      setShowPopupModal(true);
    } catch (err: any) {
      toast.error(err.message || "Registration encountered an unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left side panel: Brand marketing (Hidden on mobile) */}
      <div className="hidden md:flex w-[40%] bg-[#008236] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent)] pointer-events-none" />
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("landing")}
            className="transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Anovra Home"
          >
            <img src="/logo.png" alt="Anovra Logo" className="h-16 w-auto object-contain brightness-0 invert" />
          </button>
        </div>

        {/* Dynamic Marketing Panel Text based on Selected Role */}
        <div className="my-auto space-y-8 pr-4">
          {selectedRole === "customer" ? (
            <>
              <h2 className="text-4xl font-light leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                Your personal skincare companion.
              </h2>
              <div className="space-y-6">
                {[
                  { title: "AI-Powered Skin Test", desc: "Scan your face to diagnose concerns, retrieve skin scores, and track changes." },
                  { title: "Specialist Recommendations", desc: "Get curated suggestions mapped specifically to your profile by licensed professionals." },
                  { title: "Routine Builder", desc: "Build healthy day and night skincare routines with helpful application tips." },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C86B3A] mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.title}</p>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-4xl font-light leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
                Empowering intelligent skincare businesses.
              </h2>
              <div className="space-y-6">
                {[
                  { title: "AI-Powered Skin Recommendations", desc: "Anovra's engine matches your catalog products to clients' skin profiles instantly." },
                  { title: "Verified Customer Trust", desc: "CAC registration validation ensures a secure, authenticated, and professional storefront." },
                  { title: "Direct WhatsApp Client Flow", desc: "Zero friction orders and questions landed directly in your sales channel inbox." },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C86B3A] mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-sm text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.title}</p>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="space-y-4">
          <div className="border-t border-white/20 pt-6">
            <p className="text-xs italic text-white/80 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              &ldquo;Anovra helps shoppers understand their skin and connects them with authentic skincare vendors who care.&rdquo;
            </p>
          </div>
          <p className="text-[10px] text-white/40 tracking-wider uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>
            Anovra Africa © 2026
          </p>
        </div>
      </div>

      {/* Right side panel: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#FAF7F2]/40 overflow-y-auto">
        <div className="max-w-md w-full py-8">
          {/* Header */}
          <div className="mb-8 text-center sm:text-left">
            <button
              onClick={() => setView("landing")}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <ChevronDown className="w-4 h-4 rotate-90" /> Back
            </button>
            
            <div className="md:hidden flex justify-center mb-4">
              <img src="/logo.png" alt="Anovra Logo" className="h-12 w-auto object-contain" />
            </div>

            <p className="text-xs tracking-[0.2em] uppercase text-[#C86B3A] font-bold mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
              Registration Portal
            </p>
            <h1 className="text-4xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              Create Account
            </h1>
            <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Already have an account?{" "}
              <button onClick={() => setView("signin")} className="text-[#008236] font-semibold underline underline-offset-2 hover:text-[#006c2c] cursor-pointer">
                Sign in
              </button>
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card border-2 border-border/80 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
            
            {/* Role Switcher Tabs */}
            <div className="bg-muted p-1 rounded-xl flex gap-1 mb-2">
              {[
                { id: "customer", label: "Customer", icon: User },
                { id: "vendor", label: "Vendor", icon: Store },
              ].map((role) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(role.id as any);
                      setError("");
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? "bg-[#008236] text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{role.label}</span>
                  </button>
                );
              })}
            </div>

            {/* CUSTOMER REGISTER FLOW */}
            {selectedRole === "customer" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input
                    className={inputCls}
                    placeholder="Your legal name"
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>

                <div>
                  <label className={labelCls}>Email Address *</label>
                  <input
                    className={inputCls}
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>

                <div>
                  <label className={labelCls}>Create Password *</label>
                  <div className="relative">
                    <input
                      className={inputCls}
                      type={showPass ? "text" : "password"}
                      placeholder="Enter password"
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </div>

                <div>
                  <label className={labelCls}>Confirm Password *</label>
                  <div className="relative">
                    <input
                      className={`${inputCls} ${
                        form.confirmPassword && !passwordsMatch ? "border-red-400" : ""
                      }`}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm password"
                      value={form.confirmPassword}
                      onChange={(e) => set("confirmPassword", e.target.value)}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  {form.confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>
                <button
                  onClick={handleFormSubmit}
                  disabled={!isCustomerValid || loading}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all mt-4 cursor-pointer flex items-center justify-center gap-1.5 ${
                    isCustomerValid && !loading
                      ? "bg-[#008236] text-white hover:bg-[#006c2c] shadow-md hover:shadow-lg"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-muted-foreground border-t-foreground rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    "Create Customer Account"
                  )}
                </button>
              </div>
            )}

            {/* VENDOR REGISTER FLOW (Multi-Step Wizard) */}
            {selectedRole === "vendor" && (
              <div className="space-y-6">
                {/* Multi-step progress indicator */}
                <div className="flex items-center gap-2 mb-2">
                  {[
                    { id: 1, label: "Profile" },
                    { id: 2, label: "Business" },
                    { id: 3, label: "Security" },
                  ].map((s) => (
                    <div key={s.id} className="flex-1 flex flex-col gap-1">
                      <div className={`h-1 rounded-full transition-all duration-300 ${s.id <= currentStep ? "bg-[#008236]" : "bg-muted"}`} />
                      <span className={`text-[9px] uppercase font-bold tracking-wider hidden sm:block ${s.id === currentStep ? "text-foreground font-semibold" : "text-muted-foreground"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>

                {currentStep === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div>
                      <label className={labelCls}>Full Name *</label>
                      <input
                        className={inputCls}
                        placeholder="Your full legal name"
                        value={form.fullName}
                        onChange={(e) => set("fullName", e.target.value)}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Email Address *</label>
                      <input
                        className={inputCls}
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => set("email", e.target.value)}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>WhatsApp Number *</label>
                      <div className="flex gap-2">
                        <div
                          className="flex items-center px-3.5 bg-[#FAF7F2] border border-border rounded-xl text-sm text-muted-foreground flex-shrink-0"
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        >
                          🇳🇬 +234
                        </div>
                        <input
                          className={inputCls}
                          placeholder="8012345678"
                          value={form.whatsapp}
                          onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, "").slice(0, 10))}
                          style={{ fontFamily: "'DM Mono', monospace" }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Used for customer inquiries and platform alerts.
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div>
                      <label className={labelCls}>CAC Registration Number *</label>
                      <CACVerifier value={form.cac} onChange={(v) => set("cac", v)} />
                      <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Must be between 5 and 14 characters.
                      </p>
                    </div>

                    <div>
                      <label className={labelCls}>Business / Company Name *</label>
                      <input
                        className={inputCls}
                        placeholder="e.g. Veraski Skincare"
                        value={form.businessName}
                        onChange={(e) => set("businessName", e.target.value)}
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      />
                      <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Minimum 3 characters.
                      </p>
                    </div>

                    <div>
                      <label className={labelCls}>CAC Certificate Upload *</label>
                      <label className="block cursor-pointer">
                        <div
                          className={`flex items-center gap-3 px-3.5 py-3 border-2 border-dashed rounded-xl transition-all ${
                            form.cacDoc
                              ? "border-[#008236] bg-[#008236]/5"
                              : "border-border hover:border-[#008236]/40 hover:bg-[#FAF7F2]/50"
                          }`}
                        >
                          <Upload className="w-4 h-4 text-[#008236] flex-shrink-0" />
                          <span className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {form.cacDoc ? (
                              <span className="text-[#008236] font-medium flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-[#008236]" /> {form.cacDoc}
                              </span>
                            ) : (
                              "Upload certificate file"
                            )}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("File size exceeds the 5MB limit.");
                                return;
                              }
                              set("cacDoc", file.name);
                              setCacDocFile(file);
                            }
                          }}
                        />
                      </label>
                      <p className="text-[10px] text-muted-foreground mt-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Supported formats: PDF, PNG, JPG, JPEG · Max file size: 5MB
                      </p>
                    </div>

                    <div>
                      <label className={labelCls}>Social Media Business Accounts *</label>
                      <div className="space-y-3">
                        {socialAccounts.map((acc, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <select
                              value={acc.platform}
                              onChange={(e) => updateSocialAccount(index, "platform", e.target.value)}
                              className="px-2.5 py-2.5 bg-[#FAF7F2] border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:border-[#008236] w-28 shrink-0 cursor-pointer"
                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                              <option value="Instagram">Instagram</option>
                              <option value="Facebook">Facebook</option>
                              <option value="TikTok">TikTok</option>
                              <option value="Twitter">Twitter / X</option>
                              <option value="Website">Website</option>
                            </select>

                            <div className="relative flex-1">
                              <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                              <input
                                className={`${inputCls} pl-8`}
                                placeholder="Link to profile"
                                value={acc.url}
                                onChange={(e) => updateSocialAccount(index, "url", e.target.value)}
                              />
                            </div>

                            {socialAccounts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSocialAccount(index)}
                                className="p-1 text-muted-foreground hover:text-red-500 transition-colors text-lg font-bold"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={addSocialAccount}
                        className="text-xs text-[#008236] font-semibold hover:text-[#006c2c] flex items-center gap-1 mt-2 cursor-pointer"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        + Add another channel
                      </button>
                    </div>

                    <div className="pt-2 border-t border-border/60">
                      <label className={labelCls}>Referral Code <span className="text-muted-foreground font-normal">(Optional)</span></label>
                      <input
                        className={inputCls}
                        placeholder="e.g. SLG-1234"
                        value={form.referralCode}
                        onChange={(e) => set("referralCode", e.target.value)}
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      />
                      <p className="text-xs text-muted-foreground mt-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Enter the referral code of the sales partner who brought you in.
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div>
                      <label className={labelCls}>Create Password *</label>
                      <div className="relative">
                        <input
                          className={inputCls}
                          type={showPass ? "text" : "password"}
                          placeholder="Create strong password"
                          value={form.password}
                          onChange={(e) => set("password", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                      <PasswordStrength password={form.password} />
                    </div>

                    <div>
                      <label className={labelCls}>Confirm Password *</label>
                      <div className="relative">
                        <input
                          className={`${inputCls} ${form.confirmPassword && !passwordsMatch ? "border-red-400" : ""}`}
                          type={showConfirm ? "text" : "password"}
                          placeholder="Confirm password"
                          value={form.confirmPassword}
                          onChange={(e) => set("confirmPassword", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                      {form.confirmPassword && !passwordsMatch && (
                        <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Wizard Controls */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((c) => c - 1)}
                      className="flex-1 py-3 border-2 border-[#C86B3A] text-[#C86B3A] hover:bg-[#C86B3A]/5 rounded-xl font-bold text-sm transition-colors cursor-pointer text-center"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Back
                    </button>
                  )}
                  
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((c) => c + 1)}
                      disabled={currentStep === 1 ? !step1Valid : !step2Valid}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer text-center ${
                        (currentStep === 1 ? step1Valid : step2Valid)
                          ? "bg-[#008236] text-white hover:bg-[#006c2c] shadow-sm hover:shadow"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      onClick={handleFormSubmit}
                      disabled={!canSubmitVendor || loading}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                        canSubmitVendor && !loading
                          ? "bg-[#008236] text-white hover:bg-[#006c2c] shadow-md hover:shadow-lg"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {loading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        "Submit Vendor Application"
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            <p className="text-[11px] text-center text-muted-foreground leading-relaxed mt-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              By registering, you agree to Anovra&apos;s{" "}
              <a
                href="#/terms"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Terms of Service: All accounts undergo CAC verification. Credentials must be kept secure, and product catalogs must meet platform purity rules.");
                }}
                className="underline text-foreground hover:text-[#008236] transition-colors"
              >
                terms
              </a>{" "}
              and{" "}
              <a
                href="#/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Privacy Policy: Skin scan data is encrypted and private-by-default. Photos are strictly used to run diagnostics and are never displayed publicly.");
                }}
                className="underline text-foreground hover:text-[#008236] transition-colors"
              >
                privacy policies
              </a>
              . Accounts are fully verified after detail check processes.
            </p>
          </div>
        </div>
      </div>

      {/* Success Popup Modal */}
      {showPopupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl max-w-md w-full p-6 sm:p-8 text-center border-2 border-border shadow-2xl relative">
            <div className="w-16 h-16 rounded-full bg-[#008236]/15 border border-[#008236]/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#008236]" />
            </div>
            
            {selectedRole === "customer" ? (
              <>
                <h3 className="text-2xl font-light text-foreground mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
                  Account Created Successfully!
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Welcome to Anovra! You can now start scanning your skin, tracking ingredients, and creating routines.
                </p>
                <button
                  onClick={() => {
                    setShowPopupModal(false);
                    setView("userdashboard");
                  }}
                  className="w-full py-3.5 rounded-xl bg-[#008236] text-white font-bold text-sm hover:bg-[#006c2c] transition-colors shadow-md cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Enter Portal
                </button>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-light text-foreground mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
                  Vendor Application Submitted!
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Our team will verify your business CAC certificate details within 3-5 working days. You can explore your dashboard workspace right away.
                </p>
                <button
                  onClick={() => {
                    setShowPopupModal(false);
                    setView("dashboard");
                  }}
                  className="w-full py-3.5 rounded-xl bg-[#008236] text-white font-bold text-sm hover:bg-[#006c2c] transition-colors shadow-md cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Enter Workspace
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SignInView({ setView }: { setView: (v: View) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Email OTP states
  const [useOtp, setUseOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = async () => {
    if (!email) { setError("Please enter your email address."); return; }
    setError("");
    setLoading(true);
    try {
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false,
        }
      });
      if (otpErr) throw otpErr;
      setOtpSent(true);
      toast.success("Verification code dispatched to your inbox!");
    } catch (err: any) {
      let friendlyMsg = err.message || "Failed to send verification code.";
      if (friendlyMsg.toLowerCase().includes("signups not allowed for otp")) {
        friendlyMsg = "No account associated with this email. Please register first.";
      }
      setError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) { setError("Please enter the 6-digit verification code."); return; }
    setError("");
    setLoading(true);
    try {
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otpCode,
        type: "email"
      });

      if (verifyErr) throw verifyErr;
      if (!data.user) throw new Error("Verification failed: User profile not resolved.");

      const userRole = data.user.user_metadata?.role;
      const cleanEmail = email.trim().toLowerCase();

      if (cleanEmail === "admin@anovra.africa") {
        setView("admin");
      } else if (userRole === "vendor") {
        setView("dashboard");
      } else if (userRole === "customer") {
        setView("userdashboard");
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("business_name")
          .eq("id", data.user.id)
          .single();

        if (profile?.business_name) {
          setView("dashboard");
        } else {
          setView("userdashboard");
        }
      }
      toast.success("Signed in successfully via OTP!");
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
      toast.error(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (useOtp) {
      if (otpSent) {
        await handleVerifyOtp();
      } else {
        await handleSendOtp();
      }
      return;
    }

    if (!email || !password) { setError("Please enter your email and password."); return; }
    setError("");
    setLoading(true);
    
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authErr) throw authErr;
      if (!data.user) throw new Error("Authentication failed: User profile not resolved.");

      const userRole = data.user.user_metadata?.role;
      const cleanEmail = email.trim().toLowerCase();

      if (cleanEmail === "admin@anovra.africa") {
        setView("admin");
      } else if (userRole === "vendor") {
        setView("dashboard");
      } else if (userRole === "customer") {
        setView("userdashboard");
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("business_name")
          .eq("id", data.user.id)
          .single();

        if (profile?.business_name) {
          setView("dashboard");
        } else {
          setView("userdashboard");
        }
      }
      toast.success("Signed in successfully!");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your details.");
      toast.error(err.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left side panel: Brand marketing (Hidden on mobile) */}
      <div className="hidden md:flex w-[40%] bg-[#008236] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent)] pointer-events-none" />
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("landing")}
            className="transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Anovra Home"
          >
            <img src="/logo.png" alt="Anovra Logo" className="h-16 w-auto object-contain brightness-0 invert" />
          </button>
        </div>

        {/* Feature List */}
        <div className="my-auto space-y-8 pr-4">
          <h2 className="text-4xl font-light leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            Understand Your Skin. Make Smarter Decisions.
          </h2>
          
          <div className="space-y-6">
            {[
              { title: "AI-Powered Skin Test", desc: "Diagnose skin concerns, calculate your score, and receive expert routine guides." },
              { title: "Verified Skincare Ecosystem", desc: "Interact and shop securely from verified vendors with active CAC registration checkmarks." },
              { title: "Personalized Recommendation Catalogs", desc: "Access products custom-tailored to your exact skin type by expert analysis engines." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C86B3A] mt-2 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.title}</p>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div>
          <p className="text-[10px] text-white/40 tracking-wider uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>
            Anovra Africa © 2026
          </p>
        </div>
      </div>

      {/* Right side panel: Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#FAF7F2]/40">
        <div className="max-w-md w-full py-8">
          {/* Header */}
          <div className="text-center sm:text-left mb-8">
            <button
              onClick={() => setView("landing")}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <ChevronDown className="w-4 h-4 rotate-90" /> Back
            </button>

            <div className="md:hidden flex justify-center mb-4">
              <img src="/logo.png" alt="Anovra Logo" className="h-12 w-auto object-contain" />
            </div>

            <p className="text-xs tracking-[0.2em] uppercase text-[#C86B3A] font-bold mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
              Secure Gateway
            </p>
            <h1 className="text-4xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Sign in to access your Anovra account
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card border-2 border-border/80 p-6 sm:p-10 rounded-3xl shadow-xl space-y-5">
            {/* OTP Toggle Link */}
            <div className="flex justify-end mb-1">
              <button
                type="button"
                onClick={() => {
                  setUseOtp((o) => !o);
                  setOtpSent(false);
                  setOtpCode("");
                  setError("");
                }}
                className="text-xs text-[#C86B3A] hover:underline font-bold transition-all cursor-pointer"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {useOtp ? "← Use Password Sign In" : "Sign in with Email OTP code →"}
              </button>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-[#008236] mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Email address
              </label>
              <input
                className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] focus:ring-1 focus:ring-[#008236]/30 transition-all disabled:opacity-60"
                type="email"
                placeholder="you@example.com"
                value={email}
                disabled={useOtp && otpSent}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
            </div>

            {/* Password or OTP input */}
            {!useOtp ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#008236] uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Password</label>
                  <button
                    type="button"
                    onClick={() => setView("forgotpassword")}
                    className="text-xs text-[#008236] font-semibold hover:text-[#006c2c] underline underline-offset-2 cursor-pointer"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    className="w-full px-3.5 py-2.5 pr-10 bg-input-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] focus:ring-1 focus:ring-[#008236]/30 transition-all"
                    type={showPass ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                  <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              otpSent && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#008236] uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Verification Code</label>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-[#008236] font-semibold hover:text-[#006c2c] underline underline-offset-2 cursor-pointer"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Change email
                    </button>
                  </div>
                  <input
                    className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] focus:ring-1 focus:ring-[#008236]/30 transition-all text-center tracking-[0.4em] font-mono"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                  />
                </div>
              )
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#008236] hover:bg-[#006c2c] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Working…</>
              ) : useOtp ? (
                otpSent ? "Verify and Sign In" : "Send Verification Code"
              ) : (
                "Sign In"
              )}
            </button>

            <p className="text-center text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Don&apos;t have an account?{" "}
              <button onClick={() => setView("signup")} className="text-[#008236] underline underline-offset-2 hover:text-[#006c2c] font-semibold cursor-pointer">
                Join now
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ForgotPasswordView({ setView }: { setView: (v: View) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleForgot = async () => {
    if (!email) { setError("Please enter your email address."); return; }
    setError("");
    setLoading(true);

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#resetpassword`,
      });
      if (resetErr) throw resetErr;
      setSuccess(true);
      toast.success("Verification link dispatched to your inbox!");
    } catch (err: any) {
      setError(err.message || "Failed to trigger recovery. Verify details.");
      toast.error(err.message || "Password recovery error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left side panel: Brand marketing (Hidden on mobile) */}
      <div className="hidden md:flex w-[40%] bg-[#008236] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent)] pointer-events-none" />
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("landing")}
            className="transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Anovra Home"
          >
            <img src="/logo.png" alt="Anovra Logo" className="h-16 w-auto object-contain brightness-0 invert" />
          </button>
        </div>

        {/* Feature List */}
        <div className="my-auto space-y-8 pr-4">
          <h2 className="text-4xl font-light leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            Secure Skincare Accounts.
          </h2>
          
          <div className="space-y-6">
            {[
              { title: "Security Verification", desc: "Safety checks on your password resets protect your personal data logs." },
              { title: "Access Recoveries", desc: "Fast recovery systems restore your routines, logs, and scanned recommendations." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C86B3A] mt-2 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.title}</p>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div>
          <p className="text-[10px] text-white/40 tracking-wider uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>
            Anovra Africa © 2026
          </p>
        </div>
      </div>

      {/* Right side panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#FAF7F2]/40">
        <div className="max-w-md w-full py-8">
          {/* Header */}
          <div className="text-center sm:text-left mb-8">
            <button
              onClick={() => setView("signin")}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <ChevronDown className="w-4 h-4 rotate-90" /> Back to Sign In
            </button>

            <div className="md:hidden flex justify-center mb-4">
              <img src="/logo.png" alt="Anovra Logo" className="h-12 w-auto object-contain" />
            </div>

            <p className="text-xs tracking-[0.2em] uppercase text-[#C86B3A] font-bold mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
              Password Recovery
            </p>
            <h1 className="text-4xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              Forgot password?
            </h1>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              No worries, enter your email and we will send a reset link
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card border-2 border-border/80 p-6 sm:p-10 rounded-3xl shadow-xl space-y-5">
            {success ? (
              <div className="space-y-5 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-[#008236]/15 flex items-center justify-center mx-auto mb-2">
                  <Check className="w-6 h-6 text-[#008236]" />
                </div>
                <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Reset link sent!
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  We have sent a verification email to <span className="font-semibold text-foreground">{email}</span>. Click on the link to reset your password.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => setView("resetpassword")}
                    className="w-full py-3.5 rounded-xl bg-[#008236] hover:bg-[#006c2c] text-white font-bold text-sm shadow-md hover:shadow-lg transition-colors cursor-pointer"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Go to Reset Password screen (Demo)
                  </button>
                  <button
                    onClick={() => setView("signin")}
                    className="w-full py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-[#008236] mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Email address
                  </label>
                  <input
                    className="w-full px-3.5 py-2.5 bg-input-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] focus:ring-1 focus:ring-[#008236]/30 transition-all"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleForgot()}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleForgot}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#008236] hover:bg-[#006c2c] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2 cursor-pointer"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending Link…</>
                  ) : "Send Reset Link"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResetPasswordView({ setView }: { setView: (v: View) => void }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const isStrengthValid = password.length >= 8;

  const handleReset = async () => {
    if (!password || !confirmPassword) { setError("Please fill in both fields."); return; }
    if (!isStrengthValid) { setError("Password must be at least 8 characters."); return; }
    if (!passwordsMatch) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);

    try {
      const { error: resetErr } = await supabase.auth.updateUser({
        password: password
      });
      if (resetErr) throw resetErr;
      setSuccess(true);
      toast.success("Your password has been successfully updated!");
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please try again.");
      toast.error(err.message || "Password update error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left side panel: Brand marketing (Hidden on mobile) */}
      <div className="hidden md:flex w-[40%] bg-[#008236] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent)] pointer-events-none" />
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("landing")}
            className="transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Anovra Home"
          >
            <img src="/logo.png" alt="Anovra Logo" className="h-16 w-auto object-contain brightness-0 invert" />
          </button>
        </div>

        {/* Feature List */}
        <div className="my-auto space-y-8 pr-4">
          <h2 className="text-4xl font-light leading-tight" style={{ fontFamily: "'Fraunces', serif" }}>
            Set a Strong Password.
          </h2>
          
          <div className="space-y-6">
            {[
              { title: "Avoid Simple Terms", desc: "Include uppercase letters, numbers, and symbols to ensure maximum safety." },
              { title: "Unified Session Logout", desc: "Updating password logs out all other active device login sessions." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C86B3A] mt-2 flex-shrink-0" />
                <div>
                  <p className="font-bold text-sm text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.title}</p>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div>
          <p className="text-[10px] text-white/40 tracking-wider uppercase" style={{ fontFamily: "'DM Mono', monospace" }}>
            Anovra Africa © 2026
          </p>
        </div>
      </div>

      {/* Right side panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#FAF7F2]/40">
        <div className="max-w-md w-full py-8">
          {/* Header */}
          <div className="text-center sm:text-left mb-8">
            <button
              onClick={() => setView("signin")}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <ChevronDown className="w-4 h-4 rotate-90" /> Back to Sign In
            </button>

            <div className="md:hidden flex justify-center mb-4">
              <img src="/logo.png" alt="Anovra Logo" className="h-12 w-auto object-contain" />
            </div>

            <p className="text-xs tracking-[0.2em] uppercase text-[#C86B3A] font-bold mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
              Secure Update
            </p>
            <h1 className="text-4xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
              Reset password
            </h1>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Create a new secure password for your account
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card border-2 border-border/80 p-6 sm:p-10 rounded-3xl shadow-xl space-y-5">
            {success ? (
              <div className="space-y-5 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-[#008236]/15 flex items-center justify-center mx-auto mb-2">
                  <Check className="w-6 h-6 text-[#008236]" />
                </div>
                <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Fraunces', serif" }}>
                  Password updated!
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Your password has been successfully updated. You can now use your new password to sign in.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setView("signin")}
                    className="w-full py-3.5 rounded-xl bg-[#008236] hover:bg-[#006c2c] text-white font-bold text-sm shadow-md hover:shadow-lg transition-colors cursor-pointer"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Go to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-[#008236] mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      className="w-full px-3.5 py-2.5 pr-10 bg-input-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] focus:ring-1 focus:ring-[#008236]/30 transition-all"
                      type={showPass ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                    <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-[#008236] mb-1.5 uppercase tracking-wider" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      className="w-full px-3.5 py-2.5 pr-10 bg-input-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] focus:ring-1 focus:ring-[#008236]/30 transition-all"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-600 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleReset}
                  disabled={loading || !isStrengthValid || !passwordsMatch}
                  className="w-full py-3.5 rounded-xl bg-[#008236] hover:bg-[#006c2c] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Resetting…</>
                  ) : "Reset Password"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
