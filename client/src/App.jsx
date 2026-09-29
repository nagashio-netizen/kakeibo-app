import { useMemo, useState } from 'react';
import ReceiptUploader from './components/ReceiptUploader.jsx';
import ReceiptEditor from './components/ReceiptEditor.jsx';
import ReceiptList from './components/ReceiptList.jsx';
import { CategoryPieChart, MonthlyBarChart } from './components/Charts.jsx';
import { CATEGORIES } from './categories.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { formatMonth, formatYen, monthKey } from './format.js';

// ローカルストレージの保存キー
const STORAGE_KEY = 'kakeibo.receipts';

// 棒グラフに表示する月数
const BAR_CHART_MONTHS = 6;

// 今月の YYYY-MM
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// 指定月から遡って n か月分の YYYY-MM を古い順に返す
function recentMonths(endKey, n) {
  const [y, m] = endKey.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(y, m - 1 - (n - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

export default function App() {
  const [receipts, setReceipts] = useLocalStorage(STORAGE_KEY, []);
  const [draft, setDraft] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // 月ごと・カテゴリごとの支出合計 { 'YYYY-MM': { カテゴリ名: 金額 } }
  const monthly = useMemo(() => {
    const result = {};
    for (const receipt of receipts) {
      const key = monthKey(receipt.date);
      result[key] ??= {};
      for (const item of receipt.items) {
        result[key][item.category] = (result[key][item.category] ?? 0) + item.price;
      }
    }
    return result;
  }, [receipts]);

  // 月の選択肢（データのある月＋今月、新しい順）
  const monthOptions = useMemo(
    () => [...new Set([currentMonth(), ...Object.keys(monthly)])].sort().reverse(),
    [monthly],
  );

  const monthReceipts = receipts.filter((r) => monthKey(r.date) === selectedMonth);
  const categoryTotals = monthly[selectedMonth] ?? {};
  const monthTotal = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);

  // 読み取り結果を確認用の下書きにする
  const handleAnalyzed = (result) => {
    setDraft({
      storeName: result.storeName,
      date: result.date,
      dateDetected: result.dateDetected,
      items: result.items,
    });
  };

  // 下書きをレシートとして保存し、その月を表示する
  const handleSave = () => {
    const receipt = {
      id: crypto.randomUUID(),
      storeName: draft.storeName.trim(),
      date: draft.date,
      items: draft.items.map((item) => ({
        name: item.name.trim() || '（名称なし）',
        price: Math.trunc(item.price),
        category: item.category,
      })),
      createdAt: new Date().toISOString(),
    };
    setReceipts((prev) => [...prev, receipt]);
    setSelectedMonth(monthKey(receipt.date));
    setDraft(null);
  };

  const handleDelete = (id) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>レシート家計簿</h1>
        <p>レシートを撮影してアップロードするだけで、支出を自動で記録・分類します。</p>
      </header>

      <main className="layout">
        <div className="column">
          <ReceiptUploader onAnalyzed={handleAnalyzed} disabled={draft !== null} />
          {draft && (
            <ReceiptEditor
              draft={draft}
              receipts={receipts}
              onChange={setDraft}
              onSave={handleSave}
              onCancel={() => setDraft(null)}
            />
          )}
        </div>

        <div className="column">
          <section className="card">
            <div className="summary-head">
              <h2>集計</h2>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {formatMonth(m)}
                  </option>
                ))}
              </select>
            </div>
            <p className="month-total">
              {formatMonth(selectedMonth)}の支出合計 <strong>{formatYen(monthTotal)}</strong>
            </p>

            <h3>カテゴリ別</h3>
            <CategoryPieChart totals={categoryTotals} />
            <table className="summary-table">
              <tbody>
                {CATEGORIES.filter((c) => categoryTotals[c.name]).map((c) => (
                  <tr key={c.name}>
                    <td>
                      <span className="swatch" style={{ background: c.color }} />
                      {c.name}
                    </td>
                    <td className="num">{formatYen(categoryTotals[c.name])}</td>
                    <td className="num muted">
                      {monthTotal > 0 ? Math.round((categoryTotals[c.name] / monthTotal) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>月別推移（直近{BAR_CHART_MONTHS}か月）</h3>
            <MonthlyBarChart months={recentMonths(selectedMonth, BAR_CHART_MONTHS)} monthly={monthly} />
          </section>

          <ReceiptList receipts={monthReceipts} onDelete={handleDelete} />
        </div>
      </main>
    </div>
  );
}
