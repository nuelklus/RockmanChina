import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BackendWakeUpInitializer from '../components/BackendWakeUpInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rockman Logistics',
  description: 'Full-stack logistics management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BackendWakeUpInitializer />
        {children}
      </body>
    </html>
  )
}
