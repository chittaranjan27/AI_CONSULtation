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
    default: "AI Consultation & Lead Conversion Platform",
    template: "%s | Brahma Graha",
  },
  description:
    "Build, deploy, and scale AI-powered consultation chatbots. Capture leads, track analytics, automate workflows, and grow your business with intelligent AI assistants.",
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
    siteName: "Brahma Graha",
    title: "Brahma Graha — AI Consultation & Lead Conversion Platform",
    description:
      "Build, deploy, and scale AI-powered consultation chatbots. Capture leads, track analytics, automate workflows, and grow your business.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brahma Graha — AI Consultation & Lead Conversion Platform",
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

