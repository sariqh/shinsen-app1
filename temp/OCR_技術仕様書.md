# OCR精度改善 技術仕様書

## システム構成

### アーキテクチャ
```
OCR Processing Pipeline
├── Image Preprocessing
│   ├── Load & Resize (1600x2400px max)
│   ├── Grayscale Conversion
│   ├── Contrast Adjustment (1.3x)
│   └── Binarization (threshold: 0.55)
├── Card Detection
│   ├── Dynamic Grid Detection
│   ├── Visibility Check
│   └── Required Info Validation
├── ROI Extraction
│   ├── Warlord Name Region (82% y, 70% w)
│   ├── Limit Break Region (72% y, 60% w)
│   ├── SP Label Region (78% y, 15% w)
│   └── CO Label Region (68% y, 20% w)
├── OCR Processing
│   ├── Tesseract.js (jpn)
│   ├── Character Whitelist
│   └── Page Segmentation Mode 6
├── Label Detection
│   ├── SP Detection (Red Color Analysis)
│   └── CO Detection (Gold/Yellow Analysis)
├── Warlord Matching
│   ├── Prefix-aware Matching
│   ├── Exact Match
│   ├── Partial Match
│   └── Fuzzy Match
└── Result Integration
    ├── Confidence Calculation
    ├── Data Validation
    └── Output Formatting
```

## 詳細技術仕様

### 1. 画像前処理パイプライン

#### 1.1 画像読み込み
```typescript
// ファイル: packages/web/src/lib/ocr/imageProcessor.ts
export async function loadImageToCanvas(file: File): Promise<CanvasData>
```
- Canvas APIを使用した画像読み込み
- エラーハンドリング付き
- メモリ効率を考慮した実装

#### 1.2 リサイズ処理
```typescript
// 最適化されたリサイズ設定
const targetWidth = Math.min(imageData.width, 1600);
const targetHeight = Math.min(imageData.height, 2400);
```
- 最大解像度: 1600x2400px
- アスペクト比維持
- 品質とパフォーマンスのバランス

#### 1.3 グレースケール変換
```typescript
// RGBA → Grayscale変換
const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
```
- 標準的なRGB重み付け
- 4チャンネルデータの維持

#### 1.4 コントラスト調整
```typescript
// コントラスト係数: 1.3
const adjusted = Math.min(255, Math.max(0, (pixel - 128) * factor + 128));
```
- 線形コントラスト調整
- オーバーフロー/アンダーフロー防止

#### 1.5 二値化
```typescript
// 閾値: 0.55
const binary = pixel > threshold * 255 ? 255 : 0;
```
- 適応的閾値設定
- ノイズ除去効果

### 2. カード検出システム

#### 2.1 動的グリッド検出
```typescript
// アスペクト比に基づくグリッド決定
if (aspectRatio > 1.4) {
  // 横長画像 (3x6, 4x3パターン)
  columns = Math.floor(imageData.width / 200);
  rows = Math.floor(imageData.height / 300);
} else if (aspectRatio < 0.7) {
  // 縦長画像 (2x5, 3x4パターン)
  columns = Math.floor(imageData.width / 180);
  rows = Math.floor(imageData.height / 280);
} else {
  // 正方形画像 (3x3, 4x4パターン)
  columns = Math.floor(imageData.width / 200);
  rows = Math.floor(imageData.height / 300);
}
```

#### 2.2 見切れチェック
```typescript
// 完全可視性チェック
const isFullyVisible = x >= 0 && y >= 0 && 
                       x + cardWidth <= imageData.width && 
                       y + cardHeight <= imageData.height;

// 必要情報チェック
const hasRequiredInfo = 
  warlordNameRegion.x >= 0 && warlordNameRegion.y >= 0 &&
  warlordNameRegion.x + warlordNameRegion.width <= imageData.width &&
  warlordNameRegion.y + warlordNameRegion.height <= imageData.height &&
  limitBreakRegion.x >= 0 && limitBreakRegion.y >= 0 &&
  limitBreakRegion.x + limitBreakRegion.width <= imageData.width &&
  limitBreakRegion.y + limitBreakRegion.height <= imageData.height;
```

### 3. ROI抽出システム

#### 3.1 武将名領域
```typescript
const nameRegion = {
  x: Math.floor(width * 0.15),      // 左端から15%
  y: Math.floor(height * 0.82),     // 上端から82%
  width: Math.floor(width * 0.7),   // 幅70%
  height: Math.floor(height * 0.12) // 高さ12%
};
```

