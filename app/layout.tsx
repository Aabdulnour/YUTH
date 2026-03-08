import type { Metadata } from "next";
import { ProgressProvider } from "@/hooks/useProgress";
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
      <body className="antialiased">
        <ProgressProvider>
          {children}
        </ProgressProvider>
      </body>
    </html>
  );
}