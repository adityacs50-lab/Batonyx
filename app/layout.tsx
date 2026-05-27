import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Batonyx MVP",
  description: "AI-powered Sales-to-CS handoff assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
