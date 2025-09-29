export function toast(message: string) {
  // TODO: shadcn/ui の toaster に差し替え（参照: 03/13）
  console.log("[toast]", message);
}

export function logger(scope: string, ...args: unknown[]) {
  // 参照: 01/4.4 構造化ログ（PII含めない）
  console.log(`[${scope}]`, ...args);
}

