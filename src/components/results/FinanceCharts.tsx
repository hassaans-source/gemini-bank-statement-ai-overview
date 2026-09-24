import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  ComposedChart,
} from 'recharts';
import { BankStatementResult, SavedStatement, AppLanguage } from '../../types/finance';
import { translations, formatCurrency } from '../../utils/i18n';
import { PieChart as PieIcon, BarChart2, TrendingUp, DollarSign } from 'lucide-react';

interface FinanceChartsProps {
  currentResult: BankStatementResult;
  allStatements: SavedStatement[];
  language: AppLanguage;
}

const PALETTE = [
  '#0B1F44', // Dark Navy
  '#0D9488', // Teal
  '#4F46E5', // Indigo
  '#D97706', // Amber
  '#2563EB', // Blue
  '#E11D48', // Rose
  '#059669', // Emerald
  '#7C3AED', // Violet
  '#0284C7', // Sky
];

export const FinanceCharts: React.FC<FinanceChartsProps> = ({
  currentResult,
  allStatements,
  language,
}) => {
  const t = translations[language];
  const currency = currentResult.currency || 'PKR';

  // 1. Donut Chart Data
  const donutData = currentResult.categories.map((c) => ({
    name: c.name,
    amount: c.amount,
    percentage: c.percentage,
  }));

  // 2. Horizontal Bar Chart Data (largest to smallest)
  const barData = [...currentResult.categories]
    .sort((a, b) => b.amount - a.amount)
    .map((c) => ({
      name: c.name.length > 20 ? c.name.substring(0, 18) + '...' : c.name,
      fullName: c.name,
      amount: c.amount,
      percentage: c.percentage,
    }));

  // 3. Historical Timeline Data (sorted chronologically)
  const timelineData = [...allStatements]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((s) => ({
      period: s.period_label,
      totalIncome: s.total_credit || s.result.total_credit,
      totalSpending: s.total_debit || s.result.total_debit,
      closingBalance: s.closing_balance || s.result.closing_balance,
    }));

  const hasAtLeastTwo = timelineData.length >= 2;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg border border-slate-700 text-xs space-y-1 z-50">
          <p className="font-semibold text-slate-200">{label || payload[0]?.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="tabular-nums flex items-center justify-between gap-4">
              <span style={{ color: entry.color || entry.fill }}>
                {entry.name || 'Amount'}:
              </span>
              <span className="font-bold text-white">
                {formatCurrency(entry.value, currency)}
                {entry.payload?.percentage ? ` (${entry.payload.percentage}%)` : ''}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Row 1: Donut (Category Share) & Horizontal Bar (Category Ranking) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Donut Chart */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.chartCategoryShare}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.chartCategoryShareDesc}
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="amount"
                >
                  {donutData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Clear Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {donutData.map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PALETTE[idx % PALETTE.length] }}
                  />
                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                    {cat.name}
                  </span>
                </div>
                <div className="text-right shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {cat.percentage}%
                  </span>{' '}
                  <span className="text-[11px]">({formatCurrency(cat.amount, currency)})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Horizontal Bar Chart (Largest to Smallest) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.chartCategoryBar}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.chartCategoryBarDesc}
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" opacity={0.2} />
                <XAxis
                  type="number"
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  width={110}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {barData.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Helper notice */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 text-right">
            <span>Ranked by expenditure volume</span>
          </div>
        </div>
      </div>

      {/* Row 2: Timeline Trends & Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 3: Line Chart (Spending & Income over time) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.chartSpendingIncomeTrends}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.chartSpendingIncomeTrendsDesc}
              </p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(val) => (
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {val === 'totalIncome' ? t.moneyInLabel : t.moneyOutLabel}
                    </span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="totalIncome"
                  name="totalIncome"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10B981' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalSpending"
                  name="totalSpending"
                  stroke="#F43F5E"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#F43F5E' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Cash Flow Chart (Grouped Bars + Line for Closing Balance) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.chartCashFlow}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.chartCashFlowDesc}
              </p>
            </div>
          </div>

          {!hasAtLeastTwo ? (
            /* Soft message when fewer than two statements */
            <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center p-6 text-center rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200 dark:border-slate-700">
              <DollarSign className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-sm">
                {t.chartNeedTwoStatements}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Upload your previous month statement or load demo data in Settings to unlock.
              </p>
            </div>
          ) : (
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={timelineData}
                  margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    yAxisId="left"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#0B1F44"
                    fontSize={11}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(val) => (
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {val === 'totalIncome'
                          ? t.moneyInLabel
                          : val === 'totalSpending'
                          ? t.moneyOutLabel
                          : t.balanceLabel}
                      </span>
                    )}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="totalIncome"
                    name="totalIncome"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="totalSpending"
                    name="totalSpending"
                    fill="#F43F5E"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="closingBalance"
                    name="closingBalance"
                    stroke="#0B1F44"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0B1F44' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
