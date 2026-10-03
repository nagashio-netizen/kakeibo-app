// Claude API でレシート画像を読み取り、商品ごとにカテゴリ分類する
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';

// 使用モデル（Claude Haiku の最新版）
const MODEL = 'claude-haiku-4-5';

// 分類カテゴリ（クライアント側 client/src/categories.js と揃えること）
export const CATEGORIES = [
  '食費',
  '外食',
  '日用品',
  '交通費',
  '衣服・美容',
  '医療・健康',
  '趣味・娯楽',
  'その他',
];

// Claude に返させる JSON の形式
// 金額は丸め誤差を防ぐため整数（円）で受け取る
const ReceiptSchema = z.object({
  storeName: z.string().describe('店名。読み取れない場合は空文字'),
  date: z
    .string()
    .nullable()
    .describe('購入日（YYYY-MM-DD 形式）。読み取れない場合は null'),
  items: z.array(
    z.object({
      name: z.string().describe('商品名'),
      price: z.number().int().describe('税込の支払金額（円・整数）。値引きはマイナス'),
      category: z.string().describe(`商品のカテゴリ。次のいずれか: ${CATEGORIES.join(' / ')}`),
    }),
  ),
});

const SYSTEM_PROMPT = `あなたは日本のレシートを読み取る家計簿アシスタントです。
画像から店名・購入日・購入した商品を抽出してください。

- 商品ごとに、数量を掛けた後の支払金額を price に入れてください（単価ではありません）。
- 値引き・割引の行は、マイナスの金額で独立した項目として含めてください。
- 外税のレシートでは、消費税を「消費税」という項目（カテゴリは直前の商品群で最も多いもの）として加えてください。内税の場合は加えないでください。
- 小計・合計・お預かり・お釣り・ポイントの行は items に含めないでください。
- カテゴリは次の基準で選んでください:
  - 食費: スーパー・コンビニ等で買った食材・飲料・お菓子
  - 外食: 飲食店での食事、テイクアウト、カフェ
  - 日用品: 洗剤・ティッシュ・文房具など消耗品
  - 交通費: 電車・バス・タクシー・ガソリン・駐車場
  - 衣服・美容: 衣類・靴・化粧品・美容院
  - 医療・健康: 薬・病院・サプリメント
  - 趣味・娯楽: 本・ゲーム・映画・レジャー
  - その他: 上記に当てはまらないもの
- 和暦の日付は西暦に変換してください。年が省略されている場合は ${new Date().getFullYear()} 年とみなしてください。
- 画像がレシートでない場合や読み取れない場合は、items を空の配列にしてください。`;

// 利用者に表示してよい読み取りエラー
export class ReceiptError extends Error {}

// API キーは環境変数 ANTHROPIC_API_KEY から自動で読み込まれる
let client;
function getClient() {
  client ??= new Anthropic();
  return client;
}

/**
 * レシート画像を解析して、店名・日付・商品一覧を返す
 * @param {Buffer} buffer 画像データ
 * @param {string} mediaType 画像の MIME タイプ
 */
export async function analyzeReceipt(buffer, mediaType) {
  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: buffer.toString('base64') },
          },
          { type: 'text', text: 'このレシートの内容を読み取ってください。' },
        ],
      },
    ],
    output_config: { format: zodOutputFormat(ReceiptSchema) },
  });

  // 途中で打ち切られた・拒否された場合は結果を使わない
  if (response.stop_reason === 'max_tokens') {
    throw new ReceiptError('レシートの項目が多すぎて読み取りきれませんでした');
  }
  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    throw new ReceiptError('レシートを読み取れませんでした。別の画像でお試しください');
  }

  // 商品が読み取れなかった場合もエラーにせず、利用者が手動で入力できるよう結果を返す
  // （〜Detected が false の項目は、画面で要確認として表示される）
  const receipt = response.parsed_output;

  return {
    storeName: receipt.storeName,
    // 日付が読み取れない・形式が不正な場合は今日の日付を使う
    date: isValidDate(receipt.date) ? receipt.date : today(),
    dateDetected: isValidDate(receipt.date),
    // 想定外のカテゴリが返ってきた場合は「その他」に寄せる
    items: receipt.items.map((item) => ({
      ...item,
      category: CATEGORIES.includes(item.category) ? item.category : 'その他',
      categoryDetected: CATEGORIES.includes(item.category),
    })),
  };
}

// YYYY-MM-DD 形式かつ実在する日付かを判定する
function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

// ローカル時刻での今日の日付（YYYY-MM-DD）
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
