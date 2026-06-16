'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth'

export default function PatientSignup() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.name, 'patient', { phone: form.phone })
      router.push('/patient')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div style={{ background: '#0F5C4D' }} className="w-7 h-7 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">Q</span>
        </div>
        <span style={{ color: '#0F5C4D' }} className="font-semibold">QueueCut</span>
      </Link>
      <div className="card w-full max-w-sm">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Create patient account</h1>
        <p className="text-sm text-gray-500 mb-5">Book tokens and skip the queue.</p>
        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
            <input className="input-field" type="text" value={form.name} onChange={set('name')} required placeholder="Priya Sharma" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input className="input-field" type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
            <input className="input-field" type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input className="input-field" type="password" value={form.password} onChange={set('password')} required placeholder="min 6 characters" minLength={6} />
          </div>
          <button className="btn-primary w-full mt-2" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">
          Already have an account? <Link href="/auth/patient/login" style={{ color: '#0F5C4D' }} className="font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
