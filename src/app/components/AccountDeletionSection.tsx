import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../utils/supabase";
import type { View } from "../types";

type AccountKind = "customer" | "vendor" | "brand";

export function AccountDeletionSection({ kind, setView }: { kind: AccountKind; setView: (view: View) => void }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    if (pending) return;
    setOpen(false);
    setPassword("");
    setConfirmation("");
    setError("");
  };

  const erase = async () => {
    if (confirmation !== "DELETE" || !password) {
      setError("Enter your password and type DELETE to continue.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("delete-account", {
        body: { password, confirmation },
      });
      if (invokeError || !data?.deleted) {
        const detail = await (invokeError as any)?.context?.clone?.().json().catch(() => null);
        throw new Error(detail?.error || data?.error || "Could not delete your account. Please try again.");
      }
      await supabase.auth.signOut({ scope: "local" });
      setView("landing");
      toast.success("Your account has been deleted.");
      if (data.filesPending) toast.warning("Some uploaded files need manual removal. Please contact hello@anovra.africa.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete your account. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="border border-red-200 bg-card rounded-lg p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">Delete account</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Permanently remove your {kind === "brand" ? "Brand HQ, branches and their data" : kind === "vendor" ? "storefront, catalogue and account data" : "skin history and account data"}.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">
          <Trash2 className="h-4 w-4" /> Delete account
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="w-full max-w-md rounded-lg bg-card p-5 sm:p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700"><AlertTriangle className="h-5 w-5" /></span>
                <h2 id="delete-account-title" className="text-lg font-semibold text-foreground">Delete this account?</h2>
              </div>
              <button type="button" onClick={close} disabled={pending} aria-label="Close" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              This cannot be undone. Your sign-in, {kind === "brand" ? "branch accounts, products, scans and sales" : kind === "vendor" ? "products, scans and sales" : "saved analyses, reviews and family profiles"} will be removed.
              We retain only a one-way email fingerprint and your original trial date to prevent a repeat free trial.
            </p>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-foreground">Current password
                <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-red-500" />
              </label>
              <label className="block text-sm font-medium text-foreground">Type DELETE to confirm
                <input type="text" autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-red-500" />
              </label>
            </div>
            {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button type="button" onClick={close} disabled={pending} className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted">Keep account</button>
              <button type="button" onClick={erase} disabled={pending || confirmation !== "DELETE" || !password} className="rounded-md bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50">
                {pending ? "Deleting..." : "Permanently delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
