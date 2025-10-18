import type { ImageData } from "./imageProcessor";
import { CardDetectionResult, ImageProcessingConfig } from "@/src/schema/ocr";

export interface Card {
  id: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export interface GridLayout {
  rows: number;
  columns: number;
  cardWidth: number;
  cardHeight: number;
}

/**
 * エッジ検出（簡易版Sobel演算子）
 */
function detectEdges(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  const edgeData = new Uint8ClampedArray(width * height);
  
  // Sobel演算子のカーネル
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      
      // 3x3カーネルを適用
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
          
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          gx += gray * sobelX[kernelIdx];
          gy += gray * sobelY[kernelIdx];
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edgeData[y * width + x] = Math.min(255, magnitude);
    }
  }
  
  return {
    width,
    height,
    data: edgeData,
  };
}

/**
 * 連結成分分析による矩形検出
 */
function findRectangles(imageData: ImageData, minArea: number = 1000): Card[] {
  const { width, height, data } = imageData;
  const visited = new Array(width * height).fill(false);
  const cards: Card[] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (!visited[idx] && data[idx] > 128) {
        // 連結成分を探索
        const component = floodFill(imageData, x, y, visited);
        
        if (component.area >= minArea) {
          cards.push({
            id: `card_${cards.length}`,
            boundingBox: {
              x: component.minX,
              y: component.minY,
              width: component.maxX - component.minX,
              height: component.maxY - component.minY,
            },
            confidence: Math.min(1.0, component.area / (width * height * 0.1)),
          });
        }
      }
    }
  }
  
  return cards;
}

/**
 * フラッドフィルアルゴリズム
 */
function floodFill(imageData: ImageData, startX: number, startY: number, visited: boolean[]): {
  area: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const { width, height, data } = imageData;
  const stack = [{ x: startX, y: startY }];
  const component = {
    area: 0,
    minX: startX,
    minY: startY,
    maxX: startX,
    maxY: startY,
  };
  
  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const idx = y * width + x;
    
    if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || data[idx] <= 128) {
      continue;
    }
    
    visited[idx] = true;
    component.area++;
    
    // 境界を更新
    component.minX = Math.min(component.minX, x);
    component.minY = Math.min(component.minY, y);
    component.maxX = Math.max(component.maxX, x);
    component.maxY = Math.max(component.maxY, y);
    
    // 4方向に探索
    stack.push({ x: x + 1, y });
    stack.push({ x: x - 1, y });
    stack.push({ x, y: y + 1 });
    stack.push({ x, y: y - 1 });
  }
  
  return component;
}

/**
 * グリッドレイアウトの検出
 */
function detectGridLayout(cards: Card[], config: ImageProcessingConfig): GridLayout {
  if (cards.length === 0) {
    return { rows: 0, columns: 0, cardWidth: 0, cardHeight: 0 };
  }
  
  // カードを位置でソート
  const sortedCards = [...cards].sort((a, b) => {
    if (Math.abs(a.boundingBox.y - b.boundingBox.y) < config.cardSpacingThreshold) {
      return a.boundingBox.x - b.boundingBox.x; // 同じ行ならx座標でソート
    }
    return a.boundingBox.y - b.boundingBox.y; // 行でソート
  });
  
  // 行と列を検出
  const rows: Card[][] = [];
  let currentRow: Card[] = [];
  let lastY = sortedCards[0].boundingBox.y;
  
  for (const card of sortedCards) {
    if (Math.abs(card.boundingBox.y - lastY) > config.cardSpacingThreshold) {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [card];
      lastY = card.boundingBox.y;
    } else {
      currentRow.push(card);
    }
  }
  
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }
  
  // 平均的なカードサイズを計算
  const totalWidth = cards.reduce((sum, card) => sum + card.boundingBox.width, 0);
  const totalHeight = cards.reduce((sum, card) => sum + card.boundingBox.height, 0);
  
  const avgCardWidth = totalWidth / cards.length;
  const avgCardHeight = totalHeight / cards.length;
  
  return {
    rows: rows.length,
    columns: Math.max(...rows.map(row => row.length)),
    cardWidth: avgCardWidth,
    cardHeight: avgCardHeight,
  };
}

/**
 * カードの重複を除去
 */
function removeOverlappingCards(cards: Card[], overlapThreshold: number = 0.5): Card[] {
  const filteredCards: Card[] = [];
  
  for (const card of cards) {
    let isOverlapping = false;
    
    for (const existingCard of filteredCards) {
      const overlap = calculateOverlap(card.boundingBox, existingCard.boundingBox);
      
      if (overlap > overlapThreshold) {
        // より信頼度の高いカードを保持
        if (card.confidence > existingCard.confidence) {
          const index = filteredCards.indexOf(existingCard);
          filteredCards[index] = card;
        }
        isOverlapping = true;
        break;
      }
    }
    
    if (!isOverlapping) {
      filteredCards.push(card);
    }
  }
  
  return filteredCards;
}

