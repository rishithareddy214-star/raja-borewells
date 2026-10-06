import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-slate-800">
      <Link href="/" className="font-semibold text-sky-700">← Raja Borewells</Link>
      <h1 className="mt-6 text-3xl font-black text-sky-950">Privacy Policy</h1>
      <p className="mt-5 leading-7">Raja Borewells collects only the contact and site information you provide when requesting a quotation, callback, contact or site visit. If you choose to share your current location, the browser will ask your permission first.</p>
      <p className="mt-4 leading-7">Information is used to respond to your request and coordinate borewell-related services. It is not intentionally sold. Enquiry, callback and contact records are accessible to authorized business administrators for follow-up and service management.</p>
      <p className="mt-4 leading-7">For questions about your information, contact the owner through the call or WhatsApp options on the website.</p>
    </main>
  )
}
