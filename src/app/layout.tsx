import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GDG Design Studio | 행사 에셋 & 연사자 홍보 이미지 제작 스튜디오',
  description:
    'SNS 홍보용 카드, 세션 배너부터 인쇄용 X배너, 3단 팜플렛, 네임택까지 디자인 시스템 기반으로 제작하고 SVG/PNG/JPG로 Export하는 GDG 디자인 스튜디오',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
