"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
} from "lucide-react";

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Authentication validation states
  const [isValidating, setIsValidating] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [inviteDetails, setInviteDetails] = useState<{
    email: string;
    role: string;
    tenantName: string;
  } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Validate invitation token on mount
  useEffect(() => {
    if (!token) {
      setErrorMsg("Invitation token is missing. Please check your invitation link.");
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`/api/invite/accept?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || "This invitation link is invalid or has expired.");
        } else {
          setInviteDetails({
            email: data.email,
            role: data.role,
            tenantName: data.tenantName,
          });
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to validate invitation token. Please check your network connection.");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to accept invitation. Please try again.");
        setIsSubmitting(false);
      } else {
        // Full page redirect to refresh session cookies in server layouts
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error(err);
      setSubmitError("A connection error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Background Mesh and Orbs */}
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute inset-0 dot-pattern opacity-25" />
      <div className="glow-orb w-[600px] h-[600px] bg-purple-500/10 top-[20%] left-[-10%]" />
      <div className="glow-orb w-[500px] h-[500px] bg-blue-500/10 bottom-[10%] right-[-10%]" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-blue)] flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)]">
              AI<span className="gradient-text">Consultation</span>
            </span>
          </div>

          {/* Premium Glassmorphic Card */}
          <div className="glass-card p-8 md:p-10 border border-purple-500/20 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />

            {isValidating ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <Loader2 className="w-10 h-10 text-[var(--brand-purple)] animate-spin" />
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Validating Invitation</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Please wait while we check your secure token...</p>
                </div>
              </div>
            ) : errorMsg ? (
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6 shadow-lg shadow-red-500/5">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
                  Invalid Invitation
                </h2>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8 max-w-md">
                  {errorMsg}
                </p>
                <Link href="/login" className="btn-primary w-full justify-center py-3 text-sm">
                  Go to Login
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : inviteDetails ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                    Join {inviteDetails.tenantName}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Complete your profile setup to join the workspace.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)] space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-tertiary)]">Workspace:</span>
                    <span className="font-semibold text-[var(--text-primary)]">{inviteDetails.tenantName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-tertiary)]">Your Role:</span>
                    <span className="badge badge-purple text-[9px] uppercase font-bold">
                      {inviteDetails.role.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {submitError && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email (Disabled Display) */}
                  <div>
                    <label className="input-label">Email Address</label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="email"
                        disabled
                        value={inviteDetails.email}
                        className="input-field !pl-10.5 opacity-60 cursor-not-allowed bg-[var(--bg-tertiary)] text-xs text-[var(--text-secondary)]"
                      />
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="input-label">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="input-field !pl-10.5 text-xs text-[var(--text-primary)]"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="input-label">Create Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="input-field !pl-10.5 !pr-10 text-xs text-[var(--text-primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="input-label">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="input-field !pl-10.5 !pr-10 text-xs text-[var(--text-primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full justify-center py-3 text-xs mt-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Accept & Create Account
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : null}
          </div>

          <p className="text-xs text-center text-[var(--text-muted)] mt-8">
            Already have an active account? <Link href="/login" className="text-[var(--brand-purple)] hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
