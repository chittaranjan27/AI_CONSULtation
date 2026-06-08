"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        if (data.user?.role === "SUPER_ADMIN") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Left - Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="glow-orb w-[500px] h-[500px] bg-purple-500/15 top-[10%] left-[10%]" />
        <div className="glow-orb w-[400px] h-[400px] bg-blue-500/10 bottom-[10%] right-[10%]" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-blue)] flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)]">
              AI<span className="gradient-text">Consultation</span>
            </span>
          </Link>

          <h1 className="text-4xl font-bold mb-4 text-[var(--text-primary)] leading-tight">
            Turn Every Conversation
            <br />
            <span className="gradient-text">Into Revenue</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-md leading-relaxed">
            AI-powered consultation chatbots that capture leads, qualify
            prospects, and grow your business on autopilot.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {[
              "AI Chatbot",
              "Lead Capture",
              "Analytics",
              "Multi-Language",
              "Workflow Builder",
            ].map((f) => (
              <span
                key={f}
                className="px-3 py-1.5 rounded-full bg-[var(--bg-glass)] border border-[var(--border-primary)] text-xs text-[var(--text-secondary)]"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link
            href="/"
            className="lg:hidden flex items-center gap-3 mb-10 justify-center"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-blue)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">
              AI<span className="gradient-text">Consultation</span>
            </span>
          </Link>

          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Welcome back
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            Sign in to your account to continue
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="input-field !pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field !pl-10 !pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-center text-[var(--text-muted)] mt-8">
            Looking to create a new workspace? <br />
            Contact your organization&apos;s Super Admin to get set up.
          </p>
        </div>
      </div>
    </div>
  );
}
