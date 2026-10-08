"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props { studentId: string; studentName: string; }

interface FormState {
  amount: string; method: "Cash" | "Bank"; reference: string; term: string; notes: string;
}

const INIT: FormState = { amount:"", method:"Cash", reference:"", term:"", notes:"" };

export default function RecordPaymentButton({ studentId, studentName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INIT);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to record payment."); return; }
      setForm(INIT); setOpen(false); router.refresh();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  }

  const input: React.CSSProperties = { width:"100%", padding:"9px 11px", border:"1px solid var(--border)", borderRadius:6, background:"var(--bg)", color:"var(--text)", fontSize:14, outline:"none" };
  const label: React.CSSProperties = { display:"block", fontSize:12, fontWeight:500, color:"var(--text-muted)", marginBottom:4 };

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding:"9px 16px", background:"var(--navy)", color:"white", border:"none", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
        Record payment
      </button>

      {open && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div style={{ background:"var(--surface)", width:"100%", maxWidth:500, maxHeight:"92vh", overflowY:"auto", borderRadius:"16px 16px 0 0", padding:"24px 20px 32px" }}>
            <div style={{ width:36, height:4, background:"var(--border)", borderRadius:2, margin:"0 auto 20px" }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:"var(--navy)" }}>Record Payment</h2>
              <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", color:"var(--text-muted)", fontSize:22, cursor:"pointer" }}>×</button>
            </div>
            <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:20 }}>{studentName}</p>

            <form onSubmit={handleSubmit}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div>
                  <label style={label} htmlFor="p-amount">Amount (USD)</label>
                  <input id="p-amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={e => set("amount", e.target.value)} style={input} placeholder="0.00" required />
                </div>
                <div>
                  <label style={label} htmlFor="p-method">Payment Method</label>
                  <select id="p-method" value={form.method} onChange={e => set("method", e.target.value as "Cash"|"Bank")} style={input}>
                    <option value="Cash">💵 Cash</option>
                    <option value="Bank">🏦 ZB Bank (Receipt)</option>
                  </select>
                </div>
              </div>

              {form.method === "Bank" && (
                <div style={{ padding:"10px 12px", borderRadius:6, background:"#eff6ff", border:"1px solid #bfdbfe", fontSize:12, color:"var(--accent)", marginBottom:12 }}>
                  <strong>ZB Bank payment:</strong> Enter the bank receipt number below as the reference. The payment will be recorded against the Bank account and posted to the cash book automatically.
                </div>
              )}

              <div style={{ marginBottom:12 }}>
                <label style={label} htmlFor="p-ref">
                  {form.method === "Bank" ? "ZB Bank Receipt No." : "Receipt Number"}
                </label>
                <input id="p-ref" value={form.reference} onChange={e => set("reference", e.target.value)} style={input} placeholder={form.method === "Bank" ? "e.g. ZB-2024-089234" : "e.g. RCP-001"} required />
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={label} htmlFor="p-term">Term</label>
                <input id="p-term" value={form.term} onChange={e => set("term", e.target.value)} style={input} placeholder="e.g. Term 1 2024" required />
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={label} htmlFor="p-notes">Notes (optional)</label>
                <input id="p-notes" value={form.notes} onChange={e => set("notes", e.target.value)} style={input} placeholder="Any additional notes" />
              </div>

              {error && <div style={{ padding:"10px 12px", borderRadius:6, background:"var(--red-bg)", color:"var(--red)", fontSize:13, marginBottom:14 }}>{error}</div>}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <button type="button" onClick={() => setOpen(false)} style={{ padding:"11px", border:"1px solid var(--border)", borderRadius:7, background:"var(--surface)", color:"var(--text-muted)", fontSize:13, cursor:"pointer" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding:"11px", border:"none", borderRadius:7, background:saving?"var(--border)":"var(--navy)", color:saving?"var(--text-muted)":"white", fontSize:13, fontWeight:600, cursor:saving?"not-allowed":"pointer" }}>
                  {saving ? "Saving…" : "Record payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
