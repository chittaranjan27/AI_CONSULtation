import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

export type AIProviderType = "OPENAI" | "ANTHROPIC" | "GEMINI" | "GROQ" | "OPENROUTER";

// Model mappings per provider
const MODEL_MAP: Record<AIProviderType, Record<string, string>> = {
  OPENAI: {
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
    "gpt-4-turbo": "gpt-4-turbo",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
  },
  ANTHROPIC: {
    "claude-3.5-sonnet": "claude-sonnet-4-20250514",
    "claude-3-haiku": "claude-3-haiku-20240307",
    "claude-3-opus": "claude-3-opus-20240229",
  },
  GEMINI: {
    "gemini-pro": "gemini-1.5-pro",
    "gemini-flash": "gemini-1.5-flash",
    "gemini-2-flash": "gemini-2.0-flash",
  },
  GROQ: {
    "llama-3.1-70b": "llama-3.1-70b-versatile",
    "llama-3.1-8b": "llama-3.1-8b-instant",
    "mixtral-8x7b": "mixtral-8x7b-32768",
  },
  OPENROUTER: {
    // OpenRouter passes model IDs directly
  },
};

// Default model per provider
const DEFAULT_MODELS: Record<AIProviderType, string> = {
  OPENAI: "gpt-4o-mini",
  ANTHROPIC: "claude-sonnet-4-20250514",
  GEMINI: "gemini-1.5-flash",
  GROQ: "llama-3.1-70b-versatile",
  OPENROUTER: "openai/gpt-4o-mini",
};

// Cost per 1K tokens (approximate, for tracking)
export const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.0025, output: 0.01 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "gpt-4-turbo": { input: 0.01, output: 0.03 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "claude-sonnet-4-20250514": { input: 0.003, output: 0.015 },
  "claude-3-haiku-20240307": { input: 0.00025, output: 0.00125 },
  "claude-3-opus-20240229": { input: 0.015, output: 0.075 },
  "gemini-1.5-pro": { input: 0.00125, output: 0.005 },
  "gemini-1.5-flash": { input: 0.000075, output: 0.0003 },
  "gemini-2.0-flash": { input: 0.0001, output: 0.0004 },
  "llama-3.1-70b-versatile": { input: 0.00059, output: 0.00079 },
  "llama-3.1-8b-instant": { input: 0.00005, output: 0.00008 },
  "mixtral-8x7b-32768": { input: 0.00024, output: 0.00024 },
};

/**
 * Get a Vercel AI SDK compatible language model instance.
 */
export function getAIModel(
  provider: AIProviderType,
  apiKey: string,
  modelId?: string
): LanguageModel {
  const resolvedModelId = resolveModelId(provider, modelId);

  switch (provider) {
    case "OPENAI": {
      const openai = createOpenAI({ apiKey });
      return openai(resolvedModelId);
    }
    case "ANTHROPIC": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(resolvedModelId);
    }
    case "GEMINI": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(resolvedModelId);
    }
    case "GROQ": {
      // Groq uses OpenAI-compatible API
      const groq = createOpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1",
      });
      return groq(resolvedModelId);
    }
    case "OPENROUTER": {
      const openrouter = createOpenAI({
        apiKey,
        baseURL: "https://openrouter.ai/api/v1",
      });
      return openrouter(resolvedModelId);
    }
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

/**
 * Resolve a user-friendly model name to the provider's actual model ID.
 */
function resolveModelId(provider: AIProviderType, modelId?: string): string {
  if (!modelId) return DEFAULT_MODELS[provider];

  const mapping = MODEL_MAP[provider];
  if (mapping && mapping[modelId]) return mapping[modelId];

  // If no mapping found, pass through directly (for OpenRouter or custom models)
  return modelId;
}

/**
 * Calculate token cost for usage tracking.
 */
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = TOKEN_COSTS[modelId];
  if (!costs) return 0;

  return (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;
}

/**
 * Get available models for a provider.
 */
export function getAvailableModels(provider: AIProviderType): { id: string; label: string }[] {
  switch (provider) {
    case "OPENAI":
      return [
        { id: "gpt-4o-mini", label: "GPT-4o Mini (Fast & Cheap)" },
        { id: "gpt-4o", label: "GPT-4o (Smart)" },
        { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
        { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (Legacy)" },
      ];
    case "ANTHROPIC":
      return [
        { id: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet (Recommended)" },
        { id: "claude-3-haiku", label: "Claude 3 Haiku (Fast)" },
        { id: "claude-3-opus", label: "Claude 3 Opus (Most Capable)" },
      ];
    case "GEMINI":
      return [
        { id: "gemini-flash", label: "Gemini 1.5 Flash (Fast)" },
        { id: "gemini-pro", label: "Gemini 1.5 Pro (Smart)" },
        { id: "gemini-2-flash", label: "Gemini 2.0 Flash (Latest)" },
      ];
    case "GROQ":
      return [
        { id: "llama-3.1-70b", label: "Llama 3.1 70B" },
        { id: "llama-3.1-8b", label: "Llama 3.1 8B (Fastest)" },
        { id: "mixtral-8x7b", label: "Mixtral 8x7B" },
      ];
    case "OPENROUTER":
      return [
        { id: "openai/gpt-4o-mini", label: "GPT-4o Mini via OpenRouter" },
        { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet via OpenRouter" },
        { id: "google/gemini-pro-1.5", label: "Gemini Pro via OpenRouter" },
      ];
    default:
      return [];
  }
}
