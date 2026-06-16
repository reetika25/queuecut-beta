'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, AuthUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Clinic {
  id: string
  name: string
  address: string
  specialty: string
}

interface Token {
  id: string
  token_number: number
  status: string
  doctors: { name: string }
  clinics: { name: string }
}

export default function PatientDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [activeToken, setActiveToken] = useState<Token | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const init = async () => {
      const u = await getCurrentUser()
      if (!u || u.role !== 'patient') { router.push('/auth/patient/login'); return }
      setUser(u)
      const [{ data: clinicData }, { data: tokenData }] = await Promise.all([
        supabase.from('clinics').select('*').order('name'),
        supabase.from('tokens').select('*, doctors(name), clinics(name)')
          .eq('patient_id', u.id)
          .in('status', ['waiting', 'active'])
          .order('booked_at', { ascending: false })
          .limit(1)
      ])
      if (clinicData) setClinics(clinicData)
      if (tokenData && tokenData.length > 0) setActiveToken(tokenData[0])
      setLoading(false)
    }
    init()
  }, [router])

  const filtered = clinics.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.specialty.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar role="patient" name={user?.name || ''} />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Active token banner */}
        {activeToken && (
          <div style={{ background: '#0F5C4D' }} className="rounded-xl p-4 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs opacity-75 mb-0.5">Active token</div>
                <div className="text-2xl font-bold">#{activeToken.token_number}</div>
                <div className="text-sm opacity-90 mt-0.5">
                  Dr. {(activeToken.doctors as unknown as { name: string })?.name} · {(activeToken.clinics as unknown as { name: string })?.name}
                </div>
              </div>
              <div className="text-right">
                <span className={`badge ${activeToken.status === 'active' ? 'badge-active' : 'badge-waiting'}`}>
                  {activeToken.status === 'active' ? '🟢 Your turn!' : '⏳ Waiting'}
                </span>
                <div className="mt-2">
                  <Link href="/patient/token" className="text-xs underline opacity-80">View details →</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">Find a clinic</h1>
        </div>

        <input
          className="input-field mb-4"
          type="text"
          placeholder="Search by name or specialty…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-3xl mb-2">🏥</div>
            <div className="text-sm">No clinics found</div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map(clinic => (
              <Link key={clinic.id} href={`/patient/clinic/${clinic.id}`}>
                <div className="card hover:border-green-300 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{clinic.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{clinic.specialty}</div>
                      {clinic.address && (
                        <div className="text-xs text-gray-400 mt-1">{clinic.address}</div>
                      )}
                    </div>
                    <span style={{ color: '#0F5C4D', background: '#e8f4f1' }} className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ml-2">
                      Book →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
