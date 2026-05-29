"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Globe, ChevronRight } from "lucide-react";

const languages = [
  {
    code: "en",
    name: "English",
    flag: "🇺🇸",
    greeting: "Hello! How can I help you today?",
    response: "I'd be happy to assist you with our services. What are you looking for?",
    dir: "ltr",
  },
  {
    code: "hi",
    name: "हिन्दी",
    flag: "🇮🇳",
    greeting: "नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?",
    response: "मुझे आपकी सेवाओं में मदद करने में खुशी होगी। आप क्या ढूंढ रहे हैं?",
    dir: "ltr",
  },
  {
    code: "es",
    name: "Español",
    flag: "🇪🇸",
    greeting: "¡Hola! ¿Cómo puedo ayudarte hoy?",
    response: "Estaré encantado de ayudarte con nuestros servicios. ¿Qué estás buscando?",
    dir: "ltr",
  },
  {
    code: "fr",
    name: "Français",
    flag: "🇫🇷",
    greeting: "Bonjour ! Comment puis-je vous aider ?",
    response: "Je serais ravi de vous aider avec nos services. Que recherchez-vous ?",
    dir: "ltr",
  },
  {
    code: "ar",
    name: "العربية",
    flag: "🇸🇦",
    greeting: "مرحباً! كيف يمكنني مساعدتك اليوم؟",
    response: "يسعدني مساعدتك في خدماتنا. ماذا تبحث عنه؟",
    dir: "rtl",
  },
  {
    code: "ja",
    name: "日本語",
    flag: "🇯🇵",
    greeting: "こんにちは！今日はどうされましたか？",
    response: "サービスについてお手伝いいたします。何をお探しですか？",
    dir: "ltr",
  },
  {
    code: "de",
    name: "Deutsch",
    flag: "🇩🇪",
    greeting: "Hallo! Wie kann ich Ihnen heute helfen?",
    response: "Ich helfe Ihnen gerne mit unseren Dienstleistungen. Wonach suchen Sie?",
    dir: "ltr",
  },
  {
    code: "pt",
    name: "Português",
    flag: "🇧🇷",
    greeting: "Olá! Como posso ajudá-lo hoje?",
    response: "Ficarei feliz em ajudá-lo com nossos serviços. O que você está procurando?",
    dir: "ltr",
  },
  {
    code: "zh",
    name: "中文",
    flag: "🇨🇳",
    greeting: "你好！今天我能帮您什么？",
    response: "我很乐意为您提供我们的服务。您在找什么？",
    dir: "ltr",
  },
];

export default function MultiLanguageSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % languages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const activeLang = languages[activeIndex];

  return (
    <section id="multilingual" className="section relative" ref={ref}>
      {/* Background Decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb w-[400px] h-[400px] bg-emerald-500/8 top-1/4 -left-48" />
        <div className="glow-orb w-[350px] h-[350px] bg-blue-500/8 bottom-1/4 -right-48" style={{ animationDelay: "3s" }} />
      </div>

      <div className="container-wide relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="badge badge-emerald mb-4">Multilingual</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Speak Your Customer&apos;s{" "}
            <span className="gradient-text">Language</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            AI-powered auto-detection and translation for 9+ languages. Engage
            visitors worldwide with native-quality conversations in every script.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
        >
          {/* Left — Language Picker Grid */}
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {languages.map((lang, index) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setActiveIndex(index);
                    setIsAutoPlaying(false);
                  }}
                  className={`relative p-4 rounded-xl border text-left transition-all duration-300 group ${
                    activeIndex === index
                      ? "bg-[var(--brand-emerald)]/10 border-[var(--brand-emerald)]/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                      : "bg-[var(--bg-card)] border-[var(--border-primary)] hover:border-[var(--border-secondary)] hover:bg-[var(--bg-glass-hover)]"
                  }`}
                >
                  <span className="text-2xl mb-2 block">{lang.flag}</span>
                  <span
                    className={`text-sm font-medium block ${
                      activeIndex === index
                        ? "text-[var(--brand-emerald)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {lang.name}
                  </span>
                  {lang.dir === "rtl" && (
                    <span className="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                      RTL
                    </span>
                  )}
                  {activeIndex === index && (
                    <motion.div
                      layoutId="activeLang"
                      className="absolute inset-0 border-2 border-[var(--brand-emerald)]/40 rounded-xl pointer-events-none"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 px-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--brand-emerald)] animate-pulse" />
                <span className="text-sm text-[var(--text-secondary)]">Auto-detection</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--brand-blue)]" />
                <span className="text-sm text-[var(--text-secondary)]">9+ Languages</span>
              </div>
              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-[var(--brand-purple)]" />
                <span className="text-sm text-[var(--text-secondary)]">RTL Support</span>
              </div>
            </div>
          </div>

          {/* Right — Live Chat Preview */}
          <div className="glass-card p-0 overflow-hidden hover:transform-none relative">
            {/* Chat Window Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]/80">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-blue-500/30 flex items-center justify-center text-sm">
                🤖
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  AI Consultant
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-emerald)]" />
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    Online — {activeLang.name}
                  </span>
                </div>
              </div>
              <span className="text-lg">{activeLang.flag}</span>
            </div>

            {/* Chat Messages */}
            <div
              className="p-5 space-y-4 min-h-[260px] flex flex-col justify-end"
              dir={activeLang.dir}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeLang.code + "-greeting"}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-4"
                >
                  {/* User message */}
                  <div className={`flex ${activeLang.dir === "rtl" ? "justify-start" : "justify-end"}`}>
                    <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/15 text-sm text-[var(--text-primary)]">
                      {activeLang.greeting}
                    </div>
                  </div>

                  {/* Bot response */}
                  <div className={`flex ${activeLang.dir === "rtl" ? "justify-end" : "justify-start"} gap-2`}>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500/30 to-blue-500/30 flex items-center justify-center text-[10px] shrink-0 mt-1">
                      🤖
                    </div>
                    <div className="max-w-[80%] px-4 py-2.5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-sm text-[var(--text-secondary)]">
                      {activeLang.response}
                    </div>
                  </div>

                  {/* Language indicator */}
                  <div className="flex items-center justify-center pt-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                      <Globe className="w-3 h-3 text-[var(--brand-emerald)]" />
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        Auto-detected: {activeLang.name}
                        {activeLang.dir === "rtl" && " (RTL)"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Chat Input */}
            <div className="px-5 py-3 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]/50">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)]">
                <span className="text-xs text-[var(--text-muted)] flex-1">
                  Type a message in any language...
                </span>
                <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <ChevronRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>

            {/* Language cycling indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px]">
              <motion.div
                key={activeIndex}
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: isAutoPlaying ? 3 : 0, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
