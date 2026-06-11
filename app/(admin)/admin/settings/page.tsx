import prisma from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/admin/SettingsClient";

export default async function AdminSettingsPage() {

  // Retrieve admin system tenant configuration
  const systemTenant = await prisma.tenant.findUnique({
    where: { slug: "system-admin-tenant" },
  });

  if (!systemTenant) {
    redirect("/admin");
  }

  // Fallback defaults
  const defaultConfig = {
    branding: {
      platformName: "AIAssist",
      logoUrl: "",
      primaryColor: "#8b5cf6",
      secondaryColor: "#3b82f6",
    },
    aiProviders: {
      openaiActive: true,
      anthropicActive: true,
      geminiActive: true,
      sarvamActive: true,
    },
    emailTemplates: {
      welcomeSubject: "Welcome to AIAssist!",
      welcomeBody: "Hello {{name}},\n\nYour account has been set up successfully. Access your dashboard here: {{loginUrl}}",
      alertSubject: "Security Alert: Failed Login Attempts",
      alertBody: "We detected multiple failed login attempts on your account. If this wasn't you, please secure your profile immediately.",
    },
    notifications: {
      costSpikeThreshold: 50.0,
      tokenLimitThreshold: 90, // 90%
      syncFailureEmail: "alerts@aiassist.com",
    },
    aiPricing: {
      "gpt-4o-mini": { inputPrice: 0.15, outputPrice: 0.60 },
      "gpt-4o": { inputPrice: 2.50, outputPrice: 10.00 },
      "gpt-4-turbo": { inputPrice: 10.00, outputPrice: 30.00 },
      "gpt-3.5-turbo": { inputPrice: 0.50, outputPrice: 1.50 },
      "claude-sonnet-4-20250514": { inputPrice: 3.00, outputPrice: 15.00 },
      "claude-3-haiku-20240307": { inputPrice: 0.25, outputPrice: 1.25 },
      "claude-3-opus-20240229": { inputPrice: 15.00, outputPrice: 75.00 },
      "gemini-1.5-flash": { inputPrice: 0.075, outputPrice: 0.30 },
      "gemini-1.5-pro": { inputPrice: 1.25, outputPrice: 5.00 },
      "gemini-2.0-flash": { inputPrice: 0.10, outputPrice: 0.40 },
      "llama-3.1-70b-versatile": { inputPrice: 0.59, outputPrice: 0.79 },
      "llama-3.1-8b-instant": { inputPrice: 0.05, outputPrice: 0.08 },
      "mixtral-8x7b-32768": { inputPrice: 0.24, outputPrice: 0.24 },
      "saaras:v3": { inputPrice: 0.000033, outputPrice: 0 },
      "bulbul:v3": { inputPrice: 0.00024, outputPrice: 0 },
      "whisper-1": { inputPrice: 0.0001, outputPrice: 0 },
      "tts-1": { inputPrice: 0.000015, outputPrice: 0 },
      "browser-stt": { inputPrice: 0, outputPrice: 0 },
      "browser-tts": { inputPrice: 0, outputPrice: 0 },
    },
  };

  const userSettings = (systemTenant.settings as any) || {};

  const mergedPricing = { ...defaultConfig.aiPricing } as any;
  if (userSettings.aiPricing) {
    Object.keys(userSettings.aiPricing).forEach((modelId) => {
      const rate = userSettings.aiPricing[modelId];
      if (rate) {
        const inputPrice = rate.inputPrice !== undefined ? rate.inputPrice 
                          : (rate.retailInput !== undefined ? rate.retailInput 
                          : (rate.wholesaleInput !== undefined ? rate.wholesaleInput : (defaultConfig.aiPricing as any)[modelId]?.inputPrice || 0));
                          
        const outputPrice = rate.outputPrice !== undefined ? rate.outputPrice 
                           : (rate.retailOutput !== undefined ? rate.retailOutput 
                           : (rate.wholesaleOutput !== undefined ? rate.wholesaleOutput : (defaultConfig.aiPricing as any)[modelId]?.outputPrice || 0));
        
        mergedPricing[modelId] = { inputPrice, outputPrice };
      }
    });
  }

  const config = {
    ...defaultConfig,
    ...userSettings,
    aiPricing: mergedPricing,
  };

  return <SettingsClient initialConfig={config} />;
}
