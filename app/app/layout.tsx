import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ESC/POS XPrinter Demo",
  description: "Print receipts to a LAN XPrinter via a local agent"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
