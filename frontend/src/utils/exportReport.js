import * as XLSX from 'xlsx';
import { transactionApi, reportApi, accountApi, budgetApi } from '../services/api';

/**
 * Builds and downloads a CarryUp Excel report with:
 * - Summary (budget, balances, spending, remaining, overspend, counts)
 * - All transactions
 * - Income / Expenses / Transfers sheets
 * - Accounts sheet
 */
export async function exportFinanceReport(user) {
  const [txRes, dashRes, accRes] = await Promise.all([
    transactionApi.getAllForExport(),
    reportApi.getDashboard(),
    accountApi.getAll(),
  ]);

  let spendingByBudget = {};
  try {
    const spendRes = await budgetApi.getAllSpending();
    spendingByBudget = spendRes.data || {};
  } catch {
    spendingByBudget = {};
  }

  const transactions = txRes.data || [];
  const dash = dashRes.data || {};
  const accounts = accRes.data || [];
  const sym = user?.currencySymbol || 'Rs';

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const money = (n) => `${sym}${Number(n || 0).toLocaleString()}`;
  const fmtAmt = (t) => {
    if (t.type === 'expense') return `-${money(t.amount)}`;
    if (t.type === 'transfer') return money(t.amount);
    return `+${money(t.amount)}`;
  };

  const spendingAccounts = accounts.filter((a) => !a.isMain);
  const mainAccount = accounts.find((a) => a.isMain) || dash.mainAccount;
  const totalAccountBalance =
    dash.totalBalance ?? spendingAccounts.reduce((s, a) => s + (a.balance || 0), 0);
  const mainBalance = mainAccount?.balance ?? dash.mainAccount?.balance ?? 0;
  const mainInitial = mainAccount?.initialDeposit ?? dash.mainAccount?.initialDeposit ?? 0;

  const totalBudget = dash.activeBudgetTotal ?? 0;
  const budgetSpent = dash.activeBudgetSpent ?? 0;
  const budgetRemaining = dash.activeBudgetRemaining ?? 0;
  const overSpending = budgetRemaining < 0 ? Math.abs(budgetRemaining) : 0;
  const remainingDisplay = budgetRemaining > 0 ? budgetRemaining : 0;

  const incomeTx = transactions.filter((t) => t.type === 'income');
  const expenseTx = transactions.filter((t) => t.type === 'expense');
  const transferTx = transactions.filter((t) => t.type === 'transfer');
  const totalExpense = expenseTx.reduce((s, t) => s + t.amount, 0);
  const totalIncomeTx = incomeTx.reduce((s, t) => s + t.amount, 0);
  const reportedIncome = (dash.thisMonth?.income ?? totalIncomeTx + mainInitial) || 0;

  const summaryData = [
    ['CARRYUP FINANCIAL REPORT'],
    ['Generated on', new Date().toLocaleString()],
    ['User', user?.username || ''],
    ['Currency', `${sym} (${user?.currency || 'PKR'})`],
    [],
    ['OVERVIEW'],
    ['Metric', 'Value'],
    ['Total Budget', money(totalBudget)],
    ['Budget Spending', money(budgetSpent)],
    ['Budget Remaining', money(remainingDisplay)],
    ['Over Spending', money(overSpending)],
    [],
    ['Total Account Balance (spending accounts)', money(totalAccountBalance)],
    ['Main Account Balance', money(mainBalance)],
    ['Main Account Initial Deposit (Income)', money(mainInitial)],
    ['Number of Spending Accounts', spendingAccounts.length],
    ['Has Main Account', mainAccount ? 'Yes' : 'No'],
    [],
    ['Total Spending (all expense transactions)', money(totalExpense)],
    ['Income (incl. main deposit when present)', money(reportedIncome)],
    ['Number of Transactions', transactions.length],
    ['Income Transactions', incomeTx.length],
    ['Expense Transactions', expenseTx.length],
    ['Transfer Transactions', transferTx.length],
  ];

  if (Object.keys(spendingByBudget).length > 0) {
    summaryData.push([]);
    summaryData.push(['BUDGET BREAKDOWN (per budget)']);
    summaryData.push(['Budget Id', 'Spent', 'Remaining', '% Used', 'Daily Allowance', 'Days Left']);
    Object.entries(spendingByBudget).forEach(([id, s]) => {
      summaryData.push([
        id,
        money(s.spent ?? s.Spent ?? s.totalSpent ?? 0),
        money(s.remaining ?? s.Remaining ?? 0),
        `${s.percentUsed ?? s.PercentUsed ?? 0}%`,
        money(s.dailyAllowance ?? s.DailyAllowance ?? 0),
        s.daysRemaining ?? s.DaysRemaining ?? 0,
      ]);
    });
  }

  const txHeaders = ['#', 'Date', 'Title', 'Type', 'Amount', 'Category', 'Account', 'Note'];
  const txRows = transactions.map((t, i) => [
    i + 1,
    fmtDate(t.date),
    t.title || t.category?.name || 'Transaction',
    (t.type || '').charAt(0).toUpperCase() + (t.type || '').slice(1),
    fmtAmt(t),
    `${t.category?.icon || ''} ${t.category?.name || 'Uncategorized'}`.trim(),
    `${t.account?.icon || ''} ${t.account?.name || 'N/A'}`.trim(),
    t.note || '',
  ]);

  const incomeRows = incomeTx.map((t, i) => [
    i + 1,
    fmtDate(t.date),
    t.title || t.category?.name || 'Income',
    `+${money(t.amount)}`,
    `${t.category?.icon || ''} ${t.category?.name || 'Uncategorized'}`.trim(),
    `${t.account?.icon || ''} ${t.account?.name || 'N/A'}`.trim(),
    t.note || '',
  ]);

  const expenseRows = expenseTx.map((t, i) => [
    i + 1,
    fmtDate(t.date),
    t.title || t.category?.name || 'Expense',
    `-${money(t.amount)}`,
    `${t.category?.icon || ''} ${t.category?.name || 'Uncategorized'}`.trim(),
    `${t.account?.icon || ''} ${t.account?.name || 'N/A'}`.trim(),
    t.note || '',
  ]);

  const transferRows = transferTx.map((t, i) => [
    i + 1,
    fmtDate(t.date),
    t.title || 'Transfer',
    money(t.amount),
    `${t.account?.icon || ''} ${t.account?.name || 'N/A'}`.trim(),
    t.note || '',
  ]);

  const accountRows = accounts.map((a, i) => [
    i + 1,
    a.name,
    a.isMain ? 'Main Savings' : a.type,
    money(a.balance),
    a.isMain ? money(a.initialDeposit || 0) : '—',
    a.isMain ? 'Excluded from Total Account Balance' : 'Included in Total Account Balance',
  ]);

  const wb = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 48 }, { wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const wsAll = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
  wsAll['!cols'] = [
    { wch: 4 }, { wch: 14 }, { wch: 28 }, { wch: 10 },
    { wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAll, 'All Transactions');

  const detailHdr = ['#', 'Date', 'Title', 'Amount', 'Category', 'Account', 'Note'];
  const wsIncome = XLSX.utils.aoa_to_sheet([detailHdr, ...incomeRows]);
  wsIncome['!cols'] = [
    { wch: 4 }, { wch: 14 }, { wch: 26 }, { wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsIncome, 'Income');

  const wsExpense = XLSX.utils.aoa_to_sheet([detailHdr, ...expenseRows]);
  wsExpense['!cols'] = [
    { wch: 4 }, { wch: 14 }, { wch: 26 }, { wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsExpense, 'Expenses');

  if (transferRows.length > 0) {
    const transferHdr = ['#', 'Date', 'Title', 'Amount', 'Account', 'Note'];
    const wsTransfer = XLSX.utils.aoa_to_sheet([transferHdr, ...transferRows]);
    wsTransfer['!cols'] = [
      { wch: 4 }, { wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 20 }, { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTransfer, 'Transfers');
  }

  const accHdr = ['#', 'Name', 'Type', 'Balance', 'Initial Deposit', 'Notes'];
  const wsAccounts = XLSX.utils.aoa_to_sheet([accHdr, ...accountRows]);
  wsAccounts['!cols'] = [
    { wch: 4 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAccounts, 'Accounts');

  const fileName = `CarryUp_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);

  return {
    fileName,
    transactionCount: transactions.length,
  };
}
