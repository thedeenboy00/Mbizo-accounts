"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { PaymentCategory, TransactionType, AccountType } from "@/types";

interface StudentOption { id: string; studentId: string; firstName: string; lastName: string; form: string; }
interface FeeTypeOption { id: string; name: string; amount: number; }

interface FormState {
  date: string; description: string; amount: string; type: TransactionType;
  category: PaymentCategory; reference: string; account: AccountType;
  studentId: string; feeTypeId: string; term: string;
}

const TERMS = ["Term 1", "Term 2", "Term 3"];
const CATEGORIES: PaymentCategory[] = ["BEAM","PLAN","HIGHERLIFE","CAMFED","CHILDCARE","SELF"];

function generateReceipt(): string {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `MHS-${ts}-${rnd}`;
}

const currentYear = new Date().getFullYear();
const TERM_OPTIONS = TERMS.map(t => `${t} ${currentYear}`);

const INIT: FormState = {
  date: new Date().toISOString().split("T")[0] ?? "",
  description: "", amount: "", type: "DEBIT",
  category: "SELF", reference: "", account: "Cash",
  studentId: "", feeTypeId: "", term: TERM_OPTIONS[0] ?? "",
};

export default function NewTransactionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ ...INIT, reference: generateReceipt() });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeTypeOption[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const studentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/students").then(r => r.json()).then((d: unknown) => {
      if (Array.isArray(d)) setStudents(d as StudentOption[]);
    });
    fetch("/api/fee-types").then(r => r.json()).then((d: unknown) => {
      if (Array.isArray(d)) setFeeTypes(d as FeeTypeOption[]);
    });
  }, [open]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (studentRef.current && !studentRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(p => ({ ...p, [k]: v }));
  }

  function selectStudent(s: StudentOption) {
    set("studentId", s.id);
    setStudentSearch(`${s.firstName} ${s.lastName} (${s.studentId})`);
    setShowDropdown(false);
  }

  function selectFeeType(ft: FeeTypeOption) {
    set("feeTypeId", ft.id);
    set("amount", String(ft.amount));
    set("description", ft.name);
  }

  const filtered = students.filter(s => {
    const q = studentSearch.toLowerCase();
    return `${s.firstName} ${s.lastName} ${s.studentId} ${s.form}`.toLowerCase().includes(q);
  }).slice(0, 8);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.studentId) {
      setError("Please select a student before saving.");
      return;
    }
    if (!form.term) {
      setError("Please select a term.");
      return;
    }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Enter a valid positive amount.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, amount,
          feeTypeId: form.feeTypeId || null,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
      setForm({ ...INIT, reference: generateReceipt() });
      setStudentSearch("");
      setOpen(false);
      router.refresh();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 11px", border: "1px solid var(--border)",
    borderRadius: 6, background: "var(--bg)", color: "var(--text)", fontSize: 14, outline: "none",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-muted)", marginBottom: 4,
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: "9px 16px", background: "var(--navy)", color: "white", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
        Record transaction
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div style={{ background: "var(--surface)", width: "100%", maxWidth: 540, maxHeight: "95vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: "24px 20px 32px" }}>
            <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)" }}>Record Transaction</h2>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 22, cursor: "pointer" }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>

              {/* Student — required */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ ...lbl, display: "flex", alignItems: "center", gap: 4 }}>
                  Student
                  <span style={{ color: "var(--red)", fontSize: 11 }}>*required</span>
                </label>
                <div ref={studentRef} style={{ position: "relative" }}>
                  <input
                    value={studentSearch}
                    onChange={e => {
                      setStudentSearch(e.target.value);
                      setShowDropdown(true);
                      if (!e.target.value) set("studentId", "");
                    }}
                    onFocus={() => setShowDropdown(true)}
                    style={{
                      ...inp,
                      borderColor: !form.studentId && error ? "var(--red)" : "var(--border)",
                    }}
                    placeholder="Search by name or student ID…"
                    autoComplete="off"
                  />
                  {form.studentId && (
                    <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--green)", fontSize: 14 }}>✓</div>
                  )}
                  {showDropdown && filtered.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, zIndex: 50, maxHeight: 200, overflowY: "auto", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                      {filtered.map(s => (
                        <button key={s.id} type="button" onClick={() => selectStudent(s)}
                          style={{ display: "block", width: "100%", padding: "10px 12px", background: "none", border: "none", borderBottom: "1px solid var(--border)", textAlign: "left", cursor: "pointer", fontSize: 13 }}>
                          <span style={{ fontWeight: 600, color: "var(--navy)" }}>{s.firstName} {s.lastName}</span>
                          <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-muted)" }}>{s.studentId} · {s.form}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showDropdown && studentSearch.length > 1 && filtered.length === 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, zIndex: 50, padding: "12px", fontSize: 13, color: "var(--text-muted)" }}>
                      No students found.
                    </div>
                  )}
                </div>
              </div>

              {/* Term */}
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>Term</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TERM_OPTIONS.map(t => (
                    <button key={t} type="button" onClick={() => set("term", t)}
                      style={{ padding: "6px 14px", borderRadius: 5, fontSize: 12, fontWeight: 500, border: "1px solid var(--border)", cursor: "pointer", background: form.term === t ? "var(--navy)" : "var(--bg)", color: form.term === t ? "white" : "var(--text-muted)" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fee type chips */}
              {feeTypes.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <label style={lbl}>Fee Type</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button type="button" onClick={() => { set("feeTypeId", ""); }}
                      style={{ padding: "5px 10px", borderRadius: 5, fontSize: 11, border: "1px solid var(--border)", cursor: "pointer", background: !form.feeTypeId ? "var(--navy)" : "var(--bg)", color: !form.feeTypeId ? "white" : "var(--text-muted)" }}>
                      Other
                    </button>
                    {feeTypes.map(ft => (
                      <button key={ft.id} type="button" onClick={() => selectFeeType(ft)}
                        style={{ padding: "5px 10px", borderRadius: 5, fontSize: 11, fontWeight: 500, border: "1px solid var(--border)", cursor: "pointer", background: form.feeTypeId === ft.id ? "var(--navy)" : "var(--bg)", color: form.feeTypeId === ft.id ? "white" : "var(--text-muted)" }}>
                        {ft.name} <span style={{ opacity: 0.7 }}>· ${ft.amount}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Receipt + date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl} htmlFor="tx-receipt">
                    Receipt No. <span style={{ color: "var(--green)", fontSize: 10 }}>auto</span>
                  </label>
                  <input id="tx-receipt" value={form.reference} onChange={e => set("reference", e.target.value)}
                    style={{ ...inp, fontFamily: "monospace", fontSize: 12 }} required />
                </div>
                <div>
                  <label style={lbl} htmlFor="tx-date">Date</label>
                  <input id="tx-date" type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inp} required />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={lbl} htmlFor="tx-desc">Description</label>
                <input id="tx-desc" value={form.description} onChange={e => set("description", e.target.value)}
                  style={inp} placeholder="Brief description" required />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl} htmlFor="tx-amount">Amount (USD)</label>
                  <input id="tx-amount" type="number" min="0.01" step="0.01" value={form.amount}
                    onChange={e => set("amount", e.target.value)} style={inp} placeholder="0.00" required />
                </div>
                <div>
                  <label style={lbl} htmlFor="tx-type">Type</label>
                  <select id="tx-type" value={form.type} onChange={e => set("type", e.target.value as TransactionType)} style={inp}>
                    <option value="DEBIT">Receipt (Debit)</option>
                    <option value="CREDIT">Payment (Credit)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={lbl} htmlFor="tx-category">Category</label>
                  <select id="tx-category" value={form.category} onChange={e => set("category", e.target.value as PaymentCategory)} style={inp}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl} htmlFor="tx-account">Account</label>
                  <select id="tx-account" value={form.account} onChange={e => set("account", e.target.value as AccountType)} style={inp}>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
              </div>

              {error && (
                <div style={{ padding: "10px 12px", borderRadius: 6, background: "var(--red-bg)", color: "var(--red)", fontSize: 13, marginBottom: 14 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button type="button" onClick={() => setOpen(false)}
                  style={{ padding: "11px", border: "1px solid var(--border)", borderRadius: 7, background: "var(--surface)", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: "11px", border: "none", borderRadius: 7, background: saving ? "var(--border)" : "var(--navy)", color: saving ? "var(--text-muted)" : "white", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                  {saving ? "Saving…" : "Save transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
