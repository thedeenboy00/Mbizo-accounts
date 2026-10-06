import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar username={session.username} />
      <main
        style={{
          flex: 1,
          minHeight: "100vh",
          background: "var(--bg)",
          overflowX: "hidden",
        }}
        className="dashboard-main"
      >
        <div
          style={{ padding: "24px 16px" }}
          className="dashboard-content"
        >
          {children}
        </div>
      </main>
      <style>{`
        @media (min-width: 768px) {
          .dashboard-main {
            margin-left: 220px;
          }
          .dashboard-content {
            padding: 32px 32px !important;
          }
        }
        @media (max-width: 767px) {
          .dashboard-main {
            padding-top: 52px;
          }
        }
      `}</style>
    </div>
  );
}
