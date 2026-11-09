"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardPaste, Loader2, Plus, Repeat, Sparkles } from "lucide-react";
import {
  transactionSchema,
  type TransactionFormValues,
} from "@/lib/validations";
import {
  createTransaction,
  updateTransaction,
} from "@/lib/actions/transactions";
import { parseTransactionSms } from "@/lib/sms-parser";
import { triggerNativeNotification } from "@/components/dashboard/budget-cutoff-card";
import { useActionStatus } from "@/hooks/use-action-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import type { CounterpartySuggestion, Transaction } from "@/types/database";

export const CATEGORIES = [
  { label: "Food & Dining", value: "Food & Dining" },
  { label: "Groceries", value: "Groceries" },
  { label: "Subscriptions & OTT", value: "Subscriptions & OTT" },
  { label: "Housing & Utilities", value: "Housing & Utilities" },
  { label: "Transportation", value: "Transportation" },
  { label: "Shopping", value: "Shopping" },
  { label: "Salary / Income", value: "Salary" },
  { label: "Freelance", value: "Freelance" },
  { label: "Other", value: "Other" },
];

export const PAYMENT_METHODS = [
  { label: "UPI", value: "UPI" },
  { label: "Credit Card", value: "Credit Card" },
  { label: "Debit Card", value: "Debit Card" },
  { label: "Net Banking", value: "Net Banking" },
  { label: "Cash", value: "Cash" },
];

const FREQUENCIES = [
  { label: "Monthly (Subscriptions / Rent / SIP)", value: "MONTHLY" },
  { label: "Weekly", value: "WEEKLY" },
  { label: "Daily", value: "DAILY" },
  { label: "Yearly (Annual Plans)", value: "YEARLY" },
];

interface TransactionModalProps {
  suggestions?: CounterpartySuggestion[];
  editingTransaction?: Transaction | null;
  onCloseEdit?: () => void;
  hideTriggerButton?: boolean;
}

