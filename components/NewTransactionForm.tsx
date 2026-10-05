"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentCategory, TransactionType, AccountType } from "@/types";

interface FormState {
  date: string;
  description: string;
  amount: string;
  type: TransactionType;
  category: PaymentCategory;
  reference: string;
  account: AccountType;
}

const INITIAL: FormState = {
  date: new Date().toISOString().split("T")[0] ?? "",
  description: "",
  amount: "",
  type: "DEBIT",
  category: "SELF",
  reference: "",
  account: "Cash",
};

const CATEGORIES: PaymentCategory[] = [
  "BEAM", "PLAN", "HIGHERLIFE", "CAMFED", "CHILDCARE", "SELF",
];

export default function NewTransactionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Enter a valid positive amount.");
      setSaving(false);
      return;
    }
    if (!form.reference.trim()) {
      setError("Reference number is required.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to save transaction.");
        return;
      }

      setForm(INITIAL);
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid var(--border)",
    borderRadius: 6,
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text-muted)",
    marginBottom: 4,
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "9px 18px",
          background: "var(--navy)",
          color: "white",
          border: "none",
          borderRadius: 7,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Record transaction
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 12,
              padding: 28,
              width: "100%",
              maxWidth: 520,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)" }}>
                Record Transaction
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: 20,
                  lineHeight: 1,
                  cursor: "pointer",
                  padding: "0 4px",
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle} htmlFor="tx-date">Date</label>
                  <input
                    id="tx-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => set("date", e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="tx-ref">Reference No.</label>
                  <input
                    id="tx-ref"
                    type="text"
                    value={form.reference}
                    onChange={(e) => set("reference", e.target.value)}
                    style={inputStyle}
                    placeholder="e.g. RCP-001"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle} htmlFor="tx-desc">Description</label>
                <input
                  id="tx-desc"
                  type="text"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  style={inputStyle}
                  placeholder="Brief description of the transaction"
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle} htmlFor="tx-amount">Amount (USD)</label>
                  <input
                    id="tx-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => set("amount", e.target.value)}
                    style={inputStyle}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="tx-type">Type</label>
                  <select
                    id="tx-type"
                    value={form.type}
                    onChange={(e) => set("type", e.target.value as TransactionType)}
                    style={inputStyle}
                  >
                    <option value="DEBIT">Receipt (Debit)</option>
                    <option value="CREDIT">Payment (Credit)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle} htmlFor="tx-category">Category</label>
                  <select
                    id="tx-category"
                    value={form.category}
                    onChange={(e) => set("category", e.target.value as PaymentCategory)}
                    style={inputStyle}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle} htmlFor="tx-account">Account</label>
                  <select
                    id="tx-account"
                    value={form.account}
                    onChange={(e) => set("account", e.target.value as AccountType)}
                    style={inputStyle}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 6,
                    background: "var(--red-bg)",
                    color: "var(--red)",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "9px 18px",
                    border: "1px solid var(--border)",
                    borderRadius: 7,
                    background: "var(--surface)",
                    color: "var(--text-muted)",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "9px 18px",
                    border: "none",
                    borderRadius: 7,
                    background: saving ? "var(--border)" : "var(--navy)",
                    color: saving ? "var(--text-muted)" : "white",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
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
