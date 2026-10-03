import { CATEGORY_NAMES } from '../categories.js';
import { formatYen, receiptTotal } from '../format.js';
import { validateReceipt } from '../validation.js';
import { countReviews, emptyItem } from '../draft.js';

// 要確認（読み取れなかった）欄に付けるクラス
const reviewClass = (flag) => (flag ? 'needs-review' : undefined);

// 読み取り結果を確認・修正してから保存するフォーム
export default function ReceiptEditor({ draft, receipts, onChange, onSave, onCancel }) {
  // 修正した欄は確認済みとして要確認フラグを外す
  const updateItem = (index, patch) => {
    const items = draft.items.map((item, i) =>
      i === index ? { ...item, ...patch, review: { ...item.review, [Object.keys(patch)[0]]: false } } : item,
    );
    onChange({ ...draft, items });
  };

  const updateMeta = (patch) => {
    onChange({ ...draft, ...patch, review: { ...draft.review, [Object.keys(patch)[0]]: false } });
  };

  const removeItem = (index) => {
    onChange({ ...draft, items: draft.items.filter((_, i) => i !== index) });
  };

  const addItem = () => {
    onChange({ ...draft, items: [...draft.items, emptyItem()] });
  };

  // 入力された金額を整数（円）に変換する
  const toYen = (value) => {
    const n = Number.parseInt(value, 10);
    return Number.isNaN(n) ? 0 : n;
  };

  const canSave = draft.date && draft.items.length > 0;

  // 入力内容が変わるたびに検証し、警告を表示する（保存は妨げない）
  const { negativeIndexes, messages } = validateReceipt(draft, receipts);
  const reviewCount = countReviews(draft);

  return (
    <section className="card editor">
      <h2>{draft.manual ? 'レシートの手入力' : '読み取り結果の確認'}</h2>
      <p className="hint">
        {draft.manual
          ? 'レシートを見ながら、店名・日付・商品を入力してください。'
          : '内容を確認し、必要に応じて修正してから保存してください。'}
      </p>
      {!draft.manual && draft.itemsDetected === false && (
        <p className="warning">商品を読み取れませんでした。レシートを見ながら商品を手入力してください。</p>
      )}
      {reviewCount > 0 && (
        <p className="warning">
          黄色の欄（{reviewCount} 件）は読み取れなかったか、確認が必要な項目です。入力・確認すると黄色が消えます。
        </p>
      )}

      <div className="editor-meta">
        <label>
          店名
          <input
            type="text"
            className={reviewClass(draft.review?.storeName)}
            value={draft.storeName}
            onChange={(e) => updateMeta({ storeName: e.target.value })}
          />
        </label>
        <label>
          日付
          <input
            type="date"
            className={reviewClass(draft.review?.date)}
            value={draft.date}
            onChange={(e) => updateMeta({ date: e.target.value })}
          />
        </label>
      </div>
      {draft.review?.date && (
        <p className="warning">
          {draft.manual ? '日付は今日の日付を入れています。' : '日付を読み取れなかったため、今日の日付を入れています。'}
          購入日に合わせて修正してください。
        </p>
      )}

      <div className="table-wrap">
        <table className="items-table">
          <thead>
            <tr>
              <th>商品名</th>
              <th className="num">金額（円）</th>
              <th>カテゴリ</th>
              <th aria-label="削除" />
            </tr>
          </thead>
          <tbody>
            {draft.items.map((item, i) => (
              <tr key={i} className={negativeIndexes.includes(i) ? 'is-negative' : undefined}>
                <td>
                  <input
                    type="text"
                    className={reviewClass(item.review?.name)}
                    placeholder="商品名"
                    value={item.name}
                    onChange={(e) => updateItem(i, { name: e.target.value })}
                  />
                </td>
                <td className="num">
                  <input
                    type="number"
                    step="1"
                    className={reviewClass(item.review?.price)}
                    value={item.price}
                    onChange={(e) => updateItem(i, { price: toYen(e.target.value) })}
                  />
                </td>
                <td>
                  <select
                    className={reviewClass(item.review?.category)}
                    value={item.category}
                    onChange={(e) => updateItem(i, { category: e.target.value })}
                  >
                    {CATEGORY_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button type="button" className="icon" onClick={() => removeItem(i)} title="この行を削除">
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>合計</td>
              <td className="num">{formatYen(receiptTotal(draft))}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {messages.length > 0 && (
        <ul className="warning validation-list" role="alert">
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <div className="actions">
        <button type="button" className="secondary" onClick={addItem}>
          行を追加
        </button>
        <span className="spacer" />
        <button type="button" className="secondary" onClick={onCancel}>
          破棄
        </button>
        <button type="button" onClick={onSave} disabled={!canSave}>
          保存
        </button>
      </div>
    </section>
  );
}
