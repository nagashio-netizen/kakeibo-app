import { useEffect, useRef, useState } from 'react';

// レシート画像を選択してバックエンドに送り、読み取り結果を親に渡す
export default function ReceiptUploader({ onAnalyzed, onManual, disabled }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  // プレビュー用 URL は不要になったら解放する
  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (selected) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setError('画像ファイルを選択してください');
      return;
    }
    setError('');
    setFile(selected);
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  // バックエンドの読み取り API を呼び出す
  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('image', file);
      const res = await fetch('/api/receipts/analyze', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `読み取りに失敗しました（${res.status}）`);
      }
      onAnalyzed(data);
      reset();
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'サーバーに接続できません。バックエンドが起動しているか確認してください'
          : err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>レシートを読み込む</h2>
      <div
        className={`dropzone${dragOver ? ' is-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          selectFile(e.dataTransfer.files[0]);
        }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="選択したレシート" className="preview" />
        ) : (
          <p>
            ここに画像をドロップ、またはクリックして選択
            <br />
            <small>JPEG / PNG / GIF / WebP（5MB まで）</small>
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          hidden
          onChange={(e) => selectFile(e.target.files[0])}
        />
      </div>

      {error && <p className="error">{error}</p>}
      {error && !disabled && (
        <p className="hint">
          読み取れない場合は、レシートを見ながら手入力で登録できます。
        </p>
      )}

      <div className="actions">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setError('');
            onManual();
          }}
          disabled={loading || disabled}
        >
          手入力で登録
        </button>
        <span className="spacer" />
        {file && !loading && (
          <button type="button" className="secondary" onClick={reset}>
            取り消し
          </button>
        )}
        <button type="button" onClick={analyze} disabled={!file || loading || disabled}>
          {loading ? '読み取り中…' : 'Claude で読み取る'}
        </button>
      </div>
      {!file && !disabled && <p className="hint">レシート画像を選択すると「Claude で読み取る」が押せるようになります。</p>}
      {disabled && <p className="hint">読み取った内容を保存または破棄してから、次のレシートを読み込めます。</p>}
    </section>
  );
}
