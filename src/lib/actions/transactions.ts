"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  idSchema,
  transactionSchema,
  type TransactionFormValues,
} from "@/lib/validations";
import { calculateNextRunDate, getCurrentMonthRange } from "@/lib/utils";
import type {
  DashboardStats,
  RecurringRule,
  Transaction,
} from "@/types/database";
import { budgetSettingsSchema, type BudgetSettingsValues } from "@/lib/validations";
import type { CounterpartySuggestion, UserSettings } from "@/types/database";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

export async function createTransaction(input: TransactionFormValues) {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    const { supabase, user } = await requireUser();
    let recurringRuleId: string | null = null;
    const shouldCreateImmediateEntry =
      !parsed.data.is_recurring || parsed.data.create_initial_entry;

    if (parsed.data.is_recurring && parsed.data.frequency) {
      // If logging an entry right now, schedule next run 1 cycle ahead;
      // otherwise schedule the rule to fire on the selected date itself.
      const nextRunDate = shouldCreateImmediateEntry
        ? calculateNextRunDate(parsed.data.date, parsed.data.frequency)
        : parsed.data.date;

      const { data: ruleData, error: ruleError } = await supabase
        .from("recurring_rules")
        .insert({
          user_id: user.id,
          type: parsed.data.type,
          amount: parsed.data.amount,
          category: parsed.data.category,
          payment_method: parsed.data.payment_method || null,
          notes: parsed.data.notes || null,
          frequency: parsed.data.frequency,
          next_run_date: nextRunDate,
          is_active: true,
        })
        .select("id")
        .single();

      if (ruleError) return { error: ruleError.message };
      recurringRuleId = ruleData.id;
    }

    if (shouldCreateImmediateEntry) {
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: parsed.data.type,
        amount: parsed.data.amount,
        date: parsed.data.date,
        category: parsed.data.category,
        payment_method: parsed.data.payment_method || null,
        notes: parsed.data.notes || null,
        recurring_rule_id: recurringRuleId,
      });

      if (error) return { error: error.message };
    }

    let budgetAlert: { title: string; body: string } | null = null;

    if (shouldCreateImmediateEntry && parsed.data.type === "EXPENSE") {
      const [settings, currentStats] = await Promise.all([
        getUserSettings(),
        getDashboardStatsForMonth(),
      ]);

      if (settings.monthly_budget > 0) {
        const usagePercent = Math.round(
          (currentStats.totalSpent / settings.monthly_budget) * 100
        );

        if (usagePercent >= 100) {
          budgetAlert = {
            title: "🚨 Monthly Budget Exceeded!",
            body: `You have spent ₹${currentStats.totalSpent.toLocaleString("en-IN")} (${usagePercent}% of your ₹${settings.monthly_budget.toLocaleString("en-IN")} limit).`,
          };
        } else if (usagePercent >= settings.alert_threshold_percent) {
          budgetAlert = {
            title: `⚠️ Budget Cutoff Alert (${usagePercent}% Used)`,
            body: `You crossed your ${settings.alert_threshold_percent}% alert cutoff. Spent: ₹${currentStats.totalSpent.toLocaleString("en-IN")} / ₹${settings.monthly_budget.toLocaleString("en-IN")}.`,
          };
        }
      }
    }

    revalidatePath("/dashboard");
    return { success: true, budgetAlert };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to create transaction",
    };
  }
}

export async function processDueRecurringRules() {
  const { supabase, user } = await requireUser();
  const today = new Date().toISOString().split("T")[0];

  const { data: dueRules, error } = await supabase
    .from("recurring_rules")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .lte("next_run_date", today);

  if (error || !dueRules || dueRules.length === 0) return;

  for (const rule of dueRules) {
    let runDate = rule.next_run_date;
    const rowsToInsert = [];
    let safetyCounter = 0;

    // Catch up all missed cycles up to today (capped at 36 iterations for safety)
    while (runDate <= today && safetyCounter < 36) {
      rowsToInsert.push({
        user_id: user.id,
        type: rule.type,
        amount: Number(rule.amount),
        date: runDate,
        category: rule.category,
        payment_method: rule.payment_method,
        notes: rule.notes ? `${rule.notes} (Auto-Recurring)` : "Auto-Recurring",
        recurring_rule_id: rule.id,
      });
      runDate = calculateNextRunDate(runDate, rule.frequency);
      safetyCounter++;
    }

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("transactions")
        .insert(rowsToInsert);

      if (!insertError) {
        await supabase
          .from("recurring_rules")
          .update({ next_run_date: runDate })
          .eq("id", rule.id)
          .eq("user_id", user.id);
      }
    }
  }
}

export async function getRecurringRules(): Promise<RecurringRule[]> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("recurring_rules")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("next_run_date", { ascending: true });

  if (error || !data) return [];

  return data.map((item) => ({
    ...item,
    amount: Number(item.amount),
  }));
}

export async function deleteRecurringRule(id: string) {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { error: "Invalid rule ID" };

  try {
    const { supabase, user } = await requireUser();

    const { error } = await supabase
      .from("recurring_rules")
      .delete()
      .eq("id", parsed.data)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to delete recurring rule",
    };
  }
}

export async function deleteTransaction(id: string) {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return { error: "Invalid transaction ID" };
  }

  try {
    const { supabase, user } = await requireUser();

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", parsed.data)
      .eq("user_id", user.id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to delete transaction",
    };
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { supabase, user } = await requireUser();
  const { start, end } = getCurrentMonthRange();

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end);

  if (error || !data) {
    return { totalEarned: 0, totalSpent: 0, remainingBalance: 0 };
  }

  const stats = data.reduce(
    (acc, row) => {
      const value = Number(row.amount);
      if (row.type === "INCOME") acc.totalEarned += value;
      if (row.type === "EXPENSE") acc.totalSpent += value;
      return acc;
    },
    { totalEarned: 0, totalSpent: 0 }
  );

  return {
    totalEarned: stats.totalEarned,
    totalSpent: stats.totalSpent,
    remainingBalance: stats.totalEarned - stats.totalSpent,
  };
}

