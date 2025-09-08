import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import fevicon from "../public/favicon.ico"
import apple from "../public/apple-touch-icon.png"


export const metadata: Metadata = {
  title: 'CodeNova | AI-Based Code Editor',
  description: 'Created with Next.js, Geist UI',
  generator: 'Next.js',
  icons: {
    icon: '/favicon.ico',           // path relative to public folder
    apple: '/apple-touch-icon.png', // optional for iOS
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
