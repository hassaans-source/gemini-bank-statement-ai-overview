import { AlertItem, BankStatementResult, SavedStatement } from '../types/finance';

export function computeAlerts(
  currentResult: BankStatementResult,
  previousStatement?: SavedStatement | null,
  lowBalanceThreshold?: number | null
): AlertItem[] {
  const alerts: AlertItem[] = [];

  // 1. Check Low Closing Balance
  if (
    lowBalanceThreshold !== null &&
    lowBalanceThreshold !== undefined &&
    !isNaN(Number(lowBalanceThreshold)) &&
    Number(lowBalanceThreshold) > 0
  ) {
    if (currentResult.closing_balance < Number(lowBalanceThreshold)) {
      alerts.push({
        id: 'low-balance',
        type: 'low_balance',
        title: 'Low Closing Balance Warning',
        title_ur: 'کم بینک بیلنس کا انتباہ',
        description: `Closing balance (${currentResult.currency} ${Math.round(currentResult.closing_balance).toLocaleString()}) is below your defined safety threshold of ${currentResult.currency} ${Math.round(Number(lowBalanceThreshold)).toLocaleString()}.`,
        description_ur: `اختتامی بیلنس (${Math.round(currentResult.closing_balance).toLocaleString()} ${currentResult.currency}) آپ کی مقررہ محفوظ حد (${Math.round(Number(lowBalanceThreshold)).toLocaleString()} ${currentResult.currency}) سے کم ہے۔`,
        severity: 'alert',
      });
    }
  }

  // 2. Higher spending vs previous statement
  if (previousStatement && previousStatement.result) {
    const prevDebit = previousStatement.result.total_debit || previousStatement.total_debit;
    if (prevDebit > 0 && currentResult.total_debit > prevDebit * 1.1) {
      const pctIncrease = Math.round(((currentResult.total_debit - prevDebit) / prevDebit) * 100);
      alerts.push({
        id: 'total-spending-high',
        type: 'spending_high',
        title: 'Higher Total Monthly Spending',
        title_ur: 'کل ماہانہ اخراجات میں نمایاں اضافہ',
        description: `Total debits rose by ${pctIncrease}% (${currentResult.currency} ${Math.round(currentResult.total_debit - prevDebit).toLocaleString()} increase) compared to ${previousStatement.period_label}.`,
        description_ur: `گزشتہ دورانیے (${previousStatement.period_label}) کے مقابلے میں کل اخراجات میں ${pctIncrease}% (${Math.round(currentResult.total_debit - prevDebit).toLocaleString()} ${currentResult.currency}) کا اضافہ ہوا۔`,
        severity: 'warning',
      });
    }

    // Category spending surge (>20% above previous amount)
    const prevCategoryMap = new Map<string, number>();
    previousStatement.result.categories.forEach((cat) => {
      prevCategoryMap.set(cat.name.toLowerCase().trim(), cat.amount);
    });

    currentResult.categories.forEach((cat) => {
      const prevAmount = prevCategoryMap.get(cat.name.toLowerCase().trim());
      if (prevAmount && prevAmount > 0 && cat.amount > prevAmount * 1.2) {
        const catPct = Math.round(((cat.amount - prevAmount) / prevAmount) * 100);
        alerts.push({
          id: `cat-surge-${cat.name}`,
          type: 'category_spike',
          title: `Spending Surge: ${cat.name}`,
          title_ur: `اخراجات میں اضافہ: ${cat.name}`,
          description: `${cat.name} spending surged by ${catPct}% (up ${currentResult.currency} ${Math.round(cat.amount - prevAmount).toLocaleString()}) compared to last month.`,
          description_ur: `${cat.name} کے اخراجات میں گزشتہ ماہ کے مقابلے ${catPct}% (${Math.round(cat.amount - prevAmount).toLocaleString()} ${currentResult.currency}) کا اضافہ ہوا۔`,
          severity: 'warning',
        });
      }
    });
  }

  // 3. Unusually large payment (one debit is > 3 times the average debit of that statement)
  const debitTransactions = currentResult.transactions.filter((tx) => tx.type === 'debit' && tx.amount > 0);
  if (debitTransactions.length > 0) {
    const totalDebitSum = debitTransactions.reduce((acc, tx) => acc + tx.amount, 0);
    const averageDebit = totalDebitSum / debitTransactions.length;
    const largeDebits = debitTransactions.filter((tx) => tx.amount > averageDebit * 3);

    // Limit to reporting top 2 most significant large payments to avoid noise
    largeDebits.slice(0, 2).forEach((tx, idx) => {
      const ratio = (tx.amount / averageDebit).toFixed(1);
      alerts.push({
        id: `large-debit-${idx}-${tx.date}`,
        type: 'large_payment',
        title: `Unusually Large Payment: ${tx.description}`,
        title_ur: `غیر معمولی بڑی ادائیگی: ${tx.description}`,
        description: `Payment of ${currentResult.currency} ${Math.round(tx.amount).toLocaleString()} on ${tx.date} is ${ratio}x higher than your average debit of ${currentResult.currency} ${Math.round(averageDebit).toLocaleString()}.`,
        description_ur: `${tx.date} کو ${Math.round(tx.amount).toLocaleString()} ${currentResult.currency} کی ادائیگی آپ کے اوسط ڈیبٹ (${Math.round(averageDebit).toLocaleString()} ${currentResult.currency}) سے ${ratio} گنا زیادہ ہے۔`,
        severity: 'alert',
      });
    });
  }

  // 4. Repeated payments: same amount and description appears two or more times within 7 days
  const checkedPairs = new Set<string>();
  for (let i = 0; i < currentResult.transactions.length; i++) {
    const txA = currentResult.transactions[i];
    if (txA.type !== 'debit') continue;

    for (let j = i + 1; j < currentResult.transactions.length; j++) {
      const txB = currentResult.transactions[j];
      if (txB.type !== 'debit') continue;

      if (
        txA.amount === txB.amount &&
        txA.description.trim().toLowerCase() === txB.description.trim().toLowerCase()
      ) {
        // Check date difference
        const dateA = new Date(txA.date).getTime();
        const dateB = new Date(txB.date).getTime();
        const diffDays = Math.abs(dateA - dateB) / (1000 * 60 * 60 * 24);

        if (!isNaN(diffDays) && diffDays <= 7) {
          const key = `${txA.description}-${txA.amount}`;
          if (!checkedPairs.has(key)) {
            checkedPairs.add(key);
            alerts.push({
              id: `duplicate-${key}`,
              type: 'duplicate_payment',
              title: `Repeated Payment Detected: ${txA.description}`,
              title_ur: `ایک جیسی دوہری ادائیگی: ${txA.description}`,
              description: `Identical debit amount of ${currentResult.currency} ${Math.round(txA.amount).toLocaleString()} charged on ${txA.date} and ${txB.date} (within ${Math.ceil(diffDays)} days). Verify for duplicate billing.`,
              description_ur: `${Math.round(txA.amount).toLocaleString()} ${currentResult.currency} کی یکساں رقم ${txA.date} اور ${txB.date} کو کٹوتی ہوئی۔ چیک کریں کہ آیا یہ غلطی سے ڈبل تو نہیں ہوئی۔`,
              severity: 'warning',
            });
          }
        }
      }
    }
  }

  return alerts;
}