export async function getTransactions(): Promise<Transaction[]> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((item) => ({
    ...item,
    amount: Number(item.amount),
  }));
}

export interface MonthlyTrend {
  monthKey: string; // e.g. "2026-06"
  monthLabel: string; // e.g. "Jun 2026"
  earned: number;
  spent: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
}

export async function getDashboardStatsForMonth(yearMonth?: string): Promise<DashboardStats> {
  const { supabase, user } = await requireUser();
  
  let start: string;
  let end: string;

  if (yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)) {
    const [year, month] = yearMonth.split("-").map(Number);
    start = new Date(year, month - 1, 1).toISOString().split("T")[0];
    end = new Date(year, month, 0).toISOString().split("T")[0];
  } else {
    const range = getCurrentMonthRange();
    start = range.start;
    end = range.end;
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount")
    .eq("user_id", user.id)
    .gte("date", start)
    .lte("date", end);

  if (error || !data) {
    return { totalEarned: 0, totalSpent: 0, remainingBalance: 0 };
  }

  const stats = data.reduce(
    (acc, row) => {
      const value = Number(row.amount);
      if (row.type === "INCOME") acc.totalEarned += value;
      if (row.type === "EXPENSE") acc.totalSpent += value;
      return acc;
    },
    { totalEarned: 0, totalSpent: 0 }
  );

  return {
    totalEarned: stats.totalEarned,
    totalSpent: stats.totalSpent,
    remainingBalance: stats.totalEarned - stats.totalSpent,
  };
}

export async function getSixMonthTrends(): Promise<MonthlyTrend[]> {
  const { supabase, user } = await requireUser();
  const now = new Date();
  
  // Calculate date 6 months ago
  const startDateObj = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startDate = startDateObj.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, date")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .order("date", { ascending: true });

  const monthsMap = new Map<string, { earned: number; spent: number }>();

  // Initialize last 6 months with 0
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthsMap.set(key, { earned: 0, spent: 0 });
  }

  if (!error && data) {
    for (const row of data) {
      const monthKey = row.date.slice(0, 7); // "YYYY-MM"
      if (monthsMap.has(monthKey)) {
        const entry = monthsMap.get(monthKey)!;
        const val = Number(row.amount);
        if (row.type === "INCOME") entry.earned += val;
        if (row.type === "EXPENSE") entry.spent += val;
      }
    }
  }

  const result: MonthlyTrend[] = [];
  for (const [key, val] of monthsMap.entries()) {
    const [y, m] = key.split("-").map(Number);
    const label = new Date(y, m - 1, 1).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    result.push({
      monthKey: key,
      monthLabel: label,
      earned: val.earned,
      spent: val.spent,
    });
  }

  return result;
}

export async function getCategoryBreakdown(yearMonth?: string): Promise<CategoryBreakdown[]> {
  const { supabase, user } = await requireUser();
  
  let start: string;
  let end: string;

  if (yearMonth && /^\d{4}-\d{2}$/.test(yearMonth)) {
    const [year, month] = yearMonth.split("-").map(Number);
    start = new Date(year, month - 1, 1).toISOString().split("T")[0];
    end = new Date(year, month, 0).toISOString().split("T")[0];
  } else {
    const range = getCurrentMonthRange();
    start = range.start;
    end = range.end;
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("category, amount")
    .eq("user_id", user.id)
    .eq("type", "EXPENSE")
    .gte("date", start)
    .lte("date", end);

  if (error || !data || data.length === 0) return [];

  const catMap = new Map<string, number>();
  let totalSpent = 0;

  for (const row of data) {
    const val = Number(row.amount);
    totalSpent += val;
    catMap.set(row.category, (catMap.get(row.category) || 0) + val);
  }

  const breakdown: CategoryBreakdown[] = [];
  for (const [category, total] of catMap.entries()) {
    breakdown.push({
      category,
      total,
      percentage: totalSpent > 0 ? Math.round((total / totalSpent) * 100) : 0,
    });
  }

  return breakdown.sort((a, b) => b.total - a.total);
}
export async function getUserSettings(): Promise<UserSettings> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!data) {
    return {
      user_id: user.id,
      monthly_budget: 0,
      alert_threshold_percent: 80,
      push_enabled: true,
    };
  }

  return {
    ...data,
    monthly_budget: Number(data.monthly_budget),
  };
}

export async function updateBudgetSettings(input: BudgetSettingsValues) {
  const parsed = budgetSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase.from("user_settings").upsert({
      user_id: user.id,
      monthly_budget: parsed.data.monthly_budget,
      alert_threshold_percent: parsed.data.alert_threshold_percent,
      updated_at: new Date().toISOString(),
    });

    if (error) return { error: error.message };
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to save budget" };
  }
}

export async function getCounterpartySuggestions(): Promise<CounterpartySuggestion[]> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("transactions")
    .select("counterparty, category, payment_method")
    .eq("user_id", user.id)
    .not("counterparty", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!data) return [];

  const uniqueMap = new Map<string, CounterpartySuggestion>();
  for (const row of data) {
    const name = row.counterparty?.trim();
    if (name && !uniqueMap.has(name.toLowerCase())) {
      uniqueMap.set(name.toLowerCase(), {
        counterparty: name,
        category: row.category,
        payment_method: row.payment_method,
      });
    }
  }
  return Array.from(uniqueMap.values());
}