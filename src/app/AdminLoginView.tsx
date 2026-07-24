import { useState } from "react";
import { Eye, AlertCircle, ChevronRight } from "lucide-react";
import type { View } from "./types";

export function AdminLoginView({ setView }: { setView: (v: View) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Seeded credentials for admin
  const ADMIN_EMAIL = "hello@anovra.africa";
  const ADMIN_PASS = "@Skin_ana1";

  const handleLogin = () => {
    if (!email || !password) { setError("Please enter your admin email and password."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASS) {
        setView("admin");
      } else {
        setError("Invalid credentials. Check your email and password and try again.");
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">

        {/* Wordmark */}
        <div className="text-center mb-8">
          <button
            onClick={() => setView("landing")}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008236] rounded-xl transition-transform hover:scale-105 active:scale-95 shrink-0 inline-block mb-4 cursor-pointer"
            aria-label="Anovra Home"
          >
            <img src="/logo.png" alt="Anovra Logo" className="h-12 sm:h-14 md:h-16 w-auto object-contain" />
          </button>
          <h1 className="text-3xl font-light text-foreground mb-1.5" style={{ fontFamily: "'Fraunces', serif" }}>
            Admin Portal
          </h1>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Restricted access — authorised personnel only
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border-2 border-border/80 p-6 sm:p-10 rounded-3xl shadow-xl space-y-5">
          <div className="space-y-4">

            {/* Email */}
            <div>
              <label
                className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Admin email
              </label>
              <input
                type="email"
                autoComplete="username"
                placeholder="hello@anovra.africa"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] focus:ring-1 focus:ring-[#008236]/30 transition-all"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your admin password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full px-3.5 py-2.5 pr-10 bg-[#FAF7F2] border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-[#008236] focus:ring-1 focus:ring-[#008236]/30 transition-all"
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
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 leading-relaxed font-medium" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#008236] hover:bg-[#006c2c] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-2 cursor-pointer"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4 text-white" />
                  Access admin panel
                </>
              )}
            </button>
          </div>

          {/* Demo hint */}
          <div className="mt-5 p-3 bg-muted rounded-xl">
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed" style={{ fontFamily: "'DM Mono', monospace" }}>
              admin · hello@anovra.africa / @Skin_ana1
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <button
            onClick={() => setView("landing")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-medium"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            ← Back to platform
          </button>
        </div>
      </div>
    </div>
  );
}
