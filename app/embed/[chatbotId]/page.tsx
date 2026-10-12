import prisma from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { parseAllowedDomains, extractHostname } from "@/lib/security/cors";
import EmbedChat from "./EmbedChat";

interface Props {
  params: Promise<{ chatbotId: string }>;
  searchParams: Promise<{ mode?: string; theme?: string }>;
}

export default async function EmbedPage({ params, searchParams }: Props) {
  const { chatbotId } = await params;
  const { mode = "floating", theme = "dark" } = await searchParams;

  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId },
    select: {
      id: true,
      name: true,
      welcomeMessage: true,
      widgetConfig: true,
      leadCaptureEnabled: true,
      leadCaptureFields: true,
      status: true,
      language: true,
      supportedLanguages: true,
    },
  });

  if (!chatbot || chatbot.status !== "ACTIVE") {
    notFound();
  }

  // Domain restriction enforcement
  const widgetConfig = (chatbot.widgetConfig as Record<string, unknown>) || {};
  const allowedList = parseAllowedDomains(widgetConfig.allowedDomains);

  if (allowedList.length > 0 && !allowedList.includes("*")) {
    const headersList = await headers();
    const referer = headersList.get("referer") || headersList.get("origin");
    const incomingHost = extractHostname(referer);
    const hostHeader = extractHostname(headersList.get("host"));
    const appHost = extractHostname(process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL);

    const isLocalhost = process.env.NODE_ENV !== "production" && (incomingHost === "localhost" || incomingHost === "127.0.0.1");
    const isAppHost = incomingHost && (incomingHost === appHost || incomingHost === hostHeader);

    const isMatch = allowedList.some((allowedDomain) => {
      const clean = allowedDomain.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
      if (incomingHost === clean) return true;
      if (clean.startsWith("*.") && incomingHost?.endsWith(clean.slice(1))) return true;
      if (incomingHost?.endsWith(`.${clean}`)) return true;
      return false;
    });

    if (!isLocalhost && !isAppHost && !isMatch) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6 text-center text-white">
          <div className="max-w-md p-6 rounded-2xl bg-gray-900 border border-red-500/30 space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center font-bold text-xl">
              🛡️
            </div>
            <h2 className="text-lg font-bold">Unauthorized Domain</h2>
            <p className="text-xs text-gray-400">
              This chatbot is restricted to verified domains and cannot be embedded from this site.
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <EmbedChat
      chatbotId={chatbot.id}
      botName={chatbot.name}
      welcomeMessage={chatbot.welcomeMessage || "Hello! How can I help you today?"}
      leadCaptureEnabled={chatbot.leadCaptureEnabled}
      widgetConfig={chatbot.widgetConfig as Record<string, string> | null}
      mode={mode}
      theme={theme}
      language={chatbot.language || "en"}
      supportedLanguages={chatbot.supportedLanguages}
    />
  );
}
