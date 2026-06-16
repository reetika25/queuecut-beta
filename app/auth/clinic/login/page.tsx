'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth'

export default function ClinicLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      router.push('/clinic')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
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
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Clinic sign in</h1>
        <p className="text-sm text-gray-500 mb-5">Manage your queue from here.</p>
        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input className="input-field" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="clinic@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button className="btn-primary w-full mt-2" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">
          New clinic? <Link href="/auth/clinic/signup" style={{ color: '#0F5C4D' }} className="font-medium">Register</Link>
        </p>
      </div>
    </div>
  )
}
