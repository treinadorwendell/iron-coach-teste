import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#090a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'IronCoach PWA - Personal Trainer Tablet',
  description: 'Progressive Web App para personal trainers otimizado para tablet vertical: gestão de alunos, agenda, prescrição de treinos com métricas e execução de treino em tempo real com cronômetro e histórico de cargas.',
  applicationName: 'IronCoach',
  authors: [{ name: 'IronCoach Personal Training' }],
  generator: 'Next.js',
  keywords: ['personal trainer', 'musculação', 'tablet', 'treino', 'pwa', 'offline', 'academia'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'IronCoach',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'IronCoach PWA - Personal Trainer Tablet',
    description: 'Progressive Web App para personal trainers otimizado para tablet vertical na sala de musculação.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IronCoach PWA - Personal Trainer Tablet',
    description: 'Progressive Web App para personal trainers otimizado para tablet vertical na sala de musculação.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-emerald-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
