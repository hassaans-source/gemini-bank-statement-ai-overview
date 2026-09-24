import React, { useState } from 'react';
import { SavedStatement, AppLanguage } from '../types/finance';
import { translations, formatCurrency } from '../utils/i18n';
import { History, Trash2, ArrowRight, Calendar, AlertTriangle, FileText } from 'lucide-react';

interface HistoryViewProps {
  statements: SavedStatement[];
  language: AppLanguage;
  onSelectStatement: (statement: SavedStatement) => void;
  onDeleteStatement: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  statements,
  language,
  onSelectStatement,
  onDeleteStatement,
}) => {
  const t = translations[language];
  const [statementToDelete, setStatementToDelete] = useState<SavedStatement | null>(null);

  // Sort statements newest first
  const sortedStatements = [...statements].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const confirmDelete = () => {
    if (statementToDelete) {
      onDeleteStatement(statementToDelete.id);
      setStatementToDelete(null);
    }
  };

  return (
    <div className="space-y-6 py-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-xs uppercase tracking-wider">
          <History className="w-4 h-4" />
          <span>{t.history}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t.historyTitle}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t.historySubtitle}
        </p>
      </div>

      {sortedStatements.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
          <History className="w-12 h-12 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.emptyHistoryTitle}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {t.emptyHistoryDesc}
            </p>
          </div>
        </div>
      ) : (
        /* Statements List */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="py-3.5 px-4 sm:px-6">{t.colPeriod}</th>
                  <th className="py-3.5 px-4">{t.colUploadDate}</th>
                  <th className="py-3.5 px-4">{t.statementFile}</th>
                  <th className="py-3.5 px-4 text-right">{t.colClosingBalance}</th>
                  <th className="py-3.5 px-4 text-right">{t.colTotalSpending}</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedStatements.map((st) => {
                  const uploadDate = new Date(st.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => onSelectStatement(st)}
                    >
                      {/* Period Label */}
                      <td className="py-4 px-4 sm:px-6 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>{st.period_label}</span>
                      </td>

                      {/* Upload Date */}
                      <td className="py-4 px-4 text-slate-500 tabular-nums">
                        {uploadDate}
                      </td>

                      {/* File Name */}
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{st.file_name}</span>
                        </div>
                      </td>

                      {/* Closing Balance */}
                      <td className="py-4 px-4 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrency(st.closing_balance, st.currency)}
                      </td>

                      {/* Total Spending */}
                      <td className="py-4 px-4 text-right font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                        {formatCurrency(st.total_debit, st.currency)}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-4 px-4 sm:px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectStatement(st)}
                            className="inline-flex items-center gap-1 py-1 px-2.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 font-medium text-xs transition-colors"
                          >
                            <span>{t.actionView}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setStatementToDelete(st)}
                            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title={t.actionDelete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {statementToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.confirmDeleteTitle}
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t.confirmDeleteMsg}
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded text-xs text-slate-700 dark:text-slate-300 font-medium">
              Statement: <span className="font-bold">{statementToDelete.period_label}</span> ({statementToDelete.file_name})
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setStatementToDelete(null)}
                className="py-2 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={confirmDelete}
                className="py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                {t.deleteConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
