import { BankStatementCategory, BudgetOverride, SavedStatement } from '../types/finance';

export interface CategoryBudgetInfo {
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  budget: number | null;
  isOverride: boolean;
  budgetRatio: number | null; // e.g. 0.85
  status: 'under' | 'near' | 'over' | 'none';
}

export function calculateCategoryBudgets(
  categories: BankStatementCategory[],
  currentStatementId: string | null,
  allStatements: SavedStatement[],
  overrides: BudgetOverride[]
): CategoryBudgetInfo[] {
  // 1. Map overrides
  const overrideMap = new Map<string, number>();
  overrides.forEach((ov) => {
    overrideMap.set(ov.category.toLowerCase().trim(), ov.amount);
  });

  // 2. Identify earlier statements (excluding current one)
  const earlierStatements = allStatements.filter(
    (s) => s.id !== currentStatementId && s.result && s.result.categories
  );

  // 3. Compute historical category averages
  const historicalTotals = new Map<string, { sum: number; count: number }>();
  earlierStatements.forEach((st) => {
    st.result.categories.forEach((cat) => {
      const key = cat.name.toLowerCase().trim();
      const existing = historicalTotals.get(key) || { sum: 0, count: 0 };
      existing.sum += cat.amount;
      existing.count += 1;
      historicalTotals.set(key, existing);
    });
  });

  return categories.map((cat) => {
    const key = cat.name.toLowerCase().trim();
    let budget: number | null = null;
    let isOverride = false;

    // Check manual override first
    if (overrideMap.has(key)) {
      budget = overrideMap.get(key)!;
      isOverride = true;
    } else if (earlierStatements.length > 0) {
      // Historical average
      const hist = historicalTotals.get(key);
      if (hist && hist.count > 0) {
        budget = Math.round(hist.sum / hist.count);
      }
    }

    let status: 'under' | 'near' | 'over' | 'none' = 'none';
    let budgetRatio: number | null = null;

    if (budget !== null && budget > 0) {
      budgetRatio = cat.amount / budget;
      if (budgetRatio > 1.0) {
        status = 'over';
      } else if (budgetRatio > 0.9) {
        status = 'near';
      } else {
        status = 'under';
      }
    }

    return {
      categoryName: cat.name,
      amount: cat.amount,
      percentage: cat.percentage,
      transactionCount: cat.transaction_count,
      budget,
      isOverride,
      budgetRatio,
      status,
    };
  });
}
