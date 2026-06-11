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
  };

  const config = systemTenant.settings
    ? { ...defaultConfig, ...(systemTenant.settings as any) }
    : defaultConfig;

  return <SettingsClient initialConfig={config} />;
}
