import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)", letterSpacing: "-0.4px" }}>
          Settings
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: 13 }}>
          Manage your account
        </p>
      </div>

      <div style={{ maxWidth: 420 }}>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "20px",
            marginBottom: 16,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Logged in as</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{session.username}</div>
            <div
              style={{
                display: "inline-block",
                marginTop: 6,
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 4,
                background: "#eff6ff",
                color: "var(--accent)",
              }}
            >
              {session.role}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "20px",
          }}
        >
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)", marginBottom: 16 }}>
            Change Password
          </h2>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
