import { z } from "zod";

const decimalString = (message: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, message);

const optionalDecimalString = (message: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || /^\d+(\.\d{1,2})?$/.test(v), message);

export const apartmentSchema = z.object({
  address: z.string().trim().min(1, "Address is required"),
  housingCompanyName: z.string().trim().min(1, "Housing company name is required"),
  sizeSqm: decimalString("Size must be a valid number (e.g. 42.5)"),
  purchasePrice: decimalString("Purchase price must be a valid amount"),
  purchaseDate: z.string().trim().min(1, "Purchase date is required"),
  maintenanceFeeHoito: optionalDecimalString("Hoitovastike must be a valid amount"),
  maintenanceFeePaaoma: optionalDecimalString("Pääomavastike must be a valid amount"),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type ApartmentInput = z.infer<typeof apartmentSchema>;

export const tenancySchema = z.object({
  tenantName: z.string().trim().min(1, "Tenant name is required"),
  tenantContact: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  monthlyRent: decimalString("Monthly rent must be a valid amount"),
  deposit: optionalDecimalString("Deposit must be a valid amount"),
  leaseStart: z.string().trim().min(1, "Lease start date is required"),
  leaseEnd: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type TenancyInput = z.infer<typeof tenancySchema>;

export const tenancyDocumentSchema = z.object({
  label: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  url: z.string().trim().url("Must be a valid URL"),
});

export type TenancyDocumentInput = z.infer<typeof tenancyDocumentSchema>;

export const TRANSACTION_CATEGORIES = [
  { value: "RENTAL_INCOME", label: "Rental income", type: "INCOME" },
  { value: "OTHER_INCOME", label: "Other income", type: "INCOME" },
  { value: "MAINTENANCE_FEE", label: "Maintenance fee (yhtiövastike)", type: "EXPENSE" },
  { value: "REPAIR_COST", label: "Repair cost", type: "EXPENSE" },
  { value: "MILEAGE", label: "Mileage / driving fee", type: "EXPENSE" },
  { value: "INSURANCE", label: "Insurance", type: "EXPENSE" },
  { value: "OTHER_EXPENSE", label: "Other expense", type: "EXPENSE" },
] as const;

export type TransactionCategoryValue = (typeof TRANSACTION_CATEGORIES)[number]["value"];

export function categoryToType(category: TransactionCategoryValue): "INCOME" | "EXPENSE" {
  const found = TRANSACTION_CATEGORIES.find((c) => c.value === category);
  if (!found) throw new Error(`Unknown category: ${category}`);
  return found.type;
}

export function categoryLabel(category: string): string {
  return TRANSACTION_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

const transactionCategoryValues = TRANSACTION_CATEGORIES.map((c) => c.value) as [
  TransactionCategoryValue,
  ...TransactionCategoryValue[],
];

export const transactionSchema = z.object({
  category: z.enum(transactionCategoryValues),
  amount: decimalString("Amount must be a valid amount"),
  date: z.string().trim().min(1, "Date is required"),
  description: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
