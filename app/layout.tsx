// app/layout.tsx
import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import '../styles/globals.css'
import { SidebarNav } from '@/components/SidebarNav'
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
      <body>
        <ThemeProvider>
          <SidebarNav />
          <main className="content-area">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
