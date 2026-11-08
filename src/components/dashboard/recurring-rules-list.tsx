"use client";

import { CalendarClock, Repeat, Trash2 } from "lucide-react";
import { deleteRecurringRule } from "@/lib/actions/transactions";
import { useActionStatus } from "@/hooks/use-action-toast";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RecurringRule } from "@/types/database";

export function RecurringRulesList({ rules }: { rules: RecurringRule[] }) {
  const { isPending, runAction } = useActionStatus();

  if (rules.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
            <Repeat className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Active Subscriptions & Recurring Entries ({rules.length})
            </h3>
            <p className="text-xs text-slate-500">
              Automatically logged on their scheduled run date
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rules.map((rule) => {
          const isIncome = rule.type === "INCOME";
          return (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 p-3.5"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {rule.notes || rule.category}
                  </span>
                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-indigo-700">
                    {rule.frequency}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  <span>Next: {rule.next_run_date}</span>
                  <span>•</span>
                  <span>{rule.category}</span>
                </div>
              </div>

              <div className="ml-3 flex items-center gap-2">
                <span
                  className={`text-sm font-bold ${
                    isIncome ? "text-emerald-600" : "text-slate-900"
                  }`}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(rule.amount)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => runAction(() => deleteRecurringRule(rule.id))}
                  title="Stop recurring rule"
                  aria-label="Stop recurring rule"
                >
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
