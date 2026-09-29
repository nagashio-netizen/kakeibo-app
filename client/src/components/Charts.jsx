import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { CATEGORIES } from '../categories.js';
import { formatMonth, formatYen } from '../format.js';

// 使用する Chart.js の部品を登録する
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// 選択月のカテゴリ別支出（円グラフ）
export function CategoryPieChart({ totals }) {
  // 円グラフはマイナスを描けないため、支出がプラスのカテゴリだけを表示する
  const entries = CATEGORIES.filter((c) => (totals[c.name] ?? 0) > 0);

  if (entries.length === 0) {
    return <p className="empty">表示できるデータがありません。</p>;
  }

  const data = {
    labels: entries.map((c) => c.name),
    datasets: [
      {
        data: entries.map((c) => totals[c.name]),
        backgroundColor: entries.map((c) => c.color),
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="chart-box">
      <Pie
        data={data}
        options={{
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatYen(ctx.parsed)}` } },
          },
        }}
      />
    </div>
  );
}

// 月別の支出（カテゴリ積み上げ棒グラフ）
// monthly: { 'YYYY-MM': { カテゴリ名: 金額 } }
export function MonthlyBarChart({ months, monthly }) {
  const data = {
    labels: months.map(formatMonth),
    datasets: CATEGORIES.map((c) => ({
      label: c.name,
      data: months.map((m) => monthly[m]?.[c.name] ?? 0),
      backgroundColor: c.color,
    })),
  };

  return (
    <div className="chart-box">
      <Bar
        data={data}
        options={{
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true },
            y: { stacked: true, ticks: { callback: (v) => formatYen(v) } },
          },
          plugins: {
            legend: { position: 'bottom' },
            tooltip: {
              callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatYen(ctx.parsed.y)}` },
            },
          },
        }}
      />
    </div>
  );
}
