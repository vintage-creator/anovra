import { useState } from "react";
import { Eye, AlertCircle, ChevronRight, Scan } from "lucide-react";
import type { View } from "./types";

export function AdminLoginView({ setView }: { setView: (v: View) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Demo credentials — in production this would hit a real auth endpoint
  const ADMIN_EMAIL = "admin@anovra.africa";
  const ADMIN_PASS = "Admin@2025!";

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
    <div className="min-h-screen bg-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Anovra Logo" className="h-14 w-auto mx-auto mb-4 object-contain drop-shadow-md" />
          <h1 className="text-3xl font-light text-primary-foreground mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
            Anovra Admin
          </h1>
          <p className="text-sm text-white/50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Restricted access — authorised personnel only
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl p-6 shadow-2xl border border-white/5">
          <div className="space-y-4">

            {/* Email */}
            <div>
              <label
                className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                Admin email
              </label>
              <input
                type="email"
                autoComplete="username"
                placeholder="admin@anovra.africa"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full px-3 py-2.5 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide"
                style={{ fontFamily: "'DM Mono', monospace" }}
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
                  className="w-full px-3 py-2.5 pr-10 bg-input-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-accent/50 transition-all"
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
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600 leading-relaxed" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-1"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  Access admin panel
                </>
              )}
            </button>
          </div>

          {/* Demo hint */}
          <div className="mt-5 p-3 bg-secondary rounded-lg">
            <p className="text-xs text-muted-foreground text-center leading-relaxed" style={{ fontFamily: "'DM Mono', monospace" }}>
              demo · admin@anovra.africa / Admin@2025!
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <button
            onClick={() => setView("landing")}
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            ← Back to platform
          </button>
        </div>
      </div>
    </div>
  );
}