export function TransactionModal({
  suggestions = [],
  editingTransaction = null,
  onCloseEdit,
  hideTriggerButton = false,
}: TransactionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [smsBanner, setSmsBanner] = useState<string | null>(null);
  const submittingLockRef = useRef(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { error, isPending, runAction } = useActionStatus();

  const isEditMode = Boolean(editingTransaction);
  const modalOpen = isEditMode ? Boolean(editingTransaction) : isOpen;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "EXPENSE",
      date: new Date().toISOString().split("T")[0],
      category: "Food & Dining",
      payment_method: "UPI",
      counterparty: "",
      notes: "",
      is_recurring: false,
      frequency: "MONTHLY",
      create_initial_entry: true,
    },
  });

  const isRecurring = watch("is_recurring");
  const createInitialEntry = watch("create_initial_entry");
  const isBusy = isPending || isSubmitting;

  // Populate form when editing an existing transaction
  useEffect(() => {
    if (editingTransaction) {
      reset({
        type: editingTransaction.type,
        amount: editingTransaction.amount,
        date: editingTransaction.date,
        category: editingTransaction.category,
        payment_method: editingTransaction.payment_method ?? "UPI",
        counterparty: editingTransaction.counterparty ?? "",
        notes: editingTransaction.notes ?? "",
        is_recurring: false,
        frequency: "MONTHLY",
        create_initial_entry: true,
      });
    }
  }, [editingTransaction, reset]);

  // Intercept mobile deep-links (?sms=... or ?quickAdd=true) only on create modal
  useEffect(() => {
    if (isEditMode) return;
    const rawSms = searchParams.get("sms");
    const quickAdd = searchParams.get("quickAdd");

    if (rawSms) {
      const parsed = parseTransactionSms(rawSms);
      setValue("type", parsed.type);
      if (parsed.amount) setValue("amount", parsed.amount);
      setValue("category", parsed.category);
      setValue("payment_method", parsed.payment_method);
      setValue("counterparty", parsed.counterparty);
      setValue("notes", parsed.notes);
      setSmsBanner(
        "Auto-filled from your Bank / UPI message. Tap Save to confirm.",
      );
      setIsOpen(true);
      router.replace("/dashboard", { scroll: false });
    } else if (quickAdd === "true") {
      const amountParam = Number(searchParams.get("amount"));
      const methodParam = searchParams.get("method");
      const notesParam = searchParams.get("notes");
      const categoryParam = searchParams.get("category");

      if (amountParam > 0) setValue("amount", amountParam);
      if (methodParam) setValue("payment_method", methodParam);
      if (notesParam) setValue("notes", notesParam);
      if (categoryParam) setValue("category", categoryParam);
      setSmsBanner("Auto-filled from UPI Quick Prompt. Tap Save to confirm.");
      setIsOpen(true);
      router.replace("/dashboard", { scroll: false });
    }
  }, [isEditMode, searchParams, setValue, router]);

  const handleClose = () => {
    if (isBusy) return;
    setSmsBanner(null);
    if (isEditMode) {
      onCloseEdit?.();
    } else {
      setIsOpen(false);
    }
  };

  const handlePasteClipboardSms = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const parsed = parseTransactionSms(text);
      setValue("type", parsed.type);
      if (parsed.amount) setValue("amount", parsed.amount);
      setValue("category", parsed.category);
      setValue("payment_method", parsed.payment_method);
      setValue("counterparty", parsed.counterparty);
      setValue("notes", parsed.notes);
      setSmsBanner(`Parsed from clipboard: "${text.slice(0, 55)}..."`);
    } catch {
      setSmsBanner(
        "Clipboard permission denied. Paste SMS into Notes instead.",
      );
    }
  };

  const onSubmit = async (values: TransactionFormValues) => {
    // Hard synchronous lock against rapid mobile double-taps
    if (submittingLockRef.current || isBusy) return;
    submittingLockRef.current = true;

    await runAction(
      async () => {
        if (isEditMode && editingTransaction) {
          return await updateTransaction(editingTransaction.id, values);
        }
        const res = await createTransaction(values);
        if (res?.budgetAlert) {
          triggerNativeNotification(
            res.budgetAlert.title,
            res.budgetAlert.body,
          );
        }
        return res;
      },
      () => {
        reset();
        setSmsBanner(null);
        if (isEditMode) {
          onCloseEdit?.();
        } else {
          setIsOpen(false);
        }
      },
    );

    submittingLockRef.current = false;
  };

  return (
    <>
      {!isEditMode && !hideTriggerButton && (
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={handleClose}
        title={isEditMode ? "Edit Transaction" : "Add New Transaction"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isEditMode && (
            <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-indigo-50/70 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-indigo-900">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                Copied a Bank or UPI SMS?
              </span>
              <button
                type="button"
                disabled={isBusy}
                onClick={handlePasteClipboardSms}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-2xs ring-1 ring-indigo-200 hover:bg-indigo-50 disabled:opacity-50"
              >
                <ClipboardPaste className="h-3 w-3" />
                Auto-Fill from SMS
              </button>
            </div>
          )}

          {smsBanner && (
            <div className="rounded-lg bg-emerald-50 p-2.5 text-xs font-medium text-emerald-700">
              {smsBanner}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="type"
              label="Type"
              disabled={isBusy}
              options={[
                { label: "Expense (Debit)", value: "EXPENSE" },
                { label: "Income (Credit)", value: "INCOME" },
              ]}
              error={errors.type?.message}
              {...register("type")}
            />

            <Input
              id="amount"
              label="Amount (₹)"
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled={isBusy}
              error={errors.amount?.message}
              {...register("amount")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="date"
              label="Date"
              type="date"
              disabled={isBusy}
              error={errors.date?.message}
              {...register("date")}
            />

            <Select
              id="category"
              label="Category"
              disabled={isBusy}
              options={CATEGORIES}
              error={errors.category?.message}
              {...register("category")}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              id="payment_method"
              label="Payment Method"
              disabled={isBusy}
              options={PAYMENT_METHODS}
              error={errors.payment_method?.message}
              {...register("payment_method")}
            />

            <div className="space-y-1.5">
              <Input
                id="counterparty"
                label="Payee / Sender Name"
                placeholder="e.g. Swiggy, Zomato, Rahul"
                list="counterparty-history"
                disabled={isBusy}
                error={errors.counterparty?.message}
                {...register("counterparty", {
                  onChange: (e) => {
                    const val = e.target.value.trim().toLowerCase();
                    const match = suggestions.find(
                      (s) => s.counterparty.toLowerCase() === val,
                    );
                    if (match) {
                      setValue("category", match.category);
                      if (match.payment_method) {
                        setValue("payment_method", match.payment_method);
                      }
                    }
                  },
                })}
              />
              <datalist id="counterparty-history">
                {suggestions.map((s) => (
                  <option key={s.counterparty} value={s.counterparty}>
                    {s.category} • {s.payment_method ?? "UPI"}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          <Input
            id="notes"
            label="Notes"
            placeholder="Optional description..."
            disabled={isBusy}
            error={errors.notes?.message}
            {...register("notes")}
          />

          {!isEditMode && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
              <label className="flex cursor-pointer items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <Repeat className="h-4 w-4 text-indigo-600" />
                  Repeat as recurring subscription / bill
                </span>
                <input
                  type="checkbox"
                  disabled={isBusy}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  {...register("is_recurring")}
                />
              </label>

              {isRecurring && (
                <div className="space-y-3 border-t border-slate-200 pt-3">
                  <Select
                    id="frequency"
                    label="Repeat Interval"
                    disabled={isBusy}
                    options={FREQUENCIES}
                    error={errors.frequency?.message}
                    {...register("frequency")}
                  />

                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      disabled={isBusy}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      {...register("create_initial_entry")}
                    />
                    <div className="text-xs">
                      <span className="font-medium text-slate-800">
                        Also create an entry for the selected date immediately
                      </span>
                      <p className="text-slate-500">
                        {createInitialEntry
                          ? "Logs this transaction now and schedules the next run."
                          : "Only schedules the recurring rule to start on the selected date."}
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isBusy}
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isBusy} className="min-w-[150px]">
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Saving Entry..."}
                </>
              ) : isEditMode ? (
                "Update Transaction"
              ) : isRecurring && !createInitialEntry ? (
                "Schedule Rule Only"
              ) : (
                "Save Transaction"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
