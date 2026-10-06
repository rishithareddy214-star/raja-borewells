'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { BusinessProfile, ServiceItem } from '@/lib/site-data'

type LeadCenterProps = {
  business: BusinessProfile
  services: ServiceItem[]
}

type QuoteForm = {
  customerName: string
  phone: string
  whatsapp: string
  area: string
  village: string
  city: string
  pincode: string
  googleMaps: string
  latitude?: number
  longitude?: number
  purpose: string
  borewellType: string
  boreDiameter: string
  service: string
  approxDepth: string
  landSize: string
  preferredDate: string
  message: string
  consent: boolean
  website: string
}

const emptyQuote: QuoteForm = {
  customerName: '',
  phone: '',
  whatsapp: '',
  area: '',
  village: '',
  city: 'Hyderabad',
  pincode: '',
  googleMaps: '',
  purpose: 'Residential',
  borewellType: 'New Borewell',
  boreDiameter: '',
  service: '',
  approxDepth: '',
  landSize: '',
  preferredDate: '',
  message: '',
  consent: false,
  website: '',
}

const fieldsByStep = [
  ['Customer Information', 'Name, mobile and WhatsApp details help the owner respond.'],
  ['Location', 'Tell us where the work is needed. Share your location only if you choose.'],
  ['Purpose', 'What kind of property or use is this borewell for?'],
  ['Borewell Requirement', 'Select the work you need.'],
  ['Additional Information', 'Optional details help prepare a more useful discussion.'],
  ['Review Request', 'Your enquiry is ready. Review the details before submitting.'],
]

function whatsappUrl(number: string, text: string) {
  const digits = number.replace(/\D/g, '').replace(/^91/, '')
  return `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`
}

