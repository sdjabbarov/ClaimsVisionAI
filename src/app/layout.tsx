import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClaimVision AI",
  description: "AI-powered vehicle damage claims assessment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
