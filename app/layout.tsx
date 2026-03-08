import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

import LoginTracker from '@/components/auth/LoginTracker'

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Steven Golus | Training Portal',
  description: 'Premium AI-powered training and question management for the Steven Golus brand.',
  icons: {
    icon: '/icon.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased selection:bg-slate-200`}>
        <LoginTracker />
        {children}
      </body>
    </html>
  )
}
