import type { Metadata } from 'next'
import { ContactClickTracker } from '@/components/ContactClickTracker'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import './globals.css'

export const metadata: Metadata = {
  title: 'Raja Borewells | Borewell Drilling in Hyderabad',
  description:
    'Professional borewell drilling services in Hyderabad, Telangana for homes, farms, commercial projects and agricultural lands.',
  openGraph: {
    title: 'Raja Borewells',
    description: 'Reliable borewell drilling services in Hyderabad, Telangana.',
    type: 'website',
    locale: 'en_IN',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><ContactClickTracker /><ServiceWorkerRegistration />{children}</body>
    </html>
  )
}