/**
 * 矩形の重複率を計算
 */
function calculateOverlap(rect1: Card['boundingBox'], rect2: Card['boundingBox']): number {
  const x1 = Math.max(rect1.x, rect2.x);
  const y1 = Math.max(rect1.y, rect2.y);
  const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
  const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);
  
  if (x2 <= x1 || y2 <= y1) {
    return 0;
  }
  
  const intersectionArea = (x2 - x1) * (y2 - y1);
  const unionArea = rect1.width * rect1.height + rect2.width * rect2.height - intersectionArea;
  
  return intersectionArea / unionArea;
}

/**
 * カード検出のメイン関数
 */
export async function detectCards(
  imageData: ImageData,
  config: ImageProcessingConfig
): Promise<CardDetectionResult> {
  try {
    const cards: Card[] = [];
    
    // 画像サイズに基づいてグリッドを動的に決定（サンプル画像の分析結果を基に改善）
    const aspectRatio = imageData.width / imageData.height;
    let columns = 3;
    let rows = 3;
    
    // サンプル画像の分析結果に基づく調整
    if (aspectRatio > 1.4) {
      // 横長の画像（3x6, 4x3パターン）
      columns = Math.floor(imageData.width / 200); // カード幅約200px想定
      rows = Math.floor(imageData.height / 300);   // カード高さ約300px想定
    } else if (aspectRatio < 0.7) {
      // 縦長の画像（2x5, 3x4パターン）
      columns = Math.floor(imageData.width / 180);
      rows = Math.floor(imageData.height / 280);
    } else {
      // 正方形に近い画像（3x3, 4x4パターン）
      columns = Math.floor(imageData.width / 200);
      rows = Math.floor(imageData.height / 300);
    }
    
    // 最小・最大値の制限
    columns = Math.max(2, Math.min(6, columns));
    rows = Math.max(2, Math.min(8, rows));
    
    const cardWidth = Math.floor(imageData.width / columns);
    const cardHeight = Math.floor(imageData.height / rows);
    const paddingX = Math.floor(cardWidth * 0.02); // パディングを小さく調整
    const paddingY = Math.floor(cardHeight * 0.02);
    
    console.log(`[カード検出] 画像サイズ: ${imageData.width}x${imageData.height}, グリッド: ${columns}列x${rows}行`);
    console.log(`[カード検出] カードサイズ: ${cardWidth}x${cardHeight}`);
    
    // グリッド状にカードを配置し、見切れチェックを追加
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = paddingX + col * (cardWidth + paddingX);
        const y = paddingY + row * (cardHeight + paddingY);
        
        // 見切れチェック：カードが画像境界内に完全に収まっているか
        const isFullyVisible = x >= 0 && y >= 0 && 
                               x + cardWidth <= imageData.width && 
                               y + cardHeight <= imageData.height;
        
        if (isFullyVisible) {
          // さらに、武将名と凸数領域が含まれているかチェック
          const warlordNameRegion = {
            x: x + Math.floor(cardWidth * 0.1),
            y: y + Math.floor(cardHeight * 0.8),
            width: Math.floor(cardWidth * 0.8),
            height: Math.floor(cardHeight * 0.15)
          };
          
          const limitBreakRegion = {
            x: x + Math.floor(cardWidth * 0.1),
            y: y + Math.floor(cardHeight * 0.7),
            width: Math.floor(cardWidth * 0.8),
            height: Math.floor(cardHeight * 0.1)
          };
          
          // 武将名と凸数領域が画像内に完全に含まれているかチェック
          const hasRequiredInfo = 
            warlordNameRegion.x >= 0 && warlordNameRegion.y >= 0 &&
            warlordNameRegion.x + warlordNameRegion.width <= imageData.width &&
            warlordNameRegion.y + warlordNameRegion.height <= imageData.height &&
            limitBreakRegion.x >= 0 && limitBreakRegion.y >= 0 &&
            limitBreakRegion.x + limitBreakRegion.width <= imageData.width &&
            limitBreakRegion.y + limitBreakRegion.height <= imageData.height;
          
          if (hasRequiredInfo) {
            cards.push({
              id: `card_${row}_${col}`,
              boundingBox: {
                x,
                y,
                width: cardWidth,
                height: cardHeight,
              },
              confidence: 0.9, // 見切れチェック通過で信頼度向上
            });
          } else {
            console.log(`[カード検出] カード ${row}_${col} は必要情報が不完全なため除外`);
          }
        } else {
          console.log(`[カード検出] カード ${row}_${col} は見切れているため除外`);
        }
      }
    }
    
    const gridLayout: GridLayout = {
      rows,
      columns,
      cardWidth,
      cardHeight,
    };
    
    console.log(`[カード検出] ${cards.length}枚の有効なカードを検出しました（見切れ・不完全カードを除外）`);
    
    return {
      cards,
      gridLayout,
    };
  } catch (error) {
    throw new Error(`カード検出に失敗しました: ${error}`);
  }
}

