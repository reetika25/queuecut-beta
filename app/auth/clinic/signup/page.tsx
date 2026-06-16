'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth'

export default function ClinicSignup() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', address: '', specialty: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signUp(form.email, form.password, form.name, 'clinic', {
        address: form.address,
        specialty: form.specialty
      })
      router.push('/clinic')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const specialties = ['General Practice', 'Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics', 'Gynecology', 'ENT', 'Ophthalmology', 'Neurology', 'Psychiatry', 'Other']

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div style={{ background: '#0F5C4D' }} className="w-7 h-7 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">Q</span>
        </div>
        <span style={{ color: '#0F5C4D' }} className="font-semibold">QueueCut</span>
      </Link>
      <div className="card w-full max-w-sm">
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Register your clinic</h1>
        <p className="text-sm text-gray-500 mb-5">Set up your queue in minutes.</p>
        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Clinic name</label>
            <input className="input-field" type="text" value={form.name} onChange={set('name')} required placeholder="Sunshine Health Centre" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input className="input-field" type="email" value={form.email} onChange={set('email')} required placeholder="info@clinic.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input className="input-field" type="text" value={form.address} onChange={set('address')} placeholder="123 Main St, Bhubaneswar" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Specialty</label>
            <select className="input-field" value={form.specialty} onChange={set('specialty')} required>
              <option value="">Select specialty</option>
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input className="input-field" type="password" value={form.password} onChange={set('password')} required placeholder="min 6 characters" minLength={6} />
          </div>
          <button className="btn-primary w-full mt-2" type="submit" disabled={loading}>
            {loading ? 'Registering…' : 'Register clinic'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">
          Already registered? <Link href="/auth/clinic/login" style={{ color: '#0F5C4D' }} className="font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
