import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", letterSpacing: "-0.4px" }}>Settings</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 13 }}>Manage your account and system configuration</p>
      </div>

      <div style={{ display: "grid", gap: 16, maxWidth: 560 }}>
        {/* Account */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>Logged in as</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{session.username}</div>
            <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "#eff6ff", color: "var(--accent)" }}>
              {session.role}
            </span>
          </div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 16 }}>Change Password</h2>
          <ChangePasswordForm />
        </div>

        {/* Admin-only settings */}
        {session.role === "admin" && (
          <>
            <Link href="/dashboard/settings/fee-types" style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
              padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between",
              textDecoration: "none",
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>Fee Types</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                  Configure levy, tuition, building, science and other fee amounts
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </Link>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>ZB Bank SmilePay</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                    Online payment integration — parents pay from their phone
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--amber-bg)", color: "var(--amber)" }}>
                  REQUIRES SETUP
                </span>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: 7, padding: "12px 14px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                <div style={{ marginBottom: 6, fontWeight: 600, color: "var(--navy)", fontSize: 12 }}>Add these to your Vercel environment variables:</div>
                {[
                  ["ZB_API_KEY", "From Settings → API Keys in ZB Merchant Portal"],
                  ["ZB_API_SECRET", "From Settings → API Keys in ZB Merchant Portal"],
                  ["ZB_MERCHANT_ID", "Your merchant ID from ZB portal"],
                  ["ZB_SANDBOX", '"true" for testing, "false" for live'],
                  ["NEXT_PUBLIC_APP_URL", "e.g. https://mbizo-accounts.vercel.app"],
                ].map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 4 }}>
                    <code style={{ fontSize: 11, background: "var(--navy)", color: "#93c5fd", padding: "1px 5px", borderRadius: 3 }}>{k}</code>
                    <span style={{ marginLeft: 6, fontSize: 11 }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontWeight: 600, color: "var(--navy)" }}>Webhook URL to register in ZB portal: </span>
                  <code style={{ fontSize: 11, background: "var(--navy)", color: "#86efac", padding: "1px 5px", borderRadius: 3 }}>
                    {process.env.NEXT_PUBLIC_APP_URL ?? "https://your-app.vercel.app"}/api/zb/webhook
                  </code>
                </div>
              </div>
              <a href="https://zbnet.zb.co.zw/wallet_sandbox_merchant/signup" target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, padding: "7px 14px", background: "var(--navy)", color: "white", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                Register for ZB Merchant Account
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
