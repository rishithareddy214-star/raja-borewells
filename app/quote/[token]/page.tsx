import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PrintButton } from '@/components/PrintButton'
import { pool } from '@/lib/db'
import { readSiteData } from '@/lib/site-data'

type QuotePageProps = {
  params: Promise<{ token: string }>
}

export default async function CustomerQuotePage({ params }: QuotePageProps) {
  const { token } = await params
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) notFound()

  let result
  try {
    result = await pool.query(
      `SELECT q."quotationId", q."description", q."quantity", q."unit", q."rate", q."additionalCharges",
        q."discount", q."tax", q."grandTotal", q."validity", q."terms", q."notes", q."createdAt",
        e."leadId", e."customerName", e."area", e."village", e."city"
       FROM "Quotation" q JOIN "Enquiry" e ON e."id" = q."enquiryId"
       WHERE q."secureToken" = $1 LIMIT 1`,
      [token],
    )
  } catch (error) {
    console.error('Failed to load customer quotation', error)
    throw new Error('Quotation is temporarily unavailable.')
  }
  const quotation = result.rows[0]
  if (!quotation) notFound()
  const { businessProfile } = await readSiteData()

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-white px-5 py-10 text-slate-800 sm:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link href="/" className="text-sm font-semibold text-sky-700 print:hidden">RAJA BOREWELLS</Link>
          <h1 className="mt-3 text-3xl font-black text-sky-950">Quotation</h1>
          <p className="mt-2 text-sm text-slate-600">Quotation ID: <strong>{quotation.quotationId}</strong></p>
          <p className="text-sm text-slate-600">Enquiry ID: <strong>{quotation.leadId}</strong></p>
        </div>
        <PrintButton />
      </div>
      <section className="grid gap-6 py-6 sm:grid-cols-2">
        <div><h2 className="font-bold text-sky-950">Prepared for</h2><p className="mt-2">{quotation.customerName}</p><p>{[quotation.area, quotation.village, quotation.city].filter(Boolean).join(', ')}</p></div>
        <div><h2 className="font-bold text-sky-950">Business</h2><p className="mt-2">{businessProfile.businessName}</p><p>{businessProfile.ownerName}</p><p>{businessProfile.phone}</p><p>{businessProfile.address}</p></div>
      </section>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead><tr className="border-y border-slate-200 bg-slate-50"><th className="px-3 py-3">Description</th><th className="px-3 py-3">Qty</th><th className="px-3 py-3">Unit</th><th className="px-3 py-3 text-right">Rate</th><th className="px-3 py-3 text-right">Amount</th></tr></thead>
          <tbody><tr className="border-b border-slate-200"><td className="px-3 py-4">{quotation.description}</td><td className="px-3 py-4">{quotation.quantity}</td><td className="px-3 py-4">{quotation.unit}</td><td className="px-3 py-4 text-right">₹{Number(quotation.rate).toLocaleString('en-IN')}</td><td className="px-3 py-4 text-right">₹{(Number(quotation.quantity) * Number(quotation.rate)).toLocaleString('en-IN')}</td></tr></tbody>
        </table>
      </div>
      <div className="ml-auto mt-5 max-w-xs space-y-2 text-sm">
        <div className="flex justify-between"><span>Additional charges</span><span>₹{Number(quotation.additionalCharges).toLocaleString('en-IN')}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>₹{Number(quotation.discount).toLocaleString('en-IN')}</span></div>
        <div className="flex justify-between"><span>Tax / charges</span><span>₹{Number(quotation.tax).toLocaleString('en-IN')}</span></div>
        <div className="flex justify-between border-t border-slate-300 pt-3 text-lg font-black"><span>Grand Total</span><span>₹{Number(quotation.grandTotal).toLocaleString('en-IN')}</span></div>
      </div>
      <section className="mt-8 space-y-4 border-t border-slate-200 pt-6 text-sm">
        {quotation.validity ? <p><strong>Validity:</strong> {quotation.validity}</p> : null}
        {quotation.terms ? <p><strong>Terms:</strong> {quotation.terms}</p> : null}
        {quotation.notes ? <p><strong>Notes:</strong> {quotation.notes}</p> : null}
        <p className="text-slate-500">Final scope, price and schedule remain subject to the site conditions described in the quotation and confirmation with the business.</p>
      </section>
    </main>
  )
}
