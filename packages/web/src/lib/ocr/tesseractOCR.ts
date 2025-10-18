import Tesseract, { createWorker } from 'tesseract.js';
import type { ImageData } from './imageProcessor';
import { OCRConfig } from '@/src/schema/ocr';

export interface OCRTextResult {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRWordResult {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

/**
 * Tesseract.jsワーカーの管理
 */
class OCRWorkerManager {
  private worker: any = null;
  private isInitialized = false;

  async initialize(config: OCRConfig): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.worker = await createWorker();

      await this.worker.loadLanguage(config.language);
      await this.worker.initialize(config.language);

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`OCRワーカーの初期化に失敗しました: ${error}`);
    }
  }

  async recognize(imageData: ImageData): Promise<OCRTextResult> {
    if (!this.worker || !this.isInitialized) {
      throw new Error('OCRワーカーが初期化されていません');
    }

    try {
      // ImageDataをCanvasに変換
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context could not be created');
      }

      const imgData = new ImageData(imageData.data as ImageDataArray, imageData.width, imageData.height);
      ctx.putImageData(imgData, 0, 0);

      // OCR実行
      const { data } = await this.worker.recognize(canvas);
      
      return {
        text: data.text.trim(),
        confidence: data.confidence / 100, // 0-1の範囲に正規化
        boundingBox: {
          x: 0,
          y: 0,
          width: imageData.width,
          height: imageData.height,
        },
      };
    } catch (error) {
      throw new Error(`OCR認識に失敗しました: ${error}`);
    }
  }

  async recognizeWords(imageData: ImageData): Promise<OCRWordResult[]> {
    if (!this.worker || !this.isInitialized) {
      throw new Error('OCRワーカーが初期化されていません');
    }

    try {
      // ImageDataをCanvasに変換
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context could not be created');
      }

      const imgData = new ImageData(imageData.data as ImageDataArray, imageData.width, imageData.height);
      ctx.putImageData(imgData, 0, 0);

      // 単語レベルのOCR実行
      const { data } = await this.worker.recognize(canvas);
      
      return data.words.map((word: any) => ({
        text: word.text.trim(),
        confidence: word.confidence / 100,
        bbox: {
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1,
        },
      }));
    } catch (error) {
      throw new Error(`単語レベルのOCR認識に失敗しました: ${error}`);
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }
}

// シングルトンインスタンス
const ocrWorkerManager = new OCRWorkerManager();

/**
 * OCR処理のメイン関数
 */
export async function performOCR(
  imageData: ImageData,
  config: OCRConfig
): Promise<OCRTextResult> {
  try {
    // ImageDataをCanvasに変換
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context could not be created');
    }

    const imgData = new ImageData(imageData.data as ImageDataArray, imageData.width, imageData.height);
    ctx.putImageData(imgData, 0, 0);

    // シンプルAPIで実行（日本語設定を強化）
    const { data } = await Tesseract.recognize(canvas, 'jpn', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`[Tesseract] 進捗: ${(m.progress * 100).toFixed(1)}%`);
        }
      },
      // サンプル画像分析に基づく最適化設定（型キャストで回避）
      ...({
        tessedit_pageseg_mode: '6', // 単一のテキストブロック
        tessedit_ocr_engine_mode: '3', // デフォルトエンジン
        preserve_interword_spaces: '1', // 単語間のスペースを保持
        // 文字認識の精度向上
        tessedit_char_whitelist: '一二三四五六七八九十百千万億兆京垓秭穣溝澗正載極恒河沙阿僧祇那由他不可思議無量大数孫尚香張紘于吉呂布龐德許褚程昱荀攸典韋王異曹操郭嘉司馬懿周瑜甘寧孫堅黄蓋程普孫策陸遜呂蒙孫権太史慈馬忠陸抗凌統魯粛周泰諸葛恪馬超陳到黄忠趙雲王平徐庶劉備張飛黄月英諸葛亮関羽法正魏延馬雲騄龐統張氏伊籍厳顔関銀屏関興張苞姜維孟獲于吉董卓田豊呂玲綺祝融兀突骨公孫瓚袁紹張角李儒高順馬騰文醜華雄顔良華佗左慈貂蝉蔡琰許攸袁術高覧陳宮張譲木鹿大王沮授董白朶思大王鄒氏麹義皇甫嵩張宝SP',
      } as any),
    });
    
    return {
      text: data.text.trim(),
      confidence: data.confidence / 100, // 0-1の範囲に正規化
      boundingBox: {
        x: 0,
        y: 0,
        width: imageData.width,
        height: imageData.height,
      },
    };
  } catch (error) {
    throw new Error(`OCR処理に失敗しました: ${error}`);
  }
}

/**
 * 単語レベルのOCR処理
 */
export async function performOCRWords(
  imageData: ImageData,
  config: OCRConfig
): Promise<OCRWordResult[]> {
  try {
    await ocrWorkerManager.initialize(config);
    return await ocrWorkerManager.recognizeWords(imageData);
  } catch (error) {
    throw new Error(`単語レベルのOCR処理に失敗しました: ${error}`);
  }
}

/**
 * OCRワーカーの終了
 */
export async function terminateOCRWorker(): Promise<void> {
  await ocrWorkerManager.terminate();
}

/**
 * テキストの前処理（OCR結果のクリーニング）
 */
export function preprocessOCRText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // 複数の空白を単一の空白に
    .replace(/[^\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ffa-zA-Z0-9\s]/g, '') // 不要な文字を除去
    .trim();
}

/**
 * 信頼度に基づくテキストフィルタリング
 */
export function filterByConfidence(
  results: OCRWordResult[],
  minConfidence: number = 0.5
): OCRWordResult[] {
  return results.filter(result => result.confidence >= minConfidence);
}

/**
 * バッチOCR処理
 */
export async function performBatchOCR(
  imageDataList: ImageData[],
  config: OCRConfig,
  onProgress?: (progress: number) => void
): Promise<OCRTextResult[]> {
  try {
    await ocrWorkerManager.initialize(config);
    
    const results: OCRTextResult[] = [];
    const total = imageDataList.length;
    
    for (let i = 0; i < total; i++) {
      const result = await ocrWorkerManager.recognize(imageDataList[i]);
      results.push(result);
      
      if (onProgress) {
        onProgress((i + 1) / total * 100);
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(`バッチOCR処理に失敗しました: ${error}`);
  }
}

/**
 * OCR結果のデバッグ情報を生成
 */
export function generateOCRDebugInfo(result: OCRTextResult): string {
  return `
OCR結果:
- テキスト: "${result.text}"
- 信頼度: ${(result.confidence * 100).toFixed(1)}%
- 領域: ${result.boundingBox?.width || 0}×${result.boundingBox?.height || 0}
- 前処理後: "${preprocessOCRText(result.text)}"
  `.trim();
}
