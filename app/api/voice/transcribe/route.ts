import { NextRequest, NextResponse } from "next/server";

// Language code mapping: short code → BCP-47 locale for Sarvam AI
const LANGUAGE_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ur: "ur-IN",
  ar: "ar-AE",
  bn: "bn-IN",
  te: "te-IN",
  ta: "ta-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  od: "od-IN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.SARVAM_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || "en";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const filename = audioFile.name || "recording.wav";

    // Fallback to OpenAI Whisper for Arabic transcription if API key is present
    if (language === "ar" && openaiApiKey) {
      console.log(`Transcribing Arabic via OpenAI Whisper: file=${filename}, size=${audioFile.size} bytes`);
      const whisperForm = new FormData();
      whisperForm.append("file", audioFile, filename);
      whisperForm.append("model", "whisper-1");
      whisperForm.append("language", "ar");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: whisperForm,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI Whisper STT error:", response.status, errorText);
        return NextResponse.json(
          { error: "Whisper transcription failed", details: errorText },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json({
        transcript: data.text || "",
      });
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "Sarvam API key not configured" },
        { status: 500 }
      );
    }

    // Build the Sarvam API request as multipart/form-data
    const sarvamForm = new FormData();
    console.log(`Sarvam STT request: file=${filename}, type=${audioFile.type}, size=${audioFile.size} bytes, language=${language}`);

    sarvamForm.append("file", audioFile, filename);
    sarvamForm.append("model", "saaras:v3");
    sarvamForm.append("language_code", LANGUAGE_MAP[language] || "en-IN");

    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
      },
      body: sarvamForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sarvam STT error:", response.status, errorText);
      return NextResponse.json(
        { error: "Transcription failed", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      transcript: data.transcript || data.text || "",
    });
  } catch (error) {
    console.error("Voice transcribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
