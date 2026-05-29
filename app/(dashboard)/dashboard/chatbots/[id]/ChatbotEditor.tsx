"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Bot,
  Settings,
  Code,
  FileText,
  Target,
  Palette,
  Loader2,
  Copy,
  Check,
  Trash2,
  Upload,
  X,
  Zap,
  MessageSquare,
  Users,
  ExternalLink,
  ShoppingBag,
  Plus,
  Edit2,
  Workflow,
  Coins,
  Cpu,
  TrendingUp,
  BarChart3,
  Layers,
  Info,
  Globe,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface ChatbotDoc {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  status: string;
  chunkCount: number;
  createdAt: string;
}

interface EditorProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  category: string | null;
  checkoutUrl: string | null;
  isActive: boolean;
  chatbotId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChatbotData {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  welcomeMessage: string | null;
  aiProvider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  status: string;
  language: string;
  supportedLanguages?: string[];
  widgetMode: string;
  widgetPosition: string;
  widgetConfig: Record<string, string> | null;
  leadCaptureEnabled: boolean;
  documents: ChatbotDoc[];
  _count: { conversations: number; leads: number };
  consultationSteps?: unknown;
}

interface ApiKeyInfo {
  id: string;
  provider: string;
  isActive: boolean;
}

interface ChatbotAnalytics {
  monthlyUsage: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  dailyTrends: {
    date: string;
    label: string;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }[];
  conversations: any[];
  leads: any[];
}

interface ChatbotEditorProps {
  chatbot: ChatbotData;
  apiKeys: ApiKeyInfo[];
  appUrl: string;
  analytics?: ChatbotAnalytics;
}

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "ai", label: "AI Config", icon: Zap },
  { id: "analytics", label: "Analytics & Usage", icon: TrendingUp },
  { id: "widget", label: "Widget", icon: Palette },
  { id: "steps", label: "Intake Steps", icon: Workflow },
  { id: "knowledge", label: "Knowledge", icon: FileText },
  { id: "products", label: "Products Catalog", icon: ShoppingBag },
  { id: "embed", label: "Embed Code", icon: Code },
];

const PROVIDERS = [
  { value: "OPENAI", label: "OpenAI" },
  { value: "ANTHROPIC", label: "Anthropic" },
  { value: "GEMINI", label: "Google Gemini" },
  { value: "GROQ", label: "Groq" },
  { value: "OPENROUTER", label: "OpenRouter" },
];

