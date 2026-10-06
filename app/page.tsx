import { SiteLanding } from '@/components/SiteLanding'
import { readPublicSiteData } from '@/lib/site-data'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const data = await readPublicSiteData()
  const profile = data.businessProfile
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: profile.businessName,
    address: {
      '@type': 'PostalAddress',
      addressLocality: profile.city,
      addressRegion: profile.state,
      addressCountry: 'IN',
    },
    ...(profile.phone && !/[xX]/.test(profile.phone) ? { telephone: profile.phone } : {}),
    ...(profile.email ? { email: profile.email } : {}),
    ...(profile.latitude !== null && profile.longitude !== null ? {
      geo: { '@type': 'GeoCoordinates', latitude: profile.latitude, longitude: profile.longitude },
    } : {}),
    ...(data.serviceAreas.length ? { areaServed: data.serviceAreas } : {}),
  }).replace(/</g, '\\u003c')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <SiteLanding initialData={data} />
    </>
  )
}
