"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props { studentId: string; studentName: string; }

type Tab = "cash" | "zb";

interface CashForm { amount: string; method: "Cash" | "Bank"; reference: string; term: string; notes: string; }
interface ZBForm  { amount: string; currency: "USD" | "ZWG"; feeTypeId: string; term: string; payerPhone: string; }

interface FeeTypeOption { id: string; name: string; amount: number; }
interface ZBResult { zbReference: string; paymentUrl: string; schoolReceipt: string; }

const CASH_INIT: CashForm = { amount:"", method:"Cash", reference:"", term:"", notes:"" };
const ZB_INIT:   ZBForm   = { amount:"", currency:"USD", feeTypeId:"", term:"", payerPhone:"" };

export default function RecordPaymentButton({ studentId, studentName }: Props) {
  const router = useRouter();
  const [open, setOpen]   = useState(false);
  const [tab, setTab]     = useState<Tab>("cash");
  const [cash, setCash]   = useState<CashForm>(CASH_INIT);
  const [zb, setZB]       = useState<ZBForm>(ZB_INIT);
  const [feeTypes, setFeeTypes] = useState<FeeTypeOption[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [zbResult, setZBResult] = useState<ZBResult | null>(null);
  const [zbStatusMsg, setZBStatusMsg] = useState("");

  function openModal() {
    setOpen(true); setTab("cash"); setError(""); setZBResult(null);
    fetch("/api/fee-types").then(r => r.json()).then((d: unknown) => { if (Array.isArray(d)) setFeeTypes(d as FeeTypeOption[]); });
  }

  function setC<K extends keyof CashForm>(k: K, v: CashForm[K]) { setCash(p => ({ ...p, [k]: v })); }
  function setZ<K extends keyof ZBForm>(k: K, v: ZBForm[K])   { setZB(p  => ({ ...p, [k]: v })); }

  async function handleCashSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/payments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cash, amount: Number(cash.amount) }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed."); return; }
      setCash(CASH_INIT); setOpen(false); router.refresh();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  }

  async function handleZBSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const res = await fetch("/api/zb/initiate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId, amount: Number(zb.amount), currency: zb.currency,
          feeTypeId: zb.feeTypeId || undefined, term: zb.term,
          payerName: studentName, payerPhone: zb.payerPhone || undefined,
        }),
      });
      const data = await res.json() as { error?: string; zbReference?: string; paymentUrl?: string; schoolReceipt?: string };
      if (!res.ok) { setError(data.error ?? "Failed to initiate ZB payment."); return; }
      setZBResult({ zbReference: data.zbReference!, paymentUrl: data.paymentUrl!, schoolReceipt: data.schoolReceipt! });
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  }

  async function checkZBStatus() {
    if (!zbResult) return;
    setZBStatusMsg("Checking…");
    const res = await fetch(`/api/zb/status?ref=${zbResult.zbReference}`);
    const data = await res.json() as { status?: string };
    const s = data.status ?? "UNKNOWN";
    setZBStatusMsg(`Status: ${s}`);
    if (s === "PAID") { setZBResult(null); setOpen(false); router.refresh(); }
  }

  const inp: React.CSSProperties = { width:"100%", padding:"9px 11px", border:"1px solid var(--border)", borderRadius:6, background:"var(--bg)", color:"var(--text)", fontSize:14, outline:"none" };
  const lbl: React.CSSProperties = { display:"block", fontSize:12, fontWeight:500, color:"var(--text-muted)", marginBottom:4 };

  return (
    <>
      <button onClick={openModal} style={{ padding:"9px 16px", background:"var(--navy)", color:"white", border:"none", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
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

            {/* Tabs */}
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              {(["cash","zb"] as Tab[]).map(t => (
                <button key={t} onClick={() => { setTab(t); setError(""); setZBResult(null); }}
                  style={{ flex:1, padding:"9px", borderRadius:7, fontSize:13, fontWeight:600, border:"1px solid var(--border)", cursor:"pointer", background:tab===t?"var(--navy)":"var(--surface)", color:tab===t?"white":"var(--text-muted)" }}>
                  {t === "cash" ? "💵 Cash / Bank" : "🏦 ZB SmilePay"}
                </button>
              ))}
            </div>

            {tab === "cash" && (
              <form onSubmit={handleCashSubmit}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  <div>
                    <label style={lbl}>Amount (USD)</label>
                    <input type="number" min="0.01" step="0.01" value={cash.amount} onChange={e => setC("amount",e.target.value)} style={inp} placeholder="0.00" required />
                  </div>
                  <div>
                    <label style={lbl}>Method</label>
                    <select value={cash.method} onChange={e => setC("method",e.target.value as "Cash"|"Bank")} style={inp}>
                      <option value="Cash">💵 Cash</option>
                      <option value="Bank">🏦 ZB Bank (manual receipt)</option>
                    </select>
                  </div>
                </div>
                {cash.method === "Bank" && (
                  <div style={{ padding:"10px 12px", borderRadius:6, background:"#eff6ff", border:"1px solid #bfdbfe", fontSize:12, color:"var(--accent)", marginBottom:12 }}>
                    Parent brought a ZB Bank deposit receipt. Enter the ZB receipt number as reference below.
                  </div>
                )}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  <div>
                    <label style={lbl}>{cash.method === "Bank" ? "ZB Bank Receipt No." : "School Receipt No."}</label>
                    <input value={cash.reference} onChange={e => setC("reference",e.target.value)} style={inp} placeholder="e.g. RCP-001" required />
                  </div>
                  <div>
                    <label style={lbl}>Term</label>
                    <input value={cash.term} onChange={e => setC("term",e.target.value)} style={inp} placeholder="e.g. Term 1 2024" required />
                  </div>
                </div>
                {feeTypes.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <label style={lbl}>Fee Type (optional)</label>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {feeTypes.map(ft => (
                        <button key={ft.id} type="button"
                          onClick={() => { setC("amount", String(ft.amount)); }}
                          style={{ padding:"5px 10px", borderRadius:5, fontSize:11, border:"1px solid var(--border)", cursor:"pointer", background:"var(--bg)", color:"var(--navy)" }}>
                          {ft.name} · ${ft.amount}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ marginBottom:20 }}>
                  <label style={lbl}>Notes (optional)</label>
                  <input value={cash.notes} onChange={e => setC("notes",e.target.value)} style={inp} placeholder="Any additional notes" />
                </div>
                {error && <div style={{ padding:"10px 12px", borderRadius:6, background:"var(--red-bg)", color:"var(--red)", fontSize:13, marginBottom:14 }}>{error}</div>}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <button type="button" onClick={() => setOpen(false)} style={{ padding:"11px", border:"1px solid var(--border)", borderRadius:7, background:"var(--surface)", color:"var(--text-muted)", fontSize:13, cursor:"pointer" }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ padding:"11px", border:"none", borderRadius:7, background:saving?"var(--border)":"var(--navy)", color:saving?"var(--text-muted)":"white", fontSize:13, fontWeight:600, cursor:saving?"not-allowed":"pointer" }}>
                    {saving ? "Saving…" : "Record"}
                  </button>
                </div>
              </form>
            )}

            {tab === "zb" && !zbResult && (
              <form onSubmit={handleZBSubmit}>
                <div style={{ padding:"10px 12px", borderRadius:6, background:"var(--green-bg)", border:"1px solid #86efac40", fontSize:12, color:"var(--green)", marginBottom:16, lineHeight:1.6 }}>
                  <strong>ZB SmilePay:</strong> A payment link will be generated. Share it with the parent via WhatsApp or SMS — they pay from their phone. The system will auto-record the payment when ZB confirms.
                </div>

                {feeTypes.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <label style={lbl}>Fee Type</label>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {feeTypes.map(ft => (
                        <button key={ft.id} type="button"
                          onClick={() => { setZ("feeTypeId",ft.id); setZ("amount",String(ft.amount)); }}
                          style={{ padding:"6px 12px", borderRadius:5, fontSize:12, fontWeight:500, border:"1px solid var(--border)", cursor:"pointer", background:zb.feeTypeId===ft.id?"var(--navy)":"var(--bg)", color:zb.feeTypeId===ft.id?"white":"var(--navy)" }}>
                          {ft.name} · ${ft.amount}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  <div>
                    <label style={lbl}>Amount</label>
                    <input type="number" min="0.01" step="0.01" value={zb.amount} onChange={e => setZ("amount",e.target.value)} style={inp} placeholder="0.00" required />
                  </div>
                  <div>
                    <label style={lbl}>Currency</label>
                    <select value={zb.currency} onChange={e => setZ("currency",e.target.value as "USD"|"ZWG")} style={inp}>
                      <option value="USD">USD ($)</option>
                      <option value="ZWG">ZWG (ZWG$)</option>
                    </select>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                  <div>
                    <label style={lbl}>Term</label>
                    <input value={zb.term} onChange={e => setZ("term",e.target.value)} style={inp} placeholder="e.g. Term 1 2024" required />
                  </div>
                  <div>
                    <label style={lbl}>Payer phone (optional)</label>
                    <input value={zb.payerPhone} onChange={e => setZ("payerPhone",e.target.value)} style={inp} placeholder="+263 7X XXX XXXX" />
                  </div>
                </div>
                {error && <div style={{ padding:"10px 12px", borderRadius:6, background:"var(--red-bg)", color:"var(--red)", fontSize:13, marginBottom:14 }}>{error}</div>}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <button type="button" onClick={() => setOpen(false)} style={{ padding:"11px", border:"1px solid var(--border)", borderRadius:7, background:"var(--surface)", color:"var(--text-muted)", fontSize:13, cursor:"pointer" }}>Cancel</button>
                  <button type="submit" disabled={saving} style={{ padding:"11px", border:"none", borderRadius:7, background:saving?"var(--border)":"var(--navy)", color:saving?"var(--text-muted)":"white", fontSize:13, fontWeight:600, cursor:saving?"not-allowed":"pointer" }}>
                    {saving ? "Generating…" : "Generate payment link"}
                  </button>
                </div>
              </form>
            )}

            {tab === "zb" && zbResult && (
              <div>
                <div style={{ padding:"16px", borderRadius:8, background:"var(--green-bg)", border:"1px solid #86efac", marginBottom:16 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--green)", marginBottom:8 }}>✓ Payment link generated</div>
                  <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:4 }}>School receipt: <code style={{ color:"var(--navy)", fontWeight:600 }}>{zbResult.schoolReceipt}</code></div>
                  <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:12 }}>ZB ref: <code style={{ fontSize:11 }}>{zbResult.zbReference}</code></div>
                  <a href={zbResult.paymentUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display:"block", padding:"10px 14px", background:"var(--navy)", color:"white", borderRadius:7, fontSize:13, fontWeight:600, textAlign:"center", textDecoration:"none", marginBottom:8 }}>
                    Open payment page ↗
                  </a>
                  <button onClick={() => { navigator.clipboard.writeText(zbResult.paymentUrl); }}
                    style={{ display:"block", width:"100%", padding:"9px", border:"1px solid var(--border)", borderRadius:7, background:"var(--surface)", fontSize:12, cursor:"pointer", color:"var(--navy)" }}>
                    📋 Copy link to share via WhatsApp / SMS
                  </button>
                </div>
                <p style={{ fontSize:12, color:"var(--text-muted)", marginBottom:12 }}>
                  The payment will be auto-recorded when ZB confirms. Check status to verify:
                </p>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={checkZBStatus} style={{ flex:1, padding:"10px", border:"1px solid var(--border)", borderRadius:7, background:"var(--surface)", fontSize:13, cursor:"pointer", color:"var(--navy)", fontWeight:500 }}>
                    Check payment status
                  </button>
                  <button onClick={() => setOpen(false)} style={{ flex:1, padding:"10px", border:"none", borderRadius:7, background:"var(--navy)", color:"white", fontSize:13, cursor:"pointer", fontWeight:600 }}>
                    Done
                  </button>
                </div>
                {zbStatusMsg && <div style={{ marginTop:10, fontSize:12, color:"var(--text-muted)", textAlign:"center" }}>{zbStatusMsg}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
