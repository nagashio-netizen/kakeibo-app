import { categoryColor } from '../categories.js';
import { formatYen, receiptTotal } from '../format.js';

// 選択中の月のレシートと商品を一覧表示する
export default function ReceiptList({ receipts, onDelete }) {
  if (receipts.length === 0) {
    return (
      <section className="card">
        <h2>登録済みのレシート</h2>
        <p className="empty">この月のデータはまだありません。</p>
      </section>
    );
  }

  // 日付の新しい順に並べる
  const sorted = [...receipts].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <section className="card">
      <h2>登録済みのレシート</h2>
      <ul className="receipt-list">
        {sorted.map((receipt) => (
          <li key={receipt.id}>
            <details>
              <summary>
                <span className="receipt-date">{receipt.date}</span>
                <span className="receipt-store">{receipt.storeName || '（店名なし）'}</span>
                <span className="receipt-total">{formatYen(receiptTotal(receipt))}</span>
              </summary>
              <div className="table-wrap">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>商品名</th>
                      <th>カテゴリ</th>
                      <th className="num">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.name}</td>
                        <td>
                          <span className="tag" style={{ '--tag-color': categoryColor(item.category) }}>
                            {item.category}
                          </span>
                        </td>
                        <td className="num">{formatYen(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    if (window.confirm('このレシートを削除しますか？')) onDelete(receipt.id);
                  }}
                >
                  削除
                </button>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
