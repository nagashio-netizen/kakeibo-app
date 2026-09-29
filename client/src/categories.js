// 支出カテゴリと表示色（server/receipt.js の CATEGORIES と揃えること）
export const CATEGORIES = [
  { name: '食費', color: '#2a9d8f' },
  { name: '外食', color: '#e76f51' },
  { name: '日用品', color: '#457b9d' },
  { name: '交通費', color: '#8d6cab' },
  { name: '衣服・美容', color: '#e9a23b' },
  { name: '医療・健康', color: '#d6566b' },
  { name: '趣味・娯楽', color: '#5aa469' },
  { name: 'その他', color: '#8a8f98' },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

// カテゴリ名から表示色を取得する
export function categoryColor(name) {
  return CATEGORIES.find((c) => c.name === name)?.color ?? '#8a8f98';
}
