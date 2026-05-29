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
  User,
  Building2,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordChecks = [
    { label: "At least 8 characters", valid: formData.password.length >= 8 },
    { label: "Contains a number", valid: /\d/.test(formData.password) },
    { label: "Contains uppercase", valid: /[A-Z]/.test(formData.password) },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Register the account
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // 2. Auto sign-in after registration
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (loginRes.ok) {
        router.push("/dashboard");
      } else {
        // Registration succeeded but auto-login failed — send to login page
        router.push("/login");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Left - Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh" />
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="glow-orb w-[500px] h-[500px] bg-purple-500/15 top-[10%] left-[10%]" />
        <div className="glow-orb w-[400px] h-[400px] bg-cyan-500/10 bottom-[10%] right-[10%]" />

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
            Start Building Your
            <br />
            <span className="gradient-text">AI Assistant</span> Today
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-md leading-relaxed mb-8">
            Create your free account and have your first AI chatbot live on your
            website in under 5 minutes.
          </p>

          {/* Steps */}
          <div className="space-y-4">
            {[
              "Create your account",
              "Configure your AI chatbot",
              "Train it with your data",
              "Embed on your website",
              "Start capturing leads",
            ].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-[var(--brand-purple)]">
                  {i + 1}
                </div>
                <span className="text-sm text-[var(--text-secondary)]">
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Register Form */}
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
            Create your account
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            Free forever plan · No credit card required
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="John Doe"
                    className="input-field !pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Company</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    placeholder="Acme Inc"
                    className="input-field !pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="input-label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
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
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Create a strong password"
                  className="input-field !pl-10 !pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.password && (
                <div className="flex gap-3 mt-2">
                  {passwordChecks.map((check) => (
                    <div
                      key={check.label}
                      className={`flex items-center gap-1 text-[11px] ${
                        check.valid
                          ? "text-[var(--brand-emerald)]"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      {check.label}
                    </div>
                  ))}
                </div>
              )}
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
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-center text-[var(--text-muted)] mt-4">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-[var(--text-secondary)] hover:text-white">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-[var(--text-secondary)] hover:text-white">
              Privacy Policy
            </a>
          </p>

          <p className="text-sm text-center text-[var(--text-secondary)] mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[var(--brand-purple)] hover:text-purple-400 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
