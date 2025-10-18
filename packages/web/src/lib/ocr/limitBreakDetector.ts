import type { ImageData } from './imageProcessor';
import { LimitBreakDetectionResult, SPDetectionResult, CODetectionResult } from '@/src/schema/ocr';

/**
 * HSV色空間への変換
 */
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return { h, s, v };
}

/**
 * 色範囲の判定
 */
function isColorInRange(hsv: { h: number; s: number; v: number }, range: {
  hMin: number; hMax: number;
  sMin: number; sMax: number;
  vMin: number; vMax: number;
}): boolean {
  return (
    hsv.h >= range.hMin && hsv.h <= range.hMax &&
    hsv.s >= range.sMin && hsv.s <= range.sMax &&
    hsv.v >= range.vMin && hsv.v <= range.vMax
  );
}

/**
 * 凸数の色検出
 */
function detectLimitBreakByColor(imageData: ImageData): LimitBreakDetectionResult {
  const { width, height, data } = imageData;
  
  // 凸数の色範囲（黄色系）
  const yellowRange = {
    hMin: 40, hMax: 80,   // 黄色の色相範囲
    sMin: 0.3, sMax: 1.0, // 彩度範囲
    vMin: 0.5, vMax: 1.0, // 明度範囲
  };
  
  let yellowPixelCount = 0;
  let totalPixels = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const hsv = rgbToHsv(r, g, b);
    
    if (isColorInRange(hsv, yellowRange)) {
      yellowPixelCount++;
    }
    totalPixels++;
  }
  
  const yellowRatio = yellowPixelCount / totalPixels;
  
  // 黄色の割合から凸数を推定
  let detectedCount = 0;
  let confidence = 0;
  
  if (yellowRatio > 0.1) {
    // 黄色の割合から凸数を推定（簡易的な計算）
    detectedCount = Math.min(5, Math.round(yellowRatio * 20));
    confidence = Math.min(0.9, yellowRatio * 5);
  }
  
  return {
    detectedCount,
    confidence,
    method: 'color_detection',
  };
}

/**
 * 形状ベースの凸数検出
 */
function detectLimitBreakByShape(imageData: ImageData): LimitBreakDetectionResult {
  const { width, height, data } = imageData;
  
  // 二値化して形状を検出
  const binaryData = new Uint8ClampedArray(width * height);
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    binaryData[i / 4] = gray > 128 ? 255 : 0;
  }
  
  // 連結成分を検出して形状をカウント
  const visited = new Array(width * height).fill(false);
  const shapes: Array<{ area: number; centerX: number; centerY: number }> = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (!visited[idx] && binaryData[idx] > 128) {
        const shape = floodFillShape(binaryData, width, height, x, y, visited);
        
        // 適切なサイズの形状のみをカウント
        if (shape.area > 10 && shape.area < 200) {
          shapes.push(shape);
        }
      }
    }
  }
  
  // 形状の数から凸数を推定
  const detectedCount = Math.min(5, shapes.length);
  const confidence = Math.min(0.8, shapes.length / 5);
  
  return {
    detectedCount,
    confidence,
    method: 'shape_detection',
  };
}

/**
 * フラッドフィルで形状を検出
 */
function floodFillShape(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  startX: number,
  startY: number,
  visited: boolean[]
): { area: number; centerX: number; centerY: number } {
  const stack = [{ x: startX, y: startY }];
  const pixels: Array<{ x: number; y: number }> = [];
  
  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const idx = y * width + x;
    
    if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || data[idx] <= 128) {
      continue;
    }
    
    visited[idx] = true;
    pixels.push({ x, y });
    
    // 4方向に探索
    stack.push({ x: x + 1, y });
    stack.push({ x: x - 1, y });
    stack.push({ x, y: y + 1 });
    stack.push({ x, y: y - 1 });
  }
  
  // 重心を計算
  const centerX = pixels.reduce((sum, p) => sum + p.x, 0) / pixels.length;
  const centerY = pixels.reduce((sum, p) => sum + p.y, 0) / pixels.length;
  
  return {
    area: pixels.length,
    centerX,
    centerY,
  };
}

/**
 * SPマークの色検出
 */
function detectSPByColor(imageData: ImageData): SPDetectionResult {
  const { width, height, data } = imageData;
  
  // SPマークの色範囲（赤色系）
  const redRange = {
    hMin: 0, hMax: 20,    // 赤色の色相範囲
    sMin: 0.5, sMax: 1.0, // 彩度範囲
    vMin: 0.5, vMax: 1.0, // 明度範囲
  };
  
  let redPixelCount = 0;
  let totalPixels = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const hsv = rgbToHsv(r, g, b);
    
    if (isColorInRange(hsv, redRange)) {
      redPixelCount++;
    }
    totalPixels++;
  }
  
  const redRatio = redPixelCount / totalPixels;
  const isSP = redRatio > 0.05; // 5%以上が赤色ならSPと判定
  const confidence = Math.min(0.9, redRatio * 10);
  
  return {
    isSP,
    confidence,
    detectedMark: isSP ? 'red_mark' : undefined,
    method: 'color_detection',
  };
}

/**
 * SPマークのテキスト検出
 */
