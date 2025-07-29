import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://sidus.app' : 'http://localhost:3000'),
  title: 'Sidus - Your Cosmic Guide',
  description: 'Discover your destiny through the stars. AI-powered astrology, horoscopes, and soulmate connections.',
  keywords: ['astrology', 'horoscope', 'zodiac', 'soulmate', 'cosmic', 'stars', 'destiny'],
  authors: [{ name: 'Sidus Team' }],
  creator: 'Sidus',
  publisher: 'Sidus',
  icons: {
    icon: [
      { url: '/assets/images/sidus_favicon.png', sizes: 'any', type: 'image/png' },
      { url: '/favicon.ico', sizes: '16x16 32x32', type: 'image/x-icon' }
    ],
    apple: { url: '/assets/images/sidus_favicon.png', sizes: '180x180', type: 'image/png' },
    shortcut: '/assets/images/sidus_favicon.png'
  },
  openGraph: {
    title: 'Sidus - Your Cosmic Guide',
    description: 'Discover your destiny through the stars. AI-powered astrology, horoscopes, and soulmate connections.',
    url: 'https://sidus.app',
    siteName: 'Sidus',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Sidus - Your Cosmic Guide',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sidus - Your Cosmic Guide',
    description: 'Discover your destiny through the stars. AI-powered astrology, horoscopes, and soulmate connections.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-aleo cosmic-bg min-h-screen">
        <AuthProvider>
          <div className="relative z-10">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
} 