import type { TransactionType } from "@/types/database";

export interface ParsedSmsTransaction {
  isValidTransaction: boolean;
  type: TransactionType;
  amount?: number;
  category: string;
  payment_method: string;
  counterparty: string;
  notes: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Food & Dining": ["swiggy", "zomato", "dominos", "mcdonald", "starbucks", "cafe", "restaurant"],
  Groceries: ["blinkit", "zepto", "instamart", "bigbasket", "dmart", "d-mart", "reliance", "grocery"],
  Transportation: ["uber", "ola", "rapido", "irctc", "metro", "petrol", "fuel", "shell", "hpcl", "bpcl"],
  Shopping: ["amazon", "flipkart", "myntra", "ajio", "nykaa", "meesho", "decathlon"],
  "Subscriptions & OTT": ["netflix", "spotify", "youtube", "prime", "hotstar", "jiofiber", "airtel"],
  "Housing & Utilities": ["torrent power", "dgvcl", "ugvcl", "pgvcl", "mgvcl", "electricity", "gas", "rent"],
};

export function parseTransactionSms(rawText: string): ParsedSmsTransaction {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Ignore OTPs, login codes, and promotional spam when triggering on "Rs." / "₹"
  const isOtpOrPromo =
    /\b(otp|one time password|verification code|win up to|loan offer|pre-approved)\b/i.test(text);
  const hasTxVerb =
    /\b(debited|credited|spent|paid|sent|received|deposited|withdrawn|deducted|transferred)\b/i.test(text);

  const isIncome =
    /\b(credited|received|deposited|refund|cashback)\b/i.test(text) &&
    !/\b(debited|spent|paid|sent|deducted)\b/i.test(text);
  const type: TransactionType = isIncome ? "INCOME" : "EXPENSE";

  const amountMatch = text.match(
    /(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i
  );
  const amount = amountMatch
    ? parseFloat(amountMatch[1].replace(/,/g, ""))
    : undefined;

  let payment_method = "UPI";
  if (/\b(credit card|cc)\b/i.test(lower)) payment_method = "Credit Card";
  else if (/\b(debit card|atm|pos)\b/i.test(lower)) payment_method = "Debit Card";
  else if (/\b(neft|imps|rtgs|netbanking)\b/i.test(lower)) payment_method = "Net Banking";

  const partyMatch = text.match(
    /(?:to|from|at|towards|vpa)\s+([a-zA-Z0-9@._\-\s]{2,35}?)(?:\s+(?:on|ref|upi|txn|avl|bal|via|\.)|$)/i
  );
  const counterparty = partyMatch
    ? partyMatch[1].replace(/^vpa\s+/i, "").trim()
    : "";

  let category = isIncome ? "Salary" : "Other";
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      category = cat;
      break;
    }
  }

  return {
    isValidTransaction: !isOtpOrPromo && hasTxVerb && Boolean(amount && amount > 0),
    type,
    amount: amount && !Number.isNaN(amount) ? amount : undefined,
    category,
    payment_method,
    counterparty,
    notes: counterparty ? `Auto-synced (${payment_method})` : text.slice(0, 60),
  };
}