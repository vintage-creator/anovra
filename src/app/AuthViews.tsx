import { useState, useRef } from "react";
import { Eye, Check, CheckCircle, AlertCircle, Globe, Upload, ChevronDown, Scan } from "lucide-react";
import type { View } from "./types";

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
  const [status, setStatus] = useState<"idle" | "verifying" | "found" | "notfound">("idle");
  const [bizName, setBizName] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MOCK_CAC: Record<string, string> = {
    "RC-123456": "Veraski Nigeria Limited",
    "RC-987654": "GlowAfrique Cosmetics Ltd",
    "RC-445566": "ClearSkin Ventures Nigeria",
    "BN-112233": "SunGuard Skincare Enterprises",
  };

  const handleChange = (v: string) => {
    onChange(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    const clean = v.trim().toUpperCase();
    if (clean.length < 6) { setStatus("idle"); return; }
    setStatus("verifying");
    timerRef.current = setTimeout(() => {
      const match = MOCK_CAC[clean];
      if (match) { setStatus("found"); setBizName(match); }
      else setStatus("notfound");
    }, 900);
  };

  return (
    <div>
      <div className="relative">
        <input
          className={`w-full px-3 py-2.5 pr-10 bg-input-background border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all ${
            status === "found" ? "border-green-400 focus:ring-1 focus:ring-green-400/50" :
            status === "notfound" ? "border-red-400 focus:ring-1 focus:ring-red-400/50" :
            "border-border focus:ring-1 focus:ring-accent/50"
          }`}
          placeholder="e.g. RC-123456 or BN-112233"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          style={{ fontFamily: "'DM Mono', monospace" }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === "verifying" && <div className="w-4 h-4 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />}
          {status === "found" && <CheckCircle className="w-4 h-4 text-green-500" />}
          {status === "notfound" && <AlertCircle className="w-4 h-4 text-red-500" />}
        </div>
      </div>
      {status === "verifying" && (
        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div className="w-3 h-3 border border-accent/40 border-t-accent rounded-full animate-spin flex-shrink-0" />
          Verifying with CAC registry…
        </p>
      )}
      {status === "found" && (
        <p className="text-xs text-green-700 mt-1.5 flex items-center gap-1.5 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <CheckCircle className="w-3 h-3 flex-shrink-0" /> Registered business found: <span className="font-semibold">{bizName}</span>
        </p>
      )}
      {status === "notfound" && (
        <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <AlertCircle className="w-3 h-3 flex-shrink-0" /> No match found. Check the number and try again.
        </p>
      )}
    </div>
  );
}

function isSocialUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /^https?:$/.test(u.protocol) && u.hostname.length > 3;
  } catch { return false; }
}

