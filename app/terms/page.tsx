import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-slate-800">
      <Link href="/" className="font-semibold text-sky-700">← Raja Borewells</Link>
      <h1 className="mt-6 text-3xl font-black text-sky-950">Terms &amp; Conditions</h1>
      <p className="mt-5 leading-7">Website descriptions and any estimate are for initial discussion only. Final scope, price and schedule are subject to site inspection, actual ground conditions, equipment requirements and a quotation agreed with the customer.</p>
      <p className="mt-4 leading-7">Water availability, depth and yield depend on local geological and site conditions and are not guaranteed by the website. Service availability must be confirmed for the specific location.</p>
      <p className="mt-4 leading-7">Submitting a form allows Raja Borewells to contact you about the request. Please provide accurate contact and location information.</p>
    </main>
  )
}
