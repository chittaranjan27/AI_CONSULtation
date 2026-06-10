import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BubbleBackground from "@/components/BubbleBackground";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AIAssist",
    template: "%s | AIAssist",
  },
  description:
    "Build, deploy, and scale AI-powered consultation chatbots. Capture leads, track analytics, automate workflows, and grow your business with intelligent AI assistants.",
  icons: {
    icon: "/image.png?v=4",
    shortcut: "/favicon.ico?v=4",
    apple: "/image.png?v=4",
  },
  keywords: [
    "AI chatbot",
    "lead generation",
    "consultation AI",
    "SaaS platform",
    "chatbot builder",
    "AI assistant",
    "workflow automation",
    "analytics",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "AIAssist",
    title: "AIAssist — AI Consultation & Lead Conversion Platform",
    description:
      "Build, deploy, and scale AI-powered consultation chatbots. Capture leads, track analytics, automate workflows, and grow your business.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIAssist — AI Consultation & Lead Conversion Platform",
    description:
      "Build, deploy, and scale AI-powered consultation chatbots. Capture leads, track analytics, automate workflows, and grow your business.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-bg-primary text-text-primary antialiased">
        <BubbleBackground />
        {children}
      </body>
    </html>
  );
}

