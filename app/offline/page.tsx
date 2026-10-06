import Link from 'next/link'

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-950 px-4 text-center text-white">
      <div>
        <h1 className="text-3xl font-black">You are offline</h1>
        <p className="mt-3 text-sky-100">Reconnect to submit an enquiry or contact Raja Borewells.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-semibold text-sky-950">Try again</Link>
      </div>
    </main>
  )
}
