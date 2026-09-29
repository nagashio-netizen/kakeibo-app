// レシート読み取り用 API サーバー
// ブラウザに API キーを渡さないため、Claude API の呼び出しはすべてこのサーバーで行う
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import { analyzeReceipt, ReceiptError } from './receipt.js';

// プロジェクトルートの .env を読み込む
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, '..', '.env') });

const PORT = Number(process.env.PORT) || 3001;

// Claude が受け付ける画像形式
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// アップロード画像はディスクに保存せずメモリ上で扱う（上限 5MB）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('JPEG / PNG / GIF / WebP の画像を選択してください'));
    }
  },
});

const app = express();

// レシート画像を受け取り、読み取り結果を JSON で返す
app.post('/api/receipts/analyze', (req, res) => {
  upload.single('image')(req, res, async (uploadError) => {
    if (uploadError) {
      const message =
        uploadError.code === 'LIMIT_FILE_SIZE'
          ? '画像サイズは 5MB 以下にしてください'
          : uploadError.message;
      return res.status(400).json({ error: message });
    }
    if (!req.file) {
      return res.status(400).json({ error: '画像ファイルが指定されていません' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'サーバーに API キーが設定されていません。.env に ANTHROPIC_API_KEY を設定して再起動してください' });
    }

    try {
      const result = await analyzeReceipt(req.file.buffer, req.file.mimetype);
      res.json(result);
    } catch (error) {
      // SDK の型付き例外で原因を切り分ける（詳細なエラー内容はサーバーログのみに出す）
      console.error('レシート読み取りエラー:', error);
      if (error instanceof Anthropic.AuthenticationError) {
        res.status(500).json({ error: 'API キーが無効です。.env の ANTHROPIC_API_KEY を確認してください' });
      } else if (error instanceof Anthropic.RateLimitError) {
        res.status(429).json({ error: 'リクエストが集中しています。しばらく待ってから再度お試しください' });
      } else if (error instanceof Anthropic.APIError) {
        res.status(502).json({ error: `Claude API でエラーが発生しました（${error.status ?? '接続エラー'}）` });
      } else if (error instanceof ReceiptError) {
        res.status(422).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'レシートの読み取りに失敗しました' });
      }
    }
  });
});

app.listen(PORT, () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('警告: ANTHROPIC_API_KEY が設定されていません。.env を確認してください');
  }
  console.log(`API サーバー起動: http://localhost:${PORT}`);
});