function detectSPByText(imageData: ImageData): SPDetectionResult {
  // この関数は実際のOCR処理と組み合わせて使用
  // ここでは簡易的な実装
  
  const { width, height, data } = imageData;
  
  // 画像の上部領域をチェック（SPマークが表示される位置）
  const topRegionHeight = Math.floor(height * 0.2);
  let brightPixelCount = 0;
  let totalPixels = 0;
  
  for (let y = 0; y < topRegionHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
      
      if (gray > 200) { // 明るいピクセル
        brightPixelCount++;
      }
      totalPixels++;
    }
  }
  
  const brightRatio = brightPixelCount / totalPixels;
  const isSP = brightRatio > 0.1; // 上部に明るい領域があればSPと判定
  const confidence = Math.min(0.7, brightRatio * 5);
  
  return {
    isSP,
    confidence,
    detectedMark: isSP ? 'bright_region' : undefined,
    method: 'text_detection',
  };
}

/**
 * 凸数検出のメイン関数
 */
export function detectLimitBreak(imageData: ImageData): LimitBreakDetectionResult {
  try {
    // 色検出と形状検出の両方を試行
    const colorResult = detectLimitBreakByColor(imageData);
    const shapeResult = detectLimitBreakByShape(imageData);
    
    // より信頼度の高い結果を選択
    if (colorResult.confidence > shapeResult.confidence) {
      return colorResult;
    } else {
      return shapeResult;
    }
  } catch (error) {
    // エラー時はデフォルト値を返す
    return {
      detectedCount: 0,
      confidence: 0,
      method: 'manual',
    };
  }
}

/**
 * SP判定のメイン関数
 */
export function detectSP(imageData: ImageData): SPDetectionResult {
  try {
    // 色検出とテキスト検出の両方を試行
    const colorResult = detectSPByColor(imageData);
    const textResult = detectSPByText(imageData);
    
    // より信頼度の高い結果を選択
    if (colorResult.confidence > textResult.confidence) {
      return colorResult;
    } else {
      return textResult;
    }
  } catch (error) {
    // エラー時はデフォルト値を返す
    return {
      isSP: false,
      confidence: 0,
      method: 'manual',
    };
  }
}

/**
 * COラベル検出（色ベース）
 */
function detectCOByColor(imageData: ImageData): CODetectionResult {
  try {
    const { width, height, data } = imageData;
    
    // COラベル（無双）は金色や黄色で表示されることが多い
    let goldPixelCount = 0;
    let yellowPixelCount = 0;
    let totalPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 金色の判定（R > G > B のパターン）
      if (r > 150 && g > 100 && b < 100 && r > g && g > b) {
        goldPixelCount++;
      }
      
      // 黄色の判定
      if (r > 180 && g > 180 && b < 100) {
        yellowPixelCount++;
      }
      
      totalPixels++;
    }
    
    const goldRatio = goldPixelCount / totalPixels;
    const yellowRatio = yellowPixelCount / totalPixels;
    
    // COラベルの判定条件
    const isCO = goldRatio > 0.03 || yellowRatio > 0.05; // 金色3%以上、または黄色5%以上
    
    console.log(`[CO検出] 金色比率: ${(goldRatio * 100).toFixed(1)}%, 黄色比率: ${(yellowRatio * 100).toFixed(1)}%, CO判定: ${isCO}`);
    
    return {
      isCO,
      confidence: Math.min((goldRatio + yellowRatio) * 3, 1.0), // 信頼度を調整
      method: 'color',
    };
  } catch (error) {
    console.error('COラベル色検出エラー:', error);
    return {
      isCO: false,
      confidence: 0,
      method: 'color',
    };
  }
}

/**
 * COラベル検出（テキストベース）
 */
function detectCOByText(imageData: ImageData): CODetectionResult {
  try {
    // テキスト検出は将来的にTesseract.jsで「無双」を認識する予定
    // 現在は色検出のみ実装
    return {
      isCO: false,
      confidence: 0,
      method: 'text',
    };
  } catch (error) {
    console.error('COラベルテキスト検出エラー:', error);
    return {
      isCO: false,
      confidence: 0,
      method: 'text',
    };
  }
}

/**
 * CO判定のメイン関数
 */
export function detectCO(imageData: ImageData): CODetectionResult {
  try {
    // 色検出とテキスト検出の両方を試行
    const colorResult = detectCOByColor(imageData);
    const textResult = detectCOByText(imageData);
    
    // より信頼度の高い結果を選択
    if (colorResult.confidence > textResult.confidence) {
      return colorResult;
    } else {
      return textResult;
    }
  } catch (error) {
    // エラー時はデフォルト値を返す
    return {
      isCO: false,
      confidence: 0,
      method: 'manual',
    };
  }
}

/**
 * 凸数から所持枚数を計算
 */
export function calculateCopiesFromLimitBreak(limitBreak: number): number {
  // 凸数 = min(5, max(0, copies - 1))
  // 逆算: copies = limitBreak + 1
  return Math.max(1, limitBreak + 1);
}

/**
 * 所持枚数から凸数を計算
 */
export function calculateLimitBreakFromCopies(copies: number): number {
  // 凸数 = min(5, max(0, copies - 1))
  return Math.min(5, Math.max(0, copies - 1));
}

/**
 * 検出結果のデバッグ情報を生成
 */
export function generateDetectionDebugInfo(
  limitBreakResult: LimitBreakDetectionResult,
  spResult: SPDetectionResult
): string {
  return `
検出結果:
- 凸数: ${limitBreakResult.detectedCount} (信頼度: ${(limitBreakResult.confidence * 100).toFixed(1)}%, 方法: ${limitBreakResult.method})
- SP判定: ${spResult.isSP ? 'SP' : '通常'} (信頼度: ${(spResult.confidence * 100).toFixed(1)}%, 方法: ${spResult.method})
- 推定所持枚数: ${calculateCopiesFromLimitBreak(limitBreakResult.detectedCount)}
  `.trim();
}
