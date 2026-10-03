// 保存前のレシート（下書き）を作る
// 読み取れなかった項目には review フラグを立て、編集画面で要確認として表示する
// （利用者がその欄を修正するとフラグは外れる）

// 今日の日付（YYYY-MM-DD・ローカル時刻）
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 手入力用の空の商品行（すべての欄が要確認）
export function emptyItem() {
  return { name: '', price: 0, category: 'その他', review: { name: true, price: true, category: true } };
}

// 読み取り結果から下書きを作る
export function draftFromResult(result) {
  const items = result.items.map((item) => ({
    name: item.name,
    price: item.price,
    category: item.category,
    review: {
      name: !item.name.trim(),
      price: item.price === 0,
      category: !item.categoryDetected,
    },
  }));
  return {
    storeName: result.storeName,
    date: result.date,
    // 商品が 1 件も読み取れなかった場合は、手入力用の空行を用意する
    itemsDetected: items.length > 0,
    items: items.length > 0 ? items : [emptyItem()],
    review: { storeName: !result.storeName.trim(), date: !result.dateDetected },
  };
}

// 読み取りに失敗したレシートを手入力するための下書きを作る
export function emptyDraft() {
  return {
    storeName: '',
    date: today(),
    manual: true,
    items: [emptyItem()],
    review: { storeName: true, date: true },
  };
}

// 要確認のまま残っている欄の数
export function countReviews(draft) {
  const flags = [draft.review, ...draft.items.map((item) => item.review)];
  return flags.reduce((sum, review) => sum + Object.values(review ?? {}).filter(Boolean).length, 0);
}
