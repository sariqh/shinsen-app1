# OCR精度改善 実装ガイド

## 概要
このドキュメントは、OCR精度改善の実装を担当する開発者向けの詳細なガイドです。ソースコードと併せて使用してください。

## 前提条件

### 必要な知識
- TypeScript/JavaScript
- Next.js
- Canvas API
- Tesseract.js
- 画像処理の基礎知識

### 開発環境
- Node.js 18以上
- npm/yarn/pnpm
- モダンブラウザ（Chrome, Firefox, Safari, Edge）

## ファイル構成

```
packages/web/
├── data/master/warlords-ocr.json          # OCR用武将マスタデータ
├── public/warlords-ocr.json               # 公開用武将マスタデータ
├── src/lib/ocr/
│   ├── index.ts                           # メインOCR処理
│   ├── cardDetector.ts                    # カード検出・ROI抽出
│   ├── imageProcessor.ts                  # 画像前処理
│   ├── tesseractOCR.ts                    # Tesseract.js OCR処理
│   ├── warlordMatcher.ts                  # 武将名照合
│   ├── limitBreakDetector.ts              # 凸数・SP/CO検出
│   └── correctionManager.ts               # 校正管理
├── src/schema/ocr.ts                      # OCR型定義
└── app/(ocr-test)/ocr-test/page.tsx       # OCRテスト画面
```

## 実装手順

### 1. 環境セットアップ

#### 1.1 依存関係のインストール
```bash
cd packages/web
npm install tesseract.js
```

#### 1.2 開発サーバーの起動
```bash
npm run dev
```

#### 1.3 OCRテスト画面へのアクセス
```
http://localhost:3000/ocr-test
```

### 2. 主要コンポーネントの理解

#### 2.1 メインOCR処理 (`src/lib/ocr/index.ts`)
```typescript
export async function processOCR(
  files: File[],
  options: OCRProcessingOptions
): Promise<OCRProcessingResult>
```

**処理フロー**:
1. 画像読み込み・前処理
2. カード検出（見切れチェック付き）
3. ROI抽出（武将名・凸数・SP/COラベル）
4. OCR処理（Tesseract.js）
5. SP/CO判定
6. プレフィックス決定
7. 武将名照合（プレフィックス対応）
8. 凸数検出
9. 結果統合・保存

#### 2.2 画像前処理 (`src/lib/ocr/imageProcessor.ts`)
```typescript
export async function preprocessImage(
  file: File,
  config: ImageProcessingConfig
): Promise<ProcessedImage>
```

**処理内容**:
- 画像読み込み（Canvas API）
- リサイズ（最大1600x2400px）
- グレースケール変換
- コントラスト調整（1.3倍）
- 二値化（閾値0.55）

#### 2.3 カード検出 (`src/lib/ocr/cardDetector.ts`)
```typescript
export async function detectCards(
  imageData: ImageData,
  config: ImageProcessingConfig
): Promise<CardDetectionResult>
```

**検出ロジック**:
- アスペクト比に基づく動的グリッド決定
- 見切れチェック（完全可視性）
- 必要情報チェック（武将名・凸数領域）

#### 2.4 ROI抽出 (`src/lib/ocr/cardDetector.ts`)
```typescript
export function extractWarlordNameRegion(cardImageData: ImageData): ImageData
export function extractLimitBreakRegion(cardImageData: ImageData): ImageData
export function extractSpLabelRegion(cardImageData: ImageData): ImageData
export function extractCoLabelRegion(cardImageData: ImageData): ImageData
```

**抽出領域**:
- 武将名: 82% y, 70% w
- 凸数: 72% y, 60% w
- SPラベル: 78% y, 15% w
- COラベル: 68% y, 20% w

#### 2.5 Tesseract.js OCR (`src/lib/ocr/tesseractOCR.ts`)
```typescript
export async function performOCR(
  imageData: ImageData,
  config: OCRConfig
): Promise<OCRTextResult>
```

**設定内容**:
- 言語: 日本語（jpn）
- ページセグメンテーション: 単一テキストブロック
- 文字ホワイトリスト: 武将名に含まれる文字

#### 2.6 ラベル検出 (`src/lib/ocr/limitBreakDetector.ts`)
```typescript
export function detectSP(imageData: ImageData): SPDetectionResult
export function detectCO(imageData: ImageData): CODetectionResult
```

