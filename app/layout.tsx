import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QueueCut — Skip the waiting room',
  description: 'Book clinic tokens and track your queue position in real time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
