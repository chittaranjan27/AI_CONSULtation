"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  AlertTriangle,
  Zap,
  Building,
  DollarSign,
  AlertOctagon,
  Clock,
  Loader2,
  Settings2,
} from "lucide-react";

interface SystemNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsCenterClientProps {
  initialNotifications: SystemNotification[];
}

export default function NotificationsCenterClient({
  initialNotifications,
}: NotificationsCenterClientProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<SystemNotification[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("unread");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // Filter list
  const filtered = notifications.filter((n) => {
    if (activeTab === "unread") return !n.isRead;
    return true;
  });

  // Mark single as read
  const handleMarkRead = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    setIsBulkLoading(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Delete single notification
  const handleDeleteNotification = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/notifications?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Render icon based on type
  const getIcon = (type: string) => {
    switch (type) {
      case "new_tenant":
        return <Building className="w-4.5 h-4.5 text-blue-400" />;
      case "tenant_suspended":
        return <AlertOctagon className="w-4.5 h-4.5 text-pink-500" />;
      case "token_limit_reached":
        return <Zap className="w-4.5 h-4.5 text-amber-400 animate-pulse" />;
      case "high_ai_costs":
        return <DollarSign className="w-4.5 h-4.5 text-pink-400" />;
      case "crm_sync_failed":
        return <AlertTriangle className="w-4.5 h-4.5 text-orange-400" />;
      case "payment_failed":
        return <AlertOctagon className="w-4.5 h-4.5 text-red-500" />;
      default:
        return <Bell className="w-4.5 h-4.5 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notification Alerts Command</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            System warnings, payment failures, high resource usage alerts, and new registrations.
          </p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            disabled={isBulkLoading}
            className="btn-secondary text-xs py-2 px-5 flex items-center gap-1.5 shrink-0 justify-center"
          >
            {isBulkLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCheck className="w-4 h-4" />
                Mark All as Read
              </>
            )}
          </button>
        )}
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-[var(--border-primary)] gap-4">
        <button
          onClick={() => setActiveTab("unread")}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "unread"
              ? "border-[var(--brand-purple)] text-[var(--brand-purple)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          Unread Alerts ({notifications.filter((n) => !n.isRead).length})
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "all"
              ? "border-[var(--brand-purple)] text-[var(--brand-purple)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          All Logs ({notifications.length})
        </button>
      </div>

      {/* Alerts Logs */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card p-10 hover:transform-none text-center text-[var(--text-muted)]">
            No system notifications found in this view.
          </div>
        ) : (
          filtered.map((n) => {
            const isLoading = actionLoadingId === n.id;
            return (
              <div
                key={n.id}
                className={`glass-card p-4 hover:transform-none flex items-start justify-between gap-4 transition-all ${
                  !n.isRead ? "border-l-4 border-[var(--brand-purple)] bg-[var(--brand-purple)]/5" : "opacity-85"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] flex items-center justify-center shrink-0">
                    {getIcon(n.type)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                      {n.title}
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-purple)] shrink-0" />
                      )}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] mt-2">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      disabled={isLoading}
                      className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white transition-colors"
                      title="Mark as Read"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteNotification(n.id)}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--brand-purple)]/10 text-[var(--text-secondary)] hover:text-[var(--brand-purple)] transition-colors"
                    title="Dismiss Log"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Notification Trigger Threshold Rules */}
      <div className="glass-card p-5 hover:transform-none">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-[var(--brand-purple)]" />
          Notification Trigger Threshold Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-2">
            <p className="font-semibold text-[var(--text-primary)]">Cost Spike Warnings</p>
            <p className="text-[var(--text-tertiary)]">Spike trigger threshold: 200% (2.0x) abnormal cost expansion within 6 hours.</p>
            <span className="badge badge-purple text-[9px] uppercase font-bold">Cost Control</span>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-2">
            <p className="font-semibold text-[var(--text-primary)]">Monthly Token Warnings</p>
            <p className="text-[var(--text-tertiary)]">Allocation warning trigger: Tenant monthly token utilization reaches 90% limit.</p>
            <span className="badge badge-blue text-[9px] uppercase font-bold">Resource Allocation</span>
          </div>
          <div className="p-4 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] space-y-2">
            <p className="font-semibold text-[var(--text-primary)]">CRM Sync Warnings</p>
            <p className="text-[var(--text-tertiary)]">Failures limit warning: Tenant external sync pipeline failure count reaches 3 failures.</p>
            <span className="badge badge-emerald text-[9px] uppercase font-bold">Integrations</span>
          </div>
        </div>
      </div>
    </div>
  );
}
