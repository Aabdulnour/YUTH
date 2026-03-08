import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YUTH",
  description: "AI-powered life assistant for young Canadians navigating taxes, benefits, and financial adulthood.",
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
