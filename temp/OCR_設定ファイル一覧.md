# OCR精度改善 設定ファイル一覧

## 1. 武将マスタデータ

### ファイル: `packages/web/data/master/warlords-ocr.json`
### ファイル: `packages/web/public/warlords-ocr.json`

**用途**: OCR用の武将マスタデータ
**形式**: JSON配列
**レコード数**: 72武将

**サンプルデータ**:
```json
[
  {
    "warlordId": "w_001",
    "name": "孫尚香",
    "prefix": null,
    "fullName": "孫尚香",
    "aliases": ["孫尚香"],
    "camp": 2
  },
  {
    "warlordId": "w_sp_001",
    "name": "龐徳",
    "prefix": "SP",
    "fullName": "SP龐徳",
    "aliases": ["龐徳", "庞德"],
    "camp": 1
  },
  {
    "warlordId": "w_co_001",
    "name": "甄姫",
    "prefix": "CO",
    "fullName": "CO甄姫",
    "aliases": ["甄姫"],
    "camp": 1
  }
]
```

**フィールド説明**:
- `warlordId`: 武将の一意ID
- `name`: 基本武将名（プレフィックスなし）
- `prefix`: プレフィックス（"SP", "CO", null）
- `fullName`: 完全武将名（プレフィックス付き）
- `aliases`: 異表記・別名の配列
- `camp`: 陣営（1:魏, 2:呉, 3:蜀, 4:群）

## 2. OCR設定

### ファイル: `packages/web/src/lib/ocr/tesseractOCR.ts`

**Tesseract.js設定**:
```typescript
const ocrConfig = {
  language: 'jpn',
  tessedit_pageseg_mode: '6',        // 単一テキストブロック
  tessedit_ocr_engine_mode: '3',     // デフォルトエンジン
  preserve_interword_spaces: '1',    // 単語間スペース保持
  tessedit_char_whitelist: '一二三四五六七八九十百千万億兆京垓秭穣溝澗正載極恒河沙阿僧祇那由他不可思議無量大数孫尚香張紘于吉呂布龐德許褚程昱荀攸典韋王異曹操郭嘉司馬懿周瑜甘寧孫堅黄蓋程普孫策陸遜呂蒙孫権太史慈馬忠陸抗凌統魯粛周泰諸葛恪馬超陳到黄忠趙雲王平徐庶劉備張飛黄月英諸葛亮関羽法正魏延馬雲騄龐統張氏伊籍厳顔関銀屏関興張苞姜維孟獲于吉董卓田豊呂玲綺祝融兀突骨公孫瓚袁紹張角李儒高順馬騰文醜華雄顔良華佗左慈貂蝉蔡琰許攸袁術高覧陳宮張譲木鹿大王沮授董白朶思大王鄒氏麹義皇甫嵩張宝SP'
};
```

## 3. 画像前処理設定

### ファイル: `packages/web/src/lib/ocr/imageProcessor.ts`

**リサイズ設定**:
```typescript
const targetWidth = Math.min(imageData.width, 1600);  // 最大幅1600px
const targetHeight = Math.min(imageData.height, 2400); // 最大高さ2400px
```

**コントラスト調整**:
```typescript
const contrastFactor = 1.3; // コントラスト係数
```

**二値化設定**:
```typescript
const binarizationThreshold = 0.55; // 二値化閾値
```

## 4. カード検出設定

### ファイル: `packages/web/src/lib/ocr/cardDetector.ts`

**グリッド検出設定**:
```typescript
// アスペクト比によるグリッド決定
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

// 最小・最大値の制限
columns = Math.max(2, Math.min(6, columns));
rows = Math.max(2, Math.min(8, rows));
```

**パディング設定**:
```typescript
const paddingX = Math.floor(cardWidth * 0.02); // 横パディング2%
const paddingY = Math.floor(cardHeight * 0.02); // 縦パディング2%
```

## 5. ROI抽出設定

### ファイル: `packages/web/src/lib/ocr/cardDetector.ts`

**武将名領域**:
```typescript
const nameRegion = {
  x: Math.floor(width * 0.15),      // 左端から15%
  y: Math.floor(height * 0.82),     // 上端から82%
  width: Math.floor(width * 0.7),   // 幅70%
  height: Math.floor(height * 0.12) // 高さ12%
};
```

**凸数領域**:
```typescript
const limitBreakRegion = {
  x: Math.floor(width * 0.2),       // 左端から20%
  y: Math.floor(height * 0.72),     // 上端から72%
  width: Math.floor(width * 0.6),   // 幅60%
  height: Math.floor(height * 0.08) // 高さ8%
};
```

**SPラベル領域**:
```typescript
const spRegion = {
  x: Math.floor(width * 0.05),      // 左端から5%
  y: Math.floor(height * 0.78),    // 上端から78%
  width: Math.floor(width * 0.15), // 幅15%
  height: Math.floor(height * 0.08) // 高さ8%
};
```

