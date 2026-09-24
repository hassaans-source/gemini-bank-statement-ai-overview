import React from 'react';
import { CategoryComparisonRow } from '../../utils/comparisons';
import { AppLanguage, SavedStatement } from '../../types/finance';
import { translations, formatCurrency } from '../../utils/i18n';
import { GitCompare, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MonthComparisonTableProps {
  comparisons: CategoryComparisonRow[];
  previousStatement: SavedStatement | null;
  currentPeriodLabel: string;
  currency: string;
  language: AppLanguage;
}

export const MonthComparisonTable: React.FC<MonthComparisonTableProps> = ({
  comparisons,
  previousStatement,
  currentPeriodLabel,
  currency,
  language,
}) => {
  const t = translations[language];

  if (!previousStatement || comparisons.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-2 text-center">
        <GitCompare className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {t.monthComparisonTitle}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          {t.noPrevStatement}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.monthComparisonTitle}
            </h3>
            <p className="text-xs text-slate-500">
              {currentPeriodLabel} vs {previousStatement.period_label}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold">
              <th className="py-3 px-4 sm:px-6">{t.colCategory}</th>
              <th className="py-3 px-4 text-right">{currentPeriodLabel}</th>
              <th className="py-3 px-4 text-right">{previousStatement.period_label}</th>
              <th className="py-3 px-4 text-right">{t.colDifference}</th>
              <th className="py-3 px-4 sm:px-6 text-right">{t.colChangePercent}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {comparisons.map((row) => {
              const isIncrease = row.isIncrease;
              const hasDiff = row.difference !== 0;

              return (
                <tr
                  key={row.category}
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                    isIncrease ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                  }`}
                >
                  {/* Category Name */}
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900 dark:text-white">
                    {row.category}
                  </td>

                  {/* Current Period */}
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(row.currentAmount, currency)}
                  </td>

                  {/* Previous Period */}
                  <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-400 tabular-nums">
                    {formatCurrency(row.previousAmount, currency)}
                  </td>

                  {/* Difference */}
                  <td
                    className={`py-3.5 px-4 text-right font-semibold tabular-nums ${
                      isIncrease
                        ? 'text-rose-600 dark:text-rose-400'
                        : row.difference < 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {row.difference > 0 ? '+' : ''}
                    {formatCurrency(row.difference, currency)}
                  </td>

                  {/* % Change with indicator badge */}
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    {hasDiff && row.percentageChange !== null ? (
                      <span
                        className={`inline-flex items-center gap-1 font-bold text-xs tabular-nums px-2 py-0.5 rounded ${
                          isIncrease
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {isIncrease ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        <span>{Math.abs(row.percentageChange)}%</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">0%</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
