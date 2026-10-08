"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ImportRow {
  studentId: string; firstName: string; lastName: string;
  form: string; class: string; termFee: string;
}

type ImportMode = "file" | "bulk";

function parseCSV(text: string): ImportRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0]!.split(",").map(h => h.trim().replace(/^"|"$/g, "").toLowerCase());

  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return {
      studentId: row["studentid"] ?? row["student_id"] ?? row["student id"] ?? "",
      firstName: row["firstname"] ?? row["first_name"] ?? row["first name"] ?? "",
      lastName:  row["lastname"]  ?? row["last_name"]  ?? row["last name"]  ?? "",
      form:      row["form"]      ?? "",
      class:     row["class"]     ?? "",
      termFee:   row["termfee"]   ?? row["term_fee"]   ?? row["term fee"]   ?? "0",
    };
  }).filter(r => r.studentId || r.firstName);
}

const EMPTY_ROW: ImportRow = { studentId:"", firstName:"", lastName:"", form:"Form 1", class:"", termFee:"" };
const FORMS = ["Form 1","Form 2","Form 3","Form 4","Form 5","Form 6"];

export default function ImportStudentsButton() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ImportMode>("file");
  const [rows, setRows] = useState<ImportRow[]>([{ ...EMPTY_ROW }]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created:number; skipped:number; errors:string[] } | null>(null);
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) { setError("Could not parse file. Make sure it has headers: studentId, firstName, lastName, form, class, termFee"); return; }
      setRows(parsed);
      setError("");
    };
    reader.readAsText(file);
  }

  function updateRow(i: number, k: keyof ImportRow, v: string) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  }

  function addRow() { setRows(prev => [...prev, { ...EMPTY_ROW }]); }
  function removeRow(i: number) { setRows(prev => prev.filter((_, idx) => idx !== i)); }

  async function handleImport() {
    setError(""); setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json() as { created?:number; skipped?:number; errors?:string[]; error?:string };
      if (!res.ok) { setError(data.error ?? "Import failed."); return; }
      setResult({ created: data.created ?? 0, skipped: data.skipped ?? 0, errors: data.errors ?? [] });
      router.refresh();
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  const input: React.CSSProperties = { padding:"7px 9px", border:"1px solid var(--border)", borderRadius:5, background:"var(--bg)", color:"var(--text)", fontSize:12, outline:"none", width:"100%" };

  return (
    <>
      <button onClick={() => { setOpen(true); setResult(null); setError(""); }} style={{ padding:"9px 16px", background:"var(--surface)", color:"var(--navy)", border:"1px solid var(--border)", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
        Import students
      </button>

      {open && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div style={{ background:"var(--surface)", width:"100%", maxWidth:680, maxHeight:"95vh", overflowY:"auto", borderRadius:"16px 16px 0 0", padding:"24px 20px 32px" }}>
            <div style={{ width:36, height:4, background:"var(--border)", borderRadius:2, margin:"0 auto 20px" }} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:"var(--navy)" }}>Import Students</h2>
              <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", color:"var(--text-muted)", fontSize:22, cursor:"pointer" }}>×</button>
            </div>

            {/* Mode tabs */}
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              {(["file","bulk"] as ImportMode[]).map(m => (
                <button key={m} onClick={() => { setMode(m); setRows([{ ...EMPTY_ROW }]); setResult(null); setError(""); }}
                  style={{ padding:"7px 16px", borderRadius:6, fontSize:13, fontWeight:500, border:"1px solid var(--border)", cursor:"pointer", background:mode===m?"var(--navy)":"var(--surface)", color:mode===m?"white":"var(--text-muted)" }}>
                  {m === "file" ? "📄 Upload File" : "✏️ Bulk Manual Entry"}
                </button>
              ))}
            </div>

            {mode === "file" && (
              <div style={{ marginBottom:20 }}>
                <div style={{ padding:"20px", border:"2px dashed var(--border)", borderRadius:8, textAlign:"center", marginBottom:12 }}>
                  <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display:"none" }} />
                  <button onClick={() => fileRef.current?.click()} style={{ padding:"9px 18px", background:"var(--navy)", color:"white", border:"none", borderRadius:7, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:8 }}>
                    Choose CSV file
                  </button>
                  <p style={{ fontSize:12, color:"var(--text-muted)", margin:0 }}>Supports .csv files</p>
                </div>
                <div style={{ background:"var(--amber-bg)", border:"1px solid #fbbf2420", borderRadius:6, padding:"10px 12px", fontSize:12, color:"var(--amber)" }}>
                  <strong>Required CSV columns:</strong> studentId, firstName, lastName, form, class, termFee
                  <br />
                  <strong>Example:</strong> MHS-2024-001, Tatenda, Moyo, Form 1, 1A, 350
                </div>
              </div>
            )}

            {/* Preview / Bulk table */}
            {rows.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--navy)", marginBottom:8 }}>
                  {mode === "file" ? `Preview — ${rows.length} student${rows.length !== 1 ? "s" : ""}` : "Enter students"}
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ minWidth:560, width:"100%" }}>
                    <thead>
                      <tr style={{ background:"#f8fafc", borderBottom:"1px solid var(--border)" }}>
                        {["Student ID","First","Last","Form","Class","Fee (USD)",""].map(h => (
                          <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:600, color:"var(--navy)", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} style={{ borderBottom:"1px solid var(--border)" }}>
                          {(["studentId","firstName","lastName","form","class","termFee"] as (keyof ImportRow)[]).map(k => (
                            <td key={k} style={{ padding:"6px 6px" }}>
                              {k === "form" ? (
                                <select value={r[k]} onChange={e => updateRow(i, k, e.target.value)} style={input}>
                                  {FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                              ) : (
                                <input value={r[k]} onChange={e => updateRow(i, k, e.target.value)} style={input} type={k === "termFee" ? "number" : "text"} min={k === "termFee" ? "0" : undefined} step={k === "termFee" ? "0.01" : undefined} />
                              )}
                            </td>
                          ))}
                          <td style={{ padding:"6px 6px" }}>
                            <button onClick={() => removeRow(i)} style={{ background:"none", border:"none", color:"var(--red)", cursor:"pointer", fontSize:16, padding:"0 4px" }}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {mode === "bulk" && (
                  <button onClick={addRow} style={{ marginTop:10, padding:"7px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:6, fontSize:12, color:"var(--navy)", cursor:"pointer" }}>
                    + Add row
                  </button>
                )}
              </div>
            )}

            {error && <div style={{ padding:"10px 12px", borderRadius:6, background:"var(--red-bg)", color:"var(--red)", fontSize:13, marginBottom:14 }}>{error}</div>}

            {result && (
              <div style={{ padding:"12px 14px", borderRadius:6, background:"var(--green-bg)", color:"var(--green)", fontSize:13, marginBottom:14 }}>
                <strong>Done.</strong> {result.created} student{result.created !== 1 ? "s" : ""} imported
                {result.skipped > 0 ? `, ${result.skipped} skipped (already exist)` : ""}.
                {result.errors.length > 0 && (
                  <ul style={{ marginTop:6, paddingLeft:16 }}>
                    {result.errors.map((e, i) => <li key={i} style={{ fontSize:12, color:"var(--amber)" }}>{e}</li>)}
                  </ul>
                )}
              </div>
            )}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <button onClick={() => setOpen(false)} style={{ padding:"11px", border:"1px solid var(--border)", borderRadius:7, background:"var(--surface)", color:"var(--text-muted)", fontSize:13, cursor:"pointer" }}>Close</button>
              <button onClick={handleImport} disabled={loading || rows.length === 0}
                style={{ padding:"11px", border:"none", borderRadius:7, background:loading?"var(--border)":"var(--navy)", color:loading?"var(--text-muted)":"white", fontSize:13, fontWeight:600, cursor:loading?"not-allowed":"pointer" }}>
                {loading ? "Importing…" : `Import ${rows.length} student${rows.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
