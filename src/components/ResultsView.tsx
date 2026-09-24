import React, { useMemo } from 'react';
import {
  BankStatementResult,
  SavedStatement,
  BudgetOverride,
  AppLanguage,
} from '../types/finance';
import { translations } from '../utils/i18n';
import { calculateCategoryBudgets } from '../utils/budgets';
import {
  findPreviousStatement,
  calculateCategoryComparisons,
} from '../utils/comparisons';
import { computeAlerts } from '../utils/alerts';
import { exportToExcel, exportToCsv, printPdfReport } from '../utils/export';

import { SummaryCards } from './results/SummaryCards';
import { AiSummaryAlerts } from './results/AiSummaryAlerts';
import { FinanceCharts } from './results/FinanceCharts';
import { CategoryBudgetTable } from './results/CategoryBudgetTable';
import { MonthComparisonTable } from './results/MonthComparisonTable';
import { TransactionsTable } from './results/TransactionsTable';

import {
  PlusCircle,
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  FileCode,
} from 'lucide-react';

interface ResultsViewProps {
  currentStatement: SavedStatement;
  allStatements: SavedStatement[];
  budgetOverrides: BudgetOverride[];
  lowBalanceThreshold: number | null;
  companyName: string;
  language: AppLanguage;
  onNewAnalysis: () => void;
  onSaveBudgetOverride: (category: string, amount: number) => void;
  onSelectStatement?: (statement: SavedStatement) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  currentStatement,
  allStatements,
  budgetOverrides,
  lowBalanceThreshold,
  companyName,
  language,
  onNewAnalysis,
  onSaveBudgetOverride,
  onSelectStatement,
}) => {
  const t = translations[language];
  const currentResult: BankStatementResult = currentStatement.result;

  // Previous statement determination
  const previousStatement = useMemo(() => {
    return findPreviousStatement(
      currentStatement.id,
      currentStatement.period_label,
      allStatements
    );
  }, [currentStatement.id, currentStatement.period_label, allStatements]);

  // Compute category budgets
  const categoryBudgets = useMemo(() => {
    return calculateCategoryBudgets(
      currentResult.categories,
      currentStatement.id,
      allStatements,
      budgetOverrides
    );
  }, [currentResult.categories, currentStatement.id, allStatements, budgetOverrides]);

  // Compute category comparison vs previous month
  const categoryComparisons = useMemo(() => {
    return calculateCategoryComparisons(currentResult, previousStatement);
  }, [currentResult, previousStatement]);

  // Compute alerts
  const alerts = useMemo(() => {
    return computeAlerts(currentResult, previousStatement, lowBalanceThreshold);
  }, [currentResult, previousStatement, lowBalanceThreshold]);

  const handleExportExcel = () => {
    exportToExcel(currentResult, categoryBudgets, companyName);
  };

  const handleExportCsv = () => {
    exportToCsv(currentResult, companyName);
  };

  const handlePrintPdf = () => {
    printPdfReport();
  };

  return (
    <div className="space-y-8 py-6">
      {/* Printable Header (Visible strictly during print) */}
      <div className="hidden print:block pb-4 mb-4 border-b border-slate-300">
        <h1 className="text-2xl font-bold text-slate-900">{companyName}</h1>
        <p className="text-sm text-slate-600">
          Executive Finance Review Report — {currentStatement.period_label}
        </p>
      </div>

      {/* Block 1: Period Label & Statement File Name + Top Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-xs uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.period}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {currentStatement.period_label}
            </h1>
            {allStatements.length > 1 && onSelectStatement && (
              <select
                value={currentStatement.id}
                onChange={(e) => {
                  const target = allStatements.find((s) => s.id === e.target.value);
                  if (target) onSelectStatement(target);
                }}
                className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md py-1 px-2 cursor-pointer font-medium"
                title={t.switchPeriod}
              >
                {allStatements.map((stmt) => (
                  <option key={stmt.id} value={stmt.id}>
                    {stmt.period_label} ({stmt.file_name})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <FileCode className="w-3.5 h-3.5" />
            <span>
              {t.statementFile}:{' '}
              <strong className="text-slate-700 dark:text-slate-200 font-semibold">
                {currentStatement.file_name}
              </strong>
            </span>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 no-print">
          <button
            onClick={onNewAnalysis}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.newAnalysis}</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t.downloadPdf}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t.exportExcel}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>{t.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* Block 2: AI Summary Card & Block 3: Alerts Card */}
      <AiSummaryAlerts
        summaryEn={currentResult.summary}
        summaryUr={currentResult.summary_ur}
        alerts={alerts}
        language={language}
      />

      {/* Block 4: Summary Cards (Opening, Closing, In, Out, Net) */}
      <SummaryCards
        currentResult={currentResult}
        previousStatement={previousStatement}
        language={language}
      />

      {/* Block 5: Charts */}
      <FinanceCharts
        currentResult={currentResult}
        allStatements={allStatements}
        language={language}
      />

      {/* Block 6: Category Table with Budgets */}
      <CategoryBudgetTable
        categoryBudgets={categoryBudgets}
        currency={currentResult.currency}
        language={language}
        onSaveOverride={onSaveBudgetOverride}
      />

      {/* Block 7: Month Comparison Table */}
      <MonthComparisonTable
        comparisons={categoryComparisons}
        previousStatement={previousStatement}
        currentPeriodLabel={currentStatement.period_label}
        currency={currentResult.currency}
        language={language}
      />

      {/* Block 8: Transactions Table */}
      <TransactionsTable
        transactions={currentResult.transactions}
        currency={currentResult.currency}
        language={language}
      />

      {/* Block 9: Bottom Export & Action Buttons */}
      <div className="p-6 bg-slate-100 dark:bg-slate-800/60 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.portalTitle}
          </h4>
          <p className="text-xs text-slate-500">
            Export statements for accounting audits, stakeholder reviews, or tax preparation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onNewAnalysis}
            className="py-2 px-4 rounded-lg bg-[#0B1F44] hover:bg-[#16336e] text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            {t.newAnalysis}
          </button>
          <button
            onClick={handlePrintPdf}
            className="py-2 px-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {t.downloadPdf}
          </button>
          <button
            onClick={handleExportExcel}
            className="py-2 px-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {t.exportExcel}
          </button>
          <button
            onClick={handleExportCsv}
            className="py-2 px-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {t.exportCsv}
          </button>
        </div>
      </div>
    </div>
  );
};
