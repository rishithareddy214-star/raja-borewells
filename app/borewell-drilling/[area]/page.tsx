import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LeadCenter } from '@/components/LeadCenter'
import { readPublicSiteData, readSiteData } from '@/lib/site-data'

type AreaPageProps = {
  params: Promise<{ area: string }>
}

function areaSlug(area: string) {
  return area.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: AreaPageProps): Promise<Metadata> {
  const { area: slug } = await params
  const { serviceAreas } = await readSiteData()
  const area = serviceAreas.find((item) => areaSlug(item) === slug)
  if (!area) return { title: 'Service area not found | Raja Borewells' }
  return {
    title: `Borewell Drilling in ${area} | Raja Borewells`,
    description: `Contact Raja Borewells to discuss borewell drilling and water solutions in ${area}, Hyderabad. Availability and quotation depend on site conditions.`,
    alternates: { canonical: `/borewell-drilling-${slug}` },
    openGraph: {
      title: `Borewell Drilling in ${area} | Raja Borewells`,
      description: `Discuss borewell drilling requirements for ${area} with Raja Borewells.`,
      type: 'website',
    },
  }
}

export default async function AreaLandingPage({ params }: AreaPageProps) {
  const { area: slug } = await params
  const data = await readPublicSiteData()
  const area = data.serviceAreas.find((item) => areaSlug(item) === slug)
  if (!area) notFound()

  const message = encodeURIComponent(`Hello ${data.businessProfile.ownerName}, I need borewell service in ${area}. Please confirm availability and provide an approximate quotation.`)
  const encodedOwner = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: data.businessProfile.businessName,
    telephone: data.businessProfile.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: data.businessProfile.city,
      addressRegion: data.businessProfile.state,
      addressCountry: 'IN',
    },
    areaServed: area,
    url: process.env.NEXT_PUBLIC_APP_URL,
  }).replace(/</g, '\\u003c')

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: encodedOwner }} />
      <header className="bg-sky-950 px-4 py-5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="font-black tracking-wide">RAJA BOREWELLS</Link>
          <Link href="/" className="text-sm font-semibold text-sky-200">Home</Link>
        </div>
      </header>
      <section className="bg-gradient-to-br from-sky-950 to-sky-700 px-4 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="font-semibold uppercase tracking-[0.2em] text-sky-200">Hyderabad, Telangana</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black sm:text-5xl">Borewell Drilling in {area}</h1>
          <p className="mt-5 max-w-2xl text-lg text-sky-100">Raja Borewells provides borewell drilling and water-solution services. Share your exact site location so availability and site requirements can be discussed before work is planned.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={`tel:${data.businessProfile.phone}`} className="rounded-full bg-white px-5 py-3 font-bold text-sky-950">CALL OWNER</a>
            <a href={`https://wa.me/91${data.businessProfile.whatsapp.replace(/\D/g, '').replace(/^91/, '')}?text=${message}`} className="rounded-full bg-emerald-500 px-5 py-3 font-bold text-white">WHATSAPP OWNER</a>
            <a href="#area-quote" className="rounded-full border border-white/50 px-5 py-3 font-bold text-white">GET QUOTE</a>
            <Link href="/#request-site-visit" className="rounded-full border border-white/50 px-5 py-3 font-bold text-white">REQUEST SITE VISIT</Link>
          </div>
          <p className="mt-5 max-w-2xl text-sm text-sky-200">Service availability is confirmed according to the specific site location and current operating conditions. Water availability depends on local geological conditions.</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-2xl font-black text-sky-950">Services available to discuss</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.services.map((service) => (
            <div key={service.id} className="rounded-2xl border border-sky-100 bg-white p-5">
              <h3 className="font-bold text-sky-950">{service.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{service.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl bg-sky-50 p-5">
          <h2 className="text-xl font-bold text-sky-950">Frequently asked</h2>
          <div className="mt-4 space-y-4">
            {data.faqs.slice(0, 4).map((faq) => (
              <div key={faq.id}>
                <h3 className="font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-1 text-sm text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div id="area-quote">
        <LeadCenter business={data.businessProfile} services={data.services} />
      </div>
      <footer className="bg-sky-950 px-4 py-6 text-center text-sm text-sky-100">© 2026 Raja Borewells · {area}, Hyderabad</footer>
    </main>
  )
}
