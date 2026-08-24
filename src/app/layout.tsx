import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fontSerif = Source_Serif_4({
  variable: "--font-serif-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Student Center",
  description:
    "Student Center scholarship evaluation platform — manage applications, score candidates objectively, and select the most deserving Grade 9 students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fontSerif.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full flex antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
