import { CATEGORY_NAMES } from '../categories.js';
import { formatYen, receiptTotal } from '../format.js';

// 読み取り結果を確認・修正してから保存するフォーム
export default function ReceiptEditor({ draft, onChange, onSave, onCancel }) {
  const updateItem = (index, patch) => {
    const items = draft.items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ ...draft, items });
  };

  const removeItem = (index) => {
    onChange({ ...draft, items: draft.items.filter((_, i) => i !== index) });
  };

  const addItem = () => {
    onChange({ ...draft, items: [...draft.items, { name: '', price: 0, category: 'その他' }] });
  };

  // 入力された金額を整数（円）に変換する
  const toYen = (value) => {
    const n = Number.parseInt(value, 10);
    return Number.isNaN(n) ? 0 : n;
  };

  const canSave = draft.date && draft.items.length > 0;

  return (
    <section className="card editor">
      <h2>読み取り結果の確認</h2>
      <p className="hint">内容を確認し、必要に応じて修正してから保存してください。</p>

      <div className="editor-meta">
        <label>
          店名
          <input
            type="text"
            value={draft.storeName}
            onChange={(e) => onChange({ ...draft, storeName: e.target.value })}
          />
        </label>
        <label>
          日付
          <input
            type="date"
            value={draft.date}
            onChange={(e) => onChange({ ...draft, date: e.target.value })}
          />
        </label>
      </div>
      {!draft.dateDetected && (
        <p className="warning">日付を読み取れなかったため、今日の日付を入れています。</p>
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
              <tr key={i}>
                <td>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(i, { name: e.target.value })}
                  />
                </td>
                <td className="num">
                  <input
                    type="number"
                    step="1"
                    value={item.price}
                    onChange={(e) => updateItem(i, { price: toYen(e.target.value) })}
                  />
                </td>
                <td>
                  <select
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
