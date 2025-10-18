"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";

interface OCRResult {
  warlordName: string;
  copies: number;
  limitBreak: number;
  isSP: boolean;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

interface OCRBatchResult {
  results: OCRResult[];
  unresolved: string[];
  processingTime: number;
}

export default function OCRTestPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ocrResults, setOcrResults] = useState<OCRBatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setError(null);
    setOcrResults(null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(files);
    setError(null);
    setOcrResults(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const performOCRProcessing = async () => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // 実際のOCR処理を実行
      const { processOCR, createDefaultOCROptions } = await import('@/src/lib/ocr/index');

      // 武将マスタデータを /public/warlords-ocr.json から読み込み
      const resp = await fetch('/warlords-ocr.json');
      const warlords: Array<{ warlordId: string; name: string; prefix?: string | null; fullName?: string; aliases?: string[]; camp?: number }> = await resp.json();
      const warlordMaster = warlords.map(w => ({ 
        warlordId: w.warlordId, 
        name: w.name, 
        prefix: w.prefix,
        fullName: w.fullName,
        aliases: w.aliases,
        camp: w.camp
      }));

      const options = createDefaultOCROptions(warlordMaster);
      options.onProgress = setProgress;
      
      const result = await processOCR(selectedFiles, options);
      
      setOcrResults(result.batchResult);
    } catch (err) {
      console.error('OCR処理エラー:', err);
      setError(`OCR処理中にエラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmResults = () => {
    // TODO: 結果をAssetsスキーマに変換して保存
    console.log("OCR結果を確定:", ocrResults);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">OCR機能テスト</h1>
        <p className="text-gray-600">
          武将スクリーンショットをアップロードして、OCR処理をテストします
        </p>
      </div>

      {/* ファイルアップロード */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            画像アップロード
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="mb-4">画像ファイルをドラッグ&ドロップまたは</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              ファイルを選択
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">
                選択されたファイル ({selectedFiles.length}件):
              </p>
              <ul className="text-sm">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OCR処理 */}
      {selectedFiles.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>OCR処理</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={performOCRProcessing}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? "処理中..." : "OCR処理を開始"}
            </Button>

            {isProcessing && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>処理進行状況</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* エラー表示 */}
      {error && (
        <Card className="mb-6 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OCR結果表示 */}
      {ocrResults && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              OCR処理結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                処理時間: {ocrResults.processingTime}秒
              </p>
              <p className="text-sm text-gray-600">
                検出された武将: {ocrResults.results.length}件
              </p>
              {ocrResults.unresolved.length > 0 && (
                <p className="text-sm text-orange-600">
                  未解決: {ocrResults.unresolved.length}件
                </p>
              )}
            </div>

            <div className="space-y-3">
              {ocrResults.results.map((result, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {result.warlordName}
                        {result.isSP && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
                            SP
                          </span>
                        )}
                      </span>
                      <div className="text-sm text-gray-600">
                        所持枚数: {result.copies}枚 | 
                        凸数: {result.limitBreak} | 
                        信頼度: {(result.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        {result.boundingBox.width}×{result.boundingBox.height}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {ocrResults.unresolved.length > 0 && (
                <div className="border rounded-lg p-3 bg-orange-50">
                  <h4 className="font-medium text-orange-800 mb-2">未解決の武将名</h4>
                  <ul className="text-sm text-orange-700">
                    {ocrResults.unresolved.map((name, index) => (
                      <li key={index}>• {name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <Button onClick={handleConfirmResults} className="flex-1">
                結果を確定
              </Button>
              <Button variant="outline" onClick={() => setOcrResults(null)}>
                やり直し
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
