import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.SARVAM_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  try {
    const { text, speaker = "priya", language = "en" } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const truncatedText = text.slice(0, 500);
    if (text.length > 500) {
      console.warn(`TTS text truncated: ${text.length} chars → 500 chars`);
    }

    // Use OpenAI TTS for Arabic/Urdu if OpenAI key is configured
    if ((language === "ar" || language === "ur") && openaiApiKey) {
      console.log(`Synthesizing ${language} voice via OpenAI TTS...`);
      // Use premium voices: alloy (balanced) or nova (higher pitch female)
      const openaiVoice = language === "ar" ? "alloy" : "nova";

      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: truncatedText,
          voice: openaiVoice,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI TTS error:", response.status, errorText);
        return NextResponse.json(
          { error: "OpenAI Speech synthesis failed", details: errorText },
          { status: response.status }
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString("base64");

      return NextResponse.json({
        audio: base64Audio,
        format: "mp3",
      });
    }

    // Fallback to Sarvam for English/Hindi or any other supported Indic languages
    if (!apiKey) {
      return NextResponse.json(
        { error: "Sarvam API key not configured for language: " + language },
        { status: 500 }
      );
    }

    // Sarvam bulbul only supports English and 10 Indic languages (no Arabic, no Urdu for TTS)
    if (language === "ar" || language === "ur") {
      return NextResponse.json(
        { error: "Language " + language + " not supported by Sarvam TTS" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: truncatedText,
        speaker,
        model: "bulbul:v3",
        speech_sample_rate: 24000,
        enable_preprocessing: false,
        pace: 1.0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sarvam TTS error:", response.status, errorText);
      return NextResponse.json(
        { error: "Speech synthesis failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      audio: data.audios?.[0] || data.audio || "",
    });
  } catch (error) {
    console.error("Voice synthesize error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
