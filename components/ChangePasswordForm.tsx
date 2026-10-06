"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordForm() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to change password."); return; }
      setSuccess(true);
      setCurrent(""); setNext(""); setConfirm("");
      // Sessions invalidated — redirect to login
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 11px",
    border: "1px solid var(--border)",
    borderRadius: 6,
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: 14,
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
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle} htmlFor="cp-current">Current password</label>
        <input id="cp-current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} style={inputStyle} autoComplete="current-password" required />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle} htmlFor="cp-new">New password</label>
        <input id="cp-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} style={inputStyle} autoComplete="new-password" required minLength={8} />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle} htmlFor="cp-confirm">Confirm new password</label>
        <input id="cp-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} autoComplete="new-password" required />
      </div>

      {error && (
        <div style={{ padding: "10px 12px", borderRadius: 6, background: "var(--red-bg)", color: "var(--red)", fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: "10px 12px", borderRadius: 6, background: "var(--green-bg)", color: "var(--green)", fontSize: 13, marginBottom: 14 }}>
          Password changed. Redirecting to login…
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        style={{
          width: "100%",
          padding: "11px",
          border: "none",
          borderRadius: 7,
          background: saving ? "var(--border)" : "var(--navy)",
          color: saving ? "var(--text-muted)" : "white",
          fontSize: 13,
          fontWeight: 600,
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
