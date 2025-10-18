import { OCRResult, OCRBatchResult } from '@/src/schema/ocr';
import { WarlordMatchResult } from '@/src/schema/ocr';
import { LimitBreakDetectionResult, SPDetectionResult } from '@/src/schema/ocr';

export interface CorrectionItem {
  id: string;
  originalResult: OCRResult;
  warlordMatch: WarlordMatchResult;
  limitBreakResult: LimitBreakDetectionResult;
  spResult: SPDetectionResult;
  isCorrected: boolean;
  corrections?: {
    warlordName?: string;
    copies?: number;
    limitBreak?: number;
    isSP?: boolean;
  };
}

export interface CorrectionBatch {
  items: CorrectionItem[];
  totalItems: number;
  correctedItems: number;
  unresolvedItems: number;
}

/**
 * OCR結果から校正アイテムを生成
 */
export function createCorrectionItems(
  ocrResults: OCRResult[],
  warlordMatches: WarlordMatchResult[],
  limitBreakResults: LimitBreakDetectionResult[],
  spResults: SPDetectionResult[]
): CorrectionItem[] {
  return ocrResults.map((ocrResult, index) => ({
    id: `correction_${index}`,
    originalResult: ocrResult,
    warlordMatch: warlordMatches[index] || {
      originalText: ocrResult.warlordName,
      matchedWarlordId: undefined,
      matchedName: undefined,
      confidence: 0,
      matchType: 'none',
      alternatives: [],
    },
    limitBreakResult: limitBreakResults[index] || {
      detectedCount: 0,
      confidence: 0,
      method: 'manual',
    },
    spResult: spResults[index] || {
      isSP: false,
      confidence: 0,
      method: 'manual',
    },
    isCorrected: false,
  }));
}

/**
 * 校正アイテムを更新
 */
export function updateCorrectionItem(
  items: CorrectionItem[],
  itemId: string,
  corrections: {
    warlordName?: string;
    copies?: number;
    limitBreak?: number;
    isSP?: boolean;
  }
): CorrectionItem[] {
  return items.map(item => {
    if (item.id === itemId) {
      return {
        ...item,
        isCorrected: true,
        corrections: {
          ...item.corrections,
          ...corrections,
        },
      };
    }
    return item;
  });
}

/**
 * 校正バッチの統計を計算
 */
export function calculateCorrectionStatistics(items: CorrectionItem[]): {
  totalItems: number;
  correctedItems: number;
  unresolvedItems: number;
  highConfidenceItems: number;
  lowConfidenceItems: number;
} {
  const stats = {
    totalItems: items.length,
    correctedItems: 0,
    unresolvedItems: 0,
    highConfidenceItems: 0,
    lowConfidenceItems: 0,
  };

  for (const item of items) {
    if (item.isCorrected) {
      stats.correctedItems++;
    }

    if (item.warlordMatch.matchType === 'none') {
      stats.unresolvedItems++;
    }

    const overallConfidence = Math.min(
      item.warlordMatch.confidence,
      item.limitBreakResult.confidence,
      item.spResult.confidence
    );

    if (overallConfidence >= 0.8) {
      stats.highConfidenceItems++;
    } else if (overallConfidence < 0.5) {
      stats.lowConfidenceItems++;
    }
  }

  return stats;
}

/**
 * 校正結果をOCRResultに変換
 */
export function convertToOCRResult(item: CorrectionItem): OCRResult {
  const corrections = item.corrections || {};
  
  return {
    warlordName: corrections.warlordName || item.warlordMatch.matchedName || item.originalResult.warlordName,
    copies: corrections.copies || calculateCopiesFromLimitBreak(item.limitBreakResult.detectedCount),
    limitBreak: corrections.limitBreak || item.limitBreakResult.detectedCount,
    isSP: corrections.isSP !== undefined ? corrections.isSP : item.spResult.isSP,
    confidence: Math.min(
      item.warlordMatch.confidence,
      item.limitBreakResult.confidence,
      item.spResult.confidence
    ),
    boundingBox: item.originalResult.boundingBox,
  };
}

/**
 * 校正バッチをOCRBatchResultに変換
 */
export function convertToOCRBatchResult(items: CorrectionItem[]): OCRBatchResult {
  const results = items.map(convertToOCRResult);
  const unresolved = items
    .filter(item => item.warlordMatch.matchType === 'none')
    .map(item => item.originalResult.warlordName);

  return {
    results,
    unresolved,
    processingTime: 0, // 実際の処理時間は別途管理
  };
}

