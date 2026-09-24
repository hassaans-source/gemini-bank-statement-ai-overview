import { BankStatementResult, SavedStatement } from '../types/finance';

export interface CategoryComparisonRow {
  category: string;
  currentAmount: number;
  previousAmount: number;
  difference: number;
  percentageChange: number | null;
  isIncrease: boolean;
}

export function findPreviousStatement(
  currentStatementId: string | null,
  currentPeriodLabel: string,
  allStatements: SavedStatement[]
): SavedStatement | null {
  if (!allStatements || allStatements.length === 0) return null;

  // Filter out current statement
  const candidates = allStatements.filter(
    (s) => s.id !== currentStatementId && s.period_label !== currentPeriodLabel
  );

  if (candidates.length === 0) return null;

  // Sort by created_at descending (newest first)
  const sorted = [...candidates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return sorted[0];
}

export function calculateCategoryComparisons(
  currentResult: BankStatementResult,
  previousStatement: SavedStatement | null
): CategoryComparisonRow[] {
  if (!previousStatement || !previousStatement.result || !previousStatement.result.categories) {
    return [];
  }

  const prevCategoryMap = new Map<string, number>();
  previousStatement.result.categories.forEach((cat) => {
    prevCategoryMap.set(cat.name.toLowerCase().trim(), cat.amount);
  });

  return currentResult.categories.map((cat) => {
    const key = cat.name.toLowerCase().trim();
    const prevAmount = prevCategoryMap.get(key) || 0;
    const diff = cat.amount - prevAmount;
    let pct: number | null = null;

    if (prevAmount > 0) {
      pct = Math.round(((cat.amount - prevAmount) / prevAmount) * 100);
    }

    return {
      category: cat.name,
      currentAmount: cat.amount,
      previousAmount: prevAmount,
      difference: diff,
      percentageChange: pct,
      isIncrease: diff > 0,
    };
  });
}

export function calculateMetricChange(
  currentVal: number,
  prevVal?: number | null
): { diff: number; pct: number | null; isPositive: boolean } | null {
  if (prevVal === undefined || prevVal === null) return null;
  const diff = currentVal - prevVal;
  let pct: number | null = null;
  if (prevVal !== 0) {
    pct = Math.round((diff / Math.abs(prevVal)) * 100);
  }
  return {
    diff,
    pct,
    isPositive: diff >= 0,
  };
}
