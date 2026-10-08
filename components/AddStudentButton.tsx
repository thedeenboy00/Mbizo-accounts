"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FORMS = ["Form 1","Form 2","Form 3","Form 4","Form 5","Form 6"];

interface FormState {
  studentId: string; firstName: string; lastName: string;
  form: string; class: string; termFee: string;
}

const INIT: FormState = { studentId:"", firstName:"", lastName:"", form:"Form 1", class:"", termFee:"" };

export default function AddStudentButton() {
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
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, termFee: Number(form.termFee) }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to add student."); return; }
      setForm(INIT); setOpen(false); router.refresh();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  }

  const input: React.CSSProperties = { width:"100%", padding:"9px 11px", border:"1px solid var(--border)", borderRadius:6, background:"var(--bg)", color:"var(--text)", fontSize:14, outline:"none" };
  const label: React.CSSProperties = { display:"block", fontSize:12, fontWeight:500, color:"var(--text-muted)", marginBottom:4 };

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding:"9px 16px", background:"var(--navy)", color:"white", border:"none", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
        Add student
      </button>

      {open && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div style={{ background:"var(--surface)", width:"100%", maxWidth:500, maxHeight:"92vh", overflowY:"auto", borderRadius:"16px 16px 0 0", padding:"24px 20px 32px" }}>
            <div style={{ width:36, height:4, background:"var(--border)", borderRadius:2, margin:"0 auto 20px" }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:"var(--navy)" }}>Add Student</h2>
              <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", color:"var(--text-muted)", fontSize:22, cursor:"pointer" }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:12 }}>
                <label style={label} htmlFor="s-id">Student ID</label>
                <input id="s-id" value={form.studentId} onChange={e => set("studentId", e.target.value)} style={input} placeholder="e.g. MHS-2024-001" required />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div>
                  <label style={label} htmlFor="s-fn">First Name</label>
                  <input id="s-fn" value={form.firstName} onChange={e => set("firstName", e.target.value)} style={input} required />
                </div>
                <div>
                  <label style={label} htmlFor="s-ln">Last Name</label>
                  <input id="s-ln" value={form.lastName} onChange={e => set("lastName", e.target.value)} style={input} required />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div>
                  <label style={label} htmlFor="s-form">Form</label>
                  <select id="s-form" value={form.form} onChange={e => set("form", e.target.value)} style={input}>
                    {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label} htmlFor="s-class">Class</label>
                  <input id="s-class" value={form.class} onChange={e => set("class", e.target.value)} style={input} placeholder="e.g. 1A" required />
                </div>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={label} htmlFor="s-fee">Term Fee (USD)</label>
                <input id="s-fee" type="number" min="0" step="0.01" value={form.termFee} onChange={e => set("termFee", e.target.value)} style={input} placeholder="0.00" required />
              </div>

              {error && <div style={{ padding:"10px 12px", borderRadius:6, background:"var(--red-bg)", color:"var(--red)", fontSize:13, marginBottom:14 }}>{error}</div>}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <button type="button" onClick={() => setOpen(false)} style={{ padding:"11px", border:"1px solid var(--border)", borderRadius:7, background:"var(--surface)", color:"var(--text-muted)", fontSize:13, cursor:"pointer" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding:"11px", border:"none", borderRadius:7, background:saving?"var(--border)":"var(--navy)", color:saving?"var(--text-muted)":"white", fontSize:13, fontWeight:600, cursor:saving?"not-allowed":"pointer" }}>
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
