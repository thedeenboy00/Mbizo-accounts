"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/transactions",
    label: "Transactions",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M3 9h18M3 15h18M12 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/cashbook",
    label: "Cash Book",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16v16H4zM4 9h16M9 9v11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/trial-balance",
    label: "Trial Balance",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="6" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="18" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/students",
    label: "Students",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 21v-2a6 6 0 0 1 6-6h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M16 16l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

interface SidebarProps {
  username: string;
}

export default function Sidebar({ username }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close sidebar on route change
  const prevPathname = useState(pathname)[0];
  if (prevPathname !== pathname && open) {
    setOpen(false);
  }

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const navLink = (item: typeof NAV_ITEMS[0]) => {
    const active = isActive(item.href);
    return (
      <a
        key={item.href}
        href={item.href}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 7,
          marginBottom: 2,
          fontSize: 13,
          fontWeight: active ? 600 : 400,
          color: active ? "white" : "rgba(255,255,255,0.55)",
          background: active ? "rgba(255,255,255,0.12)" : "transparent",
        }}
      >
        <span style={{ opacity: active ? 1 : 0.6, flexShrink: 0 }}>{item.icon}</span>
        {item.label}
      </a>
    );
  };

  const sidebarContent = (
    <div
      style={{
        width: 220,
        background: "var(--navy)",
        height: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "white", letterSpacing: "-0.2px" }}>
            Mbizo High School
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
            Accounts Department
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            padding: 4,
            display: "none",
          }}
          className="sidebar-close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px" }}>
        {NAV_ITEMS.map(navLink)}
      </nav>

      {/* Footer */}
      <div style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>
            {username[0]?.toUpperCase() ?? "A"}
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {username}
          </span>
        </div>

        {/* Change password */}
        <a
          href="/dashboard/settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 7,
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
            marginBottom: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Change password
        </a>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 7,
            border: "none",
            background: loggingOut ? "rgba(185,28,28,0.1)" : "rgba(185,28,28,0.2)",
            color: loggingOut ? "rgba(252,165,165,0.5)" : "#fca5a5",
            fontSize: 12,
            fontWeight: 500,
            cursor: loggingOut ? "not-allowed" : "pointer",
            textAlign: "left",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Hamburger — mobile topbar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 52,
          background: "var(--navy)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          zIndex: 8,
        }}
        className="mobile-topbar"
      >
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          style={{
            background: "none",
            border: "none",
            color: "white",
            padding: 4,
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Mbizo Accounts</span>
      </div>

      {/* Overlay */}
      <div
        className={`sidebar-overlay${open ? " open" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* Desktop sidebar */}
      <aside
        style={{
          width: 220,
          background: "var(--navy)",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        className="desktop-sidebar"
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: open ? 0 : -240,
          width: 220,
          height: "100vh",
          zIndex: 10,
          transition: "left 0.25s ease",
        }}
        className="mobile-sidebar"
        aria-hidden={!open}
      >
        {sidebarContent}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .mobile-topbar { display: none !important; }
          .mobile-sidebar { display: none !important; }
          .sidebar-overlay { display: none !important; }
          .desktop-sidebar { display: flex !important; }
        }
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .sidebar-close { display: flex !important; }
        }
      `}</style>
    </>
  );
}
