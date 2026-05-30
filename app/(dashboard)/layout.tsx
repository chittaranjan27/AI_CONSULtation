"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  Bot,
  MessageSquare,
  Users,
  BarChart3,
  Workflow,
  FileText,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Menu,
  CreditCard,
  HelpCircle,
  LogOut,
  User,
  ShoppingBag,
} from "lucide-react";

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chatbots", href: "/dashboard/chatbots", icon: Bot },
  { label: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
  { label: "Leads", href: "/dashboard/leads", icon: Users },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Knowledge Base", href: "/dashboard/knowledge-base", icon: FileText },
  { label: "Integrations", href: "/dashboard/integrations", icon: Plug },
];

const bottomNav = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Help", href: "#", icon: HelpCircle },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarUserMenu, setSidebarUserMenu] = useState(false);
  const [topBarUserMenu, setTopBarUserMenu] = useState(false);
  const sidebarMenuRef = useRef<HTMLDivElement>(null);
  const topBarMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sidebarMenuRef.current && !sidebarMenuRef.current.contains(e.target as Node)) {
        setSidebarUserMenu(false);
      }
      if (topBarMenuRef.current && !topBarMenuRef.current.contains(e.target as Node)) {
        setTopBarUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden relative z-10">
      {/* Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] transition-all duration-300 relative ${
          sidebarCollapsed ? "w-[68px]" : "w-[260px]"
        }`}
      >
        {/* Toggle Button (Floating on the border) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute right-[-10px] top-[26px] z-50 w-5 h-5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-primary)] hover:bg-[var(--bg-glass-hover)] hover:border-[var(--border-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center shadow-md transition-all cursor-pointer"
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>

        {/* Logo */}
        <div className={`flex items-center h-[var(--nav-height)] border-b border-[var(--border-primary)] ${
          sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
        }`}>
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-blue)] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-base font-bold text-[var(--text-primary)] whitespace-nowrap">
                AI<span className="gradient-text">Consultation</span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${active ? "active" : ""} ${
                    sidebarCollapsed ? "justify-center px-0" : ""
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Nav */}
        <div className="px-3 py-4 border-t border-[var(--border-primary)] space-y-1">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`sidebar-link ${active ? "active" : ""} ${
                  sidebarCollapsed ? "justify-center px-0" : ""
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* User */}
        <div className="px-3 py-3 border-t border-[var(--border-primary)] relative" ref={sidebarMenuRef}>
          <div
            onClick={() => setSidebarUserMenu(!sidebarUserMenu)}
            className={`flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-glass-hover)] cursor-pointer transition-colors ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              A
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  Admin
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                  Free Plan
                </p>
              </div>
            )}
          </div>

          {/* Sidebar User Dropdown (opens upward) */}
          {sidebarUserMenu && (
            <div className={`absolute bottom-full mb-2 ${
              sidebarCollapsed ? "left-1/2 -translate-x-1/2" : "left-3 right-3"
            } bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl shadow-xl overflow-hidden z-50 min-w-[180px]`}>
              <div className="p-3 border-b border-[var(--border-primary)]">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">Admin</p>
                <p className="text-[11px] text-[var(--text-tertiary)] truncate">kcd5567@gmail.com</p>
              </div>
              <div className="p-1">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setSidebarUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)] rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <a
                  href="/api/auth/logout"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </a>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-[var(--nav-height)] flex items-center justify-between px-4 sm:px-6 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] shrink-0">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] w-72">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none flex-1"
            />
            <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-primary)]">
              ⌘K
            </kbd>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-[var(--bg-glass-hover)] text-[var(--text-secondary)] hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-px h-6 bg-[var(--border-primary)]" />
            <div className="relative" ref={topBarMenuRef}>
              <button
                onClick={() => setTopBarUserMenu(!topBarUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-glass-hover)] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                  A
                </div>
                <span className="hidden sm:inline text-sm text-[var(--text-secondary)]">
                  Admin
                </span>
              </button>

              {/* Top Bar User Dropdown */}
              {topBarUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-3 border-b border-[var(--border-primary)]">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">Admin</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] truncate">kcd5567@gmail.com</p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setTopBarUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)] rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile & Settings
                    </Link>
                    <a
                      href="/api/auth/logout"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-[280px] h-full bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] p-4 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-blue)] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold text-[var(--text-primary)]">
                  AI<span className="gradient-text">Consultation</span>
                </span>
              </div>
              <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                {mainNav.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`sidebar-link ${active ? "active" : ""}`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Sidebar Bottom Section */}
            <div className="border-t border-[var(--border-primary)] pt-4 space-y-4">
              <div className="space-y-1">
                {bottomNav.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`sidebar-link ${active ? "active" : ""}`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* User Section on Mobile */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    A
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">Admin</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] truncate">Free Plan</p>
                  </div>
                </div>
                <a
                  href="/api/auth/logout"
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
