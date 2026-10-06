'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import type { SiteData } from '@/lib/site-data'
import { LeadCenter } from '@/components/LeadCenter'
import { ReviewForm } from '@/components/ReviewForm'

const defaultQuote = {
  customerName: '',
  mobileNumber: '',
  whatsapp: '',
  area: '',
  city: 'Hyderabad',
  landType: '',
  borewellType: '',
  approxDepth: '',
  boreDiameter: '',
  purpose: 'Home',
  preferredDate: '',
  message: '',
  consent: false,
  website: '',
}

const defaultSiteVisit = {
  name: '',
  phone: '',
  location: '',
  googleMaps: '',
  landType: '',
  preferredDate: '',
  preferredTime: '',
  message: '',
  consent: false,
  website: '',
}

const defaultContact = {
  name: '',
  email: '',
  phone: '',
  message: '',
  consent: false,
  website: '',
}

type SiteLandingProps = {
  initialData: SiteData
}

export function SiteLanding({ initialData }: SiteLandingProps) {
  const business = initialData.businessProfile
  const [quoteForm, setQuoteForm] = useState(defaultQuote)
  const [siteForm, setSiteForm] = useState(defaultSiteVisit)
  const [contactForm, setContactForm] = useState(defaultContact)
  const [quoteStatus, setQuoteStatus] = useState('')
  const [siteStatus, setSiteStatus] = useState('')
  const [contactStatus, setContactStatus] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const whatsappBase = useMemo(() => {
    const digits = (business.whatsapp || '+91XXXXXXXXXX').replace(/\D/g, '')
    return `https://wa.me/91${digits.replace(/^91/, '')}`
  }, [business.whatsapp])

  const toWhatsApp = (message: string) => `${whatsappBase}?text=${encodeURIComponent(message)}`

  const handleQuote = async (event: React.FormEvent) => {
    event.preventDefault()
    setQuoteStatus('Submitting...')

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: quoteForm.customerName,
          phone: quoteForm.mobileNumber,
          whatsapp: quoteForm.whatsapp,
          area: quoteForm.area,
          city: quoteForm.city,
          landType: quoteForm.landType,
          borewellType: quoteForm.borewellType,
          approxDepth: quoteForm.approxDepth,
          preferredDate: quoteForm.preferredDate,
          message: quoteForm.message,
          purpose: quoteForm.purpose,
          boreDiameter: quoteForm.boreDiameter,
          consent: quoteForm.consent,
          website: quoteForm.website,
        }),
      })

      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Unable to submit your quote request.')
      setQuoteStatus(json.message)
      setQuoteForm(defaultQuote)
    } catch (error) {
      console.error('Quote request submission failed', error)
      setQuoteStatus(error instanceof Error ? error.message : 'Unable to submit your quote request. Please call the owner.')
    }
  }

  const handleSiteVisit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSiteStatus('Requesting site visit...')

    try {
      const response = await fetch('/api/site-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteForm),
      })

      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Unable to request a site visit.')
      setSiteStatus(json.message)
      setSiteForm(defaultSiteVisit)
    } catch (error) {
      console.error('Site visit request submission failed', error)
      setSiteStatus(error instanceof Error ? error.message : 'Unable to request a site visit. Please call the owner.')
    }
  }

  const handleContact = async (event: React.FormEvent) => {
    event.preventDefault()
    setContactStatus('Sending message...')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })

      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Unable to send your message.')
      setContactStatus(json.message)
      setContactForm(defaultContact)
    } catch (error) {
      console.error('Contact message submission failed', error)
      setContactStatus(error instanceof Error ? error.message : 'Unable to send your message. Please call the owner.')
    }
  }

  const qualifyLocation = async () => {
    if (!navigator.geolocation) {
      setSiteStatus('Geolocation is not supported in this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setSiteForm((prev) => ({
          ...prev,
          googleMaps: `https://maps.google.com/?q=${latitude},${longitude}`,
          location: prev.location || 'Current location',
        }))
        setSiteStatus('Current location added to your site visit request.')
      },
      () => {
        setSiteStatus('Location access was denied. You can still enter the location manually.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-50 border-b border-sky-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-lg font-bold text-white shadow-md">R</div>
            <div>
              <div className="text-lg font-black tracking-wide text-sky-950">RAJA BOREWELLS</div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-700 lg:flex">
            {['Home','About','Services','Rates','Projects','Service Areas','Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g,'-')}`} className="transition hover:text-sky-700">{item}</a>
            ))}
          </nav>
            <button type="button" aria-expanded={mobileMenuOpen} aria-label="Toggle navigation menu" onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-sky-950 lg:hidden">Menu</button>
            <div className="hidden items-center gap-3 lg:flex">
            <a href={`tel:${business.phone}`} className="rounded-full border border-sky-600 px-4 py-2 text-sm font-semibold text-sky-700">CALL NOW</a>
            <a href={toWhatsApp('Hello Raja Borewells, I want to enquire about borewell drilling services.')}
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm">WHATSAPP</a>
          </div>
        </div>
        {mobileMenuOpen ? (
          <nav className="border-t border-sky-100 bg-white px-4 py-3 lg:hidden">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-4">
              {['Home','About','Services','Rates','Projects','Service Areas','Contact'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(/\s+/g,'-')}`} onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-sky-50">{item}</a>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <main>
        <section id="home" className="relative isolate overflow-hidden bg-sky-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_40%)]" />
          <div className="absolute inset-0 bg-[url('/images/borewell/borewell-drilling-india.webp')] bg-cover bg-center opacity-25" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-sky-100">Hyderabad, Telangana</div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">Reliable Borewell Drilling Services in Hyderabad</h1>
              <p className="mt-5 max-w-xl text-lg text-sky-100">Professional borewell drilling solutions for homes, farms, commercial properties and agricultural lands.</p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-sky-100">
                <span>Owner: <strong className="font-semibold text-white">{business.ownerName}</strong></span>
                <span>•</span>
                <span>{business.address}</span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href={`tel:${business.phone}`} className="rounded-full bg-sky-500 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:bg-sky-400">CALL NOW</a>
                <a href={toWhatsApp('Hello Raja Borewells, I want to enquire about borewell drilling services.')} className="rounded-full bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400">WHATSAPP</a>
                <a href="#get-a-quote" className="rounded-full border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20">GET A QUOTE</a>
                <a href="#request-site-visit" className="rounded-full border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20">REQUEST SITE VISIT</a>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {['Experienced Local Contractor','Transparent Pricing','Fast Response','Hyderabad Service'].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-medium text-sky-50 backdrop-blur-sm">{item}</div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-sky-200/20 bg-white/10 p-4 shadow-2xl shadow-sky-900/30 backdrop-blur-sm">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900">
                <Image src="/images/borewell/borewell-drilling-india.webp" alt="Borewell drilling rig operating at a site in India" width={1200} height={1600} priority className="h-[430px] w-full object-cover" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4 text-white">
                  <div className="text-sm text-sky-100">Service</div>
                  <div className="mt-1 font-bold">Borewell Drilling & Water Solutions</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 text-white">
                  <div className="text-sm text-sky-100">Location</div>
                  <div className="mt-1 font-bold">Hyderabad, Telangana</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="border-b border-sky-100 bg-sky-50">
          <div className="mx-auto grid max-w-7xl gap-3 px-4 py-3 text-sm font-medium text-slate-700 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
            <a href={`tel:${business.phone}`} className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">📞 Call Owner</a>
            <a href={toWhatsApp('Hello Raja Borewells, I want to discuss my borewell requirement.')} className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">💬 WhatsApp</a>
            <div className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">📍 Hyderabad</div>
            <a href="#rates" className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">💰 Get Borewell Rate</a>
          </div>
        </div>

        <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-3xl bg-white p-3 shadow-xl shadow-sky-100">
              <Image src="/images/borewell/borewell-drilling-india.webp" alt="Borewell drilling rig operating at a site in India" width={1200} height={1600} loading="lazy" className="h-[430px] w-full rounded-2xl object-cover" />
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">About Raja Borewells</p>
              <h2 className="text-3xl font-black text-sky-950 sm:text-4xl">About Raja Borewells</h2>
              <p className="mt-5 text-lg leading-8 text-slate-700">Raja Borewells is a locally operated borewell drilling service based in Hyderabad. Owner Banda Malla Reddy provides borewell drilling solutions for residential, agricultural, commercial and other water requirements.</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <div className="text-sm text-slate-500">Owner</div>
                  <div className="mt-2 text-lg font-bold text-sky-950">{business.ownerName}</div>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <div className="text-sm text-slate-500">Business</div>
                  <div className="mt-2 text-lg font-bold text-sky-950">{business.businessName}</div>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <div className="text-sm text-slate-500">Location</div>
                  <div className="mt-2 text-lg font-bold text-sky-950">{business.address}</div>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <div className="text-sm text-slate-500">Experience</div>
                  <div className="mt-2 text-lg font-bold text-sky-950">{business.experience}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="bg-sky-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Our Services</p>
                <h2 className="mt-2 text-3xl font-black text-sky-950 sm:text-4xl">Borewell Services</h2>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {initialData.services.map((service) => (
                <div key={service.id} className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-2xl">💧</div>
                  <h3 className="text-xl font-bold text-sky-950">{service.name}</h3>
                  <p className="mt-3 text-slate-600">{service.description}</p>
                  <a data-service-id={service.id} href={toWhatsApp(`Hello Banda Malla Reddy, I need help with ${service.name}. Please provide details and the approximate rate.`)} className="mt-6 inline-flex rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white">Get Quote</a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="rates" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Borewell Rates</p>
            <h2 className="mt-2 text-3xl font-black text-sky-950 sm:text-4xl">Know Our Borewell Rates</h2>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-sky-100 bg-white shadow-lg shadow-sky-100">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-sky-950 text-white">
                <tr>
                  <th className="px-4 py-4">Service</th>
                  <th className="px-4 py-4">Unit</th>
                  <th className="px-4 py-4">Starting Rate</th>
                  <th className="px-4 py-4">Details</th>
                  <th className="px-4 py-4">Get Quote</th>
                </tr>
              </thead>
              <tbody>
                {initialData.serviceRates.map((rate) => (
                  <tr key={rate.id} className="border-t border-sky-100">
                    <td className="px-4 py-4 font-semibold text-slate-800">{rate.service}</td>
                    <td className="px-4 py-4 text-slate-600">{rate.unit}</td>
                    <td className="px-4 py-4 text-slate-600">{rate.startingRate}</td>
                    <td className="px-4 py-4 text-slate-600">{rate.details}</td>
                    <td className="px-4 py-4">
                      <a href={toWhatsApp('Hello Raja Borewells, I would like to know the current borewell drilling rates.')} className="rounded-full bg-sky-600 px-3 py-2 text-xs font-semibold text-white">ASK TODAY&apos;S RATE</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 text-center text-sm text-slate-600">Final borewell cost depends on location, drilling depth, soil/rock conditions, bore diameter, machinery requirements and other site conditions. Contact us for an accurate quotation.</p>
        </section>

        <section className="bg-slate-900 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-6">
              {['Experienced Local Service','Transparent Quotations','Modern Drilling Equipment','Quick Response','Customer-Focused Service','Residential & Agricultural Solutions'].map((title) => (
                <div key={title} className="rounded-3xl border border-slate-700 bg-slate-800 p-5 text-white">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-xl text-sky-300">✓</div>
                  <h3 className="font-semibold leading-6">{title}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">How It Works</p>
            <h2 className="mt-2 text-3xl font-black text-sky-950 sm:text-4xl">How It Works</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['1. Contact Us', 'Reach out by call or WhatsApp to discuss your borewell requirement.'],
              ['2. Share Your Location', 'Provide your site address or plot area so we can assess the drilling needs.'],
              ['3. Site Assessment / Discussion', 'Review geology, expected depth and project requirements with the owner.'],
              ['4. Borewell Drilling', 'Proceed with the drilling work and water point development based on the site plan.'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-3xl border border-sky-100 bg-white p-6 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-xl font-black text-sky-700">{title.split('.')[0]}</div>
                <h3 className="text-lg font-bold text-sky-950">{title}</h3>
                <p className="mt-3 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="projects" className="bg-sky-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Recent Work</p>
              <h2 className="mt-2 text-3xl font-black text-sky-950 sm:text-4xl">Recent Borewell Projects</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {initialData.projects.map((project) => (
                <article key={project.id} className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
                  <img src={project.image} alt={project.title} className="h-56 w-full object-cover" />
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl font-bold text-sky-950">{project.title}</h3>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{project.status}</span>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <div><span className="font-semibold text-slate-800">Location:</span> {project.location}</div>
                      <div><span className="font-semibold text-slate-800">Project Type:</span> {project.type}</div>
                      <div><span className="font-semibold text-slate-800">Bore Diameter:</span> {project.diameter}</div>
                      <div><span className="font-semibold text-slate-800">Depth:</span> {project.depth}</div>
                      <div><span className="font-semibold text-slate-800">Date:</span> {project.date}</div>
                    </div>
                    <p className="mt-4 text-slate-600">{project.description}</p>
                  </div>
                </article>
              ))}
            </div>
            {!initialData.projects.length ? <p className="rounded-3xl border border-dashed border-sky-200 bg-white p-8 text-center text-slate-600">Verified project photos and details will be shared here when available.</p> : null}
          </div>
        </section>

        <section id="service-areas" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Areas We Serve</p>
            <h2 className="mt-2 text-3xl font-black text-sky-950 sm:text-4xl">Service Areas</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {initialData.serviceAreas.map((area) => (
              <div key={area} className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-center font-semibold text-slate-700 shadow-sm">{area}</div>
            ))}
          </div>
          {!initialData.serviceAreas.length ? <p className="mt-5 text-center text-slate-600">Contact us to confirm service availability for your location.</p> : null}
        </section>

        <section className="bg-slate-900 py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Reviews</p>
              <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Customer Reviews</h2>
            </div>
            {initialData.reviews.filter((review) => review.approved && review.permissionToPublish).length > 0 ? (
              <div className="grid gap-6 md:grid-cols-3">
                {initialData.reviews.filter((review) => review.approved && review.permissionToPublish).map((review) => (
                  <div key={review.id} className="rounded-3xl border border-slate-700 bg-slate-800 p-6">
                    <div className="mb-3 text-amber-400">{'★'.repeat(review.rating)}</div>
                    <p className="text-slate-200">“{review.review}”</p>
                    <div className="mt-4 font-semibold text-white">{review.customerName}</div>
                    <div className="text-sm text-slate-400">{review.area}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-600 bg-slate-800/60 p-8 text-center text-slate-300">Customer reviews will be added here.</div>
            )}
            <ReviewForm />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Frequently Asked Questions</p>
            <h2 className="mt-2 text-3xl font-black text-sky-950 sm:text-4xl">FAQ</h2>
          </div>
          <div className="space-y-4">
            {initialData.faqs.map((faq) => (
              <div key={faq.id} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-sky-950">{faq.question}</h3>
                <p className="mt-2 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <div>
          <LeadCenter business={business} services={initialData.services} />
        </div>

        <section id="quote-form-details" className="bg-sky-50 py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Get a Quote</p>
              <h2 className="mt-2 text-3xl font-black text-sky-950 sm:text-4xl">Request a Quote</h2>
              <p className="mt-4 text-slate-600">Share your site details and receive a call back from Raja Borewells for a borewell discussion.</p>
              <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
                <div className="mb-3 text-sm uppercase tracking-[0.2em] text-sky-700">Owner Contact</div>
                <a href={`tel:${business.phone}`} className="block text-xl font-bold text-sky-950">{business.phone}</a>
                <a href={toWhatsApp('Hello Raja Borewells, I would like to request a quote for borewell drilling.')} className="mt-3 inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">WhatsApp Owner</a>
              </div>
            </div>

            <form onSubmit={handleQuote} className="rounded-3xl bg-white p-6 shadow-lg shadow-sky-100">
              <label className="hidden" aria-hidden="true">Leave this field empty<input value={quoteForm.website} onChange={(e) => setQuoteForm({ ...quoteForm, website: e.target.value })} tabIndex={-1} autoComplete="off" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700"><span>Customer Name</span><input value={quoteForm.customerName} onChange={(e) => setQuoteForm({ ...quoteForm, customerName: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required /></label>
                <label className="block text-sm font-medium text-slate-700"><span>Mobile Number</span><input value={quoteForm.mobileNumber} onChange={(e) => setQuoteForm({ ...quoteForm, mobileNumber: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required /></label>
                <label className="block text-sm font-medium text-slate-700"><span>WhatsApp Number</span><input value={quoteForm.whatsapp} onChange={(e) => setQuoteForm({ ...quoteForm, whatsapp: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium text-slate-700"><span>Village/Area</span><input value={quoteForm.area} onChange={(e) => setQuoteForm({ ...quoteForm, area: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium text-slate-700"><span>City</span><input value={quoteForm.city} onChange={(e) => setQuoteForm({ ...quoteForm, city: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium text-slate-700"><span>Land Type</span><input value={quoteForm.landType} onChange={(e) => setQuoteForm({ ...quoteForm, landType: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium text-slate-700"><span>Required Borewell Type</span><input value={quoteForm.borewellType} onChange={(e) => setQuoteForm({ ...quoteForm, borewellType: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium text-slate-700"><span>Approximate Depth</span><input value={quoteForm.approxDepth} onChange={(e) => setQuoteForm({ ...quoteForm, approxDepth: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium text-slate-700"><span>Bore Diameter</span><input value={quoteForm.boreDiameter} onChange={(e) => setQuoteForm({ ...quoteForm, boreDiameter: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium text-slate-700"><span>Purpose</span><select value={quoteForm.purpose} onChange={(e) => setQuoteForm({ ...quoteForm, purpose: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"><option>Home</option><option>Agriculture</option><option>Commercial</option><option>Industrial</option><option>Other</option></select></label>
                <label className="block text-sm font-medium text-slate-700"><span>Preferred Date</span><input type="date" value={quoteForm.preferredDate} onChange={(e) => setQuoteForm({ ...quoteForm, preferredDate: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700"><span>Additional Requirements</span><textarea value={quoteForm.message} onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })} className="mt-1 min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="submit" className="rounded-full bg-sky-600 px-6 py-3 font-semibold text-white">REQUEST QUOTE</button>
                <a href={toWhatsApp('Hello Raja Borewells, I want to request a quote for a borewell.')} className="rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-700">WhatsApp</a>
              </div>
              <label className="mt-4 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={quoteForm.consent} onChange={(e) => setQuoteForm({ ...quoteForm, consent: e.target.checked })} required /> I agree to be contacted regarding my enquiry.</label>
              {quoteStatus ? <p className="mt-4 text-sm text-slate-700">{quoteStatus}</p> : null}
            </form>
          </div>
        </section>

        <section id="request-site-visit" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Request Site Visit</p>
              <h2 className="mt-2 text-3xl font-black text-sky-950 sm:text-4xl">Request a Site Visit</h2>
              <p className="mt-4 text-slate-600">Share the site location and the owner can assess the project requirements with you.</p>
              <button type="button" onClick={qualifyLocation} className="mt-5 rounded-full bg-sky-600 px-5 py-3 font-semibold text-white">Use My Current Location</button>
            </div>

            <form onSubmit={handleSiteVisit} className="rounded-3xl bg-white p-6 shadow-lg shadow-sky-100">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700"><span>Name</span><input value={siteForm.name} onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required /></label>
                <label className="block text-sm font-medium text-slate-700"><span>Phone</span><input value={siteForm.phone} onChange={(e) => setSiteForm({ ...siteForm, phone: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required /></label>
                <label className="block text-sm font-medium text-slate-700"><span>Location</span><input value={siteForm.location} onChange={(e) => setSiteForm({ ...siteForm, location: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required /></label>
                <label className="block text-sm font-medium text-slate-700"><span>Google Maps Location</span><input value={siteForm.googleMaps} onChange={(e) => setSiteForm({ ...siteForm, googleMaps: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium text-slate-700"><span>Land Type</span><input value={siteForm.landType} onChange={(e) => setSiteForm({ ...siteForm, landType: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium text-slate-700"><span>Preferred Date</span><input type="date" value={siteForm.preferredDate} onChange={(e) => setSiteForm({ ...siteForm, preferredDate: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2"><span>Preferred Time</span><input value={siteForm.preferredTime} onChange={(e) => setSiteForm({ ...siteForm, preferredTime: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2"><span>Message</span><textarea value={siteForm.message} onChange={(e) => setSiteForm({ ...siteForm, message: e.target.value })} className="mt-1 min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
              </div>
              <label className="mt-4 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={siteForm.consent} onChange={(e) => setSiteForm({ ...siteForm, consent: e.target.checked })} required /> I agree to be contacted regarding my request.</label>
              <label className="hidden" aria-hidden="true">Leave this field empty<input value={siteForm.website} onChange={(e) => setSiteForm({ ...siteForm, website: e.target.value })} tabIndex={-1} autoComplete="off" /></label>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="submit" className="rounded-full bg-sky-600 px-6 py-3 font-semibold text-white">REQUEST SITE VISIT</button>
                <a href={toWhatsApp('Hello, I would like to request a borewell site inspection at my location.')} className="rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-700">WhatsApp</a>
              </div>
              {siteStatus ? <p className="mt-4 text-sm text-slate-700">{siteStatus}</p> : null}
            </form>
          </div>
        </section>

        <section id="contact" className="bg-sky-50 py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Contact</p>
              <h2 className="mt-2 text-3xl font-black text-sky-950 sm:text-4xl">Raja Borewells</h2>
              <div className="mt-6 space-y-4 text-slate-700">
                <p><span className="font-semibold text-slate-900">Owner:</span> {business.ownerName}</p>
                <p><span className="font-semibold text-slate-900">Location:</span> {business.address}</p>
                <p><span className="font-semibold text-slate-900">Phone:</span> <a href={`tel:${business.phone}`} className="text-sky-700">{business.phone}</a></p>
                <p><span className="font-semibold text-slate-900">WhatsApp:</span> <a href={toWhatsApp('Hello Raja Borewells, I want to contact you regarding a borewell requirement.')} className="text-sky-700">{business.whatsapp}</a></p>
                {business.email ? <p><span className="font-semibold text-slate-900">Email:</span> <a href={`mailto:${business.email}`} className="text-sky-700">{business.email}</a></p> : null}
                <p><span className="font-semibold text-slate-900">Business Hours:</span> {business.businessHours || 'Please contact us to confirm availability.'}</p>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={`tel:${business.phone}`} className="rounded-full bg-sky-600 px-5 py-3 font-semibold text-white">CALL OWNER</a>
                <a href={toWhatsApp('Hello Raja Borewells, I want to speak with the owner.')} className="rounded-full bg-emerald-500 px-5 py-3 font-semibold text-white">WHATSAPP OWNER</a>
                <a href="#get-a-quote" className="rounded-full border border-sky-600 px-5 py-3 font-semibold text-sky-700">GET QUOTE</a>
              </div>
            </div>

            <form onSubmit={handleContact} className="rounded-3xl bg-white p-6 shadow-lg shadow-sky-100">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700"><span>Name</span><input value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required /></label>
                <label className="block text-sm font-medium text-slate-700"><span>Email</span><input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2"><span>Phone</span><input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required /></label>
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2"><span>Message</span><textarea value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} className="mt-1 min-h-[130px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required /></label>
              </div>
              <label className="mt-4 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={contactForm.consent} onChange={(e) => setContactForm({ ...contactForm, consent: e.target.checked })} required /> I agree to be contacted regarding my enquiry.</label>
              <label className="hidden" aria-hidden="true">Leave this field empty<input value={contactForm.website} onChange={(e) => setContactForm({ ...contactForm, website: e.target.value })} tabIndex={-1} autoComplete="off" /></label>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="submit" className="rounded-full bg-sky-600 px-6 py-3 font-semibold text-white">Send Message</button>
                <a href={toWhatsApp('Hello Raja Borewells, I would like to connect about my project requirements.')} className="rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-700">WhatsApp</a>
              </div>
              {contactStatus ? <p className="mt-4 text-sm text-slate-700">{contactStatus}</p> : null}
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-sky-950 text-sky-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-5 lg:px-8">
          <div className="lg:col-span-2">
            <div className="text-2xl font-black tracking-wide">RAJA BOREWELLS</div>
            <p className="mt-4 text-sky-100">Owner: {business.ownerName}</p>
            <p className="mt-1 text-sky-100">{business.address}</p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2 text-sky-100">
              {['Home','About','Services','Rates','Projects','Contact'].map((link) => (
                <li key={link}><a href={`#${link.toLowerCase()}`}>{link}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Services</h3>
            <ul className="mt-4 space-y-2 text-sky-100">
              {['Borewell Drilling','Agricultural Borewell','Residential Borewell','Borewell Cleaning','Pump Installation'].map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Contact</h3>
            <ul className="mt-4 space-y-2 text-sky-100">
              <li><a href={`tel:${business.phone}`}>Call</a></li>
              <li><a href={toWhatsApp('Hello Raja Borewells, I need support.')} target="_blank" rel="noreferrer">WhatsApp</a></li>
              {business.email ? <li><a href={`mailto:${business.email}`}>Email</a></li> : null}
              <li>{business.address}</li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms &amp; Conditions</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-sky-800 px-4 py-4 text-center text-sm text-sky-200">© 2026 Raja Borewells. All Rights Reserved.</div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-3 gap-2 border-t border-slate-200 bg-white/95 p-2 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm md:hidden">
        <a href={`tel:${business.phone}`} className="flex min-h-12 items-center justify-center rounded-full bg-sky-600 px-2 text-sm font-bold text-white">CALL</a>
        <a href={toWhatsApp('Hello Raja Borewells, I want to contact you.')} className="flex min-h-12 items-center justify-center rounded-full bg-emerald-500 px-2 text-sm font-bold text-white">WHATSAPP</a>
        <a href="#get-a-quote" className="flex min-h-12 items-center justify-center rounded-full bg-sky-950 px-2 text-sm font-bold text-white">QUOTE</a>
      </div>
    </div>
  )
}
