'use client'

import { useState } from 'react'

export function ReviewForm() {
  const [message, setMessage] = useState('')

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setMessage('Submitting review...')
    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: values.get('customerName'),
          area: values.get('area'),
          rating: Number(values.get('rating')),
          review: values.get('review'),
          permissionToPublish: values.get('permissionToPublish') === 'on',
          website: values.get('website'),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to submit the review.')
      setMessage(result.message)
      form.reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit the review.')
    }
  }

  return (
    <form id="leave-review" onSubmit={submit} className="mx-auto mt-8 max-w-2xl rounded-3xl border border-slate-700 bg-slate-800 p-6">
      <h3 className="text-xl font-bold text-white">Leave a Review</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input name="customerName" placeholder="Your name" minLength={2} maxLength={200} required className="rounded-xl border-0 bg-white px-3 py-3 text-slate-800" />
        <input name="area" placeholder="Area" maxLength={200} className="rounded-xl border-0 bg-white px-3 py-3 text-slate-800" />
        <select name="rating" defaultValue="5" className="rounded-xl border-0 bg-white px-3 py-3 text-slate-800"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select>
        <textarea name="review" placeholder="Your experience" minLength={10} maxLength={3000} required className="min-h-20 rounded-xl border-0 bg-white px-3 py-3 text-slate-800 sm:col-span-2" />
        <label className="hidden" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
        <label className="flex items-start gap-2 text-sm text-slate-200 sm:col-span-2"><input name="permissionToPublish" type="checkbox" required /> I give Raja Borewells permission to publish this review.</label>
      </div>
      <button className="mt-4 rounded-full bg-white px-5 py-3 font-semibold text-sky-950">Submit Review</button>
      {message ? <p role="status" className="mt-3 text-sm text-sky-100">{message}</p> : null}
    </form>
  )
}
