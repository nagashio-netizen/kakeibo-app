import { useEffect, useState } from 'react';

// ローカルストレージと同期する state
// リロード後も値が残るよう、変更のたびに JSON で保存する
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : initialValue;
    } catch {
      // 保存データが壊れている・ストレージが使えない場合は初期値で始める
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('ローカルストレージへの保存に失敗しました:', error);
    }
  }, [key, value]);

  return [value, setValue];
}
