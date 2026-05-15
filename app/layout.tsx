// app/layout.tsx
import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import '../styles/globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Joseph Patrick Roberts — Principal Product Designer',
  description: 'I simplify complex systems for Hardware, Mobile, Web Apps, and Everything In Between.',
  icons: {
    icon: [
      { url: '/favicon/favicon.ico', sizes: 'any' },
      { url: '/favicon/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon/favicon-16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: { url: '/favicon/apple-touch-icon.png', sizes: '180x180' },
  },
  manifest: '/favicon/site.webmanifest',
  openGraph: {
    title: 'Joseph Patrick Roberts',
    description: 'Principal Product Designer. Hardware, Mobile, Web Apps.',
    url: 'https://joepatbob.com',
    siteName: 'Joseph Patrick Roberts',
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <head>
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000" />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}