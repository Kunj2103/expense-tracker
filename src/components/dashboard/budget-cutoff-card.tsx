"use client";

import { useState, useEffect } from "react";
import { Bell, BellRing, Settings2, AlertTriangle } from "lucide-react";
import { updateBudgetSettings } from "@/lib/actions/transactions";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import type { UserSettings } from "@/types/database";

export function triggerNativeNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/icon",
      badge: "/icon",
    });
  }
}

export function BudgetCutoffCard({
  settings,
  totalSpent,
}: {
  settings: UserSettings;
  totalSpent: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [budget, setBudget] = useState(settings.monthly_budget);
  const [threshold, setThreshold] = useState(settings.alert_threshold_percent);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>("default");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPerm(Notification.permission);
    }
  }, []);

  const requestPushPermission = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === "granted") {
      triggerNativeNotification(
        "✅ Real-Time Budget Alerts Active",
        `We'll notify you when monthly spending reaches ${threshold}% of your limit.`,
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateBudgetSettings({
      monthly_budget: Number(budget),
      alert_threshold_percent: Number(threshold),
    });
    setIsSaving(false);
    setIsOpen(false);
  };

  const limit = settings.monthly_budget;
  const percentUsed = limit > 0 ? Math.round((totalSpent / limit) * 100) : 0;
  const isOverThreshold =
    limit > 0 && percentUsed >= settings.alert_threshold_percent;
  const isExceeded = limit > 0 && percentUsed >= 100;

  return (
    <>
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Monthly Budget & Cutoff Guard
              </h3>
              {isOverThreshold && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    isExceeded
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {isExceeded
                    ? "Limit Exceeded!"
                    : `Crossed ${settings.alert_threshold_percent}% Cutoff`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {limit > 0
                ? `${formatCurrency(totalSpent)} spent of ${formatCurrency(limit)} monthly limit (${percentUsed}%)`
                : "Set a monthly spending limit to receive real-time push alerts"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {notifPerm !== "granted" ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={requestPushPermission}
              >
                <Bell className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                Enable Push Alerts
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <BellRing className="h-3.5 w-3.5" />
                Push Active
              </span>
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsOpen(true)}
            >
              <Settings2 className="mr-1.5 h-3.5 w-3.5" />
              {limit > 0 ? "Edit Limit" : "Set Limit"}
            </Button>
          </div>
        </div>

        {limit > 0 && (
          <div className="relative mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
              className={`h-full transition-all duration-300 ${
                isExceeded
                  ? "bg-red-600"
                  : isOverThreshold
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
            />
          </div>
        )}
      </Card>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Configure Monthly Spending Cutoff"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            id="monthly_budget"
            type="number"
            label="Monthly Budget Limit (₹)"
            placeholder="e.g. 25000"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />

          <Input
            id="alert_threshold_percent"
            type="number"
            min={10}
            max={100}
            label="Alert Cutoff Percentage (%)"
            placeholder="e.g. 80"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
          <p className="text-xs text-slate-500">
            You will receive an instant notification as soon as your monthly
            spending crosses <strong>{threshold}%</strong> (
            {formatCurrency((budget * threshold) / 100)}).
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Budget Guard"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
