import React from 'react';
import { BankStatementResult, SavedStatement, AppLanguage } from '../../types/finance';
import { translations, formatCurrency } from '../../utils/i18n';
import { calculateMetricChange } from '../../utils/comparisons';
import { ArrowUpRight, ArrowDownRight, Wallet, ArrowDownCircle, ArrowUpCircle, Scale } from 'lucide-react';

interface SummaryCardsProps {
  currentResult: BankStatementResult;
  previousStatement: SavedStatement | null;
  language: AppLanguage;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  currentResult,
  previousStatement,
  language,
}) => {
  const t = translations[language];
  const currency = currentResult.currency || 'PKR';

  const prevRes = previousStatement?.result;
  const netChange = currentResult.total_credit - currentResult.total_debit;
  const prevNetChange = prevRes ? prevRes.total_credit - prevRes.total_debit : null;

  const openingChange = calculateMetricChange(currentResult.opening_balance, prevRes?.opening_balance);
  const closingChange = calculateMetricChange(currentResult.closing_balance, prevRes?.closing_balance);
  const creditChange = calculateMetricChange(currentResult.total_credit, prevRes?.total_credit);
  const debitChange = calculateMetricChange(currentResult.total_debit, prevRes?.total_debit);
  const netDiff = calculateMetricChange(netChange, prevNetChange);

  const renderBadge = (change: { diff: number; pct: number | null; isPositive: boolean } | null, inverse = false) => {
    if (!change || change.pct === null) return null;
    const isGood = inverse ? !change.isPositive : change.isPositive;
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
          isGood
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-rose-600 dark:text-rose-400'
        }`}
      >
        {change.isPositive ? (
          <ArrowUpRight className="w-3.5 h-3.5" />
        ) : (
          <ArrowDownRight className="w-3.5 h-3.5" />
        )}
        <span>{Math.abs(change.pct)}%</span>
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Opening Balance */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-medium">{t.openingBalance}</span>
          <Wallet className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
          {formatCurrency(currentResult.opening_balance, currency)}
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>{previousStatement ? previousStatement.period_label : 'Base'}</span>
          {renderBadge(openingChange)}
        </div>
      </div>

      {/* 2. Closing Balance */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-medium">{t.closingBalance}</span>
          <Wallet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
          {formatCurrency(currentResult.closing_balance, currency)}
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>{t.vsPrevious}</span>
          {renderBadge(closingChange)}
        </div>
      </div>

      {/* 3. Total Money In (Green) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-950/40 p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
          <span className="text-xs font-medium">{t.totalMoneyIn}</span>
          <ArrowDownCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
          {formatCurrency(currentResult.total_credit, currency)}
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>{t.vsPrevious}</span>
          {renderBadge(creditChange)}
        </div>
      </div>

      {/* 4. Total Money Out (Red / Orange) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-950/40 p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
          <span className="text-xs font-medium">{t.totalMoneyOut}</span>
          <ArrowUpCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums tracking-tight">
          {formatCurrency(currentResult.total_debit, currency)}
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>{t.vsPrevious}</span>
          {/* For debits, an increase is typically higher cost */}
          {renderBadge(debitChange, true)}
        </div>
      </div>

      {/* 5. Net Change */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-medium">{t.netChange}</span>
          <Scale className="w-4 h-4 text-slate-400" />
        </div>
        <div
          className={`text-xl sm:text-2xl font-bold tabular-nums tracking-tight ${
            netChange >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {netChange >= 0 ? '+' : ''}
          {formatCurrency(netChange, currency)}
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span>{netChange >= 0 ? t.netSurplus : t.netDeficit}</span>
          {renderBadge(netDiff)}
        </div>
      </div>
    </div>
  );
};
