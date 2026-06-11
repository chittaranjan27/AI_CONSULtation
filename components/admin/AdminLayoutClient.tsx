"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  Building,
  CreditCard,
  TrendingUp,
  Bot,
  Cpu,
  MessageSquare,
  DollarSign,
  Activity,
  Plug,
  Shield,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  User,
  Users,
  AlertTriangle,
} from "lucide-react";

// Sidebar Links Configuration for Super Admin
const adminNav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Tenants", href: "/admin/tenants", icon: Building },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Billing & Revenue", href: "/admin/billing", icon: CreditCard },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "System Operations", href: "/admin/system-ops", icon: Activity },
];

const bottomNav = [
  { label: "Notifications", href: "/admin/notifications", icon: Bell, badge: true },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export default function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarUserMenu, setSidebarUserMenu] = useState(false);
  const [topBarUserMenu, setTopBarUserMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const sidebarMenuRef = useRef<HTMLDivElement>(null);
  const topBarMenuRef = useRef<HTMLDivElement>(null);

  // Load sidebar state from cookies
  useEffect(() => {
    const isCollapsed = document.cookie.split("; ").find(row => row.startsWith("sidebar_collapsed="))?.split("=")[1] === "true";
    setSidebarCollapsed(isCollapsed);
  }, []);

  const userName = user?.name || "Admin";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  // Fetch unread notifications count
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchUnreadCount = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/admin/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadNotifications(data.count || 0);
        } else if (res.status === 401) {
          clearInterval(intervalId);
        }
      } catch (err) {
        // Silently handle temporary network drops or HMR builds
      }
    };

    fetchUnreadCount();

    // Refresh count every 30 seconds
    intervalId = setInterval(fetchUnreadCount, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Close dropdowns on click outside
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
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    // Clear cookie and redirect
    router.push("/api/auth/logout");
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden relative z-10">
      {/* Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] transition-all duration-300 relative ${
          sidebarCollapsed ? "w-[68px]" : "w-[260px]"
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => {
            const nextState = !sidebarCollapsed;
            setSidebarCollapsed(nextState);
            document.cookie = `sidebar_collapsed=${nextState}; path=/; max-age=${60 * 60 * 24 * 365}`;
          }}
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
        <div
          className={`flex items-center h-[var(--nav-height)] border-b border-[var(--border-primary)] ${
            sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
          }`}
        >
          <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-purple)] to-[var(--brand-blue)] flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-base font-bold text-[var(--text-primary)] whitespace-nowrap">
                Super<span className="gradient-text">Admin</span>
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {adminNav.map((item) => {
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
                } relative`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}

                {/* Notifications Badge */}
                {item.badge && unreadNotifications > 0 && (
                  <span
                    className={`absolute rounded-full bg-red-500 text-white font-bold flex items-center justify-center text-[10px] ${
                      sidebarCollapsed
                        ? "top-1 right-2 w-4 h-4"
                        : "right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 min-w-4 h-4"
                    }`}
                  >
                    {unreadNotifications}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Card */}
        <div className="px-3 py-3 border-t border-[var(--border-primary)] relative" ref={sidebarMenuRef}>
          <div
            onClick={() => setSidebarUserMenu(!sidebarUserMenu)}
            className={`flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-glass-hover)] cursor-pointer transition-colors ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {userInitial}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {userName}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                  Super Admin
                </p>
              </div>
            )}
          </div>

          {/* User Menu Dropdown */}
          {sidebarUserMenu && (
            <div
              className={`absolute bottom-full mb-2 ${
                sidebarCollapsed ? "left-1/2 -translate-x-1/2" : "left-3 right-3"
              } bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl shadow-xl overflow-hidden z-50 min-w-[180px]`}
            >
              <div className="p-3 border-b border-[var(--border-primary)]">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{userName}</p>
                <p className="text-[11px] text-[var(--text-tertiary)] truncate">{userEmail}</p>
              </div>
              <div className="p-1">
                <Link
                  href="/admin/settings"
                  onClick={() => setSidebarUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)] rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-[var(--nav-height)] flex items-center justify-between px-4 sm:px-6 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-[var(--text-secondary)] hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-[var(--brand-purple)] bg-[var(--brand-purple)]/10 border border-[var(--brand-purple)]/20 px-2.5 py-1 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              Platform Control Center
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Badge Bell */}
            <Link
              href="/admin/notifications"
              className="relative p-2 rounded-lg hover:bg-[var(--bg-glass-hover)] text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>

            <div className="w-px h-6 bg-[var(--border-primary)]" />

            {/* Profile Dropdown */}
            <div className="relative" ref={topBarMenuRef}>
              <button
                onClick={() => setTopBarUserMenu(!topBarUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-glass-hover)] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                  {userInitial}
                </div>
                <span className="hidden sm:inline text-sm text-[var(--text-secondary)]">
                  {userName}
                </span>
              </button>

              {topBarUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-3 border-b border-[var(--border-primary)]">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{userName}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] truncate">{userEmail}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/admin/settings"
                      onClick={() => setTopBarUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)] rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-bg-mesh">{children}</main>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm"
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
                  Super<span className="gradient-text">Admin</span>
                </span>
              </div>
              <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                {adminNav.map((item) => {
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
                      className={`sidebar-link ${active ? "active" : ""} relative`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      <span>{item.label}</span>
                      {item.badge && unreadNotifications > 0 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-red-500 text-white font-bold flex items-center justify-center text-[10px] px-1.5 py-0.5">
                          {unreadNotifications}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]/50 border border-[var(--border-primary)]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {userInitial}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">{userName}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] truncate">Super Admin</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
