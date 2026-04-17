import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quran App - Read with Tafsir & Hadith",
  description: "Read the Holy Quran with tafsir explanations and related hadith",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="rtl">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}