const MODELS: Record<string, { value: string; label: string }[]> = {
  OPENAI: [
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
  ANTHROPIC: [
    { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
    { value: "claude-3-haiku", label: "Claude 3 Haiku" },
    { value: "claude-3-opus", label: "Claude 3 Opus" },
  ],
  GEMINI: [
    { value: "gemini-flash", label: "Gemini 1.5 Flash" },
    { value: "gemini-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-2-flash", label: "Gemini 2.0 Flash" },
  ],
  GROQ: [
    { value: "llama-3.1-70b", label: "Llama 3.1 70B" },
    { value: "llama-3.1-8b", label: "Llama 3.1 8B" },
  ],
  OPENROUTER: [
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini (via OR)" },
    { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 (via OR)" },
  ],
};

interface EditorConsultationStep {
  stepNumber: number;
  title: string;
  prompt: string;
  inputType?: "options" | "text";
  options?: string[];
}

const DEFAULT_STEPS: EditorConsultationStep[] = [
  {
    stepNumber: 1,
    title: "Concern Selection",
    prompt: "Warmly welcome the user by name (if known). Use a professional, clinical, and empathetic tone appropriate for intimate wellness. Ask them what brings them here today. You MUST call the 'show_options' tool with these concern options: ['🌿 Intimate Itching & Irritation', '🌬️ Odor & Freshness Concerns', '🏃‍♂️ Sweat & Chafing (Active Lifestyle)', '✨ Daily Hygiene & pH Care', '❓ Something Else']. Do NOT answer other questions or offer products yet. After they select an option, call 'update_consultation_step' with stepNumber 2.",
    inputType: "options",
    options: [
      "🌿 Intimate Itching & Irritation",
      "🌬️ Odor & Freshness Concerns",
      "🏃‍♂️ Sweat & Chafing (Active Lifestyle)",
      "✨ Daily Hygiene & pH Care",
      "❓ Something Else"
    ]
  },
  {
    stepNumber: 2,
    title: "Single Follow-up Question",
    prompt: "Briefly acknowledge the concern they selected with empathy and clinical understanding (1 sentence max). Ask EXACTLY ONE relevant follow-up question to understand their lifestyle or duration of the issue.\n\nYou MUST call the 'show_options' tool to display the appropriate sub-options. Identify what the user selected in Step 1, and present the corresponding array of choices:\n\n- If selection was \"🌿 Intimate Itching & Irritation\":\n  Use options: ['Less than a week', '1-4 weeks', 'Over a month', 'Recurring issue']\n  \n- If selection was \"🌬️ Odor & Freshness Concerns\":\n  Use options: ['After workouts', 'Throughout the day', 'Mostly in hot weather', 'All the time']\n  \n- If selection was \"🏃‍♂️ Sweat & Chafing (Active Lifestyle)\":\n  Use options: ['During/After workouts', 'Throughout the work day', 'Mostly in hot weather']\n  \n- If selection was \"✨ Daily Hygiene & pH Care\":\n  Use options: ['Currently use body soap', 'Use nothing specific', 'Already use an intimate wash']\n  \n- If selection was \"❓ Something Else\":\n  Use options: ['General wellness routine', 'Product recommendations', 'Hygiene tips']\n  \nAfter they answer, call 'update_consultation_step' with stepNumber 3.",
    inputType: "options",
    options: []
  },
  {
    stepNumber: 3,
    title: "Clinical Explanation & Recommendation Offer",
    prompt: "Provide a short, plain-language clinical explanation (2-3 sentences) of WHY their selected concern happens (e.g., pH imbalance for itching/odor, skin friction for chafing, harsh soap disrupting microbiome for daily care). Do NOT ask another diagnostic question. Then ask if they would like to see a natural, pH-balanced wash designed specifically to address this. You MUST call the 'show_options' tool with options: ['✅ Yes, show me the solution', '🚫 No, thank you']. If they select 'Yes', call 'update_consultation_step' with stepNumber 4. If they select 'No', call 'update_consultation_step' with stepNumber 6.",
    inputType: "options",
    options: [
      "✅ Yes, show me the solution",
      "🚫 No, thank you"
    ]
  },
  {
    stepNumber: 4,
    title: "Product Display",
    prompt: "The user expressed interest. Call the 'fetch_products' tool to display the BrahmaGra product catalog on screen. In your text response, mention ONLY the product name and a very brief description/benefit (1 sentence). Let the product card display the remaining details, pricing, and specs. Avoid repeating pricing or long descriptions in your message. Say something like: \"I recommend the [Product Name], [Short Description] — check the product card below for all details.\" Keep your text to 1-2 sentences only and let the product card do the talking. You MUST call the 'show_options' tool with options: ['💳 I'd like to buy this', '📋 Tell me more about the ingredients', '🤔 I have other questions']. After they respond, call 'update_consultation_step' with stepNumber 5.",
    inputType: "options",
    options: [
      "💳 I'd like to buy this",
      "📋 Tell me more about the ingredients",
      "🤔 I have other questions"
    ]
  },
  {
    stepNumber: 5,
    title: "Product Benefits & Checkout Guidance",
    prompt: "Based on the user's response from Step 4: If they want to buy, guide them to use the 'Buy Now' button on the product card displayed above. If they asked about ingredients, do NOT write long ingredient lists or repeat product card details; briefly mention that the product has a pH-balanced formula (pH 5.5) with natural extracts (Tea Tree, Aloe Vera, Neem), and point them to the product card for the full list. If they had other questions, answer them very concisely using your knowledge base. Keep your response very brief and let the product card display the rest. You MUST call the 'show_options' tool with options: ['🛒 Proceed to checkout', '💬 I have another concern', '👋 That's all, thank you']. If they select 'another concern', call 'update_consultation_step' with stepNumber 1. If they select 'that's all', call 'update_consultation_step' with stepNumber 6.",
    inputType: "options",
    options: [
      "🛒 Proceed to checkout",
      "💬 I have another concern",
      "👋 That's all, thank you"
    ]
  },
  {
    stepNumber: 6,
    title: "Warp-up & Farewell",
    prompt: "Politely wrap up the conversation. Reassure them that intimate wellness is important and they made a great step by having this conversation. Let them know they can return anytime for more guidance. You MUST call the 'show_options' tool with options: ['🔄 Start a new consultation', '👋 End chat']. If they select 'Start a new consultation', call 'update_consultation_step' with stepNumber 1.",
    inputType: "options",
    options: [
      "🔄 Start a new consultation",
      "👋 End chat"
    ]
  }
];

export default function ChatbotEditor({
  chatbot,
  apiKeys,
  appUrl,
  analytics,
}: ChatbotEditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [tokenTrendMetric, setTokenTrendMetric] = useState<"tokens" | "cost">("tokens");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [name, setName] = useState(chatbot.name);
  const [description, setDescription] = useState(chatbot.description || "");
  const [systemPrompt, setSystemPrompt] = useState(chatbot.systemPrompt);
  const [welcomeMessage, setWelcomeMessage] = useState(chatbot.welcomeMessage || "");
  const [aiProvider, setAiProvider] = useState(chatbot.aiProvider);
  const [model, setModel] = useState(chatbot.model);
  const [temperature, setTemperature] = useState(chatbot.temperature);
  const [maxTokens, setMaxTokens] = useState(chatbot.maxTokens);
  const [status, setStatus] = useState(chatbot.status);
  const [language, setLanguage] = useState(chatbot.language || "en");
  const [widgetMode, setWidgetMode] = useState(chatbot.widgetMode || "FLOATING");
  const [widgetPosition, setWidgetPosition] = useState(chatbot.widgetPosition);
  const [leadCaptureEnabled, setLeadCaptureEnabled] = useState(chatbot.leadCaptureEnabled);
  const [botIconUrl, setBotIconUrl] = useState(chatbot.widgetConfig?.botIconUrl || "");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(chatbot.widgetConfig?.backgroundImageUrl || "");
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(chatbot.supportedLanguages || ["en"]);

  const availableLanguages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "ar", name: "Arabic", flag: "🇸🇦" },
    { code: "ur", name: "Urdu", flag: "🇵🇰" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "pt", name: "Portuguese", flag: "🇧🇷" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
  ];

  // Consultation Steps state
  const [consultationSteps, setConsultationSteps] = useState<EditorConsultationStep[]>(() => {
    if (Array.isArray(chatbot.consultationSteps)) {
      return (chatbot.consultationSteps as unknown[])
        .map((step) => {
          const s = step as Record<string, unknown>;
          return {
            stepNumber: Number(s?.stepNumber || 1),
            title: String(s?.title || ""),
            prompt: String(s?.prompt || ""),
            inputType: (s?.inputType as "options" | "text") || "options",
            options: Array.isArray(s?.options) ? s.options.map(String) : [],
          };
        })
        .sort((a, b) => a.stepNumber - b.stepNumber);
    }
    return DEFAULT_STEPS;
  });
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<EditorConsultationStep | null>(null);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [stepFormData, setStepFormData] = useState({
    stepNumber: "",
    title: "",
    prompt: "",
    inputType: "options" as "options" | "text",
    options: "",
  });

  // Products Tab State
  const [products, setProducts] = useState<EditorProduct[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditorProduct | null>(null);
  const [isProductSubmitLoading, setIsProductSubmitLoading] = useState(false);
  const [productFormData, setProductFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    category: "hair_care",
    checkoutUrl: "",
    isActive: true,
  });

  const fetchProducts = async () => {
    try {
      setIsProductsLoading(true);
      const res = await fetch(`/api/products?chatbotId=${chatbot.id}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setIsProductsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "products") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleProductCreateOpen = () => {
    setEditingProduct(null);
    setProductFormData({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      category: "hair_care",
      checkoutUrl: "",
      isActive: true,
    });
    setIsProductModalOpen(true);
  };

  const handleProductEditOpen = (product: EditorProduct) => {
    setEditingProduct(product);
    setProductFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      imageUrl: product.imageUrl || "",
      category: product.category || "hair_care",
      checkoutUrl: product.checkoutUrl || "",
      isActive: product.isActive,
    });
    setIsProductModalOpen(true);
  };

  const handleProductDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productFormData.name || !productFormData.price) return;
    setIsProductSubmitLoading(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productFormData,
          chatbotId: chatbot.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to save product");
      await fetchProducts();
      setIsProductModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setIsProductSubmitLoading(false);
    }
  };

  // Knowledge base state
  const [kbContent, setKbContent] = useState("");
  const [kbFilename, setKbFilename] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState(chatbot.documents);
  const [fileUploadLoading, setFileUploadLoading] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setFileUploadLoading(true);
    setFileUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatbotId", chatbot.id);

    try {
      const res = await fetch("/api/knowledge/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments((prev) => [
          {
            id: data.documentId,
            filename: data.filename,
            fileType: file.name.split(".").pop()?.toLowerCase() || "txt",
            fileSize: file.size,
            status: "COMPLETED",
            chunkCount: data.chunksCreated,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        const errData = await res.json().catch(() => null);
        setFileUploadError(errData?.error || "Failed to process document");
      }
    } catch (error) {
      console.error(error);
      setFileUploadError("Something went wrong during file upload");
    } finally {
      setFileUploadLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileUpload(e.target.files[0]);
    }
  };

  // API key state
  const [newApiKey, setNewApiKey] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  const hasApiKey = apiKeys.some((k) => k.provider === aiProvider && k.isActive);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/chatbots/${chatbot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          systemPrompt,
          welcomeMessage,
          aiProvider,
          model,
          temperature: temperature.toString(),
          maxTokens: maxTokens.toString(),
          status,
          widgetMode,
          widgetPosition,
          widgetConfig: {
            ...(chatbot.widgetConfig || {}),
            botIconUrl,
            backgroundImageUrl,
          },
          leadCaptureEnabled,
          consultationSteps,
          supportedLanguages,
          language,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepCreateOpen = () => {
    setEditingStep(null);
    setEditingStepIndex(null);
    const maxStep = consultationSteps.reduce((max, s) => Math.max(max, s.stepNumber), 0);
    setStepFormData({
      stepNumber: (maxStep + 1).toString(),
      title: "",
      prompt: "",
      inputType: "options",
      options: "",
    });
    setIsStepModalOpen(true);
  };

  const handleStepEditOpen = (step: EditorConsultationStep, index: number) => {
    setEditingStep(step);
    setEditingStepIndex(index);
    setStepFormData({
      stepNumber: step.stepNumber.toString(),
      title: step.title,
      prompt: step.prompt,
      inputType: step.inputType || "options",
      options: Array.isArray(step.options) ? step.options.join(", ") : "",
    });
    setIsStepModalOpen(true);
  };

  const handleStepDelete = (indexToDelete: number) => {
    if (!confirm("Are you sure you want to delete this consultation step?")) return;
    const updated = consultationSteps.filter((_, idx) => idx !== indexToDelete);
    const renumbered = updated.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1,
    }));
    setConsultationSteps(renumbered);
  };

  const handleStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepFormData.title.trim() || !stepFormData.prompt.trim()) {
      alert("Title and Prompt instructions are required.");
      return;
    }

    const num = parseInt(stepFormData.stepNumber);
    const stepNum = isNaN(num) || num <= 0 ? consultationSteps.length + 1 : num;

    const parsedOptions = stepFormData.options
      .split(",")
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    const newStep: EditorConsultationStep = {
      stepNumber: stepNum,
      title: stepFormData.title.trim(),
      prompt: stepFormData.prompt.trim(),
      inputType: stepFormData.inputType,
      options: stepFormData.inputType === "options" ? parsedOptions : [],
    };

    let updated: EditorConsultationStep[];
    if (editingStepIndex !== null) {
      updated = [...consultationSteps];
      updated[editingStepIndex] = newStep;
    } else {
      updated = [...consultationSteps, newStep];
    }

    updated.sort((a, b) => a.stepNumber - b.stepNumber);

    const renumbered = updated.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1,
    }));

    setConsultationSteps(renumbered);
    setIsStepModalOpen(false);
  };

  const handleRestoreDefaultSteps = () => {
    if (!confirm("Are you sure you want to restore the default 6-step intake consultation template? This will overwrite your current steps.")) return;
    setConsultationSteps(DEFAULT_STEPS);
  };

  const handleMoveStep = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= consultationSteps.length) return;

    const updated = [...consultationSteps];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    const renumbered = updated.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1,
    }));

    setConsultationSteps(renumbered);
  };

  const handleUploadKB = async () => {
    if (!kbContent.trim()) return;
    setIsUploading(true);
    try {
      const res = await fetch("/api/knowledge/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId: chatbot.id,
          content: kbContent,
          filename: kbFilename || `upload-${Date.now()}.txt`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments((prev) => [
          {
            id: data.documentId,
            filename: data.filename,
            fileType: "txt",
            fileSize: new TextEncoder().encode(kbContent).length,
            status: "COMPLETED",
            chunkCount: data.chunksCreated,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setKbContent("");
        setKbFilename("");
      } else {
        const errData = await res.json().catch(() => null);
        alert(errData?.error || "Upload failed");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!newApiKey.trim()) return;
    setSavingKey(true);
    try {
      const res = await fetch("/api/tenant/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: aiProvider, apiKey: newApiKey }),
      });
      if (res.ok) {
        setNewApiKey("");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingKey(false);
    }
  };

  const embedScript = widgetMode === "INLINE"
    ? `<script src="${appUrl}/widget.js" data-chatbot-id="${chatbot.id}" data-mode="inline"></script>`
    : `<script src="${appUrl}/widget.js" data-chatbot-id="${chatbot.id}" async></script>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/chatbots"
            className="p-2 rounded-lg hover:bg-[var(--bg-glass-hover)] text-[var(--text-muted)] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-[var(--brand-purple)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">
                {name}
              </h1>
              <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> {chatbot._count.conversations} chats
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" /> {chatbot._count.leads} leads
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-[var(--text-secondary)] outline-none"
          >
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary text-sm py-2 px-5 flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saveSuccess ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] border border-[var(--brand-purple)]/20"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="glass-card p-6 hover:transform-none">
        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Top row: Model Config & MTD Usage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Configured model details */}
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[100px] h-[100px] bg-purple-500/10 rounded-full blur-[40px] pointer-events-none" />
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-[var(--brand-purple)] border border-purple-500/35 uppercase tracking-wide">
                    Active Configuration
                  </span>
                  <div className="flex items-center gap-2 mt-4">
                    <Cpu className="w-5 h-5 text-[var(--brand-purple)]" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{chatbot.model}</h3>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1.5 leading-relaxed">
                    Provider: <strong>{chatbot.aiProvider}</strong> <br />
                    Temperature: <strong>{chatbot.temperature}</strong> <br />
                    Max output tokens: <strong>{chatbot.maxTokens}</strong>
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--border-primary)]/50 flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-tertiary)]">API Status</span>
                  {hasApiKey ? (
                    <span className="text-green-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Key Active
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Key Required
                    </span>
                  )}
                </div>
              </div>

              {/* Monthly usage stats */}
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-[var(--brand-blue)] border border-blue-500/35 uppercase tracking-wide">
                    MTD Volume
                  </span>
                  <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mt-4">Monthly Tokens</h3>
                  <p className="text-3xl font-extrabold text-[var(--text-primary)] mt-1 font-mono">
                    {(analytics?.monthlyUsage.totalTokens || 0).toLocaleString()}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--border-primary)]/50 flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-medium">
                  <span>Input: {((analytics?.monthlyUsage.inputTokens || 0)).toLocaleString()}</span>
                  <span>Output: {((analytics?.monthlyUsage.outputTokens || 0)).toLocaleString()}</span>
                </div>
              </div>

              {/* Monthly cost stats */}
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-[var(--brand-emerald)] border border-emerald-500/35 uppercase tracking-wide">
                    MTD Cost
                  </span>
                  <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mt-4">Estimated Spend</h3>
                  <p className="text-3xl font-extrabold text-[var(--text-primary)] mt-1 font-mono">
                    ${(analytics?.monthlyUsage.cost || 0).toFixed(3)}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--border-primary)]/50 flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-medium">
                  <span>Avg per chat:</span>
                  <span className="font-mono text-emerald-400">
                    ${(chatbot._count.conversations > 0 ? (analytics?.monthlyUsage.cost || 0) / chatbot._count.conversations : 0).toFixed(4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Second row: Daily Consumption Trend Chart */}
            <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">Daily Token & Cost Usage</h4>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Month-to-date daily consumption</p>
                </div>
                
                {/* Metric Toggle */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] self-start">
                  <button
                    onClick={() => setTokenTrendMetric("tokens")}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      tokenTrendMetric === "tokens"
                        ? "bg-[var(--brand-purple)] text-white"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Tokens Count
                  </button>
                  <button
                    onClick={() => setTokenTrendMetric("cost")}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      tokenTrendMetric === "cost"
                        ? "bg-[var(--brand-purple)] text-white"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Estimated Cost
                  </button>
                </div>
              </div>

              <div className="h-60 w-full">
                {!analytics?.dailyTrends || analytics.dailyTrends.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                    <Info className="w-6 h-6 text-[var(--text-muted)] mb-2" />
                    <p className="text-xs text-[var(--text-secondary)]">No consumption data recorded this month.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240} minWidth={0}>
                    {tokenTrendMetric === "tokens" ? (
                      <BarChart data={analytics.dailyTrends} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.2} />
                        <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-tertiary)",
                            borderColor: "var(--border-primary)",
                            borderRadius: "8px",
                            color: "var(--text-primary)",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="inputTokens" name="Input Tokens" fill="var(--brand-blue)" stackId="a" />
                        <Bar dataKey="outputTokens" name="Output Tokens" fill="var(--brand-purple)" stackId="a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <LineChart data={analytics.dailyTrends} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.2} />
                        <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} tickFormatter={(val) => `$${val.toFixed(2)}`} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-tertiary)",
                            borderColor: "var(--border-primary)",
                            borderRadius: "8px",
                            color: "var(--text-primary)",
                            fontSize: "12px",
                          }}
                          formatter={(val: any) => [`$${Number(val).toFixed(4)}`, "Cost"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="cost"
                          stroke="var(--brand-emerald)"
                          strokeWidth={2.5}
                          activeDot={{ r: 6 }}
                          name="Cost"
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Third row: Conversations and Leads list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conversations */}
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-3">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">Recent Conversations</h4>
                  <Link href="/dashboard/conversations" className="text-xs text-[var(--brand-purple)] hover:underline">
                    View all
                  </Link>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {!analytics?.conversations || analytics.conversations.length === 0 ? (
                    <p className="text-xs text-[var(--text-tertiary)] text-center py-6">No conversations captured yet.</p>
                  ) : (
                    analytics.conversations.slice(0, 5).map((conv) => {
                      const visitorName = conv.visitor?.name || conv.visitor?.email?.split("@")[0] || "Anonymous";
                      const totalTokens = conv.messages.reduce((sum: number, m: any) => sum + m.totalTokens, 0);
                      const cost = conv.messages.reduce((sum: number, m: any) => sum + m.cost, 0);
                      return (
                        <div key={conv.id} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-between text-xs hover:border-[var(--border-secondary)] transition-all">
                          <div>
                            <span className="font-semibold text-[var(--text-primary)] block">{visitorName}</span>
                            <span className="text-[10px] text-[var(--text-tertiary)] mt-0.5 block font-sans">
                              {conv.messages.length} messages · {new Date(conv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[var(--text-primary)] block font-mono">{totalTokens.toLocaleString()} tokens</span>
                            <span className="text-[10px] text-[var(--brand-emerald)] font-bold font-mono mt-0.5 block">${cost.toFixed(4)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Leads */}
              <div className="p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-3">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">Captured Leads</h4>
                  <Link href="/dashboard/leads" className="text-xs text-[var(--brand-purple)] hover:underline">
                    View all
                  </Link>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {!analytics?.leads || analytics.leads.length === 0 ? (
                    <p className="text-xs text-[var(--text-tertiary)] text-center py-6">No leads captured yet.</p>
                  ) : (
                    analytics.leads.slice(0, 5).map((lead) => (
                      <div key={lead.id} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-between text-xs hover:border-[var(--border-secondary)] transition-all">
                        <div>
                          <span className="font-semibold text-[var(--text-primary)] block">{lead.name || "Unknown Lead"}</span>
                          <span className="text-[10px] text-[var(--text-tertiary)] mt-0.5 block truncate max-w-[200px]">
                            {lead.email || "No Email"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${lead.status === "QUALIFIED" ? "badge-emerald" : "badge-purple"}`}>
                            {lead.status.toLowerCase()}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block mt-1">
                            Score: {lead.score}/100
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* General Tab */}
        {activeTab === "general" && (
          <div className="space-y-5 max-w-2xl animate-fade-in-up">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)] resize-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">System Prompt</label>
              <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={6} className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)] resize-none font-mono" />
              <p className="text-[10px] text-[var(--text-muted)]">This is the personality and instructions for your AI. Be specific about tone, scope, and behavior.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Welcome Message</label>
              <input type="text" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)]" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Default Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-secondary)]"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lead Capture Toggle (Compact & Clean layout) */}
            <div className="pt-4 border-t border-[var(--border-primary)]/50">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Pre-Chat Lead Capture</h4>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Collect visitor name, email, and phone before starting the conversation.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLeadCaptureEnabled(!leadCaptureEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${
                    leadCaptureEnabled ? "bg-[var(--brand-emerald)]" : "bg-[var(--bg-glass-hover)]"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                      leadCaptureEnabled ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Supported Languages */}
            <div className="pt-4 border-t border-[var(--border-primary)]/50 space-y-2.5">
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Supported Languages
                </h4>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Select languages this chatbot supports for user interactions</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableLanguages.map((lang) => {
                  const isSelected = supportedLanguages.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setSupportedLanguages((prev) =>
                          prev.includes(lang.code)
                            ? prev.filter((l) => l !== lang.code)
                            : [...prev, lang.code]
                        );
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                        isSelected
                          ? "bg-purple-500/15 border-purple-500/30 text-purple-300 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
                          : "bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-tertiary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-secondary)]"
                      }`}
                    >
                      <span className="text-sm">{lang.flag}</span>
                      {lang.name}
                      {isSelected && (
                        <span className="w-3.5 h-3.5 rounded-full bg-purple-500/30 flex items-center justify-center ml-0.5">
                          <span className="text-[8px] text-purple-300">✓</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {supportedLanguages.length === 0 && (
                <p className="text-[10px] text-amber-450">Please select at least one language</p>
              )}
            </div>
          </div>
        )}

        {/* AI Config Tab */}
        {activeTab === "ai" && (
          <div className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">AI Provider</label>
                <select value={aiProvider} onChange={(e) => { setAiProvider(e.target.value); setModel(MODELS[e.target.value]?.[0]?.value || ""); }} className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-secondary)]">
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Model</label>
                <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-secondary)]">
                  {(MODELS[aiProvider] || []).map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Temperature: {temperature.toFixed(1)}</label>
              <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full accent-purple-500" />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>Precise (0)</span><span>Balanced (0.7)</span><span>Creative (2.0)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Max Tokens</label>
              <input type="number" min="256" max="16384" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value))} className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)]" />
            </div>

            {/* API Key Section */}
            <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {aiProvider} API Key
                </h3>
                {hasApiKey ? (
                  <span className="badge badge-emerald text-[10px]">Configured</span>
                ) : (
                  <span className="badge badge-amber text-[10px]">Not Set</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input type="password" value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} placeholder={hasApiKey ? "Enter new key to update..." : "Paste your API key..."} className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
                <button onClick={handleSaveApiKey} disabled={savingKey || !newApiKey} className="btn-primary text-xs py-2 px-4">
                  {savingKey ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Key"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Widget Tab */}
        {activeTab === "widget" && (
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Widget Mode</label>
              <div className="grid grid-cols-2 gap-3">
                {["FLOATING", "INLINE"].map((mode) => (
                  <button key={mode} onClick={() => setWidgetMode(mode)} className={`p-3 rounded-xl border text-sm font-medium transition-all ${widgetMode === mode ? "bg-[var(--brand-purple)]/10 border-[var(--brand-purple)]/30 text-[var(--brand-purple)]" : "bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]"}`}>
                    {mode === "FLOATING" ? "Floating Corner Widget" : "Inline Widget"}
                  </button>
                ))}
              </div>
            </div>

            {widgetMode === "FLOATING" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)]">Widget Position</label>
              <div className="grid grid-cols-2 gap-3">
                {["BOTTOM_RIGHT", "BOTTOM_LEFT", "TOP_RIGHT", "TOP_LEFT"].map((pos) => (
                  <button key={pos} onClick={() => setWidgetPosition(pos)} className={`p-3 rounded-xl border text-sm font-medium transition-all ${widgetPosition === pos ? "bg-[var(--brand-purple)]/10 border-[var(--brand-purple)]/30 text-[var(--brand-purple)]" : "bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]"}`}>
                    {pos.replace("_", " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
             )}

            {/* Customizable Aesthetics */}
            <div className="border-t border-[var(--border-primary)] pt-6 space-y-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Customizable Aesthetics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Bot Avatar Icon URL</label>
                  <input
                    type="url"
                    placeholder="e.g. https://example.com/doctor-avatar.png"
                    value={botIconUrl}
                    onChange={(e) => setBotIconUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all"
                  />
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    Paste a URL to a custom square image for the chatbot's avatar icon.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Chat Panel Background URL</label>
                  <input
                    type="url"
                    placeholder="e.g. https://example.com/hospital-bg.png"
                    value={backgroundImageUrl}
                    onChange={(e) => setBackgroundImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all"
                  />
                  <p className="text-[10px] text-[var(--text-tertiary)]">
                    Adds a watermark background image. Auto-styled with a subtle overlay blur and low opacity.
                  </p>
                </div>
              </div>
            </div>

            {/* Widget Preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Preview</label>
              <div className="relative w-full h-[300px] rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] overflow-hidden">
                <div className="absolute inset-0 dot-pattern opacity-50" />
                {widgetMode === "INLINE" ? (
                  <div className="absolute inset-8 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] shadow-sm flex flex-col overflow-hidden">
                    <div className="h-10 border-b border-[var(--border-primary)] flex items-center px-4"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div><span className="text-[10px] text-[var(--text-secondary)]">AI Chat Assistant</span></div>
                    <div className="flex-1 p-4 flex flex-col gap-3 justify-end"><div className="self-start w-3/4 h-8 rounded-lg bg-[var(--bg-secondary)]"></div><div className="self-end w-2/3 h-8 rounded-lg bg-[var(--brand-purple)]/20"></div></div>
                  </div>
                ) : (
                  <div className={`absolute w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg ${widgetPosition === "BOTTOM_RIGHT" ? "bottom-4 right-4" : widgetPosition === "BOTTOM_LEFT" ? "bottom-4 left-4" : widgetPosition === "TOP_RIGHT" ? "top-4 right-4" : "top-4 left-4"}`}>
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] pointer-events-none">
                  Your website content
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Knowledge Base Tab */}
        {activeTab === "knowledge" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload & Form Column */}
            <div className="space-y-6">
              {/* Drag and Drop Zone */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Direct File Upload</h3>
                <p className="text-xs text-[var(--text-tertiary)]">Upload PDF, Excel, CSV, or TXT documents to automatically chunk and embed.</p>
                
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center relative ${
                    isDragActive
                      ? "border-[var(--brand-purple)] bg-[var(--brand-purple)]/5"
                      : "border-[var(--border-primary)] bg-[var(--bg-tertiary)] hover:border-[var(--border-secondary)]"
                  }`}
                >
                  <input
                    type="file"
                    id="kb-file-upload"
                    accept=".pdf,.xlsx,.xls,.csv,.txt,.md"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={fileUploadLoading}
                  />
                  
                  {fileUploadLoading ? (
                    <div className="space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-purple)] mx-auto" />
                      <p className="text-xs font-semibold text-[var(--text-primary)]">Processing and indexing your file...</p>
                      <p className="text-[10px] text-[var(--text-muted)]">This might take a few seconds as we parse the document and generate embeddings.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-primary)] flex items-center justify-center mx-auto border border-[var(--border-primary)]">
                        <Upload className="w-5 h-5 text-[var(--text-secondary)]" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-[var(--text-primary)]">
                          Drag & drop or <span className="text-[var(--brand-purple)] hover:underline cursor-pointer">browse</span>
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">Supports PDF, Excel (.xlsx/.xls), CSV, or TXT (Max 10MB)</p>
                      </div>
                    </div>
                  )}
                </div>

                {fileUploadError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    ⚠️ {fileUploadError}
                  </div>
                )}
              </div>

              {/* Horizontal Separator */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[var(--border-primary)]"></div>
                <span className="flex-shrink mx-4 text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Or paste manually</span>
                <div className="flex-grow border-t border-[var(--border-primary)]"></div>
              </div>

              {/* Manual Text Paste Form */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Document Name</label>
                  <input type="text" value={kbFilename} onChange={(e) => setKbFilename(e.target.value)} placeholder="e.g. product-faq.txt" className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Content</label>
                  <textarea value={kbContent} onChange={(e) => setKbContent(e.target.value)} rows={6} placeholder="Paste your product docs, FAQs, policies, or any knowledge content here..." className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-purple-500 outline-none text-sm text-[var(--text-primary)] resize-none font-mono" />
                  <p className="text-[10px] text-[var(--text-muted)]">
                    The content will be automatically split into chunks and embedded for AI retrieval. Requires an OpenAI API key.
                  </p>
                </div>
                <button onClick={handleUploadKB} disabled={isUploading || !kbContent.trim()} className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploading ? "Processing..." : "Upload & Process"}
                </button>
              </div>
            </div>

            {/* Document List Column */}
            <div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Uploaded Documents {documents.length > 0 && `(${documents.length})`}
                </h3>
                {documents.length === 0 ? (
                  <div className="p-8 border border-dashed border-[var(--border-primary)] rounded-xl text-center space-y-2 bg-[var(--bg-tertiary)]/50">
                    <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                    <p className="text-xs font-semibold text-[var(--text-primary)]">No training documents yet</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] max-w-xs mx-auto">
                      Upload files or paste Q&A content to train this chatbot.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            doc.fileType === "pdf"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : doc.fileType === "xlsx" || doc.fileType === "xls" || doc.fileType === "csv"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--text-primary)] truncate" title={doc.filename}>{doc.filename}</p>
                            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                              {doc.chunkCount} chunks · {(doc.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <span className="badge badge-emerald text-[9px] font-semibold tracking-wide py-0.5 px-2 shrink-0">{doc.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Intake Steps Tab */}
        {activeTab === "steps" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Intake Steps Sequence
                </h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  Configure the step-by-step questions and actions the AI will guide the user through during the consultation.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRestoreDefaultSteps}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-glass-hover)] text-xs font-semibold text-[var(--text-secondary)] transition-colors cursor-pointer"
                >
                  Restore Defaults
                </button>
                <button
                  type="button"
                  onClick={handleStepCreateOpen}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Step
                </button>
              </div>
            </div>

            {consultationSteps.length === 0 ? (
              <div className="p-8 border border-dashed border-[var(--border-primary)] rounded-xl text-center space-y-3">
                <Workflow className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    No consultation steps configured
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] max-w-sm mx-auto">
                    Without intake steps, the AI will use its default conversational rules. Add steps to enforce a custom flow.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRestoreDefaultSteps}
                  className="btn-primary text-[10px] py-1.5 px-3 cursor-pointer"
                >
                  Load Default Template
                </button>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-6 before:w-0.5 before:bg-[var(--border-primary)]">
                {consultationSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 relative group animate-in fade-in slide-in-from-bottom-2 duration-200"
                  >
                    {/* Step Marker */}
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] border-2 border-[var(--border-primary)] flex items-center justify-center font-bold text-xs text-[var(--text-secondary)] shrink-0 z-10 group-hover:border-[var(--brand-purple)] group-hover:text-[var(--brand-purple)] transition-colors">
                      {step.stepNumber}
                    </div>

                    {/* Step Card */}
                    <div className="flex-grow p-4.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2 flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-[var(--text-primary)]">
                            {step.title}
                          </h4>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                            (step.inputType || "options") === "options"
                              ? "bg-[var(--brand-purple)]/10 text-[var(--brand-purple)] border border-[var(--brand-purple)]/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {(step.inputType || "options") === "options" ? "🔘 Clickable Options" : "⌨️ Free Text Input"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                          {step.prompt}
                        </p>
                        {(step.inputType || "options") === "options" && step.options && step.options.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[9px] text-[var(--text-muted)] font-medium">Options:</span>
                            {step.options.map((opt, oIdx) => (
                              <span key={oIdx} className="text-[9px] bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-lg">
                                {opt}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Step Controls */}
                      <div className="flex items-center gap-2 md:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, "up")}
                          disabled={idx === 0}
                          className="p-1.5 rounded border border-[var(--border-primary)] hover:bg-[var(--bg-glass-hover)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-[var(--text-secondary)]"
                          title="Move Step Up"
                        >
                          <ArrowLeft className="w-3 h-3 rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, "down")}
                          disabled={idx === consultationSteps.length - 1}
                          className="p-1.5 rounded border border-[var(--border-primary)] hover:bg-[var(--bg-glass-hover)] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-[var(--text-secondary)]"
                          title="Move Step Down"
                        >
                          <ArrowLeft className="w-3 h-3 -rotate-90" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStepEditOpen(step, idx)}
                          className="p-1.5 rounded border border-[var(--border-primary)] hover:bg-[var(--bg-glass-hover)] transition-colors cursor-pointer text-[var(--text-secondary)]"
                          title="Edit Step"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStepDelete(idx)}
                          className="p-1.5 rounded border border-[var(--border-primary)] hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer text-[var(--text-secondary)]"
                          title="Delete Step"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step Add/Edit Modal */}
            {isStepModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                    <div className="flex items-center gap-2">
                      <Workflow className="w-4.5 h-4.5 text-[var(--brand-purple)]" />
                      <h2 className="text-sm font-bold text-[var(--text-primary)]">
                        {editingStep ? `Edit Intake Step ${stepFormData.stepNumber}` : "Add New Intake Step"}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsStepModalOpen(false)}
                      className="p-1.5 rounded hover:bg-[var(--bg-glass-hover)] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <form onSubmit={handleStepSubmit} className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold block text-[var(--text-secondary)]">
                        Step Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Symptoms Diagnostic, Recommendations"
                        value={stepFormData.title}
                        onChange={(e) =>
                          setStepFormData({ ...stepFormData, title: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold block text-[var(--text-secondary)]">
                        Input Interaction Style *
                      </label>
                      <select
                        value={stepFormData.inputType}
                        onChange={(e) =>
                          setStepFormData({ ...stepFormData, inputType: e.target.value as "options" | "text" })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all cursor-pointer"
                      >
                        <option value="options">🔘 Clickable Options</option>
                        <option value="text">⌨️ Free Text Input</option>
                      </select>
                      <p className="text-[9px] text-[var(--text-muted)] leading-normal">
                        Choose whether the user responds by clicking buttons or by typing freely.
                      </p>
                    </div>

                    {stepFormData.inputType === "options" && (
                      <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                        <label className="text-[10px] font-semibold block text-[var(--text-secondary)]">
                          Interactive Options (Comma-Separated)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Skin Care, Hair Care, Daily Hygiene"
                          value={stepFormData.options}
                          onChange={(e) =>
                            setStepFormData({ ...stepFormData, options: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all resize-none leading-relaxed"
                        />
                        <p className="text-[9px] text-[var(--text-muted)] leading-normal">
                          Add the selectable buttons the user will see. Separate choices with commas.
                        </p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold block text-[var(--text-secondary)]">
                        Prompt Instructions for AI *
                      </label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Instruct the AI on what to say, ask, and tools to call. E.g. 'Ask the user to describe their daily skin routine. Offer options: Morning only, Evening only, Both morning and evening, or None.'"
                        value={stepFormData.prompt}
                        onChange={(e) =>
                          setStepFormData({ ...stepFormData, prompt: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all resize-none leading-relaxed"
                      />
                      <p className="text-[9px] text-[var(--text-muted)] leading-normal">
                        These instructions are dynamically injected into the AI&apos;s system prompt when this step is active.
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-primary)]">
                      <button
                        type="button"
                        onClick={() => setIsStepModalOpen(false)}
                        className="px-3.5 py-1.5 rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-glass-hover)] text-xs font-semibold text-[var(--text-secondary)] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {editingStep ? "Update Step" : "Add Step"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}



        {/* Products Catalog Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Product Catalog Recommendations</h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Manage products that this chatbot will recommend during consultation</p>
              </div>
              <button onClick={handleProductCreateOpen} className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                Add Product
              </button>
            </div>

            {isProductsLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-purple)]" />
                <p className="text-xs text-[var(--text-muted)]">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-8 border border-dashed border-[var(--border-primary)] rounded-xl text-center space-y-3">
                <ShoppingBag className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">No products linked to this chatbot yet</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] max-w-sm mx-auto">
                    Add products that this chatbot can suggest. The AI will recommend them during its consultation flow.
                  </p>
                </div>
                <button onClick={handleProductCreateOpen} className="btn-primary text-[10px] py-1.5 px-3 cursor-pointer">
                  Add First Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="flex flex-col overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-tertiary)] rounded-xl relative group">
                    {/* Image */}
                    <div className="h-28 bg-[var(--bg-primary)] relative overflow-hidden flex items-center justify-center border-b border-[var(--border-primary)]">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-[var(--text-muted)]" />
                      )}
                      <span className={`absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${product.isActive ? "badge-emerald" : "badge-red bg-red-500/10 text-red-400 border border-red-500/25"}`}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {/* Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--brand-purple)] block">
                          {product.category?.replace("_", " ")}
                        </span>
                        <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{product.name}</h4>
                        <p className="text-[10px] text-[var(--text-tertiary)] line-clamp-2 leading-relaxed">
                          {product.description || "No description provided."}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--border-primary)]">
                        <span className="text-xs font-extrabold text-[var(--text-primary)]">د.إ {product.price.toFixed(2)}</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleProductEditOpen(product)} className="p-1 rounded border border-[var(--border-primary)] hover:bg-[var(--bg-glass-hover)] transition-colors cursor-pointer text-[var(--text-secondary)]">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleProductDelete(product.id)} className="p-1 rounded border border-[var(--border-primary)] hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer text-[var(--text-secondary)]">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Product CRUD Modal */}
            {isProductModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)] shrink-0">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4.5 h-4.5 text-[var(--brand-purple)]" />
                      <h2 className="text-base font-bold text-[var(--text-primary)]">
                        {editingProduct ? "Edit Product" : "Add New Product"}
                      </h2>
                    </div>
                    <button onClick={() => setIsProductModalOpen(false)} className="p-1.5 rounded hover:bg-[var(--bg-glass-hover)] text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Modal Form */}
                  <form onSubmit={handleProductSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable Form Body */}
                    <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="text-[10px] font-semibold mb-1 block text-[var(--text-secondary)]">Product Name *</label>
                          <input type="text" required placeholder="e.g. Organic Hair Serum" value={productFormData.name} onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })} className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold mb-1 block text-[var(--text-secondary)]">Price (د.إ) *</label>
                          <input type="number" step="0.01" min="0" required placeholder="e.g. 29.99" value={productFormData.price} onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })} className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all" />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold mb-1 block text-[var(--text-secondary)]">Category *</label>
                          <select value={productFormData.category} onChange={(e) => setProductFormData({ ...productFormData, category: e.target.value })} className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all">
                            <option value="hair_care">Hair Care</option>
                            <option value="skin_care">Skin Care</option>
                            <option value="wellness">General Wellness</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-semibold mb-1 block text-[var(--text-secondary)]">Description</label>
                          <textarea rows={2} placeholder="Briefly describe the product benefits..." value={productFormData.description} onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })} className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all resize-none" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-semibold mb-1 block text-[var(--text-secondary)]">Image URL</label>
                          <input type="url" placeholder="https://example.com/product.jpg" value={productFormData.imageUrl} onChange={(e) => setProductFormData({ ...productFormData, imageUrl: e.target.value })} className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-semibold mb-1 block text-[var(--text-secondary)]">Checkout URL</label>
                          <input type="url" placeholder="Stripe, PayPal link, or any custom checkout page" value={productFormData.checkoutUrl} onChange={(e) => setProductFormData({ ...productFormData, checkoutUrl: e.target.value })} className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] outline-none focus:border-[var(--brand-purple)] focus:ring-2 focus:ring-[var(--brand-purple)]/20 transition-all" />
                        </div>
                        <div className="col-span-2 flex items-center gap-2 pt-1">
                          <input type="checkbox" id="isProductActive" checked={productFormData.isActive} onChange={(e) => setProductFormData({ ...productFormData, isActive: e.target.checked })} className="rounded text-[var(--brand-purple)] focus:ring-[var(--brand-purple)]" />
                          <label htmlFor="isProductActive" className="text-[11px] font-semibold text-[var(--text-secondary)] cursor-pointer">Active (AI can recommend this product)</label>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--border-primary)] bg-[var(--bg-elevated)] shrink-0">
                      <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-3.5 py-1.5 rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-glass-hover)] text-xs font-semibold text-[var(--text-secondary)] transition-colors cursor-pointer">Cancel</button>
                      <button type="submit" disabled={isProductSubmitLoading} className="btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5 cursor-pointer">
                        {isProductSubmitLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            {editingProduct ? "Save Changes" : "Create Product"}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Embed Code Tab */}
        {activeTab === "embed" && (
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Embed Script</h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                {widgetMode === "INLINE"
                  ? "Copy this script tag and paste it into your HTML exactly where you want the chat to appear."
                  : "Copy this script tag and paste it before the closing </body> tag on your website."}
              </p>
              <div className="relative">
                <pre className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] text-xs text-[var(--brand-emerald)] font-mono overflow-x-auto">
                  {embedScript}
                </pre>
                <button onClick={handleCopyEmbed} className="absolute top-2 right-2 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--bg-glass-hover)] transition-all">
                  {copied ? <Check className="w-3.5 h-3.5 text-[var(--brand-emerald)]" /> : <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Test Widget</h3>
              <p className="text-xs text-[var(--text-tertiary)]">
                Open the chat widget in a new tab to test it live.
              </p>
              <a href={`${appUrl}/embed/${chatbot.id}`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2.5 px-5 inline-flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Open Widget Preview
              </a>
            </div>

            {chatbot.status !== "ACTIVE" && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
                ⚠️ Your chatbot status is set to <strong>{chatbot.status}</strong>. Set it to <strong>Active</strong> for the widget to work on external sites.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
