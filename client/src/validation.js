// 保存前のレシートデータを検証する
// 保存を止めるエラーではなく、利用者に確認を促す警告として扱う
import { formatYen, receiptTotal } from './format.js';

/**
 * 下書きのレシートを検証し、警告の一覧を返す
 * @param {object} draft 保存前のレシート（date, items）
 * @param {object[]} receipts 登録済みのレシート
 * @returns {{ negativeIndexes: number[], duplicates: object[], messages: string[] }}
 */
export function validateReceipt(draft, receipts) {
  const messages = [];

  // 金額が負の値の商品（値引き行の読み取りや入力ミスの可能性がある）
  const negativeIndexes = draft.items
    .map((item, i) => (item.price < 0 ? i : -1))
    .filter((i) => i !== -1);
  for (const i of negativeIndexes) {
    const item = draft.items[i];
    messages.push(
      `「${item.name || '（名称なし）'}」の金額が負の値（${formatYen(item.price)}）です。値引きでなければ修正してください。`,
    );
  }

  // 同じ日付・同じ合計金額のレシートが登録済みなら重複の可能性がある
  const total = receiptTotal(draft);
  const duplicates = receipts.filter((r) => r.date === draft.date && receiptTotal(r) === total);
  if (duplicates.length > 0) {
    const stores = duplicates.map((r) => r.storeName || '（店名なし）').join('、');
    messages.push(
      `${draft.date} に合計 ${formatYen(total)} のレシート（${stores}）が既に登録されています。重複していないか確認してください。`,
    );
  }

  return { negativeIndexes, duplicates, messages };
}