#### 3.2 凸数領域
```typescript
const limitBreakRegion = {
  x: Math.floor(width * 0.2),       // 左端から20%
  y: Math.floor(height * 0.72),     // 上端から72%
  width: Math.floor(width * 0.6),   // 幅60%
  height: Math.floor(height * 0.08) // 高さ8%
};
```

#### 3.3 SPラベル領域
```typescript
const spRegion = {
  x: Math.floor(width * 0.05),      // 左端から5%
  y: Math.floor(height * 0.78),    // 上端から78%
  width: Math.floor(width * 0.15), // 幅15%
  height: Math.floor(height * 0.08) // 高さ8%
};
```

#### 3.4 COラベル領域
```typescript
const coRegion = {
  x: Math.floor(width * 0.05),      // 左端から5%
  y: Math.floor(height * 0.68),    // 上端から68%（SPより上）
  width: Math.floor(width * 0.2),  // 幅20%（SPより広い）
  height: Math.floor(height * 0.08) // 高さ8%
};
```

### 4. Tesseract.js設定

#### 4.1 基本設定
```typescript
const config = {
  language: 'jpn',
  tessedit_pageseg_mode: '6',        // 単一テキストブロック
  tessedit_ocr_engine_mode: '3',     // デフォルトエンジン
  preserve_interword_spaces: '1',    // 単語間スペース保持
  tessedit_char_whitelist: '...'     // 文字ホワイトリスト
};
```

#### 4.2 文字ホワイトリスト
```
一二三四五六七八九十百千万億兆京垓秭穣溝澗正載極恒河沙阿僧祇那由他不可思議無量大数
孫尚香張紘于吉呂布龐德許褚程昱荀攸典韋王異曹操郭嘉司馬懿周瑜甘寧孫堅黄蓋程普孫策陸遜呂蒙孫権太史慈馬忠陸抗凌統魯粛周泰諸葛恪馬超陳到黄忠趙雲王平徐庶劉備張飛黄月英諸葛亮関羽法正魏延馬雲騄龐統張氏伊籍厳顔関銀屏関興張苞姜維孟獲于吉董卓田豊呂玲綺祝融兀突骨公孫瓚袁紹張角李儒高順馬騰文醜華雄顔良華佗左慈貂蝉蔡琰許攸袁術高覧陳宮張譲木鹿大王沮授董白朶思大王鄒氏麹義皇甫嵩張宝SP
```

### 5. ラベル検出システム

#### 5.1 SP検出アルゴリズム
```typescript
// 赤色検出
if (r > 180 && g < 80 && b < 80) {
  redPixelCount++;
  // 明るい赤色
  if (r > 200 && g < 50 && b < 50) {
    brightRedPixelCount++;
  }
}

// 判定条件
const isSP = redRatio > 0.05 && brightRedRatio > 0.02;
```

#### 5.2 CO検出アルゴリズム
```typescript
// 金色検出
if (r > 150 && g > 100 && b < 100 && r > g && g > b) {
  goldPixelCount++;
}

// 黄色検出
if (r > 180 && g > 180 && b < 100) {
  yellowPixelCount++;
}

// 判定条件
const isCO = goldRatio > 0.03 || yellowRatio > 0.05;
```

### 6. 武将名照合システム

#### 6.1 プレフィックス対応照合
```typescript
export function matchWarlordNameWithPrefix(
  ocrText: string,
  warlordMaster: WarlordMaster[],
  detectedPrefix: string | null = null
): WarlordMatchResult
```

#### 6.2 照合順序
1. **プレフィックス考慮厳格一致**
   - `w.fullName === prefixedName`
   - `w.prefix === detectedPrefix && w.name === normalizedText`

2. **プレフィックスなし厳格一致**
   - `w.name === normalizedText && !w.prefix`

3. **部分一致（プレフィックス考慮）**
   - 類似度計算 + プレフィックスボーナス

4. **ファジーマッチ（プレフィックス考慮）**
   - レーベンシュタイン距離 + プレフィックスボーナス