**SP検出**:
- 赤色検出: 5%以上が赤色、2%以上が明るい赤色
- 判定条件: `r > 180 && g < 80 && b < 80`

**CO検出**:
- 金色検出: 3%以上が金色
- 黄色検出: 5%以上が黄色
- 判定条件: `r > 150 && g > 100 && b < 100 && r > g && g > b`

#### 2.7 武将名照合 (`src/lib/ocr/warlordMatcher.ts`)
```typescript
export function matchWarlordNameWithPrefix(
  ocrText: string,
  warlordMaster: WarlordMaster[],
  detectedPrefix: string | null = null
): WarlordMatchResult
```

**照合順序**:
1. プレフィックス考慮厳格一致
2. プレフィックスなし厳格一致
3. 部分一致（プレフィックス考慮）
4. ファジーマッチ（プレフィックス考慮）

## デバッグ・テスト

### 1. デバッグログの確認

#### 1.1 ブラウザの開発者ツール
- F12キーで開発者ツールを開く
- Consoleタブでログを確認

#### 1.2 主要ログ
```
[カード検出] 画像サイズ: 1200x1800, グリッド: 3列x6行
[カード検出] 5枚の有効なカードを検出しました（見切れ・不完全カードを除外）
[ROI] 武将名領域: x=60, y=246, w=280, h=36
[OCR] 武将名OCR結果: "孫尚香" (信頼度: 85.2%)
[SP検出] 赤色比率: 2.1%, 明るい赤色比率: 0.8%, SP判定: false
[CO検出] 金色比率: 1.2%, 黄色比率: 0.5%, CO判定: false
[OCR] 武将名照合結果: {matchType: "exact", confidence: 1.0}
[OCR] 凸数検出結果: {detectedCount: 0, confidence: 0.8}
```

### 2. テスト手順

#### 2.1 基本テスト
1. OCRテスト画面にアクセス
2. サンプル画像をアップロード
3. OCR処理実行
4. 結果の確認

#### 2.2 精度テスト
1. 正解データとの比較
2. 信頼度の確認
3. 誤検出の分析

#### 2.3 パフォーマンステスト
1. 処理時間の測定
2. メモリ使用量の監視
3. 大量画像でのテスト

## 設定の調整

### 1. 画像前処理パラメータ

#### 1.1 リサイズ設定
```typescript
// packages/web/src/lib/ocr/imageProcessor.ts
const targetWidth = Math.min(imageData.width, 1600);  // 最大幅
const targetHeight = Math.min(imageData.height, 2400); // 最大高さ
```

#### 1.2 コントラスト調整
```typescript
const contrastFactor = 1.3; // コントラスト係数
```

#### 1.3 二値化設定
```typescript
const binarizationThreshold = 0.55; // 二値化閾値
```

### 2. ROI抽出設定

#### 2.1 武将名領域
```typescript
// packages/web/src/lib/ocr/cardDetector.ts
const nameRegion = {
  x: Math.floor(width * 0.15),      // 左端から15%
  y: Math.floor(height * 0.82),     // 上端から82%
  width: Math.floor(width * 0.7),   // 幅70%
  height: Math.floor(height * 0.12) // 高さ12%
};
```

#### 2.2 凸数領域
```typescript
const limitBreakRegion = {
  x: Math.floor(width * 0.2),       // 左端から20%
  y: Math.floor(height * 0.72),     // 上端から72%
  width: Math.floor(width * 0.6),   // 幅60%
  height: Math.floor(height * 0.08) // 高さ8%
};
```

### 3. ラベル検出設定

#### 3.1 SP検出
```typescript
// packages/web/src/lib/ocr/limitBreakDetector.ts
const redRatioThreshold = 0.05;      // 赤色比率5%以上
const brightRedRatioThreshold = 0.02; // 明るい赤色比率2%以上
```

#### 3.2 CO検出
```typescript
const goldRatioThreshold = 0.03;    // 金色比率3%以上
const yellowRatioThreshold = 0.05; // 黄色比率5%以上
```

### 4. 武将名照合設定

#### 4.1 照合閾値
```typescript
// packages/web/src/lib/ocr/warlordMatcher.ts
const partialMatchThreshold = 0.6;  // 部分一致閾値60%
const fuzzyMatchThreshold = 0.3;    // ファジーマッチ閾値30%
```

#### 4.2 プレフィックスボーナス
```typescript
const partialMatchBonus = {
  prefixMatch: 0.2,      // プレフィックス一致時+20%
  noPrefixMatch: 0.1     // プレフィックスなし一致時+10%
};
```

