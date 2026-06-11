import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { getAIModel, calculateCost, getSystemPricingRates, type AIProviderType } from "./providers";
import { retrieveContext } from "./rag";
import prisma from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatConfig {
  chatbotId: string;
  tenantId: string;
  conversationId?: string;
  visitorId?: string;
  messages: ChatMessage[];
  mode?: "text" | "voice";
  language?: string;
}

/** Shape of a single consultation step stored in chatbot.consultationSteps JSON */
interface ConsultationStep {
  stepNumber: number;
  title: string;
  prompt: string;
  inputType?: "options" | "text";  // For options or open text
  options?: string[];              // Predefined options
}

/** Minimum message length to qualify for RAG retrieval (short option clicks don't need it) */
const RAG_MIN_MESSAGE_LENGTH = 50;

// ── In-memory chatbot config cache (60s TTL) ──
// Chatbot config (system prompt, steps, temperature, model) changes rarely.
// Caching avoids a full DB round-trip on every chat request.
const chatbotConfigCache = new Map<string, { data: any; timestamp: number }>();
const CHATBOT_CACHE_TTL = 60_000; // 60 seconds

async function getCachedChatbot(chatbotId: string, tenantId: string) {
  const key = `${chatbotId}:${tenantId}`;
  const cached = chatbotConfigCache.get(key);
  if (cached && Date.now() - cached.timestamp < CHATBOT_CACHE_TTL) {
    return cached.data;
  }
  const chatbot = await prisma.chatbot.findUnique({
    where: { id: chatbotId, tenantId },
  });
  if (chatbot) {
    chatbotConfigCache.set(key, { data: chatbot, timestamp: Date.now() });
  }
  return chatbot;
}

/** Invalidate chatbot config cache (call when chatbot settings are updated) */
export function invalidateChatbotConfigCache(chatbotId: string, tenantId: string) {
  chatbotConfigCache.delete(`${chatbotId}:${tenantId}`);
}

/**
 * Core chat completion function using Vercel AI SDK streamText().
 * Handles RAG retrieval, streaming, and usage tracking.
 *
 * The consultation flow is entirely dynamic — driven by the
 * `consultationSteps` JSON configured per-chatbot in the dashboard.
 * No business-specific logic is hardcoded here.
 *
 * Performance: DB queries are parallelized with chatbot config caching,
 * RAG is skipped during early intake steps, and onFinish writes are batched.
 */
