import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--navy)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, padding: "0 16px" }}>
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="3" width="20" height="14" rx="2" stroke="white" strokeWidth="1.5" />
              <path d="M8 21h8M12 17v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M7 8h10M7 11h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1
            style={{
              color: "white",
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "-0.3px",
            }}
          >
            Mbizo High School
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>
            Accounts Department
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
