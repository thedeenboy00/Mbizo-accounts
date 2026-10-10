"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const FORMS = ["Form 1","Form 2","Form 3","Form 4","Form 5","Form 6"];
const currentYear = new Date().getFullYear();
const TERM_OPTIONS = [`Term 1 ${currentYear}`,`Term 2 ${currentYear}`,`Term 3 ${currentYear}`];

interface FeeType { id: string; name: string; amount: number; active: boolean; }

interface FormState {
  studentId: string; firstName: string; lastName: string;
  form: string; class: string; term: string;
}

const INIT: FormState = { studentId: "", firstName: "", lastName: "", form: "Form 1", class: "", term: TERM_OPTIONS[0] ?? "" };

export default function AddStudentButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INIT);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/fee-types").then(r => r.json()).then((d: unknown) => {
      if (Array.isArray(d)) setFeeTypes((d as FeeType[]).filter(f => f.active));
    });
  }, [open]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(p => ({ ...p, [k]: v }));
  }

  const totalFee = feeTypes.reduce((s, f) => s + f.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, termFee: totalFee }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to add student."); return; }
      setForm(INIT); setOpen(false); router.refresh();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  }

  const inp: React.CSSProperties = { width: "100%", padding: "9px 11px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg)", color: "var(--text)", fontSize: 14, outline: "none" };
  const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: 4 };

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: "9px 16px", background: "var(--navy)", color: "white", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
        Add student
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div style={{ background: "var(--surface)", width: "100%", maxWidth: 500, maxHeight: "95vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: "24px 20px 32px" }}>
            <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)" }}>Add Student</h2>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 22, cursor: "pointer" }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>Student ID</label>
                <input value={form.studentId} onChange={e => set("studentId", e.target.value)} style={inp} placeholder="e.g. MHS-2024-001" required />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>First Name</label>
                  <input value={form.firstName} onChange={e => set("firstName", e.target.value)} style={inp} required />
                </div>
                <div>
                  <label style={lbl}>Last Name</label>
                  <input value={form.lastName} onChange={e => set("lastName", e.target.value)} style={inp} required />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>Form</label>
                  <select value={form.form} onChange={e => set("form", e.target.value)} style={inp}>
                    {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Class</label>
                  <input value={form.class} onChange={e => set("class", e.target.value)} style={inp} placeholder="e.g. 1A" required />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Starting Term</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {TERM_OPTIONS.map(t => (
                    <button key={t} type="button" onClick={() => set("term", t)}
                      style={{ flex: 1, padding: "7px 6px", borderRadius: 5, fontSize: 11, fontWeight: 500, border: "1px solid var(--border)", cursor: "pointer", background: form.term === t ? "var(--navy)" : "var(--bg)", color: form.term === t ? "white" : "var(--text-muted)" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee breakdown from configured fee types */}
              <div style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", marginBottom: 8 }}>
                  Fee Breakdown for {form.term}
                </div>
                {feeTypes.length === 0 ? (
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    No fee types configured. Go to <a href="/dashboard/settings/fee-types" style={{ color: "var(--accent)" }}>Settings → Fee Types</a> to add them first.
                  </p>
                ) : (
                  <>
                    {feeTypes.map(ft => (
                      <div key={ft.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{ft.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--navy)", fontVariantNumeric: "tabular-nums" }}>
                          USD {ft.amount.toLocaleString("en-ZW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4, borderTop: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)" }}>Total Term Fee</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", fontVariantNumeric: "tabular-nums" }}>
                        USD {totalFee.toLocaleString("en-ZW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {error && <div style={{ padding: "10px 12px", borderRadius: 6, background: "var(--red-bg)", color: "var(--red)", fontSize: 13, marginBottom: 14 }}>{error}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button type="button" onClick={() => setOpen(false)} style={{ padding: "11px", border: "1px solid var(--border)", borderRadius: 7, background: "var(--surface)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={saving || feeTypes.length === 0}
                  style={{ padding: "11px", border: "none", borderRadius: 7, background: saving || feeTypes.length === 0 ? "var(--border)" : "var(--navy)", color: saving || feeTypes.length === 0 ? "var(--text-muted)" : "white", fontSize: 13, fontWeight: 600, cursor: saving || feeTypes.length === 0 ? "not-allowed" : "pointer" }}>
                  {saving ? "Saving…" : "Add student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
