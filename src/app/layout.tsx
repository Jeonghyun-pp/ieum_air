import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppProviders } from '@/contexts'
import { TopNav } from '@/components/shared/top-nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'I:EUM',
  description: '생산성 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AppProviders>
          <TopNav />
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
