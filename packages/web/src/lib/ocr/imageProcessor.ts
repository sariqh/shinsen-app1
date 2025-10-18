import { ImageProcessingConfig } from "@/src/schema/ocr";

export interface ImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface ProcessedImage {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  imageData: ImageData;
}

/**
 * 画像ファイルをCanvasに読み込む
 */
export async function loadImageToCanvas(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      reject(new Error('Canvas context could not be created'));
      return;
    }

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      resolve({
        canvas,
        context,
        imageData: {
          width: imageData.width,
          height: imageData.height,
          data: imageData.data,
        },
      });
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 画像をグレースケールに変換
 */
export function convertToGrayscale(imageData: ImageData): ImageData {
  const { width, height, data } = imageData;
  // RGBAを維持（length は width * height * 4 のまま）
  const grayscaleData = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // グレースケール変換（重み付き平均）
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    grayscaleData[i] = gray;
    grayscaleData[i + 1] = gray;
    grayscaleData[i + 2] = gray;
    grayscaleData[i + 3] = data[i + 3]; // Alpha を維持
  }

  return {
    width,
    height,
    data: grayscaleData,
  };
}

/**
 * コントラスト調整
 */
export function adjustContrast(imageData: ImageData, factor: number = 1.5): ImageData {
  const { width, height, data } = imageData;
  const adjustedData = new Uint8ClampedArray(data.length);
  
  for (let i = 0; i < data.length; i += 4) {
    adjustedData[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));
    adjustedData[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128));
    adjustedData[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128));
    adjustedData[i + 3] = data[i + 3]; // Alpha channel
  }
  
  return {
    width,
    height,
    data: adjustedData,
  };
}

/**
 * 二値化処理
 */
export function binarize(imageData: ImageData, threshold: number = 128): ImageData {
  const { width, height, data } = imageData;
  const binaryData = new Uint8ClampedArray(data.length);
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const binary = gray > threshold ? 255 : 0;
    
    binaryData[i] = binary;
    binaryData[i + 1] = binary;
    binaryData[i + 2] = binary;
    binaryData[i + 3] = data[i + 3]; // Alpha channel
  }
  
  return {
    width,
    height,
    data: binaryData,
  };
}

/**
 * ノイズ除去（モルフォロジー演算の簡易版）
 */
export function removeNoise(imageData: ImageData, kernelSize: number = 3): ImageData {
  const { width, height, data } = imageData;
  const cleanedData = new Uint8ClampedArray(data.length);
  
  const halfKernel = Math.floor(kernelSize / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // 周囲のピクセルをチェック
      let whiteCount = 0;
      let totalCount = 0;
      
      for (let ky = -halfKernel; ky <= halfKernel; ky++) {
        for (let kx = -halfKernel; kx <= halfKernel; kx++) {
          const nx = x + kx;
          const ny = y + ky;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = (ny * width + nx) * 4;
            const gray = Math.round(0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2]);
            
            if (gray > 128) whiteCount++;
            totalCount++;
          }
        }
      }
      
      // 多数決でノイズ除去
      const result = whiteCount > totalCount / 2 ? 255 : 0;
      
      cleanedData[idx] = result;
      cleanedData[idx + 1] = result;
      cleanedData[idx + 2] = result;
      cleanedData[idx + 3] = data[idx + 3];
    }
  }
  
  return {
    width,
    height,
    data: cleanedData,
  };
}

/**
 * 画像の傾き補正（簡易版）
 */
export function correctSkew(imageData: ImageData): ImageData {
  // 簡易的な傾き検出（水平線の角度を計算）
  const { width, height, data } = imageData;
  
  // 実際の実装では、Hough変換などを使って傾きを検出
  // ここでは簡易的に0度（傾きなし）として返す
  return imageData;
}

/**
 * 画像をリサイズ
 */
export function resizeImage(imageData: ImageData, newWidth: number, newHeight: number): ImageData {
  const { width, height, data } = imageData;
  const resizedData = new Uint8ClampedArray(newWidth * newHeight * 4);
  
  const scaleX = width / newWidth;
  const scaleY = height / newHeight;
  
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const sourceX = Math.floor(x * scaleX);
      const sourceY = Math.floor(y * scaleY);
      
      const sourceIdx = (sourceY * width + sourceX) * 4;
      const targetIdx = (y * newWidth + x) * 4;
      
      resizedData[targetIdx] = data[sourceIdx];
      resizedData[targetIdx + 1] = data[sourceIdx + 1];
      resizedData[targetIdx + 2] = data[sourceIdx + 2];
      resizedData[targetIdx + 3] = data[sourceIdx + 3];
    }
  }
  
  return {
    width: newWidth,
    height: newHeight,
    data: resizedData,
  };
}

/**
 * 画像前処理のメイン関数
 */
export async function preprocessImage(
  file: File,
  config: ImageProcessingConfig
): Promise<ProcessedImage> {
  try {
    // 画像をCanvasに読み込み
    const { canvas, context, imageData } = await loadImageToCanvas(file);
    
    // 画像をリサイズ（サンプル画像分析に基づく最適化）
    const targetWidth = Math.min(imageData.width, 1600); // 1200 → 1600に拡大
    const targetHeight = Math.min(imageData.height, 2400); // 1600 → 2400に拡大
    
    if (imageData.width !== targetWidth || imageData.height !== targetHeight) {
      const resizedData = resizeImage(imageData, targetWidth, targetHeight);
      
      // Canvasを更新
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const newImageData = new ImageData(resizedData.data as ImageDataArray, targetWidth, targetHeight);
      context.putImageData(newImageData, 0, 0);
    }
    
    // 前処理を適用
    let processedData = imageData;
    
    // グレースケール変換
    processedData = convertToGrayscale(processedData);
    
    // コントラスト調整
    processedData = adjustContrast(processedData, 1.5);
    
    // 二値化
    processedData = binarize(processedData, 128);
    
    // ノイズ除去
    processedData = removeNoise(processedData, 3);
    
    // Canvasに結果を描画
    const finalImageData = new ImageData(processedData.data as ImageDataArray, processedData.width, processedData.height);
    context.putImageData(finalImageData, 0, 0);
    
    return {
      canvas,
      context,
      imageData: processedData,
    };
  } catch (error) {
    throw new Error(`画像前処理に失敗しました: ${error}`);
  }
}

/**
 * CanvasからImageDataを取得
 */
export function getImageDataFromCanvas(canvas: HTMLCanvasElement): ImageData {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context not available');
  }
  
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  
  return {
    width: imageData.width,
    height: imageData.height,
    data: imageData.data,
  };
}

/**
 * ImageDataをCanvasに描画
 */
export function drawImageDataToCanvas(imageData: ImageData, canvas: HTMLCanvasElement): void {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context not available');
  }
  
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  
  const imgData = new ImageData(imageData.data as ImageDataArray, imageData.width, imageData.height);
  context.putImageData(imgData, 0, 0);
}
