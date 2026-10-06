'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { BusinessProfile, SiteData } from '@/lib/site-data'

type AdminDashboardProps = {
  initialData: SiteData
}

type Lead = {
  id: string
  leadId: string
  customerName: string
  phone: string
  whatsapp: string | null
  area: string | null
  village: string | null
  city: string | null
  serviceLabel: string | null
  borewellType: string | null
  purpose: string | null
  approxDepth: string | null
  boreDiameter: string | null
  status: string
  leadSource: string | null
  sourcePage: string | null
  possibleDuplicate: boolean
  followUpAt: string | null
  followUpDone: boolean
  createdAt: string
  notes: { id: string; note: string; createdAt: string }[]
}

type Callback = {
  id: string
  name: string
  phone: string
  preferredTime: string
  message: string | null
  status: string
  createdAt: string
}

type SiteVisitRequest = {
  id: string
  name: string
  phone: string
  location: string
  googleMaps: string | null
  preferredDate: string | null
  preferredTime: string | null
  message: string | null
  status: string
  createdAt: string
}

type Quotation = {
  id: string
  quotationId: string
  secureToken: string
  enquiryId: string
  description: string
  quantity: number
  unit: string
  rate: number
  additionalCharges: number
  discount: number
  tax: number
  grandTotal: number
  leadId: string
  customerName: string
  phone: string
  whatsapp: string | null
}

type DashboardAnalytics = {
  summary: {
    totalEnquiries: number
    newEnquiries: number
    completedJobs: number
    pendingFollowUps: number
    quoteRequests: number
    siteVisits: number
    whatsappClicks: number
    callClicks: number
  }
  sources: { source: string; count: number }[]
  services: { service: string; count: number }[]
  areas: { area: string; count: number }[]
  leadsByDay: { day: string; count: number }[]
}

