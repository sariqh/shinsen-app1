import { preprocessImage } from './imageProcessor';
import type { ImageData } from './imageProcessor';
import { detectCards, extractWarlordNameRegion, extractLimitBreakRegion, extractSpLabelRegion, extractCoLabelRegion, extractCardImage } from './cardDetector';
import { performOCR, performOCRWords } from './tesseractOCR';
import { matchWarlordNameWithPrefix, matchWarlordNamesBatch, type WarlordMaster as WarlordMasterType } from './warlordMatcher';
import { detectLimitBreak, detectSP, detectCO } from './limitBreakDetector';
import { createCorrectionItems, convertToOCRBatchResult } from './correctionManager';

import { OCRBatchResult, OCRConfig, ImageProcessingConfig, WarlordMaster } from '@/src/schema/ocr';

export interface OCRProcessingOptions {
  imageConfig: ImageProcessingConfig;
  ocrConfig: OCRConfig;
  warlordMaster: WarlordMasterType[];
  onProgress?: (progress: number) => void;
}

export interface OCRProcessingResult {
  batchResult: OCRBatchResult;
  correctionItems: any[];
  processingTime: number;
  statistics: {
    totalCards: number;
    successfulOCR: number;
    successfulMatches: number;
    unresolvedNames: number;
  };
}

/**
 * OCR処理のメイン関数
 */
export async function processOCR(
  files: File[],
  options: OCRProcessingOptions
): Promise<OCRProcessingResult> {
  const startTime = Date.now();
  let progress = 0;
  
  try {
    const allResults: any[] = [];
    const allWarlordMatches: any[] = [];
    const allLimitBreakResults: any[] = [];
    const allSPResults: any[] = [];
    
    const totalFiles = files.length;
    
    for (let fileIndex = 0; fileIndex < totalFiles; fileIndex++) {
      const file = files[fileIndex];
      
      // 進捗更新
      if (options.onProgress) {
        progress = (fileIndex / totalFiles) * 100;
        options.onProgress(progress);
      }
      
      // 1. 画像前処理
      const processedImage = await preprocessImage(file, options.imageConfig);
      
      // 2. カード検出
      const cardDetection = await detectCards(processedImage.imageData, options.imageConfig);
      
      if (cardDetection.cards.length === 0) {
        console.warn(`ファイル ${file.name} でカードが検出されませんでした`);
        continue;
      }
      
      // 3. 各カードに対してOCR処理
      for (const card of cardDetection.cards) {
        try {
          console.log(`[OCR] カード ${card.id} を処理中...`);
          
          // カード領域を抽出
          const cardImageData = extractCardImage(processedImage.imageData, card);
          console.log(`[OCR] カード領域抽出完了: ${cardImageData.width}x${cardImageData.height}`);
          
          // 武将名領域の抽出
          const warlordNameRegion = extractWarlordNameRegion(cardImageData);
          console.log(`[OCR] 武将名領域: ${warlordNameRegion.width}x${warlordNameRegion.height}`);
          
          // 凸数領域の抽出
          const limitBreakRegion = extractLimitBreakRegion(cardImageData);
          console.log(`[OCR] 凸数領域: ${limitBreakRegion.width}x${limitBreakRegion.height}`);
          
          // SPラベル領域の抽出
          const spLabelRegion = extractSpLabelRegion(cardImageData);
          console.log(`[OCR] SPラベル領域: ${spLabelRegion.width}x${spLabelRegion.height}`);
          
          // COラベル領域の抽出
          const coLabelRegion = extractCoLabelRegion(cardImageData);
          console.log(`[OCR] COラベル領域: ${coLabelRegion.width}x${coLabelRegion.height}`);

          // OCR処理
          const warlordNameOCR = await performOCR(warlordNameRegion, options.ocrConfig);
          console.log(`[OCR] 武将名OCR結果: "${warlordNameOCR.text}" (信頼度: ${(warlordNameOCR.confidence * 100).toFixed(1)}%)`);
          
          // SP/CO判定
          const spResult = detectSP(spLabelRegion);
          const coResult = detectCO(coLabelRegion);
          console.log(`[OCR] SP判定結果:`, spResult);
          console.log(`[OCR] CO判定結果:`, coResult);
          
          // プレフィックスを決定
          let detectedPrefix: string | null = null;
          if (spResult.isSP && spResult.confidence > 0.5) {
            detectedPrefix = 'SP';
          } else if (coResult.isCO && coResult.confidence > 0.5) {
            detectedPrefix = 'CO';
          }
          
          // 武将名照合（プレフィックス対応）
          const warlordMatch = matchWarlordNameWithPrefix(warlordNameOCR.text, options.warlordMaster, detectedPrefix);
          console.log(`[OCR] 武将名照合結果:`, warlordMatch);
          if (warlordMatch.matchType === 'none') {
            // マスタにない武将名はスキップ
            console.log(`[OCR] マスタ外のためスキップ: "${warlordNameOCR.text}"`);
            continue;
          }
          
          // 凸数検出
          const limitBreakResult = detectLimitBreak(limitBreakRegion);
          console.log(`[OCR] 凸数検出結果:`, limitBreakResult);
          
          // 結果を保存
          allResults.push({
            warlordName: warlordMatch.matchedName || warlordNameOCR.text,
            copies: Math.max(1, limitBreakResult.detectedCount + 1),
            limitBreak: limitBreakResult.detectedCount,
            isSP: detectedPrefix === 'SP',
            confidence: Math.min(warlordNameOCR.confidence, limitBreakResult.confidence, spResult.confidence, coResult.confidence),
            boundingBox: card.boundingBox,
          });
          
          allWarlordMatches.push(warlordMatch);
          allLimitBreakResults.push(limitBreakResult);
          allSPResults.push(spResult);
          
        } catch (error) {
          console.error(`カード ${card.id} の処理中にエラーが発生しました:`, error);
        }
      }
    }
    
    // 最終進捗更新
    if (options.onProgress) {
      options.onProgress(100);
    }
    
    // 4. 校正アイテムの作成
    const correctionItems = createCorrectionItems(
      allResults,
      allWarlordMatches,
      allLimitBreakResults,
      allSPResults
    );
    
    // 5. バッチ結果の生成
    const batchResult = convertToOCRBatchResult(correctionItems);
    
    // 6. 統計情報の計算
    const statistics = {
      totalCards: allResults.length,
      successfulOCR: allResults.filter(r => r.confidence > 0.5).length,
      successfulMatches: allWarlordMatches.filter(m => m.matchType !== 'none').length,
      unresolvedNames: allWarlordMatches.filter(m => m.matchType === 'none').length,
    };
    
    const processingTime = Date.now() - startTime;
    
    return {
      batchResult,
      correctionItems,
      processingTime,
      statistics,
    };
    
  } catch (error) {
    throw new Error(`OCR処理に失敗しました: ${error}`);
  }
}

