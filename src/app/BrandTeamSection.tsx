import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Plus, Shield, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "./utils/supabase";

type Branch = { branch_id: string; branch_name: string; status: string };
type Member = {
  id: string; vendor_id: string; name: string; email: string;
  role: "Manager" | "Viewer"; status: string; created_at: string;
};

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("manage-brand-team", { body });
  if (error) {
    const response = (error as any).context as Response | undefined;
    const detail = await response?.clone().json().catch(() => null);
    throw new Error(detail?.error || error.message);
  }
  return data;
}

export function BrandTeamSection({ branches }: { branches: Branch[] }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [form, setForm] = useState({ branchId: "", name: "", email: "", role: "Manager" as "Manager" | "Viewer" });
  const activeBranches = branches.filter((branch) => branch.status === "active");

  const load = async () => {
    try {
      const result = await invoke({ action: "list" });
      setMembers(result.members || []);
    } catch (error: any) {
      toast.error(error.message || "Could not load team accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!form.branchId && activeBranches.length) setForm((current) => ({ ...current, branchId: activeBranches[0].branch_id }));
  }, [branches]);

  const create = async () => {
    setBusy(true);
    try {
      const result = await invoke({ action: "create", ...form });
      setMembers((current) => [result.member, ...current]);
      setCreating(false);
      setForm({ branchId: form.branchId, name: "", email: "", role: "Manager" });
      setTemporaryPassword(result.temporaryPassword || "");
      toast.success(result.emailSent ? "Team member created and invitation emailed." : "Team member created. Share the temporary password securely.");
    } catch (error: any) {
      toast.error(error.message || "Could not create this account.");
    } finally {
      setBusy(false);
    }
  };

  const changeAccess = async (member: Member, action: "suspend" | "reactivate" | "remove") => {
    if (action === "remove" && !window.confirm(`Remove ${member.name}'s access to this branch?`)) return;
    setBusy(true);
    try {
      await invoke({ action, memberId: member.id });
      await load();
      toast.success(action === "remove" ? "Team access removed." : action === "suspend" ? "Team access suspended." : "Team access restored.");
    } catch (error: any) {
      toast.error(error.message || "Could not update team access.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Branch access</p>
          <h2 className="text-2xl sm:text-3xl font-light text-foreground mt-1" style={{ fontFamily: "'Fraunces', serif" }}>Team accounts</h2>
          <p className="text-sm text-muted-foreground mt-2">Give staff access to one branch's catalogue and customer activity.</p>
        </div>
        <button onClick={() => { setCreating((value) => !value); setTemporaryPassword(""); }}
          disabled={!activeBranches.length}
          className="inline-flex items-center justify-center gap-2 bg-accent text-white px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
          {creating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {creating ? "Close" : "Add team member"}
        </button>
      </div>

      {temporaryPassword && (
        <div className="border border-amber-300 bg-amber-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-950">Invitation email was not sent</p>
            <p className="text-xs text-amber-900 mt-1">Share this one-time password with the member through a secure channel. It will disappear when you leave this page.</p>
            <code className="block mt-2 text-sm font-mono break-all text-amber-950">{temporaryPassword}</code>
          </div>
          <button onClick={async () => { await navigator.clipboard.writeText(temporaryPassword); toast.success("Password copied."); }}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-semibold">
            <Copy className="w-4 h-4" /> Copy
          </button>
        </div>
      )}

      {creating && (
        <form onSubmit={(event) => { event.preventDefault(); create(); }} className="bg-card border border-border rounded-lg p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><Shield className="w-4 h-4 text-accent" /> New branch team member</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-xs font-semibold text-muted-foreground">Branch
              <select required value={form.branchId} onChange={(event) => setForm((current) => ({ ...current, branchId: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground">
                {activeBranches.map((branch) => <option key={branch.branch_id} value={branch.branch_id}>{branch.branch_name}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">Access level
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as "Manager" | "Viewer" }))}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground">
                <option value="Manager">Manager · edit catalogue</option>
                <option value="Viewer">Viewer · read only</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">Full name
              <input required minLength={2} maxLength={100} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground" />
            </label>
            <label className="block text-xs font-semibold text-muted-foreground">Email address
              <input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground" />
            </label>
          </div>
          <button disabled={busy} type="submit" className="inline-flex items-center gap-2 bg-accent text-white rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create account
          </button>
        </form>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
          : !members.length ? <div className="p-8 text-center">
            <UserRound className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold">No team members yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add an active branch first, then invite staff here.</p>
          </div> : <div className="divide-y divide-border">
            {members.map((member) => (
              <div key={member.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
                <div className="w-9 h-9 shrink-0 rounded-lg bg-accent/10 text-accent flex items-center justify-center"><UserRound className="w-4 h-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground break-all">{member.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">{branches.find((branch) => branch.branch_id === member.vendor_id)?.branch_name || "Branch"} · {member.role}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded self-start ${member.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                  {member.status === "active" ? <Check className="w-3 h-3 inline mr-1" /> : null}{member.status}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button disabled={busy} onClick={() => changeAccess(member, member.status === "active" ? "suspend" : "reactivate")}
                    className="px-3 py-2 rounded-lg border border-border text-xs font-semibold hover:bg-muted disabled:opacity-50">
                    {member.status === "active" ? "Suspend" : "Restore"}
                  </button>
                  <button disabled={busy} onClick={() => changeAccess(member, "remove")}
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 disabled:opacity-50">Remove</button>
                </div>
              </div>
            ))}
          </div>}
      </div>
    </section>
  );
}