## トラブルシューティング

### 1. よくある問題

#### 1.1 ビルドエラー
```
Type error: Cannot find name 'CODetectionResult'
```
**解決方法**: 型定義のインポートを確認
```typescript
import { CODetectionResult } from '@/src/schema/ocr';
```

#### 1.2 Tesseract.js設定エラー
```
Object literal may only specify known properties, and 'tessedit_pageseg_mode' does not exist
```
**解決方法**: 型キャストを使用
```typescript
...({
  tessedit_pageseg_mode: '6',
  // その他の設定
} as any)
```

#### 1.3 画像読み込みエラー
```
Failed to construct 'ImageData': The input data length is not a multiple of (4 * width)
```
**解決方法**: データ長の確認と修正
```typescript
const newImageData = new ImageData(imageData.data as ImageDataArray, imageData.width, imageData.height);
```

### 2. パフォーマンス問題

#### 2.1 処理時間が長い
- 画像サイズの制限
- 並列処理の最適化
- キャッシュの活用

#### 2.2 メモリ使用量が多い
- ImageDataの適切な管理
- ガベージコレクションの考慮
- メモリリークの防止

### 3. 精度問題

#### 3.1 文字化け
- 文字ホワイトリストの確認
- 画像前処理の調整
- Tesseract.js設定の最適化

#### 3.2 誤検出
- ROI抽出の調整
- 照合閾値の調整
- マスタデータの確認

## 拡張・カスタマイズ

### 1. 新しい武将の追加

#### 1.1 マスタデータの更新
```typescript
// packages/web/data/master/warlords-ocr.json
{
  "warlordId": "w_new_001",
  "name": "新武将",
  "prefix": null,
  "fullName": "新武将",
  "aliases": ["新武将"],
  "camp": 1
}
```

#### 1.2 文字ホワイトリストの更新
```typescript
// packages/web/src/lib/ocr/tesseractOCR.ts
tessedit_char_whitelist: '...新武将...'
```

### 2. 新しいラベルタイプの追加

#### 2.1 型定義の追加
```typescript
// packages/web/src/schema/ocr.ts
export interface NewLabelDetectionResult {
  isNewLabel: boolean;
  confidence: number;
  method: 'color' | 'text' | 'manual';
}
```

#### 2.2 検出ロジックの実装
```typescript
// packages/web/src/lib/ocr/limitBreakDetector.ts
export function detectNewLabel(imageData: ImageData): NewLabelDetectionResult {
  // 検出ロジックの実装
}
```

### 3. 新しい画像形式の対応

#### 3.1 画像読み込みの拡張
```typescript
// packages/web/src/lib/ocr/imageProcessor.ts
export async function loadImageToCanvas(file: File): Promise<CanvasData> {
  // 新しい画像形式の対応
}
```

#### 3.2 前処理の調整
```typescript
export async function preprocessImage(file: File, config: ImageProcessingConfig): Promise<ProcessedImage> {
  // 新しい画像形式に応じた前処理
}
```

## ベストプラクティス

### 1. コード品質

#### 1.1 型安全性
- TypeScriptのstrictモードを使用
- 適切な型定義の実装
- 型チェックの活用

#### 1.2 エラーハンドリング
- try-catch文の適切な使用
- エラーログの出力
- フォールバック処理の実装

#### 1.3 パフォーマンス
- 非同期処理の活用
- メモリ効率の考慮
- キャッシュの活用

### 2. テスト

#### 2.1 単体テスト
- 各関数の個別テスト
- エッジケースの検証
- モックの活用

#### 2.2 統合テスト
- サンプル画像での検証
- 正解データとの比較
- 精度測定

#### 2.3 負荷テスト
- 大量画像の処理
- メモリ使用量の監視
- 処理時間の測定

### 3. ドキュメント

#### 3.1 コメント
- 関数の説明
- パラメータの説明
- 戻り値の説明

#### 3.2 ログ
- デバッグ情報の出力
- エラー情報の出力
- パフォーマンス情報の出力

## まとめ

この実装ガイドに従うことで、OCR精度改善の実装を効率的に進めることができます。不明な点がある場合は、ソースコードと併せて確認してください。

### 次のステップ
1. 環境セットアップ
2. 基本テストの実行
3. 設定の調整
4. 精度の向上
5. 機能の拡張
