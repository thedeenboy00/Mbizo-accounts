"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FeeType } from "@/lib/feeTypes";

interface Props { initialFeeTypes: FeeType[] }

export default function FeeTypesManager({ initialFeeTypes }: Props) {
  const router = useRouter();
  const [feeTypes, setFeeTypes] = useState<FeeType[]>(initialFeeTypes);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editName, setEditName] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSaving(true);
    const res = await fetch("/api/fee-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, amount: Number(newAmount), description: newDesc }),
    });
    const data = await res.json() as { error?: string; id?: string };
    if (!res.ok) { setError(data.error ?? "Failed to add."); setSaving(false); return; }
    setNewName(""); setNewAmount(""); setNewDesc(""); setAdding(false); setSaving(false);
    router.refresh();
    const updated = await fetch("/api/fee-types").then(r => r.json()) as FeeType[];
    setFeeTypes(updated);
  }

  async function handleToggle(ft: FeeType) {
    await fetch(`/api/fee-types/${ft.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !ft.active }),
    });
    setFeeTypes(prev => prev.map(f => f.id === ft.id ? { ...f, active: !f.active } : f));
  }

  async function handleSaveEdit(id: string) {
    setSaving(true);
    await fetch(`/api/fee-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, amount: Number(editAmount) }),
    });
    setFeeTypes(prev => prev.map(f => f.id === id ? { ...f, name: editName, amount: Number(editAmount) } : f));
    setEditId(null); setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this fee type? This cannot be undone if it has payments linked.")) return;
    const res = await fetch(`/api/fee-types/${id}`, { method: "DELETE" });
    if (!res.ok) { alert("Cannot delete — this fee type has existing payments."); return; }
    setFeeTypes(prev => prev.filter(f => f.id !== id));
  }

  const input: React.CSSProperties = { padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg)", color: "var(--text)", fontSize: 13, outline: "none" };

  return (
    <div style={{ maxWidth: 560 }}>
      {/* Fee type list */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
        {feeTypes.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No fee types configured yet. Add one below.
          </div>
        )}
        {feeTypes.map((ft, i) => (
          <div key={ft.id} style={{ padding: "14px 16px", borderBottom: i < feeTypes.length - 1 ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", gap: 12 }}>
            {editId === ft.id ? (
              <>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={{ ...input, flex: 1 }} />
                <input value={editAmount} onChange={e => setEditAmount(e.target.value)} style={{ ...input, width: 90 }} type="number" min="0" step="0.01" />
                <button onClick={() => handleSaveEdit(ft.id)} disabled={saving} style={{ padding: "6px 12px", background: "var(--navy)", color: "white", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save</button>
                <button onClick={() => setEditId(null)} style={{ padding: "6px 10px", background: "none", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
              </>
            ) : (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: ft.active ? "var(--navy)" : "var(--text-muted)" }}>{ft.name}</span>
                    {!ft.active && <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: "var(--border)", color: "var(--text-muted)" }}>INACTIVE</span>}
                  </div>
                  {ft.description && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{ft.description}</div>}
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--green)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  USD {ft.amount.toLocaleString("en-ZW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <button onClick={() => { setEditId(ft.id); setEditName(ft.name); setEditAmount(String(ft.amount)); }} style={{ padding: "5px 10px", background: "none", border: "1px solid var(--border)", borderRadius: 5, fontSize: 11, cursor: "pointer", color: "var(--text-muted)" }}>Edit</button>
                <button onClick={() => handleToggle(ft)} style={{ padding: "5px 10px", background: "none", border: "1px solid var(--border)", borderRadius: 5, fontSize: 11, cursor: "pointer", color: ft.active ? "var(--amber)" : "var(--green)" }}>
                  {ft.active ? "Disable" : "Enable"}
                </button>
                <button onClick={() => handleDelete(ft.id)} style={{ padding: "5px 10px", background: "none", border: "1px solid #fca5a520", borderRadius: 5, fontSize: 11, cursor: "pointer", color: "var(--red)" }}>Del</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add new */}
      {!adding ? (
        <button onClick={() => setAdding(true)} style={{ padding: "9px 18px", background: "var(--navy)", color: "white", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Add fee type
        </button>
      ) : (
        <form onSubmit={handleAdd} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)", marginBottom: 14 }}>New Fee Type</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} style={{ ...input, width: "100%" }} placeholder="e.g. Levy Fee" required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>Amount (USD)</label>
              <input value={newAmount} onChange={e => setNewAmount(e.target.value)} style={{ ...input, width: "100%" }} type="number" min="0" step="0.01" placeholder="0.00" required />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 3 }}>Description (optional)</label>
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ ...input, width: "100%" }} placeholder="e.g. Annual school levy" />
          </div>
          {error && <div style={{ padding: "8px 10px", borderRadius: 5, background: "var(--red-bg)", color: "var(--red)", fontSize: 12, marginBottom: 10 }}>{error}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={saving} style={{ padding: "8px 18px", background: saving ? "var(--border)" : "var(--navy)", color: saving ? "var(--text-muted)" : "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => { setAdding(false); setError(""); }} style={{ padding: "8px 14px", background: "none", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, cursor: "pointer", color: "var(--text-muted)" }}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
