import React, { useState } from 'react';
import { CategoryBudgetInfo } from '../../utils/budgets';
import { AppLanguage } from '../../types/finance';
import { translations, formatCurrency } from '../../utils/i18n';
import { Edit2, Check, X, Layers, AlertCircle, ShieldCheck } from 'lucide-react';

interface CategoryBudgetTableProps {
  categoryBudgets: CategoryBudgetInfo[];
  currency: string;
  language: AppLanguage;
  onSaveOverride: (category: string, amount: number) => void;
}

export const CategoryBudgetTable: React.FC<CategoryBudgetTableProps> = ({
  categoryBudgets,
  currency,
  language,
  onSaveOverride,
}) => {
  const t = translations[language];
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');

  const handleStartEdit = (category: string, currentBudget: number | null) => {
    setEditingCategory(category);
    setEditAmount(currentBudget ? String(currentBudget) : '');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditAmount('');
  };

  const handleSave = (category: string) => {
    const parsed = parseFloat(editAmount);
    if (!isNaN(parsed) && parsed >= 0) {
      onSaveOverride(category, Math.round(parsed));
    }
    setEditingCategory(null);
    setEditAmount('');
  };

  const renderStatus = (status: CategoryBudgetInfo['status']) => {
    switch (status) {
      case 'under':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t.statusUnder}</span>
          </span>
        );
      case 'near':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>{t.statusNear}</span>
          </span>
        );
      case 'over':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>{t.statusOver}</span>
          </span>
        );
      default:
        return (
          <span className="text-xs text-slate-400 italic">
            {t.statusNoBudget}
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t.categoryTableTitle}
          </h3>
        </div>
        <p className="text-xs text-slate-400 hidden sm:block">
          {t.budgetAutoNote}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold">
              <th className="py-3 px-4 sm:px-6">{t.colCategory}</th>
              <th className="py-3 px-4 text-right">{t.colAmount}</th>
              <th className="py-3 px-4 text-right">{t.colPercent}</th>
              <th className="py-3 px-4 text-center">{t.colTransactions}</th>
              <th className="py-3 px-4 sm:px-6">{t.colBudget}</th>
              <th className="py-3 px-4 sm:px-6">{t.colStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {categoryBudgets.map((row) => {
              const isEditing = editingCategory === row.categoryName;

              return (
                <tr
                  key={row.categoryName}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Category Name */}
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900 dark:text-white">
                    {row.categoryName}
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(row.amount, currency)}
                  </td>

                  {/* % of Spending */}
                  <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                    {row.percentage}%
                  </td>

                  {/* Transactions Count */}
                  <td className="py-3.5 px-4 text-center font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                    {row.transactionCount}
                  </td>

                  {/* Budget (Editable Cell) */}
                  <td className="py-3.5 px-4 sm:px-6">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          placeholder="e.g. 150000"
                          className="w-28 sm:w-32 py-1 px-2 text-xs border border-teal-500 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 tabular-nums"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(row.categoryName);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <button
                          onClick={() => handleSave(row.categoryName)}
                          className="p-1 rounded bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                          title={t.saveBudget}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                          title={t.cancel}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                          {row.budget !== null
                            ? formatCurrency(row.budget, currency)
                            : t.statusNoBudget}
                        </span>
                        {row.isOverride && (
                          <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-1 rounded">
                            Set
                          </span>
                        )}
                        <button
                          onClick={() => handleStartEdit(row.categoryName, row.budget)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-teal-600 transition-opacity"
                          title="Edit budget"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 sm:px-6">
                    {renderStatus(row.status)}
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