export function LeadCenter({ business, services }: LeadCenterProps) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<QuoteForm>(emptyQuote)
  const [message, setMessage] = useState('')
  const [leadId, setLeadId] = useState('')
  const [areaQuery, setAreaQuery] = useState('')
  const [areaResult, setAreaResult] = useState('')
  const [areaError, setAreaError] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)
  const [locationConfirmed, setLocationConfirmed] = useState(false)
  const [rateConfig, setRateConfig] = useState<{ ratePerFoot: number | null; minimumCharge: number; equipmentCharge: number; transportCharge: number } | null>(null)
  const [depth, setDepth] = useState('')
  const [diameter, setDiameter] = useState('5 inch')
  const [estimatorPurpose, setEstimatorPurpose] = useState('Residential')
  const [estimatorLocation, setEstimatorLocation] = useState('')
  const [existingBorewell, setExistingBorewell] = useState('New Borewell')
  const [cleaningSelected, setCleaningSelected] = useState(false)
  const [pumpSelected, setPumpSelected] = useState(false)
  const [estimate, setEstimate] = useState<number | null>(null)

  const setField = <K extends keyof QuoteForm>(field: K, value: QuoteForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setMessage('Location sharing is not supported by this browser. Enter the address or Maps link manually.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const googleMaps = `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`
        setForm((current) => ({ ...current, latitude: coords.latitude, longitude: coords.longitude, googleMaps }))
        setLocationConfirmed(false)
        setMessage('Location received. Review and confirm it before submitting.')
      },
      () => setMessage('Location permission was not granted. You can enter the location manually.'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const checkArea = async (event: React.FormEvent) => {
    event.preventDefault()
    setAreaError('')
    setAreaResult('')
    setIsAvailable(false)
    try {
      const response = await fetch(`/api/service-area?query=${encodeURIComponent(areaQuery)}`)
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to check this area.')
      setIsAvailable(result.available)
      setAreaResult(result.available
        ? `Yes, Raja Borewells currently serves ${result.area}.`
        : `We currently don't have ${areaQuery} listed. Contact us to check availability.`)
    } catch (error) {
      setAreaError(error instanceof Error ? error.message : 'Unable to check this area.')
    }
  }

  const submitEnquiry = async () => {
    setMessage('Submitting your enquiry...')
    try {
      const currentUrl = new URL(window.location.href)
      const sourceParam = (currentUrl.searchParams.get('utm_source') ?? '').toLowerCase()
      const referrer = document.referrer.toLowerCase()
      const leadSource = sourceParam.includes('google') || referrer.includes('google.com')
        ? referrer.includes('/maps') ? 'Google Maps' : 'Google Search'
        : sourceParam.includes('whatsapp') || referrer.includes('whatsapp') ? 'WhatsApp'
          : sourceParam.includes('instagram') || referrer.includes('instagram') ? 'Instagram'
            : sourceParam.includes('facebook') || referrer.includes('facebook') ? 'Facebook'
              : referrer ? 'Referral' : 'Direct'
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          contactType: 'quote',
          sourcePage: currentUrl.pathname,
          leadSource,
          deviceType: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to submit enquiry.')
      setLeadId(result.leadId)
      setMessage(result.message)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit enquiry.')
    }
  }

  const submitCallback = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const currentForm = event.currentTarget
    const formData = new FormData(currentForm)
    setMessage('Submitting callback request...')
    try {
      const response = await fetch('/api/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          phone: formData.get('phone'),
          preferredTime: formData.get('preferredTime'),
          message: formData.get('message'),
          consent: formData.get('consent') === 'on',
          website: formData.get('website'),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to submit callback request.')
      setMessage(result.message)
      currentForm.reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit callback request.')
    }
  }

  const getEstimate = async () => {
    try {
      const response = await fetch('/api/estimator')
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to load estimate rules.')
      setRateConfig(result.config)
      if (!result.config || result.config.ratePerFoot === null || Number(depth) <= 0) {
        setEstimate(null)
        return
      }
      const extras = (cleaningSelected ? result.config.cleaningCharge : 0)
        + (pumpSelected ? result.config.pumpInstallationCharge : 0)
      setEstimate(Math.max(result.config.minimumCharge, Number(depth) * result.config.ratePerFoot)
        + result.config.equipmentCharge + result.config.transportCharge + extras)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to calculate an estimate.')
    }
  }

  const ownerMessage = [
    `Hello ${business.ownerName},`,
    '',
    'I am interested in borewell services.',
    '',
    `Customer: ${form.customerName}`,
    `Area: ${[form.area, form.village, form.city, form.pincode].filter(Boolean).join(', ')}`,
    `Requirement: ${form.service || form.borewellType}`,
    `Purpose: ${form.purpose}`,
    `Approximate Depth: ${form.approxDepth || 'Not specified'}`,
    `Bore Diameter: ${form.boreDiameter || 'Not specified'}`,
    `Preferred Date: ${form.preferredDate || 'Flexible'}`,
    '',
    'Please contact me regarding the quotation.',
    '',
    'Thank you.',
  ].join('\n')

  const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-800'
  const labelClass = 'block text-sm font-medium text-slate-700'

  return (
    <section className="bg-slate-100 py-14" aria-labelledby="smart-quote-title">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.5fr_0.8fr] lg:px-8">
        <div id="get-a-quote" className="rounded-3xl bg-white p-6 shadow-xl shadow-sky-100 sm:p-8">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Get a Quote</p>
            <h2 id="smart-quote-title" className="mt-2 text-3xl font-black text-sky-950">Tell us about your borewell requirement</h2>
            <div className="mt-5 flex items-center gap-2" aria-label={`Step ${step + 1} of 6`}>
              {fieldsByStep.map(([title], index) => (
                <div key={title} className={`h-2 flex-1 rounded-full ${index <= step ? 'bg-sky-600' : 'bg-slate-200'}`} />
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">Step {step + 1} of 6 · {fieldsByStep[step][0]}</p>
          </div>

          {leadId ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <p className="text-sm font-bold tracking-widest text-emerald-700">SUCCESS</p>
              <h3 className="mt-2 text-2xl font-bold text-emerald-950">Thank you for contacting Raja Borewells.</h3>
              <p className="mt-3 text-emerald-900">Your enquiry ID is <strong>{leadId}</strong>.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={`tel:${business.phone}`} className="rounded-full bg-sky-600 px-5 py-3 font-semibold text-white">CALL OWNER</a>
                <a href={whatsappUrl(business.whatsapp, ownerMessage)} target="_blank" rel="noreferrer" className="rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white">WHATSAPP OWNER</a>
                <Link href="/" className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-700">BACK TO HOME</Link>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold text-sky-950">{fieldsByStep[step][0]}</h3>
              <p className="mb-5 mt-1 text-sm text-slate-600">{fieldsByStep[step][1]}</p>

              {step === 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>Name<input className={inputClass} value={form.customerName} onChange={(e) => setField('customerName', e.target.value)} required /></label>
                  <label className={labelClass}>Mobile Number<input className={inputClass} type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} required /></label>
                  <label className={labelClass}>WhatsApp Number<input className={inputClass} type="tel" value={form.whatsapp} onChange={(e) => setField('whatsapp', e.target.value)} /></label>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>Area<input className={inputClass} value={form.area} onChange={(e) => setField('area', e.target.value)} required /></label>
                  <label className={labelClass}>Village<input className={inputClass} value={form.village} onChange={(e) => setField('village', e.target.value)} /></label>
                  <label className={labelClass}>City<input className={inputClass} value={form.city} onChange={(e) => setField('city', e.target.value)} /></label>
                  <label className={labelClass}>Pincode<input className={inputClass} inputMode="numeric" value={form.pincode} onChange={(e) => setField('pincode', e.target.value)} /></label>
                  <label className={`${labelClass} sm:col-span-2`}>Google Maps Location<input className={inputClass} type="url" placeholder="Paste a Google Maps link (optional)" value={form.googleMaps} onChange={(e) => { setField('googleMaps', e.target.value); setLocationConfirmed(false) }} /></label>
                  <div className="sm:col-span-2">
                    <button type="button" onClick={captureLocation} className="min-h-11 rounded-full border border-sky-600 px-5 py-2.5 font-semibold text-sky-700">Use My Current Location</button>
                    {form.latitude !== undefined && form.longitude !== undefined ? (
                      <div className="mt-4 rounded-xl border border-sky-100 p-3">
                        <p className="mb-3 text-sm text-slate-700">Selected coordinates: {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}</p>
                        <iframe title="Confirm selected location" src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=15&output=embed`} className="h-48 w-full rounded-lg border-0" loading="lazy" />
                        <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
                          <input type="checkbox" checked={locationConfirmed} onChange={(e) => setLocationConfirmed(e.target.checked)} />
                          Confirm this is the correct site location
                        </label>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {['Residential', 'Agriculture', 'Commercial', 'Industrial', 'Other'].map((purpose) => (
                    <label key={purpose} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${form.purpose === purpose ? 'border-sky-600 bg-sky-50' : 'border-slate-200'}`}>
                      <input type="radio" name="purpose" value={purpose} checked={form.purpose === purpose} onChange={() => setField('purpose', purpose)} />
                      {purpose}
                    </label>
                  ))}
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {['New Borewell', 'Existing Borewell', 'Cleaning', 'Repair', 'Pump Installation', 'Inspection'].map((type) => (
                    <label key={type} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${form.borewellType === type ? 'border-sky-600 bg-sky-50' : 'border-slate-200'}`}>
                      <input type="radio" name="borewellType" value={type} checked={form.borewellType === type} onChange={() => setField('borewellType', type)} />
                      {type}
                    </label>
                  ))}
                  <label className={`${labelClass} sm:col-span-2`}>Service detail<select className={inputClass} value={form.service} onChange={(e) => setField('service', e.target.value)}><option value="">Select a service (optional)</option>{services.map((service) => <option key={service.id} value={service.name}>{service.name}</option>)}</select></label>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>Approximate Depth<input className={inputClass} value={form.approxDepth} onChange={(e) => setField('approxDepth', e.target.value)} placeholder="e.g. 300 ft (optional)" /></label>
                  <label className={labelClass}>Bore Diameter<input className={inputClass} value={form.boreDiameter} onChange={(e) => setField('boreDiameter', e.target.value)} placeholder="e.g. 5 inch" /></label>
                  <label className={labelClass}>Land Size<input className={inputClass} value={form.landSize} onChange={(e) => setField('landSize', e.target.value)} /></label>
                  <label className={labelClass}>Preferred Date<input className={inputClass} type="date" value={form.preferredDate} onChange={(e) => setField('preferredDate', e.target.value)} /></label>
                  <label className={`${labelClass} sm:col-span-2`}>Message<textarea className={`${inputClass} min-h-24`} value={form.message} onChange={(e) => setField('message', e.target.value)} /></label>
                </div>
              ) : null}

              {step === 5 ? (
                <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
                  <p><strong>Customer:</strong> {form.customerName} · {form.phone}</p>
                  <p><strong>Location:</strong> {[form.area, form.village, form.city, form.pincode].filter(Boolean).join(', ')}</p>
                  <p><strong>Requirement:</strong> {form.service || form.borewellType} · {form.purpose}</p>
                  <p><strong>Depth:</strong> {form.approxDepth || 'Not specified'} · <strong>Diameter:</strong> {form.boreDiameter || 'Not specified'} · <strong>Preferred date:</strong> {form.preferredDate || 'Flexible'}</p>
                  <label className={labelClass}>Website<input className="sr-only" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setField('website', e.target.value)} /></label>
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <input type="checkbox" checked={form.consent} onChange={(e) => setField('consent', e.target.checked)} required />
                    I agree to be contacted regarding my enquiry.
                  </label>
                  {form.latitude !== undefined && !locationConfirmed ? <p className="text-sm font-medium text-amber-700">Please confirm the selected map location before submitting.</p> : null}
                </div>
              ) : null}

              <div className="mt-7 flex flex-wrap justify-between gap-3">
                <button type="button" disabled={step === 0} onClick={() => setStep((current) => Math.max(current - 1, 0))} className="min-h-11 rounded-full border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 disabled:opacity-40">Back</button>
                {step < 5 ? (
                  <button type="button" onClick={() => {
                    if (step === 0 && (!form.customerName.trim() || form.phone.replace(/\D/g, '').length < 8)) {
                      setMessage('Enter your name and a valid mobile number to continue.')
                      return
                    }
                    if (step === 1 && (!form.area.trim() || (form.latitude !== undefined && !locationConfirmed))) {
                      setMessage('Enter your area and confirm any shared location before continuing.')
                      return
                    }
                    setMessage('')
                    setStep((current) => current + 1)
                  }} className="min-h-11 rounded-full bg-sky-600 px-6 py-2.5 font-semibold text-white">Continue</button>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    <button type="button" disabled={!form.consent || Boolean(form.latitude !== undefined && !locationConfirmed)} onClick={submitEnquiry} className="min-h-11 rounded-full bg-sky-600 px-6 py-2.5 font-semibold text-white disabled:opacity-50">SUBMIT ENQUIRY</button>
                    <a href={whatsappUrl(business.whatsapp, ownerMessage)} target="_blank" rel="noreferrer" className="min-h-11 rounded-full bg-emerald-600 px-5 py-2.5 font-semibold text-white">WHATSAPP OWNER</a>
                    <a href={`tel:${business.phone}`} className="min-h-11 rounded-full border border-sky-600 px-5 py-2.5 font-semibold text-sky-700">CALL OWNER</a>
                  </div>
                )}
              </div>
              {message ? <p className="mt-4 text-sm text-slate-700" role="status">{message}</p> : null}
            </>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-lg shadow-sky-100">
            <h2 className="text-xl font-black text-sky-950">Check if we serve your area</h2>
            <form onSubmit={checkArea} className="mt-4 flex gap-2">
              <input aria-label="Area, village or pincode" value={areaQuery} onChange={(e) => setAreaQuery(e.target.value)} placeholder="Area / Village / Pincode" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-3" required />
              <button className="rounded-xl bg-sky-600 px-4 font-semibold text-white">Check</button>
            </form>
            {areaResult ? <p className={`mt-4 text-sm ${isAvailable ? 'text-emerald-700' : 'text-slate-600'}`}>{areaResult}</p> : null}
            {areaError ? <p className="mt-4 text-sm text-rose-700">{areaError}</p> : null}
            <div className="mt-4 flex gap-2">
              <a href={`tel:${business.phone}`} className="rounded-full border border-sky-600 px-4 py-2 text-sm font-semibold text-sky-700">CALL OWNER</a>
              <a href={whatsappUrl(business.whatsapp, `Hello ${business.ownerName}, do you serve ${areaQuery || 'my area'}?`)} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">WHATSAPP</a>
            </div>
          </div>

          <form onSubmit={submitCallback} className="rounded-3xl bg-white p-6 shadow-lg shadow-sky-100">
            <h2 className="text-xl font-black text-sky-950">Request a Callback</h2>
            <div className="mt-4 space-y-3">
              <label className={labelClass}>Name<input className={inputClass} name="name" required minLength={2} maxLength={200} /></label>
              <label className={labelClass}>Phone<input className={inputClass} name="phone" type="tel" required /></label>
              <label className={labelClass}>Preferred Time<select className={inputClass} name="preferredTime"><option>Morning</option><option>Afternoon</option><option>Evening</option><option>Anytime</option></select></label>
              <label className={labelClass}>Message<textarea className={`${inputClass} min-h-20`} name="message" /></label>
              <label className="hidden" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
              <label className="flex items-start gap-2 text-sm text-slate-700"><input name="consent" type="checkbox" required /> I agree to be contacted regarding my enquiry.</label>
              <button className="min-h-11 rounded-full bg-sky-600 px-5 py-2.5 font-semibold text-white">REQUEST CALLBACK</button>
            </div>
          </form>

          <div className="rounded-3xl bg-sky-950 p-6 text-white">
            <h2 className="text-xl font-black">Borewell Cost Estimator</h2>
            <p className="mt-2 text-sm text-sky-100">Approximate Estimate only. Final cost depends on actual site conditions and requirements.</p>
            <div className="mt-4 grid gap-3">
              <label className="text-sm">Bore diameter<select value={diameter} onChange={(e) => setDiameter(e.target.value)} className="mt-1 w-full rounded-xl border-0 bg-white px-3 py-3 text-slate-800"><option>5 inch</option><option>6.5 inch</option></select></label>
              <label className="text-sm">Estimated depth (feet)<input type="number" min="1" value={depth} onChange={(e) => setDepth(e.target.value)} className="mt-1 w-full rounded-xl border-0 bg-white px-3 py-3 text-slate-800" /></label>
              <label className="text-sm">Purpose<select value={estimatorPurpose} onChange={(e) => setEstimatorPurpose(e.target.value)} className="mt-1 w-full rounded-xl border-0 bg-white px-3 py-3 text-slate-800"><option>Residential</option><option>Agriculture</option><option>Commercial</option><option>Industrial</option><option>Other</option></select></label>
              <label className="text-sm">Location<input value={estimatorLocation} onChange={(e) => setEstimatorLocation(e.target.value)} className="mt-1 w-full rounded-xl border-0 bg-white px-3 py-3 text-slate-800" /></label>
              <label className="text-sm">Borewell<select value={existingBorewell} onChange={(e) => setExistingBorewell(e.target.value)} className="mt-1 w-full rounded-xl border-0 bg-white px-3 py-3 text-slate-800"><option>New Borewell</option><option>Existing Borewell</option></select></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cleaningSelected} onChange={(e) => setCleaningSelected(e.target.checked)} /> Add borewell cleaning</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pumpSelected} onChange={(e) => setPumpSelected(e.target.checked)} /> Add pump installation</label>
              <button type="button" onClick={getEstimate} className="min-h-11 rounded-full bg-sky-500 px-5 py-2.5 font-semibold text-white">Calculate Estimate</button>
              {estimate !== null ? <div><p className="text-lg font-bold">Approximate Estimate: ₹{estimate.toLocaleString('en-IN')}</p><p className="mt-1 text-xs text-sky-100">{diameter} · {estimatorPurpose} · {estimatorLocation || 'Location not specified'} · {existingBorewell}</p></div> : rateConfig?.ratePerFoot === null ? <p className="text-sm text-sky-100">Rates have not been configured by the business. Contact us for an accurate quotation.</p> : null}
            </div>
          </div>

          {business.googleMapsUrl ? (
            <a href={business.googleMapsUrl} target="_blank" rel="noreferrer" className="block rounded-3xl bg-white p-5 text-center font-bold text-sky-800 shadow-lg shadow-sky-100">GET DIRECTIONS</a>
          ) : null}
        </aside>
      </div>
    </section>
  )
}
