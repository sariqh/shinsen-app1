import { WarlordMatchResult } from '@/src/schema/ocr';

export interface WarlordMaster {
  warlordId: string;
  name: string;
  prefix?: string | null; // "SP", "CO", null
  fullName?: string; // "SP龐徳", "CO関平" など
  aliases?: string[];
  camp?: number;
}

/**
 * レーベンシュタイン距離を計算
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * 文字列の類似度を計算（0-1の範囲）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLength);
}

/**
 * 部分文字列マッチング
 */
function findPartialMatches(text: string, warlordNames: string[]): Array<{
  warlordId: string;
  name: string;
  confidence: number;
  matchType: 'partial';
}> {
  const matches: Array<{
    warlordId: string;
    name: string;
    confidence: number;
    matchType: 'partial';
  }> = [];
  
  for (const warlord of warlordNames) {
    // テキストに武将名が含まれているかチェック
    if (text.includes(warlord)) {
      const confidence = warlord.length / text.length;
      matches.push({
        warlordId: warlord, // 実際の実装ではwarlordIdを使用
        name: warlord,
        confidence: Math.min(confidence, 0.9), // 部分マッチは最大0.9
        matchType: 'partial',
      });
    }
    
    // 武将名にテキストが含まれているかチェック
    if (warlord.includes(text)) {
      const confidence = text.length / warlord.length;
      matches.push({
        warlordId: warlord,
        name: warlord,
        confidence: Math.min(confidence, 0.8), // 逆方向は最大0.8
        matchType: 'partial',
      });
    }
  }
  
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * ファジーマッチング
 */
function findFuzzyMatches(
  text: string,
  warlordNames: string[],
  minSimilarity: number = 0.6
): Array<{
  warlordId: string;
  name: string;
  confidence: number;
  matchType: 'fuzzy';
}> {
  const matches: Array<{
    warlordId: string;
    name: string;
    confidence: number;
    matchType: 'fuzzy';
  }> = [];
  
  for (const warlord of warlordNames) {
    const similarity = calculateSimilarity(text, warlord);
    
    if (similarity >= minSimilarity) {
      matches.push({
        warlordId: warlord,
        name: warlord,
        confidence: similarity,
        matchType: 'fuzzy',
      });
    }
  }
  
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * 武将名の正規化
 */
function normalizeWarlordName(name: string): string {
  return name
    .replace(/[SP]/g, '') // SPマークを除去
    .replace(/[CO]/g, '') // COマークを除去
    .trim();
}

/**
 * 武将名照合のメイン関数
 */
/**
 * プレフィックス対応の武将名照合
 */
export function matchWarlordNameWithPrefix(
  ocrText: string,
  warlordMaster: WarlordMaster[],
  detectedPrefix: string | null = null
): WarlordMatchResult {
  const normalizedText = normalizeWarlordName(ocrText);
  
  // 1. プレフィックスを考慮した厳格一致
  if (detectedPrefix) {
    const prefixedName = `${detectedPrefix}${normalizedText}`;
    const exactMatch = warlordMaster.find(w => 
      w.fullName === prefixedName || 
      w.prefix === detectedPrefix && w.name === normalizedText
    );
    
    if (exactMatch) {
      return {
        originalText: ocrText,
        matchedWarlordId: exactMatch.warlordId,
        matchedName: exactMatch.fullName || `${exactMatch.prefix}${exactMatch.name}`,
        confidence: 1.0,
        matchType: 'exact',
        alternatives: [],
      };
    }
  }
  
  // 2. プレフィックスなしでの厳格一致
  const exactMatch = warlordMaster.find(w => 
    w.name === normalizedText && !w.prefix
  );
  
  if (exactMatch) {
    return {
      originalText: ocrText,
      matchedWarlordId: exactMatch.warlordId,
      matchedName: exactMatch.name,
      confidence: 0.9, // プレフィックスなしなので少し信頼度を下げる
      matchType: 'exact',
      alternatives: [],
    };
  }
  
  // 3. 部分一致（プレフィックス考慮）
  const partialMatches = findPartialMatchesWithPrefix(normalizedText, warlordMaster, detectedPrefix);
  if (partialMatches.length > 0) {
    const bestMatch = partialMatches[0];
    const warlord = warlordMaster.find(w => w.warlordId === bestMatch.warlordId);
    
    return {
      originalText: ocrText,
      matchedWarlordId: warlord?.warlordId,
      matchedName: warlord?.fullName || warlord?.name,
      confidence: bestMatch.confidence,
      matchType: 'partial',
      alternatives: partialMatches.slice(1, 4).map(match => ({
        warlordId: match.warlordId,
        name: match.name,
        confidence: match.confidence,
      })),
    };
  }
  
  // 4. ファジーマッチ（プレフィックス考慮）
  const fuzzyMatches = findFuzzyMatchesWithPrefix(normalizedText, warlordMaster, detectedPrefix, 0.3);
  if (fuzzyMatches.length > 0) {
    const bestMatch = fuzzyMatches[0];
    const warlord = warlordMaster.find(w => w.warlordId === bestMatch.warlordId);
    
    return {
      originalText: ocrText,
      matchedWarlordId: warlord?.warlordId,
      matchedName: warlord?.fullName || warlord?.name,
      confidence: bestMatch.confidence,
      matchType: 'fuzzy',
      alternatives: fuzzyMatches.slice(1, 4).map(match => ({
        warlordId: match.warlordId,
        name: match.name,
        confidence: match.confidence,
      })),
    };
  }
  
  // 5. マッチなし
  return {
    originalText: ocrText,
    matchedWarlordId: undefined,
    matchedName: undefined,
    confidence: 0,
    matchType: 'none',
    alternatives: [],
  };
}

/**
 * プレフィックス考慮の部分一致検索
 */
function findPartialMatchesWithPrefix(
  text: string,
  warlordMaster: WarlordMaster[],
  detectedPrefix: string | null
): Array<{
  warlordId: string;
  name: string;
  confidence: number;
  matchType: 'partial';
}> {
  const matches: Array<{
    warlordId: string;
    name: string;
    confidence: number;
    matchType: 'partial';
  }> = [];
  
  for (const warlord of warlordMaster) {
    const normalizedName = normalizeWarlordName(warlord.name);
    const similarity = calculateSimilarity(text, normalizedName);
    
    // プレフィックスが一致する場合のボーナス
    let prefixBonus = 0;
    if (detectedPrefix && warlord.prefix === detectedPrefix) {
      prefixBonus = 0.2;
    } else if (!detectedPrefix && !warlord.prefix) {
      prefixBonus = 0.1;
    }
    
    const adjustedSimilarity = Math.min(1.0, similarity + prefixBonus);
    
    if (adjustedSimilarity >= 0.6) {
      matches.push({
        warlordId: warlord.warlordId,
        name: warlord.fullName || warlord.name,
        confidence: adjustedSimilarity,
        matchType: 'partial',
      });
    }
  }
  
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * プレフィックス考慮のファジーマッチ検索
 */
function findFuzzyMatchesWithPrefix(
  text: string,
  warlordMaster: WarlordMaster[],
  detectedPrefix: string | null,
  minSimilarity: number = 0.3
): Array<{
  warlordId: string;
  name: string;
  confidence: number;
  matchType: 'fuzzy';
}> {
  const matches: Array<{
    warlordId: string;
    name: string;
    confidence: number;
    matchType: 'fuzzy';
  }> = [];
  
  for (const warlord of warlordMaster) {
    const normalizedName = normalizeWarlordName(warlord.name);
    const similarity = calculateSimilarity(text, normalizedName);
    
    // プレフィックスが一致する場合のボーナス
    let prefixBonus = 0;
    if (detectedPrefix && warlord.prefix === detectedPrefix) {
      prefixBonus = 0.15;
    } else if (!detectedPrefix && !warlord.prefix) {
      prefixBonus = 0.05;
    }
    
    const adjustedSimilarity = Math.min(1.0, similarity + prefixBonus);
    
    if (adjustedSimilarity >= minSimilarity) {
      matches.push({
        warlordId: warlord.warlordId,
        name: warlord.fullName || warlord.name,
        confidence: adjustedSimilarity,
        matchType: 'fuzzy',
      });
    }
  }
  
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * バッチ武将名照合
 */
export function matchWarlordNamesBatch(
  ocrTexts: string[],
  warlordMaster: WarlordMaster[]
): WarlordMatchResult[] {
  return ocrTexts.map(text => matchWarlordNameWithPrefix(text, warlordMaster));
}

/**
 * 照合結果の統計情報を生成
 */
export function generateMatchStatistics(results: WarlordMatchResult[]): {
  total: number;
  exact: number;
  partial: number;
  fuzzy: number;
  none: number;
  averageConfidence: number;
} {
  const stats = {
    total: results.length,
    exact: 0,
    partial: 0,
    fuzzy: 0,
    none: 0,
    averageConfidence: 0,
  };
  
  let totalConfidence = 0;
  
  for (const result of results) {
    switch (result.matchType) {
      case 'exact':
        stats.exact++;
        break;
      case 'partial':
        stats.partial++;
        break;
      case 'fuzzy':
        stats.fuzzy++;
        break;
      case 'none':
        stats.none++;
        break;
    }
    
    totalConfidence += result.confidence;
  }
  
  stats.averageConfidence = stats.total > 0 ? totalConfidence / stats.total : 0;
  
  return stats;
}

/**
 * 未解決の武将名を抽出
 */
export function extractUnresolvedNames(results: WarlordMatchResult[]): string[] {
  return results
    .filter(result => result.matchType === 'none')
    .map(result => result.originalText);
}

/**
 * 高信頼度の照合結果を抽出
 */
export function extractHighConfidenceMatches(
  results: WarlordMatchResult[],
  minConfidence: number = 0.8
): WarlordMatchResult[] {
  return results.filter(result => result.confidence >= minConfidence);
}

/**
 * 照合結果のデバッグ情報を生成
 */
export function generateMatchDebugInfo(result: WarlordMatchResult): string {
  return `
武将名照合結果:
- 元のテキスト: "${result.originalText}"
- 照合タイプ: ${result.matchType}
- 信頼度: ${(result.confidence * 100).toFixed(1)}%
- マッチした武将: ${result.matchedName || 'なし'}
- 武将ID: ${result.matchedWarlordId || 'なし'}
- 代替候補: ${result.alternatives.length}件
  `.trim();
}
