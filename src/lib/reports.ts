import { prisma } from "@/lib/db";
import { TRANSACTION_CATEGORIES, type TransactionCategoryValue } from "@/lib/validation";

export function getCurrentTenancy(apartmentId: string) {
  return prisma.tenancy.findFirst({
    where: { apartmentId, leaseEnd: null },
    orderBy: { leaseStart: "desc" },
  });
}

export type ApartmentSummary = {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
};

export async function getApartmentSummary(
  apartmentId: string,
  options?: { year?: number }
): Promise<ApartmentSummary> {
  const dateFilter = options?.year
    ? {
        gte: new Date(Date.UTC(options.year, 0, 1)),
        lt: new Date(Date.UTC(options.year + 1, 0, 1)),
      }
    : undefined;

  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { apartmentId, type: "INCOME", ...(dateFilter ? { date: dateFilter } : {}) },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { apartmentId, type: "EXPENSE", ...(dateFilter ? { date: dateFilter } : {}) },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = Number(incomeAgg._sum.amount ?? 0);
  const totalExpense = Number(expenseAgg._sum.amount ?? 0);

  return { totalIncome, totalExpense, netProfit: totalIncome - totalExpense };
}

export async function getPortfolioSummary() {
  const apartments = await prisma.apartment.findMany({ orderBy: { createdAt: "asc" } });

  const rows = await Promise.all(
    apartments.map(async (apartment) => ({
      apartment,
      summary: await getApartmentSummary(apartment.id),
    }))
  );

  const totals = rows.reduce<ApartmentSummary>(
    (acc, row) => ({
      totalIncome: acc.totalIncome + row.summary.totalIncome,
      totalExpense: acc.totalExpense + row.summary.totalExpense,
      netProfit: acc.netProfit + row.summary.netProfit,
    }),
    { totalIncome: 0, totalExpense: 0, netProfit: 0 }
  );

  return { rows, totals };
}

export type YearReportTransaction = {
  id: string;
  date: Date;
  category: TransactionCategoryValue;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string | null;
  hasReceipt: boolean;
};

export type ApartmentYearReport = {
  apartment: NonNullable<Awaited<ReturnType<typeof prisma.apartment.findUnique>>>;
  year: number;
  transactions: YearReportTransaction[];
  byCategory: { category: string; label: string; type: "INCOME" | "EXPENSE"; total: number }[];
  totals: ApartmentSummary;
};

export async function getApartmentYearReport(
  apartmentId: string,
  year: number
): Promise<ApartmentYearReport> {
  const apartment = await prisma.apartment.findUniqueOrThrow({ where: { id: apartmentId } });

  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  const transactions = await prisma.transaction.findMany({
    where: { apartmentId, date: { gte: start, lt: end } },
    orderBy: { date: "asc" },
  });

  const byCategoryTotals = new Map<string, number>();
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    byCategoryTotals.set(tx.category, (byCategoryTotals.get(tx.category) ?? 0) + amount);
    if (tx.type === "INCOME") {
      totalIncome += amount;
    } else {
      totalExpense += amount;
    }
  }

  const byCategory = TRANSACTION_CATEGORIES.filter((c) => byCategoryTotals.has(c.value)).map(
    (c) => ({
      category: c.value,
      label: c.label,
      type: c.type,
      total: byCategoryTotals.get(c.value) ?? 0,
    })
  );

  return {
    apartment,
    year,
    transactions: transactions.map((tx) => ({
      id: tx.id,
      date: tx.date,
      category: tx.category as TransactionCategoryValue,
      type: tx.type,
      amount: Number(tx.amount),
      description: tx.description,
      hasReceipt: !!tx.receiptStoragePath,
    })),
    byCategory,
    totals: { totalIncome, totalExpense, netProfit: totalIncome - totalExpense },
  };
}
