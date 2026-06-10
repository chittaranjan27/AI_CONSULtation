"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, ShieldAlert, Lock, Mail } from "lucide-react";

export default function RegisterPage() {
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
          <Link href="/" className="flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-blue)] flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)]">
              AI<span className="gradient-text">Assist</span>
            </span>
          </Link>

          {/* Premium Glassmorphic Card */}
          <div className="glass-card p-8 md:p-10 border border-purple-500/20 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />

            <div className="flex flex-col items-center text-center">
              {/* Icon Container */}
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/5">
                <ShieldAlert className="w-8 h-8 text-[var(--brand-purple)]" />
              </div>

              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
                Self-Registration Disabled
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8 max-w-md">
                Public account creation is closed. To maintain control over onboarding and access limits, all workspaces and user accounts are provisioned exclusively by the platform Super Admin.
              </p>

              {/* Informational Sections */}
              <div className="w-full text-left space-y-4 mb-8">
                <div className="flex gap-4 p-4 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)]">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <Mail className="w-4 h-4 text-[var(--brand-blue)]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)]">Invited Users</h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                      If you have received temporary credentials or an onboarding setup notice, click the button below to sign in.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-xl bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)]">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                    <Lock className="w-4 h-4 text-[var(--brand-purple)]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)]">New Workspaces</h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                      To register a new tenant company or obtain additional seats, please contact your organization&apos;s Super Admin.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link href="/login" className="btn-primary w-full justify-center py-3 text-sm">
                Go to Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <p className="text-xs text-center text-[var(--text-muted)] mt-8">
            Need assistance? Reach out to our system support team.
          </p>
        </div>
      </div>
    </div>
  );
}

