import type { Metadata } from 'next';
import './globals.css';

const siteUrl = 'https://launchings.io';
const defaultTitle = 'Launchings — 작동 제품으로 증명하는 한국 빌더 쇼케이스';
const defaultDescription =
  '작동 제품으로 증명하는 한국 0→1 빌더 쇼케이스. 직접 만든 앱·도구를 올리고 커뮤니티의 검증을 받으세요.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: '%s | Launchings',
  },
  description: defaultDescription,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: siteUrl,
    siteName: 'Launchings',
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Launchings — 한국 빌더 쇼케이스',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
