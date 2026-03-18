import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'bababa — Ish topish platformasi',
  description: 'Job marketplace connecting Chinese companies in Uzbekistan with local talent',
}

export const viewport: Viewport = {
  themeColor: '#dc2626',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
