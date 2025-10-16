import './globals.css';
import type { Metadata } from 'next';
import { ReactQueryProvider } from '@/lib/tanstack';
import { Toaster } from '@/components/ui/Toaster';

export const metadata: Metadata = {
  title: '三国志真戦 編成アプリ（MVP）',
  description: '編成パレット + 図鑑 + エクスポート（MVP）',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <ReactQueryProvider>
          <div className="min-h-screen flex flex-col">
            <header className="border-b px-4 py-2">
              <nav className="max-w-6xl mx-auto flex items-center gap-4">
                <a className="font-bold" href="/">真戦編成アプリ（仮）</a>
                <a className="text-sm" href="/composition">編成</a>
                <a className="text-sm" href="/assets">図鑑</a>
                <a className="text-sm" href="/mypage">マイページ</a>
              </nav>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t px-4 py-2 text-xs text-center text-gray-500">MVP</footer>
          </div>
          <Toaster />
        </ReactQueryProvider>
      </body>
    </html>
  );
}