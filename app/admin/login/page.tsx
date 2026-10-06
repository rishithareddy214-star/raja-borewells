'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus('Logging in...')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (response.ok) {
        router.push('/admin')
        return
      }

      setStatus(data.error || 'Unable to login.')
    } catch (error) {
      console.error('Admin login request failed', error)
      setStatus(error instanceof Error ? error.message : 'Unable to login. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-950 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-sky-900/30">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-2xl font-black text-sky-700">R</div>
          <h1 className="mt-4 text-3xl font-black text-sky-950">Admin Login</h1>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            <span>Email</span>
            <input type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            <span>Password</span>
            <input type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required />
          </label>

          <button type="submit" disabled={isSubmitting} className="w-full rounded-full bg-sky-600 px-5 py-3 font-semibold text-white disabled:opacity-60">{isSubmitting ? 'Logging in...' : 'Login'}</button>
        </form>

        {status ? <p className="mt-4 text-sm text-slate-700">{status}</p> : null}
        <p className="mt-6 text-center text-sm text-slate-500">Admin access must be configured by the site administrator.</p>
      </div>
    </div>
  )
}