/**
 * 単一ファイルのOCR処理
 */
export async function processSingleFile(
  file: File,
  options: OCRProcessingOptions
): Promise<OCRProcessingResult> {
  return processOCR([file], options);
}

/**
 * OCR処理の設定を検証
 */
export function validateOCROptions(options: OCRProcessingOptions): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // 画像設定の検証
  if (options.imageConfig.minCardWidth <= 0) {
    errors.push('最小カード幅は0より大きい必要があります');
  }
  
  if (options.imageConfig.minCardHeight <= 0) {
    errors.push('最小カード高さは0より大きい必要があります');
  }
  
  // OCR設定の検証
  if (!options.ocrConfig.language) {
    errors.push('OCR言語が指定されていません');
  }
  
  // 武将マスタの検証
  if (!options.warlordMaster || options.warlordMaster.length === 0) {
    errors.push('武将マスタデータが空です');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * デフォルト設定を生成
 */
export function createDefaultOCROptions(warlordMaster: WarlordMaster[]): OCRProcessingOptions {
  return {
    imageConfig: {
      minCardWidth: 80,
      minCardHeight: 120,
      maxCardsPerRow: 3,
      maxCardsPerColumn: 10,
      cardSpacingThreshold: 10,
    },
    ocrConfig: {
      language: 'jpn',
    },
    warlordMaster,
    onProgress: undefined,
  };
}

/**
 * OCR処理結果のデバッグ情報を生成
 */
export function generateOCRDebugInfo(result: OCRProcessingResult): string {
  return `
OCR処理結果:
- 処理時間: ${result.processingTime}ms
- 検出カード数: ${result.statistics.totalCards}
- OCR成功: ${result.statistics.successfulOCR}
- 照合成功: ${result.statistics.successfulMatches}
- 未解決: ${result.statistics.unresolvedNames}
- 成功率: ${((result.statistics.successfulMatches / result.statistics.totalCards) * 100).toFixed(1)}%
  `.trim();
}

/**
 * OCR処理のエラーハンドリング
 */
export function handleOCRError(error: any): string {
  if (error.message.includes('画像前処理')) {
    return '画像の前処理に失敗しました。画像形式を確認してください。';
  }
  
  if (error.message.includes('カード検出')) {
    return 'カードの検出に失敗しました。画像の品質を確認してください。';
  }
  
  if (error.message.includes('OCR認識')) {
    return 'OCR認識に失敗しました。画像の解像度を確認してください。';
  }
  
  if (error.message.includes('武将名照合')) {
    return '武将名の照合に失敗しました。マスタデータを確認してください。';
  }
  
  return `OCR処理中にエラーが発生しました: ${error.message}`;
}