/**
 * カード領域から画像を切り出し
 */
export function extractCardImage(
  imageData: ImageData,
  card: Card
): ImageData {
  const { x, y, width, height } = card.boundingBox;
  const cardData = new Uint8ClampedArray(width * height * 4);
  
  for (let cardY = 0; cardY < height; cardY++) {
    for (let cardX = 0; cardX < width; cardX++) {
      const sourceX = Math.floor(x + cardX);
      const sourceY = Math.floor(y + cardY);
      
      if (sourceX >= 0 && sourceX < imageData.width && sourceY >= 0 && sourceY < imageData.height) {
        const sourceIdx = (sourceY * imageData.width + sourceX) * 4;
        const targetIdx = (cardY * width + cardX) * 4;
        
        cardData[targetIdx] = imageData.data[sourceIdx];
        cardData[targetIdx + 1] = imageData.data[sourceIdx + 1];
        cardData[targetIdx + 2] = imageData.data[sourceIdx + 2];
        cardData[targetIdx + 3] = imageData.data[sourceIdx + 3];
      }
    }
  }
  
  return {
    width,
    height,
    data: cardData,
  };
}

/**
 * 武将名領域を抽出（サンプル画像分析に基づく精密化）
 */
export function extractWarlordNameRegion(cardImageData: ImageData): ImageData {
  const { width, height } = cardImageData;
  
  // サンプル画像の分析結果に基づく武将名領域
  // 武将名はカードの下部、中央寄りに配置
  const nameRegion = {
    x: Math.floor(width * 0.15),      // 左端から15%
    y: Math.floor(height * 0.82),     // 上端から82%
    width: Math.floor(width * 0.7),   // 幅70%
    height: Math.floor(height * 0.12) // 高さ12%
  };
  
  console.log(`[ROI] 武将名領域: x=${nameRegion.x}, y=${nameRegion.y}, w=${nameRegion.width}, h=${nameRegion.height}`);
  
  return extractCardImage(cardImageData, {
    id: 'name_region',
    boundingBox: nameRegion,
    confidence: 1.0,
  });
}

/**
 * 凸数領域を抽出（サンプル画像分析に基づく精密化）
 */
export function extractLimitBreakRegion(cardImageData: ImageData): ImageData {
  const { width, height } = cardImageData;
  
  // サンプル画像の分析結果に基づく凸数領域
  // 凸数は武将名の上部、中央寄りに配置（星/点のパターン）
  const limitBreakRegion = {
    x: Math.floor(width * 0.2),       // 左端から20%
    y: Math.floor(height * 0.72),     // 上端から72%
    width: Math.floor(width * 0.6),   // 幅60%
    height: Math.floor(height * 0.08) // 高さ8%
  };
  
  console.log(`[ROI] 凸数領域: x=${limitBreakRegion.x}, y=${limitBreakRegion.y}, w=${limitBreakRegion.width}, h=${limitBreakRegion.height}`);
  
  return extractCardImage(cardImageData, {
    id: 'limit_break_region',
    boundingBox: limitBreakRegion,
    confidence: 1.0,
  });
}

/**
 * SPラベル領域を抽出（サンプル画像分析に基づく精密化）
 */
export function extractSpLabelRegion(cardImageData: ImageData): ImageData {
  const { width, height } = cardImageData;
  
  // サンプル画像の分析結果に基づくSPラベル領域
  // SPラベルは武将名の左上、小さな領域に配置
  const spRegion = {
    x: Math.floor(width * 0.05),      // 左端から5%
    y: Math.floor(height * 0.78),    // 上端から78%
    width: Math.floor(width * 0.15), // 幅15%
    height: Math.floor(height * 0.08) // 高さ8%
  };
  
  console.log(`[ROI] SPラベル領域: x=${spRegion.x}, y=${spRegion.y}, w=${spRegion.width}, h=${spRegion.height}`);
  
  return extractCardImage(cardImageData, {
    id: 'sp_label_region',
    boundingBox: spRegion,
    confidence: 1.0,
  });
}

/**
 * COラベル領域を抽出（新規追加）
 */
export function extractCoLabelRegion(cardImageData: ImageData): ImageData {
  const { width, height } = cardImageData;
  
  // COラベル（無双）はSPラベルの少し上に配置
  const coRegion = {
    x: Math.floor(width * 0.05),      // 左端から5%
    y: Math.floor(height * 0.68),    // 上端から68%（SPより上）
    width: Math.floor(width * 0.2),  // 幅20%（SPより広い）
    height: Math.floor(height * 0.08) // 高さ8%
  };
  
  console.log(`[ROI] COラベル領域: x=${coRegion.x}, y=${coRegion.y}, w=${coRegion.width}, h=${coRegion.height}`);
  
  return extractCardImage(cardImageData, {
    id: 'co_label_region',
    boundingBox: coRegion,
    confidence: 1.0,
  });
}