/**
 * 凸数から所持枚数を計算
 */
function calculateCopiesFromLimitBreak(limitBreak: number): number {
  return Math.max(1, limitBreak + 1);
}

/**
 * 信頼度に基づく色分け
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * 信頼度に基づく背景色
 */
export function getConfidenceBackgroundColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-50 border-green-200';
  if (confidence >= 0.6) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

/**
 * マッチタイプに基づくアイコン
 */
export function getMatchTypeIcon(matchType: WarlordMatchResult['matchType']): string {
  switch (matchType) {
    case 'exact':
      return '✓';
    case 'partial':
      return '~';
    case 'fuzzy':
      return '?';
    case 'none':
      return '✗';
    default:
      return '?';
  }
}

/**
 * マッチタイプに基づく説明
 */
export function getMatchTypeDescription(matchType: WarlordMatchResult['matchType']): string {
  switch (matchType) {
    case 'exact':
      return '完全一致';
    case 'partial':
      return '部分一致';
    case 'fuzzy':
      return '類似一致';
    case 'none':
      return '一致なし';
    default:
      return '不明';
  }
}

/**
 * 校正アイテムの検証
 */
export function validateCorrectionItem(item: CorrectionItem): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 武将名の検証
  if (!item.warlordMatch.matchedName && !item.corrections?.warlordName) {
    errors.push('武将名が特定できていません');
  }

  // 所持枚数の検証
  const copies = item.corrections?.copies || calculateCopiesFromLimitBreak(item.limitBreakResult.detectedCount);
  if (copies < 1 || copies > 10) {
    errors.push('所持枚数が無効です（1-10の範囲）');
  }

  // 凸数の検証
  const limitBreak = item.corrections?.limitBreak || item.limitBreakResult.detectedCount;
  if (limitBreak < 0 || limitBreak > 4) {
    errors.push('凸数が無効です（0-4の範囲）');
  }

  // 凸数と所持枚数の整合性チェック
  const expectedLimitBreak = calculateLimitBreakFromCopies(copies);
  if (Math.abs(limitBreak - expectedLimitBreak) > 1) {
    errors.push('凸数と所持枚数の整合性が取れていません');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 凸数から所持枚数を計算
 */
function calculateLimitBreakFromCopies(copies: number): number {
  return Math.min(5, Math.max(0, copies - 1));
}

/**
 * 校正アイテムのデバッグ情報を生成
 */
export function generateCorrectionDebugInfo(item: CorrectionItem): string {
  const corrections = item.corrections || {};
  
  return `
校正アイテム情報:
- ID: ${item.id}
- 元の武将名: "${item.originalResult.warlordName}"
- 照合結果: ${item.warlordMatch.matchType} (${item.warlordMatch.matchedName || 'なし'})
- 凸数: ${item.limitBreakResult.detectedCount} (信頼度: ${(item.limitBreakResult.confidence * 100).toFixed(1)}%)
- SP判定: ${item.spResult.isSP ? 'SP' : '通常'} (信頼度: ${(item.spResult.confidence * 100).toFixed(1)}%)
- 校正済み: ${item.isCorrected ? 'はい' : 'いいえ'}
- 校正内容: ${JSON.stringify(corrections)}
  `.trim();
}

/**
 * 校正バッチのエクスポート用データを生成
 */
export function generateExportData(items: CorrectionItem[]): {
  csv: string;
  json: any;
} {
  const results = items.map(convertToOCRResult);
  
  // CSV形式
  const csvHeaders = '武将名,所持枚数,凸数,SP判定,信頼度';
  const csvRows = results.map(result => 
    `${result.warlordName},${result.copies},${result.limitBreak},${result.isSP ? 'SP' : '通常'},${(result.confidence * 100).toFixed(1)}%`
  );
  const csv = [csvHeaders, ...csvRows].join('\n');
  
  // JSON形式
  const json = {
    timestamp: new Date().toISOString(),
    totalItems: results.length,
    results: results.map(result => ({
      warlordName: result.warlordName,
      copies: result.copies,
      limitBreak: result.limitBreak,
      isSP: result.isSP,
      confidence: result.confidence,
    })),
    statistics: calculateCorrectionStatistics(items),
  };
  
  return { csv, json };
}
