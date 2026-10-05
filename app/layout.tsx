import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mbizo High School — Accounts",
  description: "Integrated accounts payment and cash-book system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