const leadStatuses = ['NEW', 'CONTACTED', 'QUOTE SENT', 'SITE VISIT REQUESTED', 'SITE VISIT COMPLETED', 'WORK SCHEDULED', 'WORK IN PROGRESS', 'COMPLETED', 'CANCELLED']

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [activeTab, setActiveTab] = useState('overview')
  const [status, setStatus] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [callbacks, setCallbacks] = useState<Callback[]>([])
  const [siteVisits, setSiteVisits] = useState<SiteVisitRequest[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  const [loadError, setLoadError] = useState('')
  const [leadSearch, setLeadSearch] = useState('')
  const [leadStatus, setLeadStatus] = useState('')
  const [leadService, setLeadService] = useState('')
  const [leadArea, setLeadArea] = useState('')
  const [leadSource, setLeadSource] = useState('')
  const [leadDateFrom, setLeadDateFrom] = useState('')
  const [leadDateTo, setLeadDateTo] = useState('')
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    const params = new URLSearchParams()
    if (leadSearch) params.set('search', leadSearch)
    if (leadStatus) params.set('status', leadStatus)
    if (leadService) params.set('service', leadService)
    if (leadArea) params.set('area', leadArea)
    if (leadSource) params.set('source', leadSource)
    if (leadDateFrom) params.set('dateFrom', leadDateFrom)
    if (leadDateTo) params.set('dateTo', leadDateTo)

    fetch(`/api/admin/leads?${params.toString()}`)
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Lead data could not be loaded.')
        setLeads(result.leads)
        setCallbacks(result.callbacks)
        setAnalytics(result)
        setLoadError('')
      })
      .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : 'Lead data could not be loaded.'))
    fetch('/api/admin/quotations')
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Quotation data could not be loaded.')
        setQuotations(result.quotations)
      })
      .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : 'Quotation data could not be loaded.'))
    fetch('/api/admin/site-visits')
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Site visit requests could not be loaded.')
        setSiteVisits(result.siteVisits)
      })
      .catch((error: unknown) => setLoadError(error instanceof Error ? error.message : 'Site visit requests could not be loaded.'))
  }, [leadSearch, leadStatus, leadService, leadArea, leadSource, leadDateFrom, leadDateTo])

  const createQuotation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const formData = new FormData(formElement)
    setStatus('Creating quotation...')
    const payload = Object.fromEntries(formData.entries())
    try {
      const response = await fetch('/api/admin/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to create quotation.')
      setStatus(result.message)
      formElement.reset()
      const quotesResponse = await fetch('/api/admin/quotations')
      const quotesResult = await quotesResponse.json()
      if (!quotesResponse.ok) throw new Error(quotesResult.error || 'Quotation created, but the list could not be refreshed.')
      setQuotations(quotesResult.quotations)
    } catch (error) {
      console.error('Quotation submission failed', error)
      setStatus(error instanceof Error ? error.message : 'Unable to create quotation.')
    }
  }

  const updateLead = async (payload: { id: string; status?: string; followUpAt?: string | null; followUpDone?: boolean; note?: string }) => {
    try {
      const response = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to update lead.')
      setStatus(result.message)
      setLeads((current) => current.map((lead) => lead.id === payload.id
        ? {
            ...lead,
            ...(payload.status ? { status: payload.status } : {}),
            ...(payload.followUpAt !== undefined ? { followUpAt: payload.followUpAt } : {}),
            ...(payload.followUpDone !== undefined ? { followUpDone: payload.followUpDone } : {}),
            ...(payload.note ? { notes: [...lead.notes, { id: crypto.randomUUID(), note: payload.note, createdAt: new Date().toISOString() }] } : {}),
          }
        : lead))
      if (payload.note) setNoteDrafts((current) => ({ ...current, [payload.id]: '' }))
    } catch (error) {
      console.error('Lead update failed', error)
      setStatus(error instanceof Error ? error.message : 'Unable to update lead.')
    }
  }

  const exportLeads = () => {
    const columns = ['Lead ID', 'Customer', 'Phone', 'Area', 'Service', 'Status', 'Date', 'Source']
    const rows = leads.map((lead) => [
      lead.leadId, lead.customerName, lead.phone, lead.area ?? '', lead.serviceLabel ?? lead.borewellType ?? '',
      lead.status, lead.createdAt, lead.leadSource ?? 'Direct',
    ])
    const csv = [columns, ...rows].map((row) => row.map((field) => {
      const value = String(field).replace(/^[\s\u0000-\u001f]*[=+\-@]/, (prefix) => `'${prefix}`)
      return `"${value.replaceAll('"', '""')}"`
    }).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'raja-borewells-enquiries.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const saveSection = async (section: keyof SiteData) => {
    setStatus('Saving...')
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, value: data[section] }),
      })

      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Unable to save website content.')
      setStatus(json.message)
    } catch (error) {
      console.error('Admin content save failed', error)
      setStatus(error instanceof Error ? error.message : 'Unable to save website content.')
    }
  }

  const updateBusiness = (field: keyof BusinessProfile, value: string) => {
    const newValue = field === 'latitude' || field === 'longitude'
      ? value.trim() === '' ? null : Number(value)
      : value
    setData((current) => ({
      ...current,
      businessProfile: { ...current.businessProfile, [field]: newValue },
    }))
  }

  const tabs = [
    'overview',
    'leads',
    'callbacks',
    'quotations',
    'analytics',
    'business profile',
    'services',
    'rates',
    'projects',
    'areas',
    'enquiries',
    'site visits',
    'reviews',
    'faqs',
    'settings',
  ]

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl bg-sky-950 p-6 text-white shadow-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-200">Admin</p>
            <h1 className="mt-2 text-3xl font-black">Raja Borewells Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="inline-flex rounded-full bg-white px-4 py-2 font-semibold text-sky-950">View Website</Link>
            <button type="button" onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login') }} className="inline-flex rounded-full border border-white/50 px-4 py-2 font-semibold text-white">Log out</button>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${activeTab === tab ? 'bg-sky-600 text-white' : 'bg-white text-slate-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {status ? <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">{status}</div> : null}
        {loadError ? <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{loadError}</div> : null}

        {activeTab === 'overview' ? (
          <div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Total Enquiries', analytics?.summary.totalEnquiries ?? 0],
                ['New Enquiries', analytics?.summary.newEnquiries ?? 0],
                ['Completed Jobs', analytics?.summary.completedJobs ?? 0],
                ['Pending Follow-ups', analytics?.summary.pendingFollowUps ?? 0],
                ['Quote Requests', analytics?.summary.quoteRequests ?? 0],
                ['Site Visits', analytics?.summary.siteVisits ?? 0],
                ['WhatsApp Clicks Today', analytics?.summary.whatsappClicks ?? 0],
                ['Call Clicks Today', analytics?.summary.callClicks ?? 0],
              ].map(([title, value]) => <div key={title} className="rounded-3xl bg-white p-5 shadow-sm"><div className="text-sm text-slate-500">{title}</div><div className="mt-2 text-3xl font-black text-sky-950">{value}</div></div>)}
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl bg-white p-6 shadow-sm"><div className="text-sm text-slate-500">Services in the website</div><div className="mt-2 text-3xl font-black text-sky-950">{data.services.length}</div></div>
              <div className="rounded-3xl bg-white p-6 shadow-sm"><div className="text-sm text-slate-500">Listed service areas</div><div className="mt-2 text-3xl font-black text-sky-950">{data.serviceAreas.length}</div></div>
            </div>
          </div>
        ) : null}

        {activeTab === 'leads' ? (
          <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-sky-950">Lead Pipeline</h2>
              <button type="button" onClick={exportLeads} className="rounded-full bg-sky-600 px-4 py-2 font-semibold text-white">Export CSV</button>
            </div>
            <div className="my-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <input placeholder="Lead ID, name, phone or area" value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 lg:col-span-2" />
              <select value={leadStatus} onChange={(e) => setLeadStatus(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5"><option value="">All statuses</option>{leadStatuses.map((item) => <option key={item}>{item}</option>)}</select>
              <input placeholder="Service" value={leadService} onChange={(e) => setLeadService(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5" />
              <input placeholder="Area" value={leadArea} onChange={(e) => setLeadArea(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5" />
              <select value={leadSource} onChange={(e) => setLeadSource(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5"><option value="">All sources</option>{['Google Search','Google Maps','WhatsApp','Instagram','Facebook','Direct','Referral','Other'].map((item) => <option key={item}>{item}</option>)}</select>
              <input aria-label="Created from date" type="date" value={leadDateFrom} onChange={(e) => setLeadDateFrom(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5" />
              <input aria-label="Created to date" type="date" value={leadDateTo} onChange={(e) => setLeadDateTo(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5" />
            </div>
            <div className="grid gap-4 xl:grid-cols-3">
              {leadStatuses.map((stage) => {
                const items = leads.filter((lead) => lead.status === stage)
                return (
                  <div key={stage} className="min-w-0 rounded-2xl bg-slate-50 p-3">
                    <h3 className="mb-3 flex items-center justify-between font-bold text-slate-800"><span>{stage}</span><span className="rounded-full bg-white px-2 py-1 text-xs">{items.length}</span></h3>
                    <div className="space-y-3">
                      {items.map((lead) => (
                        <article key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex justify-between gap-2">
                            <div><p className="text-xs font-bold text-sky-700">{lead.leadId}</p><h4 className="font-bold text-slate-900">{lead.customerName}</h4></div>
                            {lead.possibleDuplicate ? <span className="h-fit rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">Possible duplicate</span> : null}
                          </div>
                          <p className="mt-2 text-sm text-slate-600">{lead.serviceLabel || lead.borewellType || 'Service unspecified'} · {lead.area || lead.village || 'Location not provided'}</p>
                          {lead.approxDepth || lead.boreDiameter ? <p className="mt-1 text-xs text-slate-500">Depth: {lead.approxDepth || 'Not specified'} · Diameter: {lead.boreDiameter || 'Not specified'}</p> : null}
                          <p className="mt-1 text-xs text-slate-500">{lead.purpose || 'Purpose not specified'} · {lead.leadSource || 'Direct'} · {new Date(lead.createdAt).toLocaleDateString()}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <a href={`tel:${lead.phone}`} className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white">Call Customer</a>
                            <a href={`https://wa.me/91${(lead.whatsapp || lead.phone).replace(/\D/g, '').replace(/^91/, '')}?text=${encodeURIComponent(`Hello ${lead.customerName}, Raja Borewells is following up about your enquiry ${lead.leadId}.`)}`} target="_blank" rel="noreferrer" className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">WhatsApp</a>
                          </div>
                          <label className="mt-3 block text-xs font-medium text-slate-600">Status<select value={lead.status} onChange={(e) => void updateLead({ id: lead.id, status: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2">{leadStatuses.map((item) => <option key={item}>{item}</option>)}</select></label>
                          <label className="mt-2 block text-xs font-medium text-slate-600">Follow-up date<input type="date" value={lead.followUpAt?.slice(0, 10) ?? ''} onChange={(e) => void updateLead({ id: lead.id, followUpAt: e.target.value ? new Date(`${e.target.value}T09:00:00`).toISOString() : null })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2" /></label>
                          {lead.followUpAt ? <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={lead.followUpDone} onChange={(e) => void updateLead({ id: lead.id, followUpDone: e.target.checked })} /> Mark follow-up done</label> : null}
                          {lead.notes.map((note) => <p key={note.id} className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">{note.note}</p>)}
                          <div className="mt-2 flex gap-2">
                            <input value={noteDrafts[lead.id] ?? ''} onChange={(e) => setNoteDrafts((current) => ({ ...current, [lead.id]: e.target.value }))} placeholder="Private admin note" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-xs" />
                            <button type="button" onClick={() => noteDrafts[lead.id] && void updateLead({ id: lead.id, note: noteDrafts[lead.id] })} className="rounded-lg bg-slate-800 px-3 text-xs font-semibold text-white">Save</button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            {!leads.length ? <p className="py-8 text-center text-slate-500">No enquiries match these filters.</p> : null}
          </section>
        ) : null}

        {activeTab === 'callbacks' ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-2xl font-black text-sky-950">Callback Requests</h2>
            {!callbacks.length ? <p className="text-slate-500">No callback requests yet.</p> : (
              <div className="space-y-3">
                {callbacks.map((callback) => (
                  <div key={callback.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                    <div><h3 className="font-bold text-slate-900">{callback.name}</h3><p className="text-sm text-slate-600">{callback.phone} · {callback.preferredTime}</p><p className="text-sm text-slate-500">{callback.message}</p></div>
                    <div className="flex items-center gap-2"><a href={`tel:${callback.phone}`} className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white">CALL CUSTOMER</a><button type="button" onClick={async () => { try { const response = await fetch('/api/admin/callbacks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: callback.id, status: 'Completed' }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Unable to update callback.'); setCallbacks((current) => current.map((item) => item.id === callback.id ? { ...item, status: 'Completed' } : item)); setStatus('Callback marked done.') } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to update callback.') } }} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold">Mark Done</button></div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === 'site visits' ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-2xl font-black text-sky-950">Site Visit Requests</h2>
            {!siteVisits.length ? <p className="text-slate-500">No site visit requests yet.</p> : (
              <div className="space-y-3">
                {siteVisits.map((visit) => (
                  <article key={visit.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                    <div><h3 className="font-bold text-slate-900">{visit.name} · {visit.location}</h3><p className="text-sm text-slate-600">{visit.phone} · {visit.preferredDate || 'Date flexible'} {visit.preferredTime || ''}</p>{visit.message ? <p className="mt-1 text-sm text-slate-500">{visit.message}</p> : null}{visit.googleMaps ? <a href={visit.googleMaps} target="_blank" rel="noreferrer" className="text-sm font-semibold text-sky-700">Open site map</a> : null}</div>
                    <div className="flex flex-wrap items-center gap-2"><a href={`tel:${visit.phone}`} className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white">Call Customer</a><select value={visit.status} onChange={async (event) => { const nextStatus = event.target.value; try { const response = await fetch('/api/admin/site-visits', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: visit.id, status: nextStatus }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Unable to update site visit.'); setSiteVisits((current) => current.map((item) => item.id === visit.id ? { ...item, status: nextStatus } : item)); setStatus('Site visit status updated.') } catch (error) { setStatus(error instanceof Error ? error.message : 'Unable to update site visit.') } }} className="rounded-full border border-slate-200 px-3 py-2 text-sm">{['New','Contacted','Scheduled','Completed','Cancelled'].map((item) => <option key={item}>{item}</option>)}</select></div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === 'quotations' ? (
          <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <form onSubmit={createQuotation} className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-sky-950">Create Quotation</h2>
              <div className="mt-5 space-y-3">
                <label className="block text-sm font-medium">Lead<select name="enquiryId" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5">{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.leadId} · {lead.customerName} · {lead.area || 'Area not set'}</option>)}</select></label>
                <label className="block text-sm font-medium">Description<input name="description" required minLength={3} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium">Quantity<input name="quantity" type="number" min="0.01" step="0.01" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
                  <label className="block text-sm font-medium">Unit<input name="unit" defaultValue="Per Feet" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
                  <label className="block text-sm font-medium">Rate<input name="rate" type="number" min="0" step="0.01" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
                  <label className="block text-sm font-medium">Additional Charges<input name="additionalCharges" type="number" min="0" step="0.01" defaultValue="0" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
                  <label className="block text-sm font-medium">Discount<input name="discount" type="number" min="0" step="0.01" defaultValue="0" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
                  <label className="block text-sm font-medium">Tax / Charges<input name="tax" type="number" min="0" step="0.01" defaultValue="0" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
                </div>
                <label className="block text-sm font-medium">Validity<input name="validity" placeholder="e.g. 15 days" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium">Terms<textarea name="terms" className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
                <label className="block text-sm font-medium">Notes<textarea name="notes" className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label>
                <button disabled={!leads.length} className="rounded-full bg-sky-600 px-5 py-3 font-semibold text-white disabled:opacity-50">Create &amp; Save Quotation</button>
              </div>
            </form>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-sky-950">Saved Quotations</h2>
              <div className="mt-5 space-y-3">
                {quotations.map((quote) => {
                  const url = `${window.location.origin}/quote/${quote.secureToken}`
                  const message = `Hello ${quote.customerName},\n\nYour Raja Borewells quotation is ready.\n\nQuotation ID: ${quote.quotationId}\nService: ${quote.description}\nEstimated Amount: ₹${Number(quote.grandTotal).toLocaleString('en-IN')}\n\nPlease contact us if you have any questions.\n\nThank you.\n${url}`
                  const whatsapp = `https://wa.me/91${(quote.whatsapp || quote.phone).replace(/\D/g, '').replace(/^91/, '')}?text=${encodeURIComponent(message)}`
                  return (
                    <article key={quote.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold text-sky-700">{quote.quotationId} · {quote.leadId}</p><h3 className="font-bold text-slate-900">{quote.customerName}</h3></div><p className="text-lg font-black text-sky-950">₹{Number(quote.grandTotal).toLocaleString('en-IN')}</p></div>
                      <p className="mt-2 text-sm text-slate-600">{quote.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2"><a href={`/quote/${quote.secureToken}`} target="_blank" rel="noreferrer" className="rounded-full border border-sky-600 px-4 py-2 text-sm font-semibold text-sky-700">View / Print</a><a href={whatsapp} target="_blank" rel="noreferrer" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Send through WhatsApp</a></div>
                    </article>
                  )
                })}
                {!quotations.length ? <p className="text-slate-500">No quotations created yet.</p> : null}
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'analytics' ? (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['Leads by source', analytics?.sources ?? [], 'source'],
              ['Top services', analytics?.services ?? [], 'service'],
              ['Top areas', analytics?.areas ?? [], 'area'],
              ['Leads per day (last 30 days)', analytics?.leadsByDay ?? [], 'day'],
            ].map(([title, rows, key]) => (
              <div key={String(title)} className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="font-bold text-sky-950">{String(title)}</h2>
                <div className="mt-4 space-y-3">
                  {(rows as Record<string, string | number>[]).map((row) => {
                    const label = String(row[key as string] ?? '')
                    const count = Number(row.count ?? 0)
                    return <div key={label} className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-slate-600">{label}</span><span className="font-bold text-sky-800">{count}</span></div>
                  })}
                  {!(rows as unknown[]).length ? <p className="text-sm text-slate-500">No analytics data yet.</p> : null}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {activeTab === 'business profile' ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-black text-sky-950">Business Profile</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(data.businessProfile).map(([key, value]) => (
                <label key={key} className="block text-sm font-medium text-slate-700">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <input
                    type={key === 'latitude' || key === 'longitude' ? 'number' : 'text'}
                    value={String(value ?? '')}
                    onChange={(e) => updateBusiness(key as keyof BusinessProfile, e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                  />
                </label>
              ))}
            </div>
            <div className="mt-6">
              <button type="button" onClick={() => saveSection('businessProfile')} className="rounded-full bg-sky-600 px-5 py-3 font-semibold text-white">Save Business Profile</button>
            </div>
          </div>
        ) : null}

        {activeTab === 'services' ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-black text-sky-950">Services</h2>
            <div className="space-y-4">
              {data.services.map((service, index) => (
                <div key={service.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_2fr_0.5fr]">
                    <input value={service.name} onChange={(e) => setData({ ...data, services: data.services.map((item, i) => i === index ? { ...item, name: e.target.value } : item) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                    <input value={service.description} onChange={(e) => setData({ ...data, services: data.services.map((item, i) => i === index ? { ...item, description: e.target.value } : item) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                    <button type="button" onClick={() => setData({ ...data, services: data.services.filter((_, i) => i !== index) })} className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700">Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setData({ ...data, services: [...data.services, { id: `service-${Date.now()}`, name: 'New Service', description: 'Add description here.' }] })} className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white">Add Service</button>
              <button type="button" onClick={() => saveSection('services')} className="rounded-full bg-sky-600 px-5 py-3 font-semibold text-white">Save Services</button>
            </div>
          </div>
        ) : null}

        {activeTab === 'rates' ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-black text-sky-950">Rates</h2>
            <div className="space-y-4">
              {data.serviceRates.map((rate, index) => (
                <div key={rate.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-4">
                  <input value={rate.service} onChange={(e) => setData({ ...data, serviceRates: data.serviceRates.map((item, i) => i === index ? { ...item, service: e.target.value } : item) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                  <input value={rate.unit} onChange={(e) => setData({ ...data, serviceRates: data.serviceRates.map((item, i) => i === index ? { ...item, unit: e.target.value } : item) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                  <input value={rate.startingRate} onChange={(e) => setData({ ...data, serviceRates: data.serviceRates.map((item, i) => i === index ? { ...item, startingRate: e.target.value } : item) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                  <input value={rate.details} onChange={(e) => setData({ ...data, serviceRates: data.serviceRates.map((item, i) => i === index ? { ...item, details: e.target.value } : item) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setData({ ...data, serviceRates: [...data.serviceRates, { id: `rate-${Date.now()}`, service: 'New Service', unit: 'Per Service', startingRate: 'Contact for Rate', details: 'Depends on site conditions.' }] })} className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white">Add Rate</button>
              <button type="button" onClick={() => saveSection('serviceRates')} className="rounded-full bg-sky-600 px-5 py-3 font-semibold text-white">Save Rates</button>
            </div>
          </div>
        ) : null}

        {activeTab === 'projects' ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-black text-sky-950">Projects</h2>
            <div className="space-y-4">
              {data.projects.map((project, index) => (
                <div key={project.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input value={project.title} onChange={(e) => setData({ ...data, projects: data.projects.map((item, i) => i === index ? { ...item, title: e.target.value } : item) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                    <input value={project.location} onChange={(e) => setData({ ...data, projects: data.projects.map((item, i) => i === index ? { ...item, location: e.target.value } : item) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                    <input value={project.type} onChange={(e) => setData({ ...data, projects: data.projects.map((item, i) => i === index ? { ...item, type: e.target.value } : item) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                    <input value={project.depth} onChange={(e) => setData({ ...data, projects: data.projects.map((item, i) => i === index ? { ...item, depth: e.target.value } : item) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                    <input value={project.date} onChange={(e) => setData({ ...data, projects: data.projects.map((item, i) => i === index ? { ...item, date: e.target.value } : item) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                    <input value={project.status} onChange={(e) => setData({ ...data, projects: data.projects.map((item, i) => i === index ? { ...item, status: e.target.value } : item) })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                  </div>
                  <textarea value={project.description} onChange={(e) => setData({ ...data, projects: data.projects.map((item, i) => i === index ? { ...item, description: e.target.value } : item) })} className="mt-3 min-h-[90px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setData({ ...data, projects: [...data.projects, { id: `project-${Date.now()}`, title: 'New Project', location: 'Hyderabad', type: 'Residential', diameter: '5 inch', depth: 'Admin-entered value', date: '2026-01-01', status: 'Completed', description: 'Project description', image: '/images/borewell/borewell-drilling-india.webp' }] })} className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white">Add Project</button>
              <button type="button" onClick={() => saveSection('projects')} className="rounded-full bg-sky-600 px-5 py-3 font-semibold text-white">Save Projects</button>
            </div>
          </div>
        ) : null}

        {activeTab === 'areas' ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-black text-sky-950">Service Areas</h2>
            <div className="flex flex-wrap gap-3">
              {data.serviceAreas.map((area, index) => (
                <div key={`${area}-${index}`} className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                  <span>{area}</span>
                  <button type="button" onClick={() => setData({ ...data, serviceAreas: data.serviceAreas.filter((_, i) => i !== index) })} className="text-sm text-rose-600">×</button>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setData({ ...data, serviceAreas: [...data.serviceAreas, `New Area ${data.serviceAreas.length + 1}`] })} className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white">Add Area</button>
              <button type="button" onClick={() => saveSection('serviceAreas')} className="rounded-full bg-sky-600 px-5 py-3 font-semibold text-white">Save Areas</button>
            </div>
          </div>
        ) : null}

        {activeTab === 'faqs' ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-black text-sky-950">FAQs</h2>
            <div className="space-y-4">
              {data.faqs.map((faq, index) => (
                <div key={faq.id} className="rounded-2xl border border-slate-200 p-4">
                  <input value={faq.question} onChange={(e) => setData({ ...data, faqs: data.faqs.map((item, i) => i === index ? { ...item, question: e.target.value } : item) })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                  <textarea value={faq.answer} onChange={(e) => setData({ ...data, faqs: data.faqs.map((item, i) => i === index ? { ...item, answer: e.target.value } : item) })} className="mt-3 min-h-[90px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setData({ ...data, faqs: [...data.faqs, { id: `faq-${Date.now()}`, question: 'New FAQ', answer: 'Answer text here.' }] })} className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white">Add FAQ</button>
              <button type="button" onClick={() => saveSection('faqs')} className="rounded-full bg-sky-600 px-5 py-3 font-semibold text-white">Save FAQs</button>
            </div>
          </div>
        ) : null}

        {activeTab === 'reviews' ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-2xl font-black text-sky-950">Review Management</h2>
            <p className="mb-5 text-sm text-slate-600">Only publish reviews when the customer has explicitly permitted publication.</p>
            <div className="space-y-4">
              {data.reviews.map((review, index) => (
                <article key={review.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input aria-label="Customer name" value={review.customerName} onChange={(event) => setData((current) => ({ ...current, reviews: current.reviews.map((item, i) => i === index ? { ...item, customerName: event.target.value } : item) }))} className="rounded-xl border border-slate-200 px-3 py-2.5" />
                    <input aria-label="Area" value={review.area} onChange={(event) => setData((current) => ({ ...current, reviews: current.reviews.map((item, i) => i === index ? { ...item, area: event.target.value } : item) }))} className="rounded-xl border border-slate-200 px-3 py-2.5" />
                    <select aria-label="Rating" value={review.rating} onChange={(event) => setData((current) => ({ ...current, reviews: current.reviews.map((item, i) => i === index ? { ...item, rating: Number(event.target.value) } : item) }))} className="rounded-xl border border-slate-200 px-3 py-2.5">{[1,2,3,4,5].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select>
                    <input aria-label="Review date" value={review.date} onChange={(event) => setData((current) => ({ ...current, reviews: current.reviews.map((item, i) => i === index ? { ...item, date: event.target.value } : item) }))} className="rounded-xl border border-slate-200 px-3 py-2.5" />
                  </div>
                  <textarea aria-label="Review text" value={review.review} onChange={(event) => setData((current) => ({ ...current, reviews: current.reviews.map((item, i) => i === index ? { ...item, review: event.target.value } : item) }))} className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                  <div className="mt-3 flex flex-wrap items-center gap-5 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={review.permissionToPublish} onChange={(event) => setData((current) => ({ ...current, reviews: current.reviews.map((item, i) => i === index ? { ...item, permissionToPublish: event.target.checked, approved: event.target.checked ? item.approved : false } : item) }))} /> Customer permission received</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={review.approved} disabled={!review.permissionToPublish} onChange={(event) => setData((current) => ({ ...current, reviews: current.reviews.map((item, i) => i === index ? { ...item, approved: event.target.checked } : item) }))} /> Approved to publish</label>
                    <button type="button" onClick={() => setData((current) => ({ ...current, reviews: current.reviews.filter((_, i) => i !== index) }))} className="font-semibold text-rose-700">Delete</button>
                  </div>
                </article>
              ))}
              {!data.reviews.length ? <p className="text-slate-500">Customer reviews will be added here.</p> : null}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setData((current) => ({ ...current, reviews: [...current.reviews, { id: `review-${Date.now()}`, customerName: '', area: '', rating: 5, review: '', date: new Date().toISOString().slice(0, 10), approved: false, permissionToPublish: false }] }))} className="rounded-full bg-slate-800 px-5 py-3 font-semibold text-white">Add Verified Review</button>
              <button type="button" onClick={() => saveSection('reviews')} className="rounded-full bg-sky-600 px-5 py-3 font-semibold text-white">Save Reviews</button>
            </div>
          </section>
        ) : null}

        {activeTab === 'settings' ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-2xl font-black text-sky-950">Website Settings</h2>
            <p className="text-slate-600">Estimator values are optional. The public estimator stays unpriced until a real rate per foot is entered here.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(data.estimatorRates).map(([key, value]) => (
                <label key={key} className="block text-sm font-medium text-slate-700">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={value ?? ''}
                    onChange={(event) => setData((current) => ({
                      ...current,
                      estimatorRates: {
                        ...current.estimatorRates,
                        [key]: event.target.value === '' ? null : Number(event.target.value),
                      },
                    }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
                  />
                </label>
              ))}
            </div>
            <button type="button" onClick={() => saveSection('estimatorRates')} className="mt-6 rounded-full bg-sky-600 px-5 py-3 font-semibold text-white">Save Estimator Rules</button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
