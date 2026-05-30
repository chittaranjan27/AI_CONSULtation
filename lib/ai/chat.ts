import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { getAIModel, calculateCost, type AIProviderType } from "./providers";
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

/**
 * Core chat completion function using Vercel AI SDK streamText().
 * Handles RAG retrieval, streaming, and usage tracking.
 *
 * The consultation flow is entirely dynamic — driven by the
 * `consultationSteps` JSON configured per-chatbot in the dashboard.
 * No business-specific logic is hardcoded here.
 *
 * Performance: DB queries are parallelized, RAG is skipped during
 * early intake steps, and onFinish writes are batched.
 */
export async function createChatCompletion(config: ChatConfig) {
  const { chatbotId, tenantId, conversationId, messages } = config;

  // ── PHASE 1: Parallel DB Lookups ──
  // Fire all independent queries simultaneously instead of sequentially
  const [chatbot, conversationMeta, categoriesResult] = await Promise.all([
    // 1. Load chatbot configuration + its API key in one go
    prisma.chatbot.findUnique({
      where: { id: chatbotId, tenantId },
    }),

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
  ]);

  if (!chatbot) {
    throw new Error("Chatbot not found");
  }

  const provider = chatbot.aiProvider as AIProviderType;
  const modelId = chatbot.model;

  // Get tenant's API key for this provider (second parallel batch — depends on chatbot)
  const apiKeyRecord = await prisma.tenantApiKey.findUnique({
    where: {
      tenantId_provider: {
        tenantId,
        provider: chatbot.aiProvider,
      },
    },
  });

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
  // - Skip during early intake steps (1-3) where user is just selecting options
  // - Skip for very short messages (option clicks like "Yes, please", "Hair Care")
  // - Always run for later steps or longer free-text messages
  const isEarlyIntakeStep = hasSteps && currentStep <= 3;
  const isShortMessage = !lastUserMessage || lastUserMessage.content.length < RAG_MIN_MESSAGE_LENGTH;
  const needsRAG = !isEarlyIntakeStep || !isShortMessage;

  if (needsRAG && lastUserMessage) {
    try {
      // We need an OpenAI key for embeddings (even if chatbot uses different provider)
      const openaiKey = await prisma.tenantApiKey.findUnique({
        where: {
          tenantId_provider: {
            tenantId,
            provider: "OPENAI",
          },
        },
      });

      const embeddingKey = openaiKey?.encryptedKey || apiKey;
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
      systemPrompt += `\n\n[CONSULTATION FLOW STATE (VOICE MODE)]
You are guiding the user through a ${totalSteps}-step intake consultation. Here is the full flow outline:
${stepsOutline}

You are currently on Step ${matchedStep.stepNumber}: "${matchedStep.title}".
Instructions for this step: ${matchedStep.prompt}

CRITICAL RULES FOR VOICE CONVERSATION:
1. NATURAL CONVERSATION: Speak in a warm, professional, empathetic, and conversational tone.
2. NO STRICT STEPS: Do not lock the user into rigid steps. If the user asks a question, goes off-topic, or describes their situation out of order, answer them naturally and thoroughly using your knowledge base and context. Do NOT aggressively redirect them back to a strict step.
3. ORGANIC INTAKE: Guide them through the intake concerns and recommend products naturally as part of a real conversation.
${stepInputType === "text"
          ? `4. FREE-TEXT INPUT MODE: For this step, the user is expected to type/speak freely. Do NOT call the 'show_options' tool. Ask an open-ended question and wait for their response without presenting selectable buttons.`
          : `4. DISPLAY OPTIONS (MANDATORY — SILENT): For every response/query in this flow, you MUST call the 'show_options' tool to display interactive buttons on the screen. However, do NOT read out, list, or mention the options in your spoken response text. The options will appear visually on the user's screen for them to tap. Your spoken response should only contain the conversational guidance, question, or context — never enumerate or narrate the choices. If the step does not define explicit options, generate logical options (e.g. yes/no, range values, or common answers) and pass them to the tool silently. IMPORTANT: If the active conversation language is NOT English, you MUST translate every option into the active language before passing them to the tool. The meaning and intent of each option must remain identical — only the language changes.`
        }
5. PRODUCT RECOMMENDATIONS (VOICE-OPTIMIZED): When recommending products, ONLY say the product name and ONE brief benefit sentence in your spoken text (e.g. "I recommend the [Product Name] — it's great for daily pH-balanced care."). Do NOT read out prices, ingredient lists, specifications, or detailed descriptions — those are all shown visually on the product card. Call the 'fetch_products' tool to display the product cards on screen. Keep your spoken mention to 1 sentence per product maximum.
6. RESPONSIVENESS: Keep responses natural, concise, and conversational (2-3 sentences max per turn). ABSOLUTELY DO NOT list, enumerate, read out, or narrate the options in your text response. Do NOT write numbered lists, bullet points, dashes, or any form of option listing. The 'show_options' tool handles all option display visually. Your text must ONLY contain the conversational question or guidance — nothing else. Example of WRONG: "You can choose from: 1) Hair fall 2) Dandruff 3) Thinning". Example of CORRECT: "What concern would you like to address today?"
7. STEP ADVANCEMENT: When you believe the current step's objective has been fulfilled and the user has provided the required input, call the 'update_consultation_step' tool with the next step number to advance the flow.`;
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
5. When showing product recommendations, you MUST call the 'fetch_products' tool with the correct category based on their concern. All prices and transactions must be discussed and represented in Dirham (د.إ) only (e.g. '150 د.إ'). Never use the dollar ($) symbol or mention USD.
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
- When recommending products, call the 'fetch_products' tool with the relevant category. All prices and transactions must be discussed and represented in Dirham (د.إ) only (e.g. '150 د.إ'). Never use the dollar ($) symbol or mention USD.
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
      .map((code) => langCodeToName[code] || code.toUpperCase())
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

  // ── Final Reinforcement Block ──
  if (hasSteps && matchedStep) {
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
    maxOutputTokens: chatbot.maxTokens,
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
        const cost = calculateCost(modelId, inputTokens, outputTokens);

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
              avgResponseTime: latencyMs,
            },
            update: {
              messages: { increment: 1 },
              inputTokens: { increment: inputTokens },
              outputTokens: { increment: outputTokens },
              totalTokens: { increment: totalTokens },
              chatCost: { increment: cost },
              totalCost: { increment: cost },
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
