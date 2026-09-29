// 表示用のフォーマット関数

// 金額（整数・円）を「¥1,234」形式にする（負の値は「-¥100」）
export function formatYen(amount) {
  const sign = amount < 0 ? '-' : '';
  return `${sign}¥${Math.abs(amount).toLocaleString('ja-JP')}`;
}

// YYYY-MM-DD から YYYY-MM（月キー）を取り出す
export function monthKey(date) {
  return date.slice(0, 7);
}

// YYYY-MM を「2026年9月」形式にする
export function formatMonth(key) {
  const [y, m] = key.split('-');
  return `${y}年${Number(m)}月`;
}

// レシートの合計金額
export function receiptTotal(receipt) {
  return receipt.items.reduce((sum, item) => sum + item.price, 0);
}
