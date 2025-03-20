import './globals.css';
import type { Metadata } from 'next';
import { Footer } from '@/components/layout/Footer';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

export const metadata: Metadata = {
  title: 'Informações Agrometeorológicas - Triângulo Mineiro Sul',
  description: 'Sistema de vigilância agrometeorológica para o Triângulo Mineiro Sul, fornecendo dados climáticos em tempo real para otimização da produção agrícola.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/favicon.ico' }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        {children}
        <Footer />
      </body>
    </html>
  );
}
