import prisma from "@/lib/db/prisma";
import { notFound } from "next/navigation";
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