#### 6.3 ボーナスシステム
```typescript
// プレフィックス一致ボーナス
let prefixBonus = 0;
if (detectedPrefix && warlord.prefix === detectedPrefix) {
  prefixBonus = 0.2; // 部分一致
  prefixBonus = 0.15; // ファジーマッチ
} else if (!detectedPrefix && !warlord.prefix) {
  prefixBonus = 0.1; // 部分一致
  prefixBonus = 0.05; // ファジーマッチ
}
```

### 7. 凸数検出システム

#### 7.1 色ベース検出
```typescript
// 青色検出（凸数表示）
if (h >= 200 && h <= 260 && s >= 0.5 && v >= 0.3) {
  bluePixelCount++;
}

// 赤色検出（凸数表示）
if ((h >= 0 && h <= 20) || (h >= 340 && h <= 360)) {
  redPixelCount++;
}
```

#### 7.2 形状ベース検出
```typescript
// 連結成分分析
const components = findConnectedComponents(imageData);
const count = components.filter(comp => 
  comp.size >= minSize && comp.size <= maxSize
).length;
```

### 8. データ構造

#### 8.1 武将マスタデータ
```typescript
interface WarlordMaster {
  warlordId: string;        // 武将ID
  name: string;            // 基本名
  prefix?: string | null; // プレフィックス
  fullName?: string;      // 完全名
  aliases?: string[];     // 異表記
  camp?: number;          // 陣営
}
```

#### 8.2 OCR結果
```typescript
interface OCRResult {
  warlordName: string;     // 武将名
  copies: number;         // 所持枚数
  limitBreak: number;     // 凸数
  isSP: boolean;          // SP判定
  confidence: number;      // 信頼度
  boundingBox: {          // 境界ボックス
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

### 9. エラーハンドリング

#### 9.1 例外処理
```typescript
try {
  // OCR処理
} catch (error) {
  console.error(`カード ${card.id} の処理中にエラー:`, error);
  // エラー時はスキップして継続
}
```

#### 9.2 フォールバック
```typescript
// 検出失敗時のデフォルト値
return {
  isSP: false,
  confidence: 0,
  method: 'manual'
};
```

### 10. パフォーマンス最適化

#### 10.1 並列処理
- カード単位での並列処理
- 非同期処理の活用

#### 10.2 メモリ管理
- ImageDataの適切な管理
- ガベージコレクションの考慮

#### 10.3 キャッシュ
- Tesseract.jsの言語パックキャッシュ
- 画像データの一時キャッシュ

## デバッグ・ログシステム

### ログレベル
- `[カード検出]`: カード検出の詳細情報
- `[ROI]`: ROI抽出の座標情報
- `[OCR]`: OCR処理の結果
- `[SP検出]`: SPラベル検出の詳細
- `[CO検出]`: COラベル検出の詳細
- `[Tesseract]`: Tesseract.jsの進捗

### ログ例
```
[カード検出] 画像サイズ: 1200x1800, グリッド: 3列x6行
[カード検出] カードサイズ: 400x300
[カード検出] 5枚の有効なカードを検出しました（見切れ・不完全カードを除外）
[ROI] 武将名領域: x=60, y=246, w=280, h=36
[ROI] 凸数領域: x=80, y=216, w=240, h=24
[ROI] SPラベル領域: x=20, y=234, w=60, h=24
[OCR] 武将名OCR結果: "孫尚香" (信頼度: 85.2%)
[SP検出] 赤色比率: 2.1%, 明るい赤色比率: 0.8%, SP判定: false
[CO検出] 金色比率: 1.2%, 黄色比率: 0.5%, CO判定: false
[OCR] 武将名照合結果: {matchType: "exact", confidence: 1.0}
[OCR] 凸数検出結果: {detectedCount: 0, confidence: 0.8}
```

## テスト・検証

### 単体テスト
- 各関数の個別テスト
- エッジケースの検証
- パフォーマンステスト

### 統合テスト
- サンプル画像での検証
- 正解データとの比較
- 精度測定

### 負荷テスト
- 大量画像の処理
- メモリ使用量の監視
- 処理時間の測定

## 今後の拡張性

### 1. 機械学習統合
- CNNベースのカード検出
- 文字認識の精度向上
- 自動学習システム

### 2. リアルタイム処理
- WebRTC統合
- ストリーミング処理
- 低遅延最適化

### 3. 多言語対応
- 英語OCR対応
- 中国語OCR対応
- 動的言語切り替え

### 4. クラウド統合
- サーバーサイド処理
- 分散処理
- スケーラビリティ
