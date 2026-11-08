import { BarChart3, PieChart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type {
  CategoryBreakdown,
  MonthlyTrend,
} from "@/lib/actions/transactions";

export function AnalyticsCharts({
  trends,
  breakdown,
}: {
  trends: MonthlyTrend[];
  breakdown: CategoryBreakdown[];
}) {
  const maxAmount = Math.max(
    ...trends.map((t) => Math.max(t.earned, t.spent)),
    1000,
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 6-Month Cash Flow Trend */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <BarChart3 className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold text-slate-900">
              6-Month Cash Flow Trend
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{" "}
              Earned
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-900" /> Spent
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2 pt-4">
          {trends.map((t) => {
            const earnedHeight = Math.round((t.earned / maxAmount) * 110);
            const spentHeight = Math.round((t.spent / maxAmount) * 110);
            return (
              <div
                key={t.monthKey}
                className="flex flex-col items-center gap-2"
              >
                <div className="flex h-32 w-full items-end justify-center gap-1 border-b border-slate-100 pb-1">
                  <div
                    style={{ height: `${Math.max(earnedHeight, 4)}px` }}
                    className="w-3 rounded-t bg-emerald-500 transition-all"
                    title={`Earned: ${formatCurrency(t.earned)}`}
                  />
                  <div
                    style={{ height: `${Math.max(spentHeight, 4)}px` }}
                    className="w-3 rounded-t bg-slate-900 transition-all"
                    title={`Spent: ${formatCurrency(t.spent)}`}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-500">
                  {t.monthLabel.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Category Breakdown */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <PieChart className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-semibold text-slate-900">
              Spending by Category (This Month)
            </h3>
          </div>
        </div>

        {breakdown.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-slate-400">
            No expenses recorded for this month
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {breakdown.slice(0, 4).map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">
                    {item.category}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(item.total)} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className="h-full rounded-full bg-indigo-600 transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
