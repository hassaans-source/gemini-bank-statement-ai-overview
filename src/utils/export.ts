import * as XLSX from 'xlsx';
import { BankStatementResult } from '../types/finance';
import { CategoryBudgetInfo } from './budgets';

export function exportToExcel(
  result: BankStatementResult,
  categoryBudgets: CategoryBudgetInfo[],
  companyName: string
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Transactions
  const txData = result.transactions.map((tx) => ({
    Date: tx.date,
    Description: tx.description,
    Category: tx.category,
    Type: tx.type.toUpperCase(),
    Amount: tx.amount,
    Currency: result.currency,
  }));
  const txSheet = XLSX.utils.json_to_sheet(txData);
  XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions');

  // Sheet 2: Categories
  const catData = categoryBudgets.map((cb) => ({
    Category: cb.categoryName,
    Amount: cb.amount,
    'Spending %': `${cb.percentage}%`,
    Transactions: cb.transactionCount,
    Budget: cb.budget ?? 'N/A',
    Status: cb.status === 'under' ? 'Under budget' : cb.status === 'near' ? 'Near budget' : cb.status === 'over' ? 'Over budget' : 'No budget',
    Currency: result.currency,
  }));
  const catSheet = XLSX.utils.json_to_sheet(catData);
  XLSX.utils.book_append_sheet(wb, catSheet, 'Categories');

  // Sheet 3: Summary
  const summaryData = [
    { Metric: 'Company', Value: companyName },
    { Metric: 'Statement Period', Value: result.period_label },
    { Metric: 'Opening Balance', Value: `${result.currency} ${result.opening_balance}` },
    { Metric: 'Closing Balance', Value: `${result.currency} ${result.closing_balance}` },
    { Metric: 'Total Money In', Value: `${result.currency} ${result.total_credit}` },
    { Metric: 'Total Money Out', Value: `${result.currency} ${result.total_debit}` },
    { Metric: 'Net Operating Change', Value: `${result.currency} ${result.total_credit - result.total_debit}` },
    { Metric: 'Summary Notes', Value: result.summary },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Executive Summary');

  const fileName = `${companyName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${result.period_label.replace(/\s+/g, '_')}_Report.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportToCsv(result: BankStatementResult, companyName: string) {
  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Currency'];
  const rows = result.transactions.map((tx) => [
    `"${tx.date}"`,
    `"${tx.description.replace(/"/g, '""')}"`,
    `"${tx.category.replace(/"/g, '""')}"`,
    `"${tx.type.toUpperCase()}"`,
    tx.amount,
    `"${result.currency}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `${companyName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${result.period_label.replace(/\s+/g, '_')}_Transactions.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printPdfReport() {
  window.print();
}
