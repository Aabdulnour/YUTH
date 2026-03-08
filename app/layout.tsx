import type { Metadata } from "next";
import { ProgressProvider } from "@/hooks/useProgress";
import "./globals.css";

export const metadata: Metadata = {
  title: "YUTH",
  description: "AI-powered Canadian adulthood assistant for young adults.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ProgressProvider>
          {children}
        </ProgressProvider>
      </body>
    </html>
  );
}