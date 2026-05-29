"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  X,
  Bot,
  User,
  Loader2,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ShoppingBag,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Headphones,
  MessageSquare,
  PhoneOff,
  Globe,
} from "lucide-react";

type VoiceState = "idle" | "recording" | "thinking" | "speaking";

const hasSpeechRecognition = typeof window !== "undefined" &&
  (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);

const ALL_SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", locale: "en-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", locale: "hi-IN" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", locale: "ar-AE" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", locale: "ur-PK" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", locale: "es-ES" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", locale: "fr-FR" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", locale: "de-DE" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", locale: "ja-JP" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", locale: "pt-BR" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", locale: "zh-CN" },
];

const getLocalizedWelcomeMessage = (lang: string, defaultMsg: string) => {
  const isDefault = !defaultMsg ||
    defaultMsg === "Hello! How can I help you today?" ||
    defaultMsg.toLowerCase().startsWith("hello! welcome to");

  if (isDefault) {
    if (lang === "hi") return "नमस्ते! आज मैं आपकी क्या मदद कर सकता हूँ?";
    if (lang === "ar") return "مرحباً! كيف يمكنني مساعدتك اليوم؟";
    if (lang === "ur") return "السلام علیکم! آج میں آپ کی کیا مدد کر سکتا ہوں؟";
    if (lang === "es") return "¡Hola! ¿Cómo puedo ayudarte hoy?";
    if (lang === "fr") return "Bonjour! Comment puis-je vous aider aujourd'hui?";
    if (lang === "de") return "Hallo! Wie kann ich Ihnen heute helfen?";
    if (lang === "ja") return "こんにちは！今日はどのようなご用件でしょうか？";
    if (lang === "pt") return "Olá! Como posso ajudar você hoje?";
    if (lang === "zh") return "你好！今天我能为您做些什么？";
  }
  return defaultMsg;
};

interface EmbedChatProps {
  chatbotId: string;
  botName: string;
  welcomeMessage: string;
  leadCaptureEnabled: boolean;
  widgetConfig: Record<string, string> | null;
  mode?: string;
  theme?: string;
  language?: string;
  supportedLanguages?: string[];
}

export default function EmbedChat({
  chatbotId,
  botName,
  welcomeMessage,
  leadCaptureEnabled,
  widgetConfig,
  mode = "floating",
  theme = "light",
  language = "en",
  supportedLanguages = ["en"],
}: EmbedChatProps) {
  const [leadCaptured, setLeadCaptured] = useState(!leadCaptureEnabled);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const selectedLanguageRef = useRef(selectedLanguage);
  selectedLanguageRef.current = selectedLanguage;
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; role: string; text: string; suggestions?: string[]; products?: any[] }>
  >([{ id: "welcome", role: "assistant", text: getLocalizedWelcomeMessage(language, welcomeMessage) }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── Voice Assistant State ──
  const [isVoiceMode, setIsVoiceMode] = useState(true);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [botSpeechText, setBotSpeechText] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceSessionEnded, setVoiceSessionEnded] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const userTranscriptRef = useRef("");
  const sentenceIndexRef = useRef(0);
  const audioMapRef = useRef<Record<number, HTMLAudioElement | string>>({});
  const nextPlayIndexRef = useRef(0);
  const pcmChunksRef = useRef<Float32Array[]>([]); // Raw PCM samples for reliable WAV building
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analyserIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSpokenRef = useRef(false);
  const manualStopRef = useRef(false); // True when user manually clicked mic to stop
  const userPausedRef = useRef(false); // True when user intentionally paused — prevents auto-restart
  const micPermissionGrantedRef = useRef(false);
  const voiceTranscriptEndRef = useRef<HTMLDivElement>(null);

  // Keep state refs updated on every render to solve stale closure bugs
  const chatMessagesRef = useRef(chatMessages);
  chatMessagesRef.current = chatMessages;
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;
  const startRecordingRef = useRef<() => void>(() => { }); // Stable ref to avoid dependency cascades
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const visitorNameRef = useRef(visitorName);
  visitorNameRef.current = visitorName;
  const visitorEmailRef = useRef(visitorEmail);
  visitorEmailRef.current = visitorEmail;
  const userTranscriptRefUpdated = useRef(userTranscript);
  userTranscriptRefUpdated.current = userTranscript;
  // Update the SpeechRecognition helper ref too
  userTranscriptRef.current = userTranscript;

  // Streaming audio queue refs
  const audioQueueRef = useRef<HTMLAudioElement[]>([]);
  const isAudioPlayingRef = useRef(false);
  const sentTextLengthRef = useRef(0);
  const streamFinishedRef = useRef(false);

  const detectAndSyncLanguage = useCallback((text: string) => {
    if (!text) return;
    // Devanagari script for Hindi
    if (/[\u0900-\u097F]/.test(text)) {
      if (supportedLanguages.includes("hi") && selectedLanguageRef.current !== "hi") {
        setSelectedLanguage("hi");
      }
    }
    // Arabic script for Arabic and Urdu
    else if (/[\u0600-\u06FF]/.test(text)) {
      const hasUrdu = supportedLanguages.includes("ur");
      const hasArabic = supportedLanguages.includes("ar");

      let detected = "";
      if (hasUrdu && !hasArabic) {
        detected = "ur";
      } else if (hasArabic && !hasUrdu) {
        detected = "ar";
      } else if (hasUrdu && hasArabic) {
        // Urdu specific characters check: چ, پ, گ, ڈ, ڑ, ں, ہ, ے
        if (/[\u067E\u0686\u0688\u0691\u06AF\u06BA\u06C1\u06D2]/.test(text)) {
          detected = "ur";
        } else {
          detected = "ar";
        }
      }

      if (detected && selectedLanguageRef.current !== detected) {
        setSelectedLanguage(detected);
      }
    }
  }, [supportedLanguages]);

  // ── Utility: Build WAV Blob from raw PCM Float32 samples ──
  const buildWavFromPcm = useCallback((samples: Float32Array, sampleRate: number): Blob => {
    const numSamples = samples.length;
    const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(wavBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };
    writeString(0, "RIFF");
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, numSamples * 2, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
    return new Blob([wavBuffer], { type: "audio/wav" });
  }, []);

  // ── Voice: Unified Recording Cleanup ──
  const cleanupActiveRecording = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (analyserIntervalRef.current) {
      clearInterval(analyserIntervalRef.current);
      analyserIntervalRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // ── Voice: Start Recording with Silence Detection ──
  const startRecording = useCallback(async () => {
    try {
      setVoiceError(null);
      // Stop any playing audio
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }

      // Abort any active speech recognition instance cleanly by stripping its handlers first
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (e) { }
        recognitionRef.current = null;
      }

      // If Web Speech API is supported, use it for zero-latency streaming transcription
      if (hasSpeechRecognition) {
        const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = true;

        let speechLang = "en-IN";
        const found = ALL_SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguageRef.current);
        if (found) {
          speechLang = found.locale;
        } else {
          speechLang = selectedLanguageRef.current;
        }
        recognition.lang = speechLang;

        recognition.onstart = () => {
          setVoiceState("recording");
          setUserTranscript("");
          userTranscriptRef.current = "";
          setBotSpeechText("");
          hasSpokenRef.current = false;
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          const transcript = finalTranscript || interimTranscript;
          if (transcript.trim()) {
            setUserTranscript(transcript);
            userTranscriptRef.current = transcript;
            hasSpokenRef.current = true;
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            setVoiceError("Microphone access denied. Please allow microphone permissions.");
          } else if (event.error !== "no-speech" && event.error !== "aborted") {
            setVoiceError("Speech recognition error: " + event.error);
          }
        };

        recognition.onend = () => {
          recognitionRef.current = null;
          cleanupActiveRecording();

          const transcript = userTranscriptRef.current;
          if (manualStopRef.current) {
            manualStopRef.current = false;
            setVoiceState("idle");
            return;
          }

          if (!hasSpokenRef.current || !transcript.trim()) {
            setVoiceState("idle");
            return;
          }

          // Auto-submit
          setVoiceState("thinking");
          submitVoiceMessage(transcript);
        };

        // In parallel, start a media stream to drive the sound wave visualizer
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          mediaStreamRef.current = stream;

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioContext = new AudioContextClass();
          if (audioContext.state === "suspended") {
            await audioContext.resume();
          }

          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.3;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          analyserIntervalRef.current = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            const voiceStart = 2;
            const voiceEnd = Math.min(80, dataArray.length);
            for (let i = voiceStart; i < voiceEnd; i++) {
              sum += dataArray[i];
            }
            const avg = sum / (voiceEnd - voiceStart);
            setAudioLevel(avg);
          }, 100);
        } catch (err) {
          console.warn("Could not start visualizer media stream:", err);
        }

        recognitionRef.current = recognition;
        recognition.start();
        micPermissionGrantedRef.current = true;
        return;
      }

      // ── Fallback: Existing PCM AudioContext WAV recorder logic ──
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // Set up Web Audio API for silence detection
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // ── Raw PCM capture via ScriptProcessorNode (bypasses WebM entirely) ──
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0; // Mute output to prevent feedback
      pcmChunksRef.current = [];
      const nativeSampleRate = audioContext.sampleRate;

      scriptProcessor.onaudioprocess = (e: AudioProcessingEvent) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Copy the raw samples directly to preserve original audio quality (no noise gate distortion)
        const samples = new Float32Array(inputData.length);
        samples.set(inputData);
        pcmChunksRef.current.push(samples);
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(silentGain);
      silentGain.connect(audioContext.destination);

      const SPEECH_THRESHOLD = 15; // Reliable fixed threshold for voice frequencies
      const SILENCE_DURATION = 1800; // 1.8s of silence to auto-stop
      const MIN_SPEECH_DURATION = 400; // Must speak for at least 0.4s
      const CONSECUTIVE_FRAMES_REQUIRED = 2; // Require 2 consecutive frames above threshold
      let consecutiveSpeechFrames = 0; // Counter for sustained speech confirmation
      hasSpokenRef.current = false;
      manualStopRef.current = false;
      let speechStartTime = 0;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      // Max listen timeout: automatically stops after 15s if the user hasn't spoken at all
      let maxListenTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
        if (mediaRecorder.state === "recording" && !hasSpokenRef.current) {
          mediaRecorder.stop();
        }
      }, 15000);

      // Absolute max recording duration: 25s hard cap (Sarvam limit is 30s)
      const absoluteMaxTimer = setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 25000);

      mediaRecorder.onstop = async () => {
        // Clean up audio analysis
        cleanupActiveRecording();
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (maxListenTimer) {
          clearTimeout(maxListenTimer);
          maxListenTimer = null;
        }
        clearTimeout(absoluteMaxTimer);
        // Disconnect PCM capture nodes
        try { scriptProcessor.disconnect(); } catch { }
        try { silentGain.disconnect(); } catch { }
        audioContext.close();

        // Collect raw PCM samples
        const pcmChunks = pcmChunksRef.current;
        const totalSamples = pcmChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        pcmChunksRef.current = [];

        // If user manually clicked mic to stop — cancel everything, go idle
        if (manualStopRef.current) {
          manualStopRef.current = false;
          setVoiceState("idle");
          return;
        }

        // Skip if user never spoke or too little audio captured
        if (!hasSpokenRef.current || totalSamples < 1600) {
          setVoiceState("idle");
          return;
        }

        setVoiceState("thinking");
        setUserTranscript("Transcribing...");

        // Merge all PCM chunks into a single Float32Array
        const mergedSamples = new Float32Array(totalSamples);
        let pcmOffset = 0;
        for (const chunk of pcmChunks) {
          mergedSamples.set(chunk, pcmOffset);
          pcmOffset += chunk.length;
        }

        // Resample from native sample rate (typically 48kHz) to 16kHz for Sarvam
        const targetRate = 16000;
        let finalSamples: Float32Array;
        if (Math.abs(nativeSampleRate - targetRate) > 1) {
          const ratio = nativeSampleRate / targetRate;
          const newLength = Math.round(mergedSamples.length / ratio);
          finalSamples = new Float32Array(newLength);
          for (let i = 0; i < newLength; i++) {
            const srcIdx = i * ratio;
            const lo = Math.floor(srcIdx);
            const hi = Math.min(lo + 1, mergedSamples.length - 1);
            const t = srcIdx - lo;
            finalSamples[i] = mergedSamples[lo] * (1 - t) + mergedSamples[hi] * t;
          }
        } else {
          finalSamples = mergedSamples;
        }

        // Build WAV directly from raw PCM — no WebM decoding needed
        const wavBlob = buildWavFromPcm(finalSamples, targetRate);

        // Helper: attempt STT call with status awareness
        const attemptSTT = async (blob: Blob, filename: string): Promise<{ transcript: string | null; status: number }> => {
          const fd = new FormData();
          fd.append("audio", blob, filename);
          fd.append("language", selectedLanguageRef.current);
          const res = await fetch("/api/voice/transcribe", {
            method: "POST",
            body: fd,
          });
          if (!res.ok) return { transcript: null, status: res.status };
          const data = await res.json();
          return { transcript: data.transcript || data.text || null, status: res.status };
        };

        try {
          let result = await attemptSTT(wavBlob, "recording.wav");
          let transcript = result.transcript;

          // Smart retry: only retry on 5xx/network errors, not 400 (bad audio) or 429 (rate limit)
          if (!transcript && result.status !== 400) {
            const backoff = result.status === 429 ? 2000 : 500;
            await new Promise(r => setTimeout(r, backoff));
            result = await attemptSTT(wavBlob, "recording.wav");
            transcript = result.transcript;
          }

          if (!transcript || !transcript.trim()) {
            setUserTranscript("Could not understand. Try again.");
            setVoiceState("idle");
            return;
          }

          setUserTranscript(transcript);
          await submitVoiceMessage(transcript);
        } catch (err) {
          console.error("STT error:", err);
          setVoiceError("Could not transcribe audio. Please try again.");
          setVoiceState("idle");
        }
      };

      // Mark that mic permission is now granted for auto-listen
      micPermissionGrantedRef.current = true;

      mediaRecorder.start(100); // Collect data every 100ms for better audio quality/reliability
      setVoiceState("recording");
      setUserTranscript("");
      setBotSpeechText("");

      // Monitor audio levels for silence detection
      analyserIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        // Calculate average volume level (focus on voice frequencies: bins 2-80 ≈ 170-6800 Hz)
        let sum = 0;
        const voiceStart = 2;
        const voiceEnd = Math.min(80, dataArray.length);
        for (let i = voiceStart; i < voiceEnd; i++) {
          sum += dataArray[i];
        }
        const avg = sum / (voiceEnd - voiceStart);
        setAudioLevel(avg);

        if (avg > SPEECH_THRESHOLD) {
          consecutiveSpeechFrames++;
          // Require sustained speech to confirm user is speaking
          if (consecutiveSpeechFrames >= CONSECUTIVE_FRAMES_REQUIRED && !hasSpokenRef.current) {
            hasSpokenRef.current = true;
            speechStartTime = Date.now();
            if (maxListenTimer) {
              clearTimeout(maxListenTimer);
              maxListenTimer = null;
            }
          }
          // Clear any pending silence timer (user is still speaking)
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else {
          consecutiveSpeechFrames = 0; // Reset consecutive counter on quiet frame
          if (hasSpokenRef.current && (Date.now() - speechStartTime) > MIN_SPEECH_DURATION) {
            // Silence detected after user has spoken long enough
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                // Auto-stop recording after sustained silence
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                  mediaRecorderRef.current.stop();
                }
              }, SILENCE_DURATION);
            }
          }
        }
      }, 100); // Check every 100ms

    } catch (err) {
      console.error("Microphone error:", err);
      setVoiceError("Microphone access denied. Please allow microphone permissions.");
      setVoiceState("idle");
    }
  }, [buildWavFromPcm, cleanupActiveRecording]);

  // Keep startRecordingRef always pointing to the latest version
  startRecordingRef.current = startRecording;

  // ── Voice: Stop Recording (manual cancel by user) ──
  const stopRecording = useCallback(() => {
    manualStopRef.current = true; // Flag: user cancelled — skip transcription entirely
    userPausedRef.current = true; // Prevent auto-restart
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) { }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    cleanupActiveRecording();
    setVoiceState("idle");
  }, [cleanupActiveRecording]);

  // ── Voice: Toggle Mic ──
  const toggleMic = useCallback(() => {
    if (voiceState === "recording") {
      stopRecording();
    } else if (voiceState === "speaking") {
      // Interrupt playback and start recording
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      userPausedRef.current = false; // User is explicitly starting — clear pause
      startRecording();
    } else {
      userPausedRef.current = false; // User is explicitly starting — clear pause
      startRecording();
    }
  }, [voiceState, stopRecording, startRecording]);  // ── Voice: Streaming Audio Queue Player ──
  // Uses refs for all external state to avoid dependency cascades
  const playNextInQueue = useCallback(() => {
    // If muted or audio is already playing, do not proceed
    if (isMutedRef.current) {
      audioMapRef.current = {};
      isAudioPlayingRef.current = false;
      setVoiceState("idle");
      return;
    }
    if (isAudioPlayingRef.current) return;

    const nextIdx = nextPlayIndexRef.current;
    const nextAudio = audioMapRef.current[nextIdx];

    if (nextAudio) {
      isAudioPlayingRef.current = true;
      setVoiceState("speaking");

      if (typeof nextAudio === "string") {
        // Speak via client-side SpeechSynthesis
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(nextAudio);

          let synthLang = "en-IN";
          const found = ALL_SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguageRef.current);
          if (found) {
            synthLang = found.locale;
          } else {
            synthLang = selectedLanguageRef.current;
          }
          utterance.lang = synthLang;

          const voices = window.speechSynthesis.getVoices();
          const matchingVoices = voices.filter(v => v.lang.toLowerCase().startsWith(synthLang.toLowerCase().slice(0, 2)));
          if (matchingVoices.length > 0) {
            const premiumVoice = matchingVoices.find(v =>
              v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Microsoft") || v.name.includes("Apple")
            );
            utterance.voice = premiumVoice || matchingVoices[0];
          }

          utterance.onend = () => {
            isAudioPlayingRef.current = false;
            delete audioMapRef.current[nextIdx];
            nextPlayIndexRef.current++;
            playNextInQueue();
          };

          utterance.onerror = (e) => {
            console.error("SpeechSynthesis error:", e);
            isAudioPlayingRef.current = false;
            delete audioMapRef.current[nextIdx];
            nextPlayIndexRef.current++;
            playNextInQueue();
          };

          window.speechSynthesis.speak(utterance);
        } else {
          isAudioPlayingRef.current = false;
          delete audioMapRef.current[nextIdx];
          nextPlayIndexRef.current++;
          playNextInQueue();
        }
      } else {
        // HTMLAudioElement
        activeAudioRef.current = nextAudio;

        nextAudio.onended = () => {
          isAudioPlayingRef.current = false;
          activeAudioRef.current = null;
          delete audioMapRef.current[nextIdx];
          nextPlayIndexRef.current++;
          playNextInQueue();
        };

        nextAudio.onerror = () => {
          isAudioPlayingRef.current = false;
          activeAudioRef.current = null;
          delete audioMapRef.current[nextIdx];
          nextPlayIndexRef.current++;
          playNextInQueue();
        };

        nextAudio.play().catch((err) => {
          console.error("Audio playback failed:", err);
          isAudioPlayingRef.current = false;
          playNextInQueue();
        });
      }
    } else {
      // Queue is empty. Check if stream is fully finished and we've processed all sentences.
      if (streamFinishedRef.current && nextIdx >= sentenceIndexRef.current) {
        setVoiceState("idle");
        isAudioPlayingRef.current = false;
      } else {
        // Stream is still loading but next sentence is not ready, show thinking/processing
        setVoiceState("thinking");
      }
    }
  }, []);

  // ── Voice: Synthesize a text chunk in background and add to queue ──
  const synthesizeAndQueue = useCallback(async (text: string, index: number) => {
    if (!text.trim() || isMutedRef.current) return;

    try {
      const res = await fetch("/api/voice/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: selectedLanguageRef.current }),
      });

      if (!res.ok) throw new Error("TTS chunk synthesis failed on backend");

      const { audio, format } = await res.json();
      if (!audio) throw new Error("Empty audio returned");

      const mimeType = format === "mp3" ? "audio/mpeg" : "audio/wav";
      const audioEl = new Audio(`data:${mimeType};base64,${audio}`);
      audioMapRef.current[index] = audioEl;

      // Try playing the next item in case the player was idle
      playNextInQueue();
    } catch (err) {
      console.warn("TTS backend synthesis failed, falling back to browser SpeechSynthesis:", err);
      audioMapRef.current[index] = text;
      playNextInQueue();
    }
  }, [playNextInQueue]);

  // ── Voice: Check if the text matches end call/chat options ──
  const isEndChatOption = (text: string): boolean => {
    const cleaned = text.toLowerCase().replace(/[^\w\s]/g, "").trim();
    return (
      cleaned === "end chat" ||
      cleaned === "end consultation" ||
      cleaned === "end call" ||
      cleaned === "stop consultation" ||
      cleaned === "quit consultation"
    );
  };

  // ── Voice: Stop STT/TTS, close voice flow, and reset consultation state cleanly ──
  const handleEndAndReset = useCallback(() => {
    // 1. Signal manual stop to prevent recorders from firing callbacks
    manualStopRef.current = true;
    userPausedRef.current = true; // Prevent any auto-record/auto-restart hooks from running

    // 2. Abort any in-flight backend requests (chat or synthesis)
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch (e) {}
    }

    // 3. Stop microphone & MediaRecorder
    cleanupActiveRecording();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    // 4. Stop STT (Speech Recognition) cleanly
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }

    // 5. Stop TTS (Audio playing & Audio Queue)
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
      } catch (e) {}
      activeAudioRef.current = null;
    }
    audioQueueRef.current.forEach((a) => {
      try {
        a.pause();
      } catch (e) {}
    });
    audioQueueRef.current = [];
    audioMapRef.current = {};
    isAudioPlayingRef.current = false;
    streamFinishedRef.current = true;
    sentTextLengthRef.current = 0;
    pcmChunksRef.current = [];

    // 6. Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // 7. Reset state and close voice mode
    setVoiceState("idle");
    setVoiceSessionEnded(false);
    setIsVoiceMode(false);

    // 8. Cleanly reset conversation state for the next session
    setConversationId(null);
    setChatMessages([
      {
        id: "welcome",
        role: "assistant",
        text: getLocalizedWelcomeMessage(selectedLanguage, welcomeMessage),
      },
    ]);
    setUserTranscript("");
    setBotSpeechText("");
    setVoiceError(null);
    setChatError(null);
    setInput("");
  }, [cleanupActiveRecording, selectedLanguage, welcomeMessage]);

  // ── Voice: Submit transcribed message and speak response ──
  const submitVoiceMessage = async (messageText: string) => {
    if (isLoading || isStreaming) return;

    if (isEndChatOption(messageText)) {
      handleEndAndReset();
      return;
    }

    // Reset streaming audio queue state
    audioMapRef.current = {};
    sentenceIndexRef.current = 0;
    nextPlayIndexRef.current = 0;
    isAudioPlayingRef.current = false;
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    sentTextLengthRef.current = 0;
    streamFinishedRef.current = false;
    setBotSpeechText("");

    // Ensure we're showing thinking state during API call
    if (isVoiceMode) {
      setVoiceState("thinking");
    }

    // Detect and update language automatically based on user voice text
    let activeLang = selectedLanguageRef.current;
    if (/[\u0900-\u097F]/.test(messageText)) {
      if (supportedLanguages.includes("hi")) {
        activeLang = "hi";
        setSelectedLanguage("hi");
      }
    } else if (/[\u0600-\u06FF]/.test(messageText)) {
      const hasUrdu = supportedLanguages.includes("ur");
      const hasArabic = supportedLanguages.includes("ar");
      if (hasUrdu && !hasArabic) {
        activeLang = "ur";
        setSelectedLanguage("ur");
      } else if (hasArabic && !hasUrdu) {
        activeLang = "ar";
        setSelectedLanguage("ar");
      } else if (hasUrdu && hasArabic) {
        if (/[\u067E\u0686\u0688\u0691\u06AF\u06BA\u06C1\u06D2]/.test(messageText)) {
          activeLang = "ur";
          setSelectedLanguage("ur");
        } else {
          activeLang = "ar";
          setSelectedLanguage("ar");
        }
      }
    }

    const userMsg = { id: `user-${Date.now()}`, role: "user", text: messageText };
    const updatedMessages = [...chatMessagesRef.current, userMsg];
    setChatMessages(updatedMessages);
    setIsLoading(true);
    setIsStreaming(false);
    setChatError(null);

    const apiMessages = updatedMessages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: [{ type: "text", text: m.text }],
    }));

    let fullResponseText = "";

    // ── TTS Text Cleaner ──
    // Strips option lists, emoji-prefixed choices, product details, and pricing
    // from text before sending to TTS synthesis. Keeps only conversational prose.
    const cleanTextForTTS = (text: string): string => {
      let cleaned = text;
      // Remove full lines that are numbered/bulleted options (1. ..., 2) ..., - ..., • ...)
      cleaned = cleaned.replace(/^\s*\d+[.):]\s+.+$/gm, "");
      cleaned = cleaned.replace(/^\s*[-•●▪︎▸►]\s+.+$/gm, "");
      // Remove lines that start with emoji(s) followed by short text (option chips)
      cleaned = cleaned.replace(/^\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]+\s*.{0,80}$/gmu, "");
      // Remove price mentions (₹xxx, د.إ xxx, $xxx)
      cleaned = cleaned.replace(/[₹$]\s*[\d,.]+/g, "");
      cleaned = cleaned.replace(/د\.إ\s*[\d,.]+/g, "");
      // Remove inline option enumerations like "Option A, Option B, or Option C"
      cleaned = cleaned.replace(/:\s*(?:['"][^'"]+['"]\s*,\s*){2,}['"][^'"]+['"]/g, "");
      // Collapse multiple blank lines and trim
      cleaned = cleaned.replace(/\n{2,}/g, "\n").trim();
      return cleaned;
    };

    // Helper to check for new complete sentences and send to TTS in background
    const checkAndQueueSentences = () => {
      if (!isVoiceMode) return;
      const untranslated = fullResponseText.slice(sentTextLengthRef.current);
      // Matches text ending in punctuation (., !, ?, । or |) or newlines — supports Hindi/multilingual
      const sentenceRegex = /[^.!?\n।|]+[.!?\n।|]+/g;
      let match;
      let lastIndex = 0;

      while ((match = sentenceRegex.exec(untranslated)) !== null) {
        const sentence = cleanTextForTTS(match[0]);
        if (sentence) {
          const index = sentenceIndexRef.current++;
          synthesizeAndQueue(sentence, index);
        }
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex > 0) {
        sentTextLengthRef.current += lastIndex;
      }
    };

    try {
      abortRef.current = new AbortController();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId,
          visitorName: visitorNameRef.current,
          visitorEmail: visitorEmailRef.current,
          conversationId: conversationIdRef.current,
          messages: apiMessages,
          mode: "voice",
          language: activeLang,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const headerConvId = response.headers.get("X-Conversation-Id");
      if (headerConvId && !conversationIdRef.current) {
        setConversationId(headerConvId);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      setIsLoading(false);
      setIsStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      setChatMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", text: "" },
      ]);

      const decoder = new TextDecoder();
      let buffer = "";
      const toolCallNames: Record<string, string> = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          const colonIdx = trimmedLine.indexOf(":");
          if (colonIdx <= 0) continue;

          const prefix = trimmedLine.slice(0, colonIdx);
          const payload = trimmedLine.slice(colonIdx + 1);

          try {
            if (prefix === "0") {
              const textChunk = JSON.parse(payload);
              if (typeof textChunk === "string") {
                fullResponseText += textChunk;
                detectAndSyncLanguage(fullResponseText);
                setChatMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, text: fullResponseText } : m
                  )
                );
                setBotSpeechText(fullResponseText);
                checkAndQueueSentences();
              }
              continue;
            }

            if (prefix === "a") {
              const data = JSON.parse(payload);
              if (data.toolName === "show_options" && data.result) {
                const suggestions = Array.isArray(data.result) ? data.result : [];
                console.log("[VOICE a:] show_options result:", JSON.stringify(suggestions), "count:", suggestions.length);
                setChatMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, suggestions } : m
                  )
                );
              } else if (data.toolName === "fetch_products" && data.result) {
                const products = Array.isArray(data.result) ? data.result : [];
                setChatMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, products } : m
                  )
                );
              }
              continue;
            }

            if (prefix === "data" || prefix === "d") {
              const data = JSON.parse(payload.trimStart());

              if (data.type === "text-delta" && (data.textDelta || data.delta || data.text)) {
                const textDelta = data.textDelta || data.delta || data.text || "";
                fullResponseText += textDelta;
                detectAndSyncLanguage(fullResponseText);
                setChatMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, text: fullResponseText } : m
                  )
                );
                setBotSpeechText(fullResponseText);
                checkAndQueueSentences();
                continue;
              }

              if (data.type === "tool-input-start" && data.toolCallId && data.toolName) {
                toolCallNames[data.toolCallId] = data.toolName;
                continue;
              }

              if (data.type === "tool-output-available" && data.toolCallId) {
                const toolName = toolCallNames[data.toolCallId] || "";
                const output = data.output;
                if (toolName === "show_options" && output) {
                  const suggestions = Array.isArray(output) ? output : [];
                  console.log("[VOICE data:] show_options output:", JSON.stringify(suggestions), "count:", suggestions.length);
                  setChatMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, suggestions } : m
                    )
                  );
                } else if (toolName === "fetch_products" && output) {
                  const products = Array.isArray(output) ? output : [];
                  setChatMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, products } : m
                    )
                  );
                }
                continue;
              }

              if (data.type === "tool-result") {
                const tName = data.toolName || toolCallNames[data.toolCallId] || "";
                const result = data.result || data.output;
                if (tName === "show_options" && result) {
                  console.log("[VOICE tool-result] show_options:", JSON.stringify(result), "isArray:", Array.isArray(result));
                  setChatMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, suggestions: Array.isArray(result) ? result : [] } : m
                    )
                  );
                } else if (tName === "fetch_products" && result) {
                  setChatMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, products: Array.isArray(result) ? result : [] } : m
                    )
                  );
                }
                continue;
              }
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setChatError(err.message || "Something went wrong.");
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortRef.current = null;
    }

    // Synthesize and play any leftover text at the end of the stream
    if (isVoiceMode) {
      const leftover = cleanTextForTTS(fullResponseText.slice(sentTextLengthRef.current));
      if (leftover) {
        const index = sentenceIndexRef.current++;
        synthesizeAndQueue(leftover, index);
        sentTextLengthRef.current = fullResponseText.length;
      }
      streamFinishedRef.current = true;
      // Trigger queue playback loop in case player is waiting
      playNextInQueue();
    } else {
      setVoiceState("idle");
    }
  };

  // Auto-start recording when voice mode is activated (only if mic was already granted and user hasn't paused)
  useEffect(() => {
    if (isVoiceMode && leadCaptured && voiceState === "idle" && micPermissionGrantedRef.current && !userPausedRef.current) {
      const timer = setTimeout(() => startRecordingRef.current(), 500);
      return () => clearTimeout(timer);
    }
  }, [isVoiceMode, leadCaptured, voiceState]);

  // Auto-scroll voice transcript
  useEffect(() => {
    if (isVoiceMode) {
      // Small timeout to ensure DOM has updated
      const timer = setTimeout(() => {
        voiceTranscriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [chatMessages, voiceState, userTranscript, isVoiceMode]);

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch (e) { }
        recognitionRef.current = null;
      }
      cleanupActiveRecording();
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [cleanupActiveRecording]);

  // Auto-scroll logic optimized for dynamic streaming (prevents stuttering)
  const prevMessagesCountRef = useRef(chatMessages.length);
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isNewMessage = chatMessages.length !== prevMessagesCountRef.current;
    prevMessagesCountRef.current = chatMessages.length;

    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;

    if (atBottom || isNewMessage) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isNewMessage ? "smooth" : "auto",
      });
    }
  }, [chatMessages]);

  // Show scroll-to-bottom button
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
    setShowScrollBtn(!atBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleClose = () => {
    window.parent.postMessage("bg-widget-close", "*");
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorEmail || !visitorPhone) return;

    setIsCapturing(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: visitorName || "Widget Visitor",
          email: visitorEmail,
          phone: visitorPhone,
          source: `Widget: ${botName}`,
          chatbotId,
        }),
      });
    } catch {
      // Don't block chat if lead capture fails
    }
    setLeadCaptured(true);
    setIsCapturing(false);
  };

  const submitMessage = async (messageText: string) => {
    if (isLoading || isStreaming) return;

    if (isEndChatOption(messageText)) {
      handleEndAndReset();
      return;
    }

    // Detect and update language automatically based on user text
    let activeLang = selectedLanguageRef.current;
    if (/[\u0900-\u097F]/.test(messageText)) {
      if (supportedLanguages.includes("hi")) {
        activeLang = "hi";
        setSelectedLanguage("hi");
      }
    } else if (/[\u0600-\u06FF]/.test(messageText)) {
      const hasUrdu = supportedLanguages.includes("ur");
      const hasArabic = supportedLanguages.includes("ar");
      if (hasUrdu && !hasArabic) {
        activeLang = "ur";
        setSelectedLanguage("ur");
      } else if (hasArabic && !hasUrdu) {
        activeLang = "ar";
        setSelectedLanguage("ar");
      } else if (hasUrdu && hasArabic) {
        if (/[\u067E\u0686\u0688\u0691\u06AF\u06BA\u06C1\u06D2]/.test(messageText)) {
          activeLang = "ur";
          setSelectedLanguage("ur");
        } else {
          activeLang = "ar";
          setSelectedLanguage("ar");
        }
      }
    }

    const userMsg = { id: `user-${Date.now()}`, role: "user", text: messageText };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setIsLoading(true);
    setIsStreaming(false);
    setChatError(null);

    const apiMessages = updatedMessages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: [{ type: "text", text: m.text }],
    }));

    try {
      abortRef.current = new AbortController();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId,
          visitorName,
          visitorEmail,
          conversationId,
          messages: apiMessages,
          mode: "text",
          language: activeLang,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const headerConvId = response.headers.get("X-Conversation-Id");
      if (headerConvId && !conversationId) {
        setConversationId(headerConvId);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      setIsLoading(false);
      setIsStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      let assistantText = "";

      setChatMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", text: "" },
      ]);

      const decoder = new TextDecoder();
      let buffer = "";

      // Track toolCallId → toolName mapping for UI Message Stream Protocol
      // (tool-output-available doesn't include toolName, only tool-input-start does)
      const toolCallNames: Record<string, string> = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          // ── AI SDK v6 UI Message Stream Protocol ──
          // The stream sends SSE events in two possible formats:
          //
          // Format A (UI Message Stream — from toUIMessageStreamResponse):
          //   data: {"type":"text-delta","textDelta":"Hello"}
          //   data: {"type":"tool-input-start","toolCallId":"tc_1","toolName":"show_options"}
          //   data: {"type":"tool-output-available","toolCallId":"tc_1","output":[...]}
          //
          // Format B (Data Stream Protocol — legacy / older SDK):
          //   0:"text chunk"           → text delta
          //   9:{...}                  → tool call start
          //   a:{"toolName":"...","result":[...]} → tool result

          const colonIdx = trimmedLine.indexOf(":");
          if (colonIdx <= 0) continue;

          const prefix = trimmedLine.slice(0, colonIdx);
          const payload = trimmedLine.slice(colonIdx + 1);

          try {
            // ─── Format B: Data Stream numeric-prefix protocol ───
            if (prefix === "0") {
              const textChunk = JSON.parse(payload);
              if (typeof textChunk === "string") {
                assistantText += textChunk;
                detectAndSyncLanguage(assistantText);
                setChatMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, text: assistantText } : m
                  )
                );
              }
              continue;
            }

            // Data Stream tool result: a:{"toolCallId":"...","toolName":"show_options","result":[...]}
            if (prefix === "a") {
              const data = JSON.parse(payload);
              if (data.toolName === "show_options" && data.result) {
                const suggestions = Array.isArray(data.result) ? data.result : [];
                console.log("[TEXT a:] show_options result:", JSON.stringify(suggestions), "count:", suggestions.length);
                setChatMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, suggestions } : m
                  )
                );
              } else if (data.toolName === "fetch_products" && data.result) {
                const products = Array.isArray(data.result) ? data.result : [];
                setChatMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, products } : m
                  )
                );
              }
              continue;
            }

            // ─── Format A: UI Message Stream SSE (data: prefix) ───
            if (prefix === "data" || prefix === "d") {
              const data = JSON.parse(payload.trimStart());

              // Text delta
              if (data.type === "text-delta" && (data.textDelta || data.delta || data.text)) {
                const textDelta = data.textDelta || data.delta || data.text || "";
                assistantText += textDelta;
                detectAndSyncLanguage(assistantText);
                setChatMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, text: assistantText } : m
                  )
                );
                continue;
              }

              // Tool input start — track toolCallId → toolName
              if (data.type === "tool-input-start" && data.toolCallId && data.toolName) {
                toolCallNames[data.toolCallId] = data.toolName;
                continue;
              }

              // Tool output available (UI Message Stream v6)
              if (data.type === "tool-output-available" && data.toolCallId) {
                const toolName = toolCallNames[data.toolCallId] || "";
                const output = data.output;

                if (toolName === "show_options" && output) {
                  const suggestions = Array.isArray(output) ? output : [];
                  console.log("[TEXT data:] show_options output:", JSON.stringify(suggestions), "count:", suggestions.length);
                  setChatMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, suggestions } : m
                    )
                  );
                } else if (toolName === "fetch_products" && output) {
                  const products = Array.isArray(output) ? output : [];
                  setChatMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, products } : m
                    )
                  );
                }
                continue;
              }

              // Legacy tool-result format fallback
              if (data.type === "tool-result") {
                const tName = data.toolName || toolCallNames[data.toolCallId] || "";
                const result = data.result || data.output;
                if (tName === "show_options" && result) {
                  console.log("[TEXT tool-result] show_options:", JSON.stringify(result), "isArray:", Array.isArray(result));
                  setChatMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, suggestions: Array.isArray(result) ? result : [] } : m
                    )
                  );
                } else if (tName === "fetch_products" && result) {
                  setChatMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, products: Array.isArray(result) ? result : [] } : m
                    )
                  );
                }
                continue;
              }
            }

            // Skip other prefixes (9: tool-call start, e: error, etc.)
          } catch {
            // Skip unparseable lines
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setChatError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || isStreaming) return;
    setInput("");
    await submitMessage(trimmed);
  };

  const handleSuggestionClick = async (optionText: string) => {
    await submitMessage(optionText);
  };

  const primaryColor = widgetConfig?.primaryColor || "#8B2E2E";
  const primaryLight = `${primaryColor}18`;
  const primaryMid = `${primaryColor}28`;
  const fontFamily = widgetConfig?.fontFamily || "var(--font-family, 'Outfit', system-ui, -apple-system, sans-serif)";

  return (
    <div
      className="flex flex-col flex-1 h-full min-h-full overflow-hidden"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: "linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-secondary) 100%)",
          borderBottom: "1px solid var(--border-primary)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
        className="flex items-center gap-3 px-4 py-3 shrink-0"
      >
        {/* Bot Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
          style={{
            background: widgetConfig?.botIconUrl ? "transparent" : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
            boxShadow: `0 2px 8px ${primaryColor}40`,
          }}
        >
          {widgetConfig?.botIconUrl ? (
            <img src={widgetConfig.botIconUrl} alt={botName} className="w-full h-full object-cover" />
          ) : (
            <Bot className="w-4.5 h-4.5 text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">

            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
              {botName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>
              Online · Ready to help
            </span>
          </div>
        </div>

        {/* Language Selector Dropdown */}
        {leadCaptured && supportedLanguages && supportedLanguages.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowLangMenu((prev) => !prev)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-glass-hover)] transition-colors flex items-center gap-1"
              style={{ color: "var(--text-muted)" }}
              title="Select Language"
            >
              <Globe className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{selectedLanguage}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLangMenu(false)}
                />
                <div
                  className="absolute right-0 mt-1.5 w-32 rounded-xl border shadow-xl z-50 py-1"
                  style={{
                    background: "var(--bg-elevated)",
                    borderColor: "var(--border-primary)",
                  }}
                >
                  {ALL_SUPPORTED_LANGUAGES.filter(lang =>
                    supportedLanguages.includes(lang.code)
                  ).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang.code);
                        setShowLangMenu(false);
                        // Update the welcome message if the user hasn't typed anything yet
                        if (chatMessages.length === 1 && chatMessages[0].id === "welcome") {
                          setChatMessages([{
                            id: "welcome",
                            role: "assistant",
                            text: getLocalizedWelcomeMessage(lang.code, welcomeMessage)
                          }]);
                        }
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[var(--bg-glass-hover)] transition-colors flex items-center gap-2 text-xs"
                      style={{
                        color: selectedLanguage === lang.code ? primaryColor : "var(--text-secondary)",
                        fontWeight: selectedLanguage === lang.code ? "600" : "400",
                      }}
                    >
                      <span className="text-sm">{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Voice Mode Toggle */}
        {leadCaptured && (
          <button
            onClick={() => {
              const nextMode = !isVoiceMode;
              setIsVoiceMode(nextMode);
              setVoiceSessionEnded(false);
              userPausedRef.current = !nextMode;
              // Stop any playing audio when toggling
              if (activeAudioRef.current) {
                activeAudioRef.current.pause();
                activeAudioRef.current = null;
              }
              if (recognitionRef.current) {
                try {
                  recognitionRef.current.onstart = null;
                  recognitionRef.current.onresult = null;
                  recognitionRef.current.onerror = null;
                  recognitionRef.current.onend = null;
                  recognitionRef.current.abort();
                } catch (e) { }
                recognitionRef.current = null;
              }
              if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
              }
              cleanupActiveRecording();
              setVoiceState("idle");
            }}
            className="p-1.5 rounded-lg transition-all"
            style={{
              color: isVoiceMode
                ? primaryColor
                : "var(--text-muted)",
              background: isVoiceMode
                ? `${primaryColor}18`
                : "transparent",
            }}
            title={isVoiceMode ? "Switch to Text Chat" : "Switch to Voice Mode"}
          >
            {isVoiceMode ? (
              <MessageSquare className="w-4 h-4" />
            ) : (
              <Headphones className="w-4 h-4" />
            )}
          </button>
        )}

        {mode !== "inline" && (
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg transition-all"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-tertiary)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
            }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Lead Capture Form ── */}
      {!leadCaptured && (
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden" style={{ background: "var(--bg-primary)" }}>
          {/* Watermark Background Overlay */}
          {widgetConfig?.backgroundImageUrl && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${widgetConfig.backgroundImageUrl})`,
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                opacity: 0.15,
              }}
            />
          )}
          <div className="w-full max-w-[300px] space-y-5 text-center">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}18, ${primaryColor}08)`,
                border: `1.5px solid ${primaryColor}25`,
                boxShadow: `0 4px 20px ${primaryColor}15`,
              }}
            >
              <Sparkles className="w-7 h-7" style={{ color: primaryColor }} />
            </div>

            {/* Text */}
            <div className="space-y-1.5">
              <h2
                className="text-lg font-bold"
                style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
              >
                Welcome! 👋
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-tertiary)" }}>
                Share a few details to start your consultation with{" "}
                <span className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {botName}
                </span>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLeadSubmit} className="space-y-3 text-left">
              <div>
                <label
                  className="text-[11px] font-semibold mb-1.5 block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1.5px solid var(--border-primary)",
                    color: "var(--text-primary)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor = primaryColor;
                    (e.currentTarget as HTMLInputElement).style.boxShadow = `0 0 0 3px ${primaryColor}18`;
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor = "var(--border-primary)";
                    (e.currentTarget as HTMLInputElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                  }}
                />
              </div>
              <div>
                <label
                  className="text-[11px] font-semibold mb-1.5 block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Email Address <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="jane@company.com"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1.5px solid var(--border-primary)",
                    color: "var(--text-primary)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor = primaryColor;
                    (e.currentTarget as HTMLInputElement).style.boxShadow = `0 0 0 3px ${primaryColor}18`;
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor = "var(--border-primary)";
                    (e.currentTarget as HTMLInputElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                  }}
                />
              </div>
              <div>
                <label
                  className="text-[11px] font-semibold mb-1.5 block"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Phone Number <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1.5px solid var(--border-primary)",
                    color: "var(--text-primary)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor = primaryColor;
                    (e.currentTarget as HTMLInputElement).style.boxShadow = `0 0 0 3px ${primaryColor}18`;
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor = "var(--border-primary)";
                    (e.currentTarget as HTMLInputElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isCapturing || !visitorEmail || !visitorPhone}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                  boxShadow: `0 4px 16px ${primaryColor}35`,
                  letterSpacing: "0.01em",
                }}
              >
                {isCapturing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Start Consultation
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setLeadCaptured(true)}
                className="w-full text-[11px] transition-colors py-1"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                }}
              >
                Skip for now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Voice Assistant Mode ── */}
      {leadCaptured && isVoiceMode && voiceSessionEnded && (
        <>
          <div
            className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
            style={{
              background: "linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
              animation: "fadeInUp 0.35s ease-out both",
            }}
          >
            {/* Watermark Background Overlay */}
            {widgetConfig?.backgroundImageUrl && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${widgetConfig.backgroundImageUrl})`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                  opacity: 0.15,
                }}
              />
            )}
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: 0.3 }}>
              <div
                className="absolute rounded-full"
                style={{
                  width: 200, height: 200, top: "20%", left: "10%",
                  background: `radial-gradient(circle, ${primaryColor}15 0%, transparent 70%)`,
                  animation: "voiceFloat 8s ease-in-out infinite",
                }}
              />
            </div>

            {/* Call Ended Icon */}
            <div
              className="relative z-10 flex flex-col items-center gap-5"
              style={{ animation: "fadeInUp 0.5s ease-out both" }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(220,38,38,0.08))",
                  border: "2px solid rgba(239,68,68,0.2)",
                  boxShadow: "0 8px 32px rgba(239,68,68,0.1)",
                }}
              >
                <PhoneOff className="w-8 h-8" style={{ color: "#ef4444" }} />
              </div>

              <div className="text-center">
                <h3
                  className="text-lg font-bold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Call Ended
                </h3>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Your voice session has ended
                </p>
              </div>

              <div className="flex items-center gap-3 mt-3">
                {/* Start New Call — creates a completely new conversation */}
                <button
                  onClick={() => {
                    // Reset to a fresh conversation session
                    setConversationId(null);
                    setChatMessages([{ id: "welcome", role: "assistant", text: welcomeMessage }]);
                    setUserTranscript("");
                    setBotSpeechText("");
                    setVoiceError(null);
                    setChatError(null);
                    setVoiceSessionEnded(false);
                    setVoiceState("idle");
                    setTimeout(() => startRecording(), 400);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all text-white"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                    boxShadow: `0 4px 16px ${primaryColor}30`,
                  }}
                >
                  <Mic className="w-3.5 h-3.5" />
                  New Call
                </button>

                {/* Switch to Text Chat */}
                <button
                  onClick={() => {
                    setVoiceSessionEnded(false);
                    setIsVoiceMode(false);
                    setVoiceState("idle");
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1.5px solid var(--border-primary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Text Chat
                </button>
              </div>
            </div>
          </div>

          {/* Powered by */}
          <div
            style={{
              background: "var(--bg-elevated)",
              borderTop: "1.5px solid var(--border-primary)",
            }}
            className="px-4 py-2 shrink-0"
          >
            <p
              className="text-center text-[9px]"
              style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}
            >
              Powered by{" "}
              <span
                className="font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, var(--text-secondary))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {widgetConfig?.poweredBy || "AI Consultation"}
              </span>
            </p>
          </div>
        </>
      )}

      {/* ── Voice Assistant Mode (Active) ── */}
      {leadCaptured && isVoiceMode && !voiceSessionEnded && (
        <>
          <div
            className={`flex-1 flex ${mode === "inline" ? "flex-row" : "flex-col"} relative overflow-hidden`}
            style={{
              background: "linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
              animation: "fadeInUp 0.35s ease-out both",
            }}
          >
            {/* Watermark Background Overlay */}
            {widgetConfig?.backgroundImageUrl && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${widgetConfig.backgroundImageUrl})`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                  opacity: 0.15,
                }}
              />
            )}
            {/* Animated Background Orbs */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ opacity: 0.4 }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  width: 200,
                  height: 200,
                  top: "10%",
                  left: "-10%",
                  background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
                  animation: "voiceFloat 8s ease-in-out infinite",
                }}
              />
              <div
                className="absolute rounded-full"
                style={{
                  width: 160,
                  height: 160,
                  bottom: "15%",
                  right: "-5%",
                  background: `radial-gradient(circle, ${primaryColor}15 0%, transparent 70%)`,
                  animation: "voiceFloat 6s ease-in-out infinite reverse",
                }}
              />
            </div>

            {/* ── Left / Center: Mic + Controls ── */}
            <div
              className={`flex flex-col items-center z-10 ${mode === "inline"
                ? "w-1/2 h-full border-r py-6 justify-center"
                : "w-full flex-1 justify-center min-h-0"
                }`}
              style={mode === "inline" ? { borderColor: "var(--border-primary)" } : {}}
            >
              {/* Status Text & Indicators */}
              <div className="text-center mb-8 z-10 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 mb-1.5">
                  {voiceState === "recording" && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                  {voiceState === "thinking" && (
                    <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ color: primaryColor, animationDuration: '3s' }} />
                  )}
                  {voiceState === "speaking" && (
                    <Volume2 className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
                  )}
                  <p
                    className="text-xs font-bold uppercase tracking-[0.15em]"
                    style={{
                      color: voiceState === "recording"
                        ? "#ef4444"
                        : voiceState === "thinking"
                          ? primaryColor
                          : voiceState === "speaking"
                            ? "#10b981"
                            : "var(--text-tertiary)",
                    }}
                  >
                    {voiceState === "idle" && "Ready"}
                    {voiceState === "recording" && "Listening"}
                    {voiceState === "thinking" && "Processing"}
                    {voiceState === "speaking" && "Speaking"}
                  </p>
                </div>
                <p
                  className="text-[10.5px] font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  {voiceState === "idle" && "Tap the microphone to begin"}
                  {voiceState === "recording" && "Speak naturally now..."}
                  {voiceState === "thinking" && "Consulting AI knowledge..."}
                  {voiceState === "speaking" && `${botName} is responding`}
                </p>
              </div>

              {/* Big Mic Button with Ripple Rings */}
              <div className="relative z-10 mb-8 flex items-center justify-center w-28 h-28">
                {/* Ripple rings when recording */}
                {voiceState === "recording" && (
                  <>
                    <div
                      className="absolute inset-0 rounded-full bg-red-500/10"
                      style={{
                        animation: "rippleSpread 2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite",
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-full bg-red-500/5"
                      style={{
                        animation: "rippleSpread 2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite 0.6s",
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-full bg-red-500/5"
                      style={{
                        animation: "rippleSpread 2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite 1.2s",
                      }}
                    />
                  </>
                )}

                {/* Ripple rings when speaking */}
                {voiceState === "speaking" && (
                  <>
                    <div
                      className="absolute inset-0 rounded-full bg-emerald-500/10"
                      style={{
                        animation: "rippleSpread 2.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite",
                      }}
                    />
                    <div
                      className="absolute inset-0 rounded-full bg-emerald-500/5"
                      style={{
                        animation: "rippleSpread 2.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite 0.7s",
                      }}
                    />
                  </>
                )}

                {/* Thinking gradient aura border */}
                {voiceState === "thinking" && (
                  <div
                    className="absolute inset-[4px] rounded-full"
                    style={{
                      border: "3.5px solid transparent",
                      borderTopColor: primaryColor,
                      borderRightColor: "#a855f7",
                      borderBottomColor: "#3b82f6",
                      animation: "spinPure 1.4s linear infinite",
                    }}
                  />
                )}

                {/* Main Mic Button */}
                <button
                  onClick={toggleMic}
                  disabled={voiceState === "thinking"}
                  className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-90"
                  style={{
                    background:
                      voiceState === "recording"
                        ? "linear-gradient(135deg, #ef4444, #dc2626)"
                        : voiceState === "speaking"
                          ? "linear-gradient(135deg, #10b981, #059669)"
                          : voiceState === "thinking"
                            ? "var(--bg-secondary)"
                            : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                    border: voiceState === "thinking" ? `1px solid var(--border-primary)` : "none",
                    boxShadow:
                      voiceState === "recording"
                        ? "0 8px 32px rgba(239,68,68,0.3)"
                        : voiceState === "speaking"
                          ? "0 8px 32px rgba(16,185,129,0.3)"
                          : voiceState === "thinking"
                            ? "0 4px 16px rgba(0,0,0,0.05)"
                            : `0 8px 32px ${primaryColor}30`,
                    animation: voiceState === "recording" ? "voicePulse 2s ease-in-out infinite" : "none",
                  }}
                >
                  {voiceState === "recording" ? (
                    <MicOff className="w-8 h-8 text-white" />
                  ) : voiceState === "thinking" ? (
                    <Sparkles className="w-8 h-8 animate-pulse" style={{ color: primaryColor }} />
                  ) : voiceState === "speaking" ? (
                    <Volume2 className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-white" />
                  )}
                </button>
              </div>

              {/* Sound Wave Visualizer */}
              <div className="flex items-end justify-center gap-1.5 h-10 mb-8 z-10">
                {[...Array(13)].map((_, i) => {
                  const multipliers = [0.35, 0.55, 0.75, 0.95, 1.15, 1.3, 1.4, 1.3, 1.15, 0.95, 0.75, 0.55, 0.35];
                  const isRecording = voiceState === "recording";
                  const isSpeaking = voiceState === "speaking";
                  const isThinking = voiceState === "thinking";

                  let barHeight = "6px";
                  if (isRecording) {
                    barHeight = `${Math.max(6, Math.min(36, (audioLevel / 40) * 32 * multipliers[i] + 4))}px`;
                  } else if (isSpeaking) {
                    barHeight = `${8 + Math.random() * 26 * multipliers[i]}px`;
                  }

                  return (
                    <div
                      key={i}
                      className="w-1 rounded-full transition-all duration-100"
                      style={{
                        height: isThinking ? "16px" : barHeight,
                        background:
                          isRecording
                            ? `linear-gradient(to top, #ef4444, #f87171)`
                            : isSpeaking
                              ? `linear-gradient(to top, #10b981, #34d399)`
                              : `linear-gradient(to top, var(--text-muted), var(--text-tertiary))`,
                        animation:
                          isThinking
                            ? `voiceWaveIdle 1.4s ease-in-out infinite alternate ${i * 0.08}s`
                            : isSpeaking
                              ? `voiceWave 0.6s ease-in-out infinite alternate ${i * 0.05}s`
                              : "none",
                        opacity: voiceState === "idle" ? 0.25 : 0.85,
                      }}
                    />
                  );
                })}
              </div>

              {/* Voice Error */}
              {voiceError && (
                <div
                  className="px-4 py-2 rounded-xl text-xs text-center z-10 max-w-[85%] mb-4"
                  style={{
                    background: "rgba(220, 38, 38, 0.12)",
                    border: "1.5px solid rgba(248, 113, 113, 0.25)",
                    color: "#f87171",
                  }}
                >
                  ⚠️ {voiceError}
                </div>
              )}

              {/* Bottom Controls — always visible, pinned at bottom */}
              <div className="flex items-center gap-3.5 z-10 shrink-0 pb-4">
                {/* Mute Toggle */}
                <button
                  onClick={() => {
                    setIsMuted((m) => !m);
                    if (activeAudioRef.current) {
                      activeAudioRef.current.pause();
                      activeAudioRef.current = null;
                      setVoiceState("idle");
                    }
                  }}
                  className="p-2.5 rounded-xl transition-all"
                  style={{
                    background: isMuted
                      ? "rgba(239,68,68,0.1)"
                      : "var(--bg-tertiary)",
                    border: isMuted
                      ? "1.5px solid rgba(239,68,68,0.25)"
                      : "1.5px solid var(--border-primary)",
                    color: isMuted
                      ? "#ef4444"
                      : "var(--text-secondary)",
                  }}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                {/* End Call Button */}
                <button
                  onClick={() => {
                    // Signal cancellation to prevent onstop from processing
                    manualStopRef.current = true;
                    userPausedRef.current = true;

                    // Abort any in-flight chat/TTS requests
                    abortRef.current?.abort();

                    // Stop recording
                    if (recognitionRef.current) {
                      try {
                        recognitionRef.current.onstart = null;
                        recognitionRef.current.onresult = null;
                        recognitionRef.current.onerror = null;
                        recognitionRef.current.onend = null;
                        recognitionRef.current.abort();
                      } catch (e) { }
                      recognitionRef.current = null;
                    }
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                      mediaRecorderRef.current.stop();
                    }
                    // Stop all audio playback
                    if (activeAudioRef.current) {
                      activeAudioRef.current.pause();
                      activeAudioRef.current = null;
                    }
                    // Clear audio queue
                    audioQueueRef.current.forEach(a => { try { a.pause(); } catch { } });
                    audioQueueRef.current = [];
                    audioMapRef.current = {};
                    isAudioPlayingRef.current = false;
                    streamFinishedRef.current = true;
                    sentTextLengthRef.current = 0;
                    pcmChunksRef.current = [];
                    cleanupActiveRecording();
                    // Clear timers
                    if (silenceTimerRef.current) {
                      clearTimeout(silenceTimerRef.current);
                      silenceTimerRef.current = null;
                    }
                    setVoiceState("idle");
                    setVoiceSessionEnded(true);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all text-white"
                  style={{
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    boxShadow: "0 4px 12px rgba(239,68,68,0.25)",
                  }}
                  title="End Voice Session"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  End Call
                </button>

                {/* Text Chat Button */}
                <button
                  onClick={() => {
                    setIsVoiceMode(false);
                    if (activeAudioRef.current) {
                      activeAudioRef.current.pause();
                      activeAudioRef.current = null;
                    }
                    if (recognitionRef.current) {
                      try {
                        recognitionRef.current.onstart = null;
                        recognitionRef.current.onresult = null;
                        recognitionRef.current.onerror = null;
                        recognitionRef.current.onend = null;
                        recognitionRef.current.abort();
                      } catch (e) { }
                      recognitionRef.current = null;
                    }
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                      mediaRecorderRef.current.stop();
                    }
                    cleanupActiveRecording();
                    setVoiceState("idle");
                  }}
                  className="p-2.5 rounded-xl transition-all"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1.5px solid var(--border-primary)",
                    color: "var(--text-secondary)",
                  }}
                  title="Switch to Text Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Right: Live Transcript Panel (inline) / Below (floating) ── */}
            <div
              className={`z-10 flex flex-col ${mode === "inline"
                ? "w-1/2 h-full p-5"
                : "w-[85%] max-w-[320px] rounded-2xl p-4 mt-0"
                }`}
              style={
                mode === "inline"
                  ? {}
                  : {
                    background: "var(--bg-secondary)",
                    border: "1.5px solid var(--border-primary)",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.1)",
                  }
              }
            >
              {mode === "inline" && (
                <div className="mb-4 shrink-0">
                  <h3
                    className="text-xs font-bold uppercase tracking-[0.15em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Conversation
                  </h3>
                </div>
              )}

              {/* Scrollable list of messages */}
              <div
                className="flex-1 overflow-y-auto space-y-4 pr-1"
                style={mode === "inline" ? {} : { maxHeight: "320px" }}
              >
                {(() => {
                  const visibleVoiceMessages = chatMessages.filter((message) => {
                    if (message.role === "assistant") {
                      return (
                        (message.text && message.text.trim().length > 0) ||
                        (message.suggestions && message.suggestions.length > 0) ||
                        (message.products && message.products.length > 0)
                      );
                    }
                    return true;
                  });

                  return visibleVoiceMessages.map((message, msgIdx) => {
                    const isUser = message.role === "user";
                    const isLastAssistant = !isUser && msgIdx === visibleVoiceMessages.length - 1;
                    return (
                      <div key={message.id} className="flex flex-col gap-2">
                        <div
                          className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className="max-w-[85%] rounded-2xl p-3"
                            style={
                              isUser
                                ? {
                                  background: `${primaryColor}15`,
                                  border: `1.5px solid ${primaryColor}30`,
                                  borderRadius: "18px 18px 4px 18px",
                                }
                                : {
                                  background: "var(--bg-secondary)",
                                  border: "1.5px solid var(--border-primary)",
                                  borderRadius: "18px 18px 18px 4px",
                                }
                            }
                          >
                            <p
                              className="text-[10px] font-bold uppercase tracking-wider mb-1"
                              style={{ color: isUser ? "var(--text-muted)" : primaryColor }}
                            >
                              {isUser ? "You" : botName}
                            </p>
                            <p
                              className="text-sm leading-relaxed whitespace-pre-wrap"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {message.text || <span style={{ color: "var(--text-muted)" }}>…</span>}
                            </p>
                          </div>
                        </div>

                        {/* Suggestion Chips in Voice Mode — shown on every message with suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="flex flex-col gap-1.5 pl-1">
                            {message.suggestions.map((opt, optIdx) => (
                              <button
                                key={opt}
                                onClick={() => {
                                  // Submit the selected option as a voice message
                                  if (isLastAssistant) submitVoiceMessage(opt);
                                }}
                                disabled={!isLastAssistant || isLoading || isStreaming || voiceState === "thinking"}
                                className="w-full text-left px-3 py-2 rounded-xl text-[11px] font-medium border transition-all flex items-center gap-2"
                                style={{
                                  borderColor: `${primaryColor}35`,
                                  color: "var(--text-primary)",
                                  background: `${primaryColor}08`,
                                  opacity: isLastAssistant ? 1 : 0.5,
                                  cursor: isLastAssistant ? "pointer" : "default",
                                  animation: isLastAssistant ? "fadeInUp 0.25s ease-out both" : "none",
                                  animationDelay: isLastAssistant ? `${optIdx * 0.06}s` : "0s",
                                }}
                              >
                                <span
                                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-[9px] font-bold text-white"
                                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
                                >
                                  {optIdx + 1}
                                </span>
                                <span className="flex-1">{opt}</span>
                                {isLastAssistant && <ArrowRight className="w-3 h-3 opacity-40 shrink-0" style={{ color: primaryColor }} />}
                              </button>
                            ))}
                            {isLastAssistant && (
                              <p className="text-[9px] text-center mt-1" style={{ color: "var(--text-muted)" }}>
                                Tap an option or say your choice
                              </p>
                            )}
                          </div>
                        )}

                        {/* Product Cards in Voice Mode */}
                        {message.products && message.products.length > 0 && (
                          <div className="pl-1">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Sparkles className="w-3 h-3" style={{ color: primaryColor }} />
                              <span className="text-[9px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                                Recommended for you
                              </span>
                            </div>
                            <div
                              className="flex gap-2 overflow-x-auto pb-1"
                              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                            >
                              {message.products.map((product: any) => (
                                <div
                                  key={product.id}
                                  className="flex flex-col w-[160px] shrink-0 rounded-xl border overflow-hidden"
                                  style={{
                                    borderColor: `${primaryColor}20`,
                                    background: "var(--bg-secondary)",
                                    boxShadow: `0 1px 8px ${primaryColor}08`,
                                  }}
                                >
                                  <div
                                    className="w-full h-20 flex items-center justify-center overflow-hidden"
                                    style={{
                                      background: product.imageUrl
                                        ? "var(--bg-tertiary)"
                                        : `linear-gradient(135deg, ${primaryColor}12, ${primaryColor}05)`,
                                    }}
                                  >
                                    {product.imageUrl ? (
                                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-1.5" />
                                    ) : (
                                      <ShoppingBag className="w-6 h-6" style={{ color: `${primaryColor}50` }} />
                                    )}
                                  </div>
                                  <div className="p-2 flex flex-col flex-1">
                                    <h4
                                      className="text-[10px] font-bold truncate mb-0.5"
                                      style={{ color: "var(--text-primary)" }}
                                    >
                                      {product.name}
                                    </h4>
                                    <div className="flex items-center justify-between mt-auto pt-1.5 border-t" style={{ borderColor: "var(--border-primary)" }}>
                                      <span className="text-xs font-extrabold" style={{ color: "var(--text-primary)" }}>
                                        {product.currency === "inr" ? "₹" : "د.إ "}{Number(product.price).toFixed(2)}
                                      </span>
                                      {product.checkoutUrl && (
                                        <a
                                          href={product.checkoutUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="px-2 py-1 rounded-md text-[8px] font-bold text-white"
                                          style={{
                                            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                                          }}
                                        >
                                          Buy Now
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}

                {/* Transcribing loader state */}
                {voiceState === "thinking" && userTranscript === "Transcribing..." && (
                  <div className="flex w-full justify-end">
                    <div
                      className="max-w-[85%] rounded-2xl p-3"
                      style={{
                        background: `${primaryColor}15`,
                        border: `1.5px solid ${primaryColor}30`,
                        borderRadius: "18px 18px 4px 18px",
                      }}
                    >
                      <p
                        className="text-[10px] font-bold uppercase tracking-wider mb-1"
                        style={{ color: "var(--text-muted)" }}
                      >
                        You
                      </p>
                      <div className="flex items-center gap-1.5 py-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: primaryColor }} />
                        <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>
                          Transcribing...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6">
                    <p
                      className="text-xs text-center"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {mode === "inline"
                        ? "Your conversation transcript will appear here"
                        : "Tap the microphone to start speaking"}
                    </p>
                  </div>
                )}

                {/* Anchor element for scrolling */}
                <div ref={voiceTranscriptEndRef} />
              </div>
            </div>
          </div>

          {/* Powered by */}
          <div
            style={{
              background: "var(--bg-elevated)",
              borderTop: "1.5px solid var(--border-primary)",
            }}
            className="px-4 py-2 shrink-0"
          >
            <p
              className="text-center text-[9px]"
              style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}
            >
              Powered by{" "}
              <span
                className="font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, var(--text-secondary))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {widgetConfig?.poweredBy || "AI Consultation"}
              </span>
            </p>
          </div>
        </>
      )}

      {/* ── Chat Messages ── */}
      {leadCaptured && !isVoiceMode && (
        <>
          <div className="flex-1 relative overflow-hidden flex flex-col bg-[var(--bg-primary)]">
            {/* Watermark Background Overlay */}
            {widgetConfig?.backgroundImageUrl && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${widgetConfig.backgroundImageUrl})`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                  opacity: 0.15,
                }}
              />
            )}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-5 space-y-4 relative z-10 bg-transparent"
            >
              {(() => {
                const visibleMessages = chatMessages.filter((message) => {
                  if (message.role === "assistant") {
                    return (
                      (message.text && message.text.trim().length > 0) ||
                      (message.suggestions && message.suggestions.length > 0) ||
                      (message.products && message.products.length > 0)
                    );
                  }
                  return true;
                });

                const showTypingIndicator = (isLoading || isStreaming) && (
                  visibleMessages.length === 0 ||
                  visibleMessages[visibleMessages.length - 1].role === "user"
                );

                return (
                  <>
                    {visibleMessages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex gap-2.5 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        style={{
                          animation: "fadeInUp 0.25s ease-out both",
                          animationDelay: `${Math.min(index * 0.03, 0.15)}s`,
                        }}
                      >
                        {/* Bot Avatar */}
                        {message.role === "assistant" && (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 overflow-hidden"
                            style={{
                              background: widgetConfig?.botIconUrl ? "transparent" : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                              boxShadow: `0 2px 6px ${primaryColor}30`,
                            }}
                          >
                            {widgetConfig?.botIconUrl ? (
                              <img src={widgetConfig.botIconUrl} alt="Bot Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <Bot className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className="flex flex-col gap-2 max-w-[78%]">
                          {message.text && (
                            <div
                              className={`px-4 py-3 text-[13px] leading-relaxed ${message.role === "user"
                                ? "rounded-2xl rounded-br-sm"
                                : "rounded-2xl rounded-bl-sm"
                                }`}
                              style={
                                message.role === "user"
                                  ? {
                                    background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                                    color: "#ffffff",
                                    boxShadow: `0 2px 12px ${primaryColor}30`,
                                    fontWeight: 500,
                                  }
                                  : {
                                    background: "var(--bg-secondary)",
                                    border: "1.5px solid var(--border-primary)",
                                    color: "var(--text-primary)",
                                    boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                                  }
                              }
                            >
                              {message.text}
                            </div>
                          )}

                          {/* Render Option Buttons — always visible on messages with suggestions */}
                          {message.suggestions && message.suggestions.length > 0 && (() => {
                            const isLatest = index === visibleMessages.length - 1;
                            return (
                              <div className="flex flex-col gap-2 mt-2 w-full" style={{ opacity: isLatest ? 1 : 0.5 }}>
                                {message.suggestions.map((opt, optIdx) => (
                                  <button
                                    key={opt}
                                    onClick={() => { if (isLatest) handleSuggestionClick(opt); }}
                                    disabled={!isLatest || isLoading || isStreaming}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-[13px] font-medium border transition-all flex items-center gap-3 ${isLatest ? "cursor-pointer group" : "cursor-default"}`}
                                    style={{
                                      borderColor: `${primaryColor}35`,
                                      color: "var(--text-primary)",
                                      background: `${primaryColor}08`,
                                      animationDelay: isLatest ? `${optIdx * 0.06}s` : "0s",
                                      animation: isLatest ? "fadeInUp 0.25s ease-out both" : "none",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isLatest) return;
                                      (e.currentTarget as HTMLButtonElement).style.background = `${primaryColor}20`;
                                      (e.currentTarget as HTMLButtonElement).style.borderColor = primaryColor;
                                      (e.currentTarget as HTMLButtonElement).style.transform = "translateX(4px)";
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isLatest) return;
                                      (e.currentTarget as HTMLButtonElement).style.background = `${primaryColor}08`;
                                      (e.currentTarget as HTMLButtonElement).style.borderColor = `${primaryColor}35`;
                                      (e.currentTarget as HTMLButtonElement).style.transform = "translateX(0)";
                                    }}
                                  >
                                    <span
                                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
                                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
                                    >
                                      {optIdx + 1}
                                    </span>
                                    <span className="flex-1">{opt}</span>
                                    {isLatest && (
                                      <ArrowRight
                                        className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                        style={{ color: primaryColor }}
                                      />
                                    )}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}

                          {/* Render Products Carousel */}
                          {message.products && message.products.length > 0 && (
                            <div className="mt-2 w-full">
                              {/* Carousel Header */}
                              <div className="flex items-center gap-2 mb-2.5 px-1">
                                <div
                                  className="w-5 h-5 rounded-md flex items-center justify-center"
                                  style={{
                                    background: `linear-gradient(135deg, ${primaryColor}25, ${primaryColor}10)`,
                                    border: `1px solid ${primaryColor}30`,
                                  }}
                                >
                                  <Sparkles className="w-3 h-3" style={{ color: primaryColor }} />
                                </div>
                                <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                                  Recommended for you
                                </span>
                              </div>

                              {/* Scrollable Product Cards */}
                              <div
                                className="flex gap-3 overflow-x-auto py-1 px-0.5 max-w-full"
                                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                              >
                                {message.products.map((product: any, pIdx: number) => (
                                  <div
                                    key={product.id}
                                    className="flex flex-col w-[200px] shrink-0 rounded-xl border overflow-hidden transition-all"
                                    style={{
                                      borderColor: `${primaryColor}20`,
                                      background: "var(--bg-secondary)",
                                      boxShadow: `0 2px 12px ${primaryColor}08`,
                                      animation: "fadeInUp 0.3s ease-out both",
                                      animationDelay: `${pIdx * 0.08}s`,
                                    }}
                                  >
                                    {/* Product Image */}
                                    <div
                                      className="w-full h-28 relative overflow-hidden flex items-center justify-center"
                                      style={{
                                        background: product.imageUrl
                                          ? "var(--bg-tertiary)"
                                          : `linear-gradient(135deg, ${primaryColor}12, ${primaryColor}05)`,
                                      }}
                                    >
                                      {product.imageUrl ? (
                                        <img
                                          src={product.imageUrl}
                                          alt={product.name}
                                          className="w-full h-full object-contain p-2 transition-transform duration-300 hover:scale-105"
                                        />
                                      ) : (
                                        <ShoppingBag className="w-8 h-8" style={{ color: `${primaryColor}55` }} />
                                      )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="p-3 flex flex-col flex-grow">
                                      <h4
                                        className="text-xs font-bold truncate mb-1"
                                        style={{ color: "var(--text-primary)" }}
                                      >
                                        {product.name}
                                      </h4>
                                      <p
                                        className="text-[10px] line-clamp-2 leading-relaxed mb-3 flex-grow"
                                        style={{ color: "var(--text-muted)" }}
                                      >
                                        {product.description}
                                      </p>

                                      {/* Action row */}
                                      <div
                                        className="flex items-center justify-between pt-2 border-t mt-auto"
                                        style={{ borderColor: "var(--border-primary)" }}
                                      >
                                        <span
                                          className="text-sm font-extrabold"
                                          style={{ color: "var(--text-primary)" }}
                                        >
                                          {product.currency === "inr" ? "₹" : "د.إ "}{Number(product.price).toFixed(2)}
                                        </span>
                                        {product.checkoutUrl && (
                                          <a
                                            href={product.checkoutUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:shadow-md cursor-pointer"
                                            style={{
                                              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                                            }}
                                            onMouseEnter={(e) => {
                                              (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.03)";
                                            }}
                                            onMouseLeave={(e) => {
                                              (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
                                            }}
                                          >
                                            Buy Now
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* User Avatar */}
                        {message.role === "user" && (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{
                              background: "linear-gradient(135deg, var(--bg-tertiary), var(--bg-elevated))",
                              border: "1.5px solid var(--border-secondary)",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            }}
                          >
                            <User className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {showTypingIndicator && (
                      <div className="flex gap-2.5 justify-start">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                          style={{
                            background: widgetConfig?.botIconUrl ? "transparent" : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                            boxShadow: `0 2px 6px ${primaryColor}30`,
                          }}
                        >
                          {widgetConfig?.botIconUrl ? (
                            <img src={widgetConfig.botIconUrl} alt="Bot Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <Bot className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                        <div
                          className="px-4 py-3 rounded-2xl rounded-bl-sm"
                          style={{
                            background: "var(--bg-secondary)",
                            border: "1.5px solid var(--border-primary)",
                            animation: "loaderGlow 2s infinite ease-in-out",
                          }}
                        >
                          <div className="flex gap-1.5 items-center h-4">
                            {[0, 150, 300].map((delay) => (
                              <div
                                key={delay}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  background: primaryColor,
                                  animation: `typingBounce 1.2s infinite ease-in-out`,
                                  animationDelay: `${delay}ms`,
                                  opacity: 0.85,
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Error */}
              {chatError && (
                <div
                  className="mx-auto max-w-[90%] px-3.5 py-2.5 rounded-xl text-xs text-center"
                  style={{
                    background: "rgba(220, 38, 38, 0.12)",
                    border: "1.5px solid rgba(248, 113, 113, 0.25)",
                    color: "#f87171",
                  }}
                >
                  ⚠️ {chatError}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll-to-bottom button */}
            {showScrollBtn && (
              <button
                onClick={scrollToBottom}
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all z-20"
                style={{
                  bottom: "20px",
                  background: "var(--bg-secondary)",
                  border: "1.5px solid var(--border-primary)",
                  color: "var(--text-secondary)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
                New messages
              </button>
            )}
          </div>

          {/* ── Input Bar ── */}
          <div
            style={{
              background: "linear-gradient(0deg, var(--bg-elevated) 0%, var(--bg-secondary) 100%)",
              borderTop: "1.5px solid var(--border-primary)",
              boxShadow: "0 -2px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.03)",
            }}
            className="px-4 py-3 shrink-0"
          >
            <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: "var(--bg-primary)",
                  border: "1.5px solid var(--border-primary)",
                  color: "var(--text-primary)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
                disabled={isLoading || isStreaming}
                onFocus={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor = primaryColor;
                  (e.currentTarget as HTMLInputElement).style.boxShadow = `0 0 0 3px ${primaryColor}15`;
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLInputElement).style.borderColor = "var(--border-primary)";
                  (e.currentTarget as HTMLInputElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                }}
              />
              <button
                type="submit"
                disabled={isLoading || isStreaming || !input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all shrink-0 disabled:opacity-40"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                  boxShadow: input.trim() ? `0 3px 10px ${primaryColor}40` : "none",
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p
              className="text-center mt-2 text-[9px]"
              style={{ color: "var(--text-muted)", letterSpacing: "0.04em" }}
            >
              Powered by{" "}
              <span
                className="font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, var(--text-secondary))`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {widgetConfig?.poweredBy || "AI Consultation"}
              </span>
            </p>
          </div>
        </>
      )}

      {/* Fade-in and voice animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes loaderGlow {
          0%, 100% { border-color: var(--border-primary); box-shadow: 0 1px 6px rgba(0,0,0,0.05); }
          50% { border-color: ${primaryColor}40; box-shadow: 0 1px 12px ${primaryColor}15; }
        }
        @keyframes voicePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes voiceRipple {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
        }
        @keyframes rippleSpread {
          0% { transform: scale(0.98); opacity: 0.8; }
          50% { opacity: 0.3; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        @keyframes voiceWave {
          0% { height: 6px; }
          100% { height: 32px; }
        }
        @keyframes voiceWaveIdle {
          0%, 100% { transform: scaleY(0.8); }
          50% { transform: scaleY(1.5); }
        }
        @keyframes voiceFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.1); }
        }
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes spinPure {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}