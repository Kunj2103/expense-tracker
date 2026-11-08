import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unified Expense Tracker",
  description: "Personal Expense Ledger & Group Expense Splitter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
