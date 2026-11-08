import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/types/database";

export function SummaryCards({ stats }: { stats: DashboardStats }) {
  const items = [
    {
      label: "Total Earned (This Month)",
      value: stats.totalEarned,
      icon: ArrowUpRight,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Total Spent (This Month)",
      value: stats.totalSpent,
      icon: ArrowDownRight,
      tone: "text-rose-600 bg-rose-50",
    },
    {
      label: "Remaining Balance",
      value: stats.remainingBalance,
      icon: Wallet,
      tone:
        stats.remainingBalance >= 0
          ? "text-blue-600 bg-blue-50"
          : "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                {item.label}
              </span>
              <span className={`rounded-lg p-2 ${item.tone}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              {formatCurrency(item.value)}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