export async function createChatCompletion(config: ChatConfig) {
  const { chatbotId, tenantId, conversationId, messages } = config;

  // ── PHASE 1: Parallel DB Lookups ──
  // Fire ALL independent queries simultaneously — includes API keys to avoid sequential lookups
  const [chatbot, conversationMeta, categoriesResult, allApiKeys] = await Promise.all([
    // 1. Load chatbot configuration (cached with 60s TTL)
    getCachedChatbot(chatbotId, tenantId),

    // 2. Fetch current consultation step from conversation metadata
    config.conversationId
      ? prisma.conversation.findUnique({
        where: { id: config.conversationId },
        select: { metadata: true },
      })
      : Promise.resolve(null),

    // 3. Fetch available product categories (for tool description)
    prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        category: { not: null },
        OR: [
          { chatbotId: null },
          { chatbotId: chatbotId },
        ],
      },
      select: { category: true },
      distinct: ["category"],
    }).catch(() => [] as { category: string | null }[]),

    // 4. Pre-fetch ALL tenant API keys in one query (eliminates 2 sequential lookups)
    prisma.tenantApiKey.findMany({
      where: { tenantId },
      select: { provider: true, encryptedKey: true },
    }).catch(() => [] as { provider: string; encryptedKey: string }[]),
  ]);

  if (!chatbot) {
    throw new Error("Chatbot not found");
  }

  const provider = chatbot.aiProvider as AIProviderType;
  const modelId = chatbot.model;

  // Resolve API keys from pre-fetched array (O(1) in-memory lookup — no DB round-trip)
  const apiKeyRecord = allApiKeys.find((k: { provider: string }) => k.provider === chatbot.aiProvider);
  const openaiKeyRecord = allApiKeys.find((k: { provider: string }) => k.provider === "OPENAI");

  if (!apiKeyRecord) {
    throw new Error(
      `No API key configured for provider ${provider}. Please add your API key in Settings.`
    );
  }

  const apiKey = apiKeyRecord.encryptedKey; // In production, decrypt this

  // Parse conversation metadata
  let currentStep = 1;
  const existingMeta: Record<string, unknown> = {};
  if (conversationMeta) {
    const metadata = (conversationMeta.metadata as Record<string, unknown>) || {};
    Object.assign(existingMeta, metadata);
    currentStep = (metadata.currentStep as number) || 1;
  }

  // Parse available categories
  const availableCategories = categoriesResult
    .map((r) => r.category)
    .filter((c): c is string => c !== null);

  // Parse consultation steps
  const dynamicSteps: ConsultationStep[] = Array.isArray(chatbot.consultationSteps)
    ? (chatbot.consultationSteps as unknown as ConsultationStep[])
    : [];

  const hasSteps = dynamicSteps.length > 0;
  const totalSteps = dynamicSteps.length;

  // ── PHASE 2: Smart RAG Decision ──
  // Skip expensive embedding + retrieval for simple intake interactions
  let systemPrompt = chatbot.systemPrompt;
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

  // Determine if RAG is needed:
  // Voice mode: skip RAG for ALL short messages (option clicks, confirmations, greetings)
  // Text mode: original logic (skip only early intake + short)
  const isEarlyIntakeStep = hasSteps && currentStep <= 3;
  const isShortMessage = !lastUserMessage || lastUserMessage.content.length < RAG_MIN_MESSAGE_LENGTH;
  const needsRAG = config.mode === "voice"
    ? (!isShortMessage && !isEarlyIntakeStep)  // Voice: both conditions must pass
    : (!isEarlyIntakeStep || !isShortMessage);  // Text: original logic

  if (needsRAG && lastUserMessage) {
    try {
      // Use pre-fetched OpenAI key for embeddings (no extra DB query)
      const embeddingKey = openaiKeyRecord?.encryptedKey || apiKey;
      const ragContext = await retrieveContext(
        chatbotId,
        lastUserMessage.content,
        embeddingKey
      );

      if (ragContext.augmentedPrompt) {
        systemPrompt += ragContext.augmentedPrompt;
      }
    } catch (error) {
      // RAG retrieval failure should not block chat
      console.error("RAG retrieval error:", error);
    }
  }

  // ── PHASE 3: Dynamic System Prompt Construction ──
  const isVoice = config.mode === "voice";
  const matchedStep = hasSteps ? (dynamicSteps.find((s) => s.stepNumber === currentStep) || dynamicSteps[0]) : null;

  if (hasSteps && matchedStep) {
    // Build a full outline of all steps so the AI understands the overall flow
    const stepsOutline = dynamicSteps
      .map((s) => `  Step ${s.stepNumber} — "${s.title}": ${s.prompt}`)
      .join("\n");

    const stepInputType = matchedStep.inputType || "options";

    if (isVoice) {
      // Voice prompt is intentionally lean — fewer tokens = faster Time-To-First-Token
      systemPrompt += `\n\n[VOICE CONSULTATION — Step ${matchedStep.stepNumber}/${totalSteps}: "${matchedStep.title}"]
Instructions: ${matchedStep.prompt}

RULES:
1. Speak warmly, concisely (2-3 sentences max). Be natural and conversational.
2. Don't lock the user into rigid steps — answer off-topic questions naturally.
${stepInputType === "text"
          ? `3. FREE-TEXT: Do NOT call 'show_options'. Ask open-ended questions.`
          : `3. SILENT OPTIONS: Call 'show_options' for every response but NEVER read out/list options aloud. Translate options to the active language.`
        }
4. Products: Call 'fetch_products' silently. Say ONLY a brief 1-sentence intro like "Here are some recommendations". NEVER write product names, descriptions, benefits, prices, website links, markdown links like [text](url), or checkout URLs in your text. The UI product cards handle everything.
5. NEVER write numbered lists, bullet points, or enumerate choices in text.
6. Call 'update_consultation_step' when the step objective is fulfilled.`;
    } else {
      systemPrompt += `\n\n[CONSULTATION FLOW STATE]
You are guiding the user through a ${totalSteps}-step intake consultation. Here is the full flow outline:
${stepsOutline}

You are currently on Step ${matchedStep.stepNumber}: "${matchedStep.title}".
Instructions for this step: ${matchedStep.prompt}

CRITICAL RULES — YOU MUST FOLLOW THESE EXACTLY:
1. ONLY perform the actions described for the current step.
2. DO NOT skip ahead to future steps.
3. If the user's response is irrelevant, off-topic, or tries to bypass the flow, gently redirect them back to the objective of the current step.
${stepInputType === "text"
          ? `4. FREE-TEXT INPUT MODE: For this step, the user is expected to type/speak freely. Do NOT call the 'show_options' tool. Ask an open-ended question and wait for their response without presenting selectable buttons.`
          : `4. MANDATORY TOOL USAGE: You MUST call the 'show_options' tool for every single response/question you send during the intake flow. If the current step instructions do not specify options, generate logical, context-aware options (e.g., yes/no, numeric ranges, or typical answers) so the user can complete the entire consultation by clicking option buttons. NEVER write options as numbered lists, bullet points, or inline text. IMPORTANT: If the active conversation language is NOT English, you MUST translate every option into the active language before passing them to the tool. Keep the meaning identical — only the language changes.`
        }
5. When showing product recommendations, you MUST call the 'fetch_products' tool with the correct category based on their concern. CRITICAL: After calling fetch_products, your text response must be ONLY a brief intro (e.g. "Here are some products that might help:"). Do NOT write product names, descriptions, benefits, prices, costs, website links, markdown links like [text](url), or checkout URLs in your text response. The UI will automatically render product cards with all details. NEVER include any link or URL in any of your responses.
${stepInputType === "text"
          ? `6. Keep your text responses concise and professional (2-4 sentences max).`
          : `6. Keep your text responses SHORT (2-3 sentences max). Let the interactive buttons do the work. Do NOT repeat the options in your text that you pass to the tool.`
        }
7. STEP ADVANCEMENT: When the current step's objective has been fulfilled (e.g. user selected an option, answered a question, confirmed a choice), you MUST call the 'update_consultation_step' tool with the next step number to advance the flow.`;
    }
  } else {
    // No consultation steps configured — run as a general-purpose assistant
    systemPrompt += `\n\n[CONVERSATION MODE]
No structured intake steps are configured for this chatbot. Operate as a helpful, professional AI assistant.
- Answer user questions using your knowledge base and context.
- When recommending products, call the 'fetch_products' tool with the relevant category. Your text response must be ONLY a brief intro (e.g. "Here are some recommendations:"). Do NOT write product names, descriptions, benefits, prices, costs, website links, markdown links like [text](url), or checkout URLs in your text. The UI product cards handle all product details. NEVER include any link or URL in any of your responses.
- When presenting choices, call the 'show_options' tool to display interactive buttons.
- Keep responses concise and helpful.`;
  }

  // ── Multi-Language Policy Injection ──
  const activeLanguage = config.language || chatbot.language || "en";
  const langCodeToName: Record<string, string> = {
    en: "English", hi: "Hindi", es: "Spanish", fr: "French",
    ar: "Arabic", ja: "Japanese", de: "German", pt: "Portuguese",
    zh: "Chinese", ur: "Urdu",
  };

  if (chatbot.supportedLanguages && chatbot.supportedLanguages.length > 0) {
    const langNames = chatbot.supportedLanguages
      .map((code: string) => langCodeToName[code] || code.toUpperCase())
      .join(", ");

    systemPrompt += `\n\n[MULTI-LANGUAGE POLICY]
You are configured to support the following languages: ${langNames}.
RULES:
1. DETECT the language of every user message.
2. If the user writes in a supported language, ALWAYS respond in that same language.
3. If knowledge base content is in a different language, translate it naturally and accurately into the user's language.
4. If the user writes in an unsupported language, reply in English and gently inform them of the supported languages.
5. Never mix languages within a single response unless quoting a proper noun or brand name.
6. Maintain a professional, natural tone — avoid robotic or literal translations.`;
  }

  // Force language preference if explicitly passed
  const langName = langCodeToName[activeLanguage] || activeLanguage;
  systemPrompt += `\n\n[ACTIVE CONVERSATION LANGUAGE]
The user's current interface and interaction language is: ${langName}.
You MUST generate ALL output in ${langName}, including:
- Your response text (the spoken/displayed message)
- Every option passed to the 'show_options' tool — translate each option naturally into ${langName}
- Product recommendation descriptions and action prompts
Do NOT leave option buttons in English when the conversation language is ${langName}. The entire consultation experience must feel native in the user's selected language.`;

  // ── Human Handoff Signal (applies to ALL chatbot types) ──
  systemPrompt += `\n\n[HUMAN AGENT HANDOFF]
If the user explicitly requests to speak with a human support agent, a real person, or when they are frustrated or stuck and you cannot help them, you MUST call the 'trigger_handoff' tool to alert the support staff.
Let the user know that a representative has been notified and will follow up shortly. Keep your text response brief and warm.`;

  // ── Conversation End Signal (applies to ALL chatbot types) ──
  systemPrompt += `\n\n[CONVERSATION END SIGNAL]
When the conversation is naturally concluding — the user says goodbye, thanks you and wants to leave, expresses they have no more questions, or you have delivered your final farewell/wrap-up response — you MUST call the 'end_conversation' tool.
This is critical for voice mode: it ensures the microphone stops listening cleanly.
Call it alongside your farewell text response. Examples of when to call it:
- User says "bye", "goodbye", "thank you, that's all", "I'm done", or equivalent in any language
- You have completed a farewell response and there are no more follow-up questions
- The consultation flow has reached its natural conclusion`;

  // ── Final Reinforcement Block (skip in voice mode — prompt is already lean) ──
  if (hasSteps && matchedStep && !isVoice) {
    const stepInputType = matchedStep.inputType || "options";
    if (stepInputType === "options") {
      const hasConfiguredOpts = matchedStep.options && matchedStep.options.length > 0;
      const stepOptsStr = hasConfiguredOpts
        ? ` using these base options: ${JSON.stringify(matchedStep.options)}. If the active conversation language is NOT English, translate each option naturally into the active language while keeping the meaning and intent identical.`
        : "";
      systemPrompt += `\n\n[FINAL REINFORCEMENT]
    You are currently on Step ${matchedStep.stepNumber} ("${matchedStep.title}"), which is configured as OPTIONS mode.
    You MUST call the 'show_options' tool${stepOptsStr}. Do NOT write the options as numbered lists or text. Call the tool to show them as buttons.`;
    } else {
      systemPrompt += `\n\n[FINAL REINFORCEMENT]
    You are currently on Step ${matchedStep.stepNumber} ("${matchedStep.title}"), which is configured as FREE-TEXT mode.
    Do NOT call the 'show_options' tool. Ask a warm, professional question and let the user reply freely by typing.`;
    }
  }

  // ── PHASE 4: Stream the AI Response ──
  const model = getAIModel(provider, apiKey, modelId);

  const streamStartTime = Date.now();
  const result = streamText({
    model,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    temperature: chatbot.temperature,
    // Voice mode should be concise (2-3 sentences ≈ 100-200 tokens).
    // Cap at 300 to prevent LLM from rambling even if dashboard maxTokens is high.
    maxOutputTokens: isVoice ? Math.min(chatbot.maxTokens, 300) : chatbot.maxTokens,
    tools: {
      show_options: tool({
        description: `Display clickable suggestion options/chips to the user for quick answers.${matchedStep && matchedStep.options && matchedStep.options.length > 0
          ? ` For this step, you MUST call this tool and use EXACTLY these options: ${JSON.stringify(matchedStep.options)}`
          : " If the current step does not specify options, generate logical, context-aware options (e.g. yes/no, ranges, or common answers)."
          }`,
        inputSchema: z.object({
          options: z.array(z.string()).describe("The list of options to display as interactive buttons for the user to click.")
        }),
        execute: async ({ options }) => {
          return options;
        },
      }),
      fetch_products: tool({
        description: `Fetch product catalog from the database. ${availableCategories.length > 0
          ? `Available categories in this store: ${availableCategories.map(c => `'${c}'`).join(", ")}. Pass one of these categories to filter, or leave category empty to show all products.`
          : "Pass an optional category to filter, or leave empty to show all products."}`,
        inputSchema: z.object({
          category: z.string().optional().describe("Optional product category to filter by. Leave empty to fetch all available products.")
        }),
        execute: async ({ category }) => {
          try {
            // Base filter: tenant's active products visible to this chatbot
            const baseWhere = {
              tenantId,
              isActive: true,
              OR: [
                { chatbotId: null },
                { chatbotId: chatbotId },
              ],
            };

            let products;

            if (category && category.trim()) {
              // Try filtering by category (case-insensitive contains match)
              products = await prisma.product.findMany({
                where: {
                  ...baseWhere,
                  category: { contains: category.trim(), mode: "insensitive" as const },
                },
                orderBy: { createdAt: "desc" },
              });

              // Fallback: if category filter returned nothing, fetch all products
              if (products.length === 0) {
                products = await prisma.product.findMany({
                  where: baseWhere,
                  orderBy: { createdAt: "desc" },
                });
              }
            } else {
              // No category specified — fetch all products for this chatbot
              products = await prisma.product.findMany({
                where: baseWhere,
                orderBy: { createdAt: "desc" },
              });
            }

            return products;
          } catch (error) {
            console.error("Error fetching local products in tool:", error);
            return [];
          }
        },
      }),
      trigger_handoff: tool({
        description: "Request a transfer to a human support agent. Call this when the user explicitly asks to speak with a human, a real person, a support agent, or when they are frustrated/stuck and you cannot help them.",
        inputSchema: z.object({
          reason: z.string().describe("The reason why handoff is being requested")
        }),
        execute: async ({ reason }) => {
          if (config.conversationId) {
            try {
              await prisma.conversation.update({
                where: { id: config.conversationId },
                data: {
                  status: "HANDOFF",
                  metadata: {
                    ...existingMeta,
                    handoffReason: reason,
                  },
                },
              });
            } catch (e) {
              console.error("Failed to update status to HANDOFF:", e);
            }
          }
          return { handoffTriggered: true, reason };
        },
      }),
      // Conversation end signal tool — the LLM calls this when the conversation is concluding
      end_conversation: tool({
        description: "Signal that the conversation has naturally concluded. Call this when the user says goodbye, thanks you and leaves, expresses they are done, or when you have completed your final farewell response. This stops the voice session cleanly.",
        inputSchema: z.object({
          reason: z.enum(["user_farewell", "consultation_complete", "no_further_questions"])
            .describe("Why the conversation is ending")
        }),
        execute: async ({ reason }) => {
          return { ended: true, reason };
        },
      }),
      // Dynamic step transition tool — the LLM calls this to advance the consultation flow
      ...(hasSteps ? {
        update_consultation_step: tool({
          description: `Advance the consultation to a specific step. Call this when the current step's objective is fulfilled. Valid step numbers: 1 to ${totalSteps}.`,
          inputSchema: z.object({
            stepNumber: z.number().min(1).max(totalSteps).describe("The step number to advance to.")
          }),
          execute: async ({ stepNumber }) => {
            // Persist step advancement immediately (not deferred to onFinish)
            // This prevents a race condition where a fast user click could trigger the
            // next API call before the step was persisted — causing the AI to repeat the previous step.
            if (config.conversationId) {
              try {
                await prisma.conversation.update({
                  where: { id: config.conversationId },
                  data: {
                    metadata: {
                      ...existingMeta,
                      currentStep: stepNumber,
                    },
                  },
                });
              } catch (e) {
                console.error("Failed to persist step advancement:", e);
              }
            }
            return { advanced: true, newStep: stepNumber };
          },
        }),
      } : {}),
    },
    stopWhen: stepCountIs(3), // Allow multi-tool calls: show_options + update_consultation_step + final text
    onFinish: async ({ usage, text, toolCalls, toolResults }) => {
      // ── PHASE 5: Parallel Post-Stream DB Writes ──
      // All writes are independent of each other — fire them in parallel
      try {
        const latencyMs = Date.now() - streamStartTime;
        const inputTokens = usage?.inputTokens || 0;
        const outputTokens = usage?.outputTokens || 0;
        const totalTokens = inputTokens + outputTokens;
        const pricingRates = await getSystemPricingRates();
        const cost = calculateCost(modelId, inputTokens, outputTokens, pricingRates);

        // Determine the next step dynamically from the LLM's tool calls
        let nextStep = currentStep;

        if (hasSteps && toolCalls && Array.isArray(toolCalls)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const stepAdvanceCall = (toolCalls as any[]).find((tc: any) => tc.toolName === "update_consultation_step");
          if (stepAdvanceCall) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const requestedStep = (stepAdvanceCall as any).args?.stepNumber;
            if (typeof requestedStep === "number" && requestedStep >= 1 && requestedStep <= totalSteps) {
              nextStep = requestedStep;
            }
          }
        }

        // Extract suggestions and products from tool execution to save in message metadata
        const messageMetadata: Record<string, unknown> = {};
        if (toolCalls && Array.isArray(toolCalls)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const showOptionsCall = (toolCalls as any[]).find((tc: any) => tc.toolName === "show_options");
          if (showOptionsCall) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            messageMetadata.suggestions = (showOptionsCall as any).args.options;
          }
        }

        if (toolResults && Array.isArray(toolResults)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fetchProductsResult = (toolResults as any[]).find((tr: any) => tr.toolName === "fetch_products");
          if (
            fetchProductsResult &&
            Array.isArray((fetchProductsResult as unknown as { result?: unknown[] }).result)
          ) {
            messageMetadata.products = (fetchProductsResult as unknown as { result: unknown[] }).result;
          }
        }

        // Resolve conversation ID — either existing or create new
        let conversationId = config.conversationId;

        if (!conversationId) {
          const conversation = await prisma.conversation.create({
            data: {
              tenantId,
              chatbotId,
              visitorId: config.visitorId || null,
              status: "ACTIVE",
              language: "en",
              metadata: {
                currentStep: nextStep
              }
            },
          });
          conversationId = conversation.id;
        }

        // Fire all independent writes in parallel
        const writes: Promise<unknown>[] = [];

        // Note: Step metadata update is handled immediately inside update_consultation_step's
        // execute() to prevent race conditions. No need to update it again here.

        // 2. Save the user message
        if (lastUserMessage) {
          writes.push(
            prisma.message.create({
              data: {
                conversationId,
                role: "USER",
                content: lastUserMessage.content,
              },
            })
          );
        }

        // 3. Save the assistant message with metadata
        writes.push(
          prisma.message.create({
            data: {
              conversationId,
              role: "ASSISTANT",
              content: text || "",
              inputTokens,
              outputTokens,
              totalTokens,
              cost,
              provider: chatbot.aiProvider,
              model: modelId,
              latencyMs,
              metadata: (Object.keys(messageMetadata).length > 0 ? messageMetadata : null) as Prisma.InputJsonValue,
            },
          })
        );

        // 4. Record usage
        writes.push(
          prisma.usageRecord.create({
            data: {
              tenantId,
              chatbotId,
              conversationId,
              provider: chatbot.aiProvider,
              model: modelId,
              inputTokens,
              outputTokens,
              totalTokens,
              requestType: "LLM",
              cost,
              wholesaleCost: 0,
            },
          })
        );

        // 5. Update DailyStats aggregates (mirrors what voice routes do for STT/TTS)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        writes.push(
          prisma.dailyStats.upsert({
            where: {
              tenantId_chatbotId_date: { tenantId, chatbotId, date: today },
            },
            create: {
              tenantId,
              chatbotId,
              date: today,
              messages: 1,
              inputTokens,
              outputTokens,
              totalTokens,
              chatCost: cost,
              totalCost: cost,
              wholesaleCost: 0,
              avgResponseTime: latencyMs,
            },
            update: {
              messages: { increment: 1 },
              inputTokens: { increment: inputTokens },
              outputTokens: { increment: outputTokens },
              totalTokens: { increment: totalTokens },
              chatCost: { increment: cost },
              totalCost: { increment: cost },
              wholesaleCost: { increment: 0 },
            },
          })
        );

        // Execute all writes in parallel
        await Promise.all(writes);
      } catch (error) {
        console.error("Error tracking usage:", error);
      }
    },
  });

  return result;
}
