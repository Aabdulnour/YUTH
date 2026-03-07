import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MapleMind",
  description: "AI-powered Canadian adulthood assistant for young adults.",
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