**COラベル領域**:
```typescript
const coRegion = {
  x: Math.floor(width * 0.05),      // 左端から5%
  y: Math.floor(height * 0.68),    // 上端から68%（SPより上）
  width: Math.floor(width * 0.2),  // 幅20%（SPより広い）
  height: Math.floor(height * 0.08) // 高さ8%
};
```

## 6. ラベル検出設定

### ファイル: `packages/web/src/lib/ocr/limitBreakDetector.ts`

**SP検出設定**:
```typescript
// 赤色判定条件
const redCondition = r > 180 && g < 80 && b < 80;
const brightRedCondition = r > 200 && g < 50 && b < 50;

// SP判定閾値
const redRatioThreshold = 0.05;      // 赤色比率5%以上
const brightRedRatioThreshold = 0.02; // 明るい赤色比率2%以上
```

**CO検出設定**:
```typescript
// 金色判定条件
const goldCondition = r > 150 && g > 100 && b < 100 && r > g && g > b;

// 黄色判定条件
const yellowCondition = r > 180 && g > 180 && b < 100;

// CO判定閾値
const goldRatioThreshold = 0.03;    // 金色比率3%以上
const yellowRatioThreshold = 0.05; // 黄色比率5%以上
```

## 7. 武将名照合設定

### ファイル: `packages/web/src/lib/ocr/warlordMatcher.ts`

**照合閾値**:
```typescript
const partialMatchThreshold = 0.6;  // 部分一致閾値60%
const fuzzyMatchThreshold = 0.3;    // ファジーマッチ閾値30%
```

**プレフィックスボーナス**:
```typescript
// 部分一致時のボーナス
const partialMatchBonus = {
  prefixMatch: 0.2,      // プレフィックス一致時+20%
  noPrefixMatch: 0.1     // プレフィックスなし一致時+10%
};

// ファジーマッチ時のボーナス
const fuzzyMatchBonus = {
  prefixMatch: 0.15,     // プレフィックス一致時+15%
  noPrefixMatch: 0.05    // プレフィックスなし一致時+5%
};
```

## 8. 凸数検出設定

### ファイル: `packages/web/src/lib/ocr/limitBreakDetector.ts`

**色検出設定**:
```typescript
// HSV色空間での色判定
const blueHueRange = { min: 200, max: 260 };
const blueSaturationMin = 0.5;
const blueValueMin = 0.3;

const redHueRange1 = { min: 0, max: 20 };
const redHueRange2 = { min: 340, max: 360 };
```

**形状検出設定**:
```typescript
const minComponentSize = 10;  // 最小連結成分サイズ
const maxComponentSize = 100; // 最大連結成分サイズ
```

## 9. デフォルト設定

### ファイル: `packages/web/src/schema/ocr.ts`

**画像処理設定**:
```typescript
export const DEFAULT_IMAGE_PROCESSING_CONFIG: ImageProcessingConfig = {
  minCardWidth: 80,
  minCardHeight: 120,
  maxCardsPerRow: 3,
  maxCardsPerColumn: 10,
  cardSpacingThreshold: 10,
};
```

**OCR設定**:
```typescript
export const DEFAULT_OCR_CONFIG: OCRConfig = {
  language: "jpn",
};
```

## 10. 環境設定

### ファイル: `packages/web/package.json`

**依存関係**:
```json
{
  "dependencies": {
    "tesseract.js": "^4.1.1",
    "next": "^14.2.5",
    "react": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
```

### ファイル: `packages/web/tsconfig.json`

**TypeScript設定**:
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/schema/*": ["./src/schema/*"]
    }
  }
}
```

## 11. ビルド設定

### ファイル: `packages/web/next.config.js`

**Next.js設定**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

module.exports = nextConfig;
```

## 12. テスト設定

### ファイル: `packages/web/app/(ocr-test)/ocr-test/page.tsx`

**テスト用設定**:
```typescript
// 武将マスタデータ読み込み
const resp = await fetch('/warlords-ocr.json');
const warlords = await resp.json();
const warlordMaster = warlords.map(w => ({ 
  warlordId: w.warlordId, 
  name: w.name, 
  prefix: w.prefix,
  fullName: w.fullName,
  aliases: w.aliases,
  camp: w.camp
}));
```

## 設定変更時の注意事項

### 1. パフォーマンス影響
- 画像サイズ上限の変更は処理時間に大きく影響
- 文字ホワイトリストの長さはOCR精度に影響
- ROI領域の調整は検出精度に直接影響

### 2. 精度への影響
- 色検出の閾値は環境光に依存
- プレフィックスボーナスは照合精度に影響
- 二値化閾値は画像品質に依存

### 3. 互換性
- Tesseract.jsのバージョン互換性
- ブラウザのCanvas API対応
- モバイルデバイスでの動作確認

### 4. メンテナンス
- 武将マスタデータの更新頻度
- 設定値の最適化
- ログ出力レベルの調整