export function SignUpView({ setView }: { setView: (v: View) => void }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    cac: "",
    cacDoc: "",
    password: "",
    confirmPassword: "",
  });

  const [socialAccounts, setSocialAccounts] = useState<
    { platform: string; url: string }[]
  >([{ platform: "Instagram", url: "" }]);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPopupModal, setShowPopupModal] = useState(false);

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

  const canSubmit =
    form.fullName &&
    form.email &&
    form.whatsapp &&
    form.cac &&
    form.cacDoc &&
    socialAccounts[0].url &&
    validSocialUrls &&
    passwordScore >= 4 &&
    passwordsMatch;

  const inputCls =
    "w-full px-3.5 py-2.5 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all";
  const labelCls =
    "block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide";

  const handleFormSubmit = () => {
    if (!canSubmit) return;
    setShowPopupModal(true);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setView("landing")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <ChevronDown className="w-4 h-4 rotate-90" /> Back
          </button>
          <img src="/logo.png" alt="Anovra Logo" className="h-12 sm:h-16 w-auto mb-4 object-contain" />
          <p className="text-xs tracking-[0.2em] uppercase text-emerald-600 font-semibold mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
            Vendor Registration
          </p>
          <h1 className="text-4xl font-light text-foreground mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
            Join Anovra
          </h1>
          <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Already have an account?{" "}
            <button onClick={() => setView("signin")} className="text-emerald-600 font-medium underline underline-offset-2 hover:text-emerald-700">
              Sign in
            </button>
          </p>
        </div>

        <div className="space-y-5">
          {/* Full name */}
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

          {/* Email */}
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

          {/* WhatsApp */}
          <div>
            <label className={labelCls}>WhatsApp Number *</label>
            <div className="flex gap-2">
              <div
                className="flex items-center px-3 bg-input-background border border-border rounded-lg text-sm text-muted-foreground flex-shrink-0"
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
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              We will use this to send you important messages and for clients to connect with you via WhatsApp.
            </p>
          </div>

          {/* CAC Registration Number & Certificate Upload (Compulsory) */}
          <div className="space-y-3">
            <div>
              <label className={labelCls}>CAC Registration Number * (Compulsory)</label>
              <CACVerifier value={form.cac} onChange={(v) => set("cac", v)} />
            </div>

            <div>
              <label className={labelCls}>CAC Certificate Upload * (Compulsory)</label>
              <label className="block cursor-pointer">
                <div
                  className={`flex items-center gap-3 px-3.5 py-3 border-2 border-dashed rounded-lg transition-colors ${
                    form.cacDoc
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-border hover:border-emerald-500/50 hover:bg-muted/30"
                  }`}
                >
                  <Upload className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {form.cacDoc ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {form.cacDoc}
                      </span>
                    ) : (
                      "Upload CAC certificate (PDF or Image)"
                    )}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="sr-only"
                  onChange={(e) => set("cacDoc", e.target.files?.[0]?.name || "")}
                />
              </label>
            </div>

            <p className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg leading-relaxed">
              🛡️ <strong>Verified Trust:</strong> Verifying your CAC business registration increases customer trust and reassures shoppers that your store is authentic and verified.
            </p>
          </div>

          {/* Social Media Business Accounts Dropdown + Multi-Adder */}
          <div className="space-y-3">
            <label className={labelCls}>Social Media Business Accounts *</label>
            {socialAccounts.map((acc, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select
                  value={acc.platform}
                  onChange={(e) => updateSocialAccount(index, "platform", e.target.value)}
                  className="px-3 py-2.5 bg-input-background border border-border rounded-lg text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all shrink-0 w-32"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Twitter">Twitter / X</option>
                  <option value="Website">Website Link</option>
                </select>

                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    className={`${inputCls} pl-9`}
                    placeholder={`https://${acc.platform.toLowerCase()}.com/yourbrand`}
                    value={acc.url}
                    onChange={(e) => updateSocialAccount(index, "url", e.target.value)}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>

                {socialAccounts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSocialAccount(index)}
                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addSocialAccount}
              className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-1 mt-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              + Add another social account
            </button>
          </div>

          {/* Create Password */}
          <div>
            <label className={labelCls}>Create Password *</label>
            <div className="relative">
              <input
                className={inputCls}
                type={showPass ? "text" : "password"}
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Note: Password must contain numbers, letters, and special characters (!@#$...).
            </p>
            <PasswordStrength password={form.password} />
          </div>

          {/* Confirm password */}
          <div>
            <label className={labelCls}>Confirm Password *</label>
            <div className="relative">
              <input
                className={`${inputCls} ${
                  form.confirmPassword && !passwordsMatch
                    ? "border-red-400 focus:ring-red-400/50"
                    : form.confirmPassword && passwordsMatch
                    ? "border-emerald-500 focus:ring-emerald-500/50"
                    : ""
                }`}
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
            {form.confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-600 mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Passwords do not match
              </p>
            )}
            {form.confirmPassword && passwordsMatch && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <Check className="w-3 h-3 text-emerald-500" /> Passwords match
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleFormSubmit}
            disabled={!canSubmit}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all mt-2 ${
              canSubmit
                ? "bg-emerald-500 text-amber-950 hover:bg-emerald-600 shadow-md"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Submit Application
          </button>

          <p className="text-xs text-center text-muted-foreground leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            By registering you agree to Anovra's Terms of Service and Privacy Policy. Your CAC details will be verified before full account verification.
          </p>
        </div>
      </div>

      {/* Confirmation Popup Modal */}
      {showPopupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl max-w-md w-full p-6 sm:p-8 text-center border border-border shadow-2xl relative">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-light text-foreground mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
              Congratulations, you have successfully signed up to Anovra!
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              It will take us 3–5 working days to verify your account. In the meantime, you can explore your vendor control center and start building your product catalog!
            </p>
            <button
              onClick={() => {
                setShowPopupModal(false);
                setView("dashboard");
              }}
              className="w-full py-3 rounded-xl bg-emerald-500 text-amber-950 font-bold text-sm hover:bg-emerald-600 transition-colors shadow-md"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              OK
            </button>
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

  const handleSignIn = () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setView("dashboard");
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <img src="/logo.png" alt="Anovra Logo" className="h-12 w-auto mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-light text-foreground mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Welcome back</h1>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Sign in to your vendor account</p>
        </div>

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Email address</label>
            <input
              className="w-full px-3 py-2.5 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-accent/50 transition-all"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>Password</label>
              <button className="text-xs text-accent hover:text-accent/80 underline underline-offset-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                className="w-full px-3 py-2.5 pr-10 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                type={showPass ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
              <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in…</>
            ) : "Sign in to dashboard"}
          </button>

          <p className="text-center text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Don't have an account?{" "}
            <button onClick={() => setView("signup")} className="text-accent underline underline-offset-2 hover:text-accent/80 font-medium">
              Join as a vendor
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
