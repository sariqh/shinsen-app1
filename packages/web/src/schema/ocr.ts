import { z } from "zod";

// 武将マスタデータ
export interface WarlordMaster {
  warlordId: string;
  name: string;
  aliases?: string[];
}

// OCR結果の個別アイテム
export const OCRResultSchema = z.object({
  warlordName: z.string(),
  copies: z.number().int().nonnegative(),
  limitBreak: z.number().int().min(0).max(4),
  isSP: z.boolean(),
  confidence: z.number().min(0).max(1),
  boundingBox: z.object({
    x: z.number().nonnegative(),
    y: z.number().nonnegative(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
});

// OCRバッチ処理結果
export const OCRBatchResultSchema = z.object({
  results: z.array(OCRResultSchema),
  unresolved: z.array(z.string()),
  processingTime: z.number().nonnegative(),
});

// 画像処理設定
export const ImageProcessingConfigSchema = z.object({
  minCardWidth: z.number().positive().default(80),
  minCardHeight: z.number().positive().default(120),
  maxCardsPerRow: z.number().int().positive().default(3),
  maxCardsPerColumn: z.number().int().positive().default(10),
  cardSpacingThreshold: z.number().positive().default(10),
});

// OCR設定
export const OCRConfigSchema = z.object({
  language: z.string().default("jpn"),
  tessdataPrefix: z.string().optional(),
  workerPath: z.string().optional(),
  logger: z.function().optional(),
});

// カード検出結果
export const CardDetectionResultSchema = z.object({
  cards: z.array(z.object({
    id: z.string(),
    boundingBox: z.object({
      x: z.number().nonnegative(),
      y: z.number().nonnegative(),
      width: z.number().positive(),
      height: z.number().positive(),
    }),
    confidence: z.number().min(0).max(1),
  })),
  gridLayout: z.object({
    rows: z.number().int().positive(),
    columns: z.number().int().positive(),
    cardWidth: z.number().positive(),
    cardHeight: z.number().positive(),
  }),
});

// 武将名照合結果
export const WarlordMatchResultSchema = z.object({
  originalText: z.string(),
  matchedWarlordId: z.string().optional(),
  matchedName: z.string().optional(),
  confidence: z.number().min(0).max(1),
  matchType: z.enum(["exact", "partial", "fuzzy", "none"]),
  alternatives: z.array(z.object({
    warlordId: z.string(),
    name: z.string(),
    confidence: z.number().min(0).max(1),
  })).default([]),
});

// 凸数検出結果
export const LimitBreakDetectionResultSchema = z.object({
  detectedCount: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1),
  method: z.enum(["color_detection", "shape_detection", "manual"]),
});

// SP判定結果
export const SPDetectionResultSchema = z.object({
  isSP: z.boolean(),
  confidence: z.number().min(0).max(1),
  detectedMark: z.string().optional(),
  method: z.enum(["color_detection", "text_detection", "manual"]),
});

// CO判定結果
export const CODetectionResultSchema = z.object({
  isCO: z.boolean(),
  confidence: z.number().min(0).max(1),
  method: z.enum(["color", "text", "manual"]),
});

// 型のエクスポート
export type OCRResult = z.infer<typeof OCRResultSchema>;
export type OCRBatchResult = z.infer<typeof OCRBatchResultSchema>;
export type ImageProcessingConfig = z.infer<typeof ImageProcessingConfigSchema>;
export type OCRConfig = z.infer<typeof OCRConfigSchema>;
export type CardDetectionResult = z.infer<typeof CardDetectionResultSchema>;
export type WarlordMatchResult = z.infer<typeof WarlordMatchResultSchema>;
export type LimitBreakDetectionResult = z.infer<typeof LimitBreakDetectionResultSchema>;
export type SPDetectionResult = z.infer<typeof SPDetectionResultSchema>;
export type CODetectionResult = z.infer<typeof CODetectionResultSchema>;

// デフォルト設定
export const DEFAULT_IMAGE_PROCESSING_CONFIG: ImageProcessingConfig = {
  minCardWidth: 80,
  minCardHeight: 120,
  maxCardsPerRow: 3,
  maxCardsPerColumn: 10,
  cardSpacingThreshold: 10,
};

export const DEFAULT_OCR_CONFIG: OCRConfig = {
  language: "jpn",
};
