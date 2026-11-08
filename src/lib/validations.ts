import { z } from "zod";

export const idSchema = z.string().uuid("Invalid ID");

export const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const otpVerifySchema = z.object({
  email: z.string().email(),
  token: z.string().length(6, "OTP must be 6 digits"),
});

export const frequencyEnum = z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .max(99999999.99, "Amount exceeds maximum limit"),
  date: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
  category: z.string().min(1, "Category is required").max(100),
  payment_method: z.string().max(50).optional().nullable(),
  counterparty: z.string().max(120).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  is_recurring: z.boolean(),
  frequency: frequencyEnum.optional(),
  create_initial_entry: z.boolean(),
});

export const budgetSettingsSchema = z.object({
  monthly_budget: z.coerce.number().min(0, "Budget cannot be negative"),
  alert_threshold_percent: z.coerce.number().min(10).max(100),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
export type BudgetSettingsValues = z.infer<typeof budgetSettingsSchema>;
export type EmailFormValues = z.infer<typeof emailSchema>;
export type OtpFormValues = z.infer<typeof otpVerifySchema>;