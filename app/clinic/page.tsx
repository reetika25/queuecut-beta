'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, AuthUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Doctor {
  id: string
  name: string
  specialty: string
  available: boolean
}

interface Token {
  id: string
  token_number: number
  status: 'waiting' | 'active' | 'completed' | 'skipped'
  booked_at: string
  called_at: string | null
  doctor_id: string
  patients: { name: string; phone: string }
  doctors: { name: string }
}

export default function ClinicDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [tokens, setTokens] = useState<Token[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = useCallback(async (clinicId: string) => {
    const [{ data: docData }, { data: tokenData }] = await Promise.all([
      supabase.from('doctors').select('*').eq('clinic_id', clinicId).order('name'),
      supabase.from('tokens')
        .select('*, patients(name, phone), doctors(name)')
        .eq('clinic_id', clinicId)
        .in('status', ['waiting', 'active'])
        .order('token_number', { ascending: true })
    ])
    if (docData) setDoctors(docData)
    if (tokenData) setTokens(tokenData)
  }, [])

useEffect(() => {
  let channel: any = null

  const init = async () => {
    const u = await getCurrentUser()

    if (!u || u.role !== 'clinic') {
      router.push('/auth/clinic/login')
      return
    }

    setUser(u)
    await fetchData(u.id)
    setLoading(false)
    await supabase.removeAllChannels()
    
    channel = supabase
      .channel('clinic-queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tokens',
          filter: `clinic_id=eq.${u.id}`
        },
        () => fetchData(u.id)
      )
      .subscribe()
  }

  init()

  return () => {
  supabase.removeAllChannels()
}
}, [router])

  const callNext = async (doctorId: string) => {
    setActionLoading(`call-${doctorId}`)
    try {
      // Find next waiting token for this doctor
      const { data: nextToken } = await supabase.from('tokens')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('status', 'waiting')
        .order('token_number', { ascending: true })
        .limit(1)
        .single()

      if (!nextToken) { alert('No waiting patients for this doctor.'); return }

      await supabase.from('tokens').update({
        status: 'active',
        called_at: new Date().toISOString()
      }).eq('id', nextToken.id)

      await fetchData(user!.id)
    } finally {
      setActionLoading(null)
    }
  }

  const complete = async (tokenId: string) => {
    setActionLoading(tokenId)
    try {
      await supabase.from('tokens').update({
        status: 'completed',
        completed_at: new Date().toISOString()
      }).eq('id', tokenId)
      await fetchData(user!.id)
    } finally {
      setActionLoading(null)
    }
  }

  const skip = async (tokenId: string) => {
    setActionLoading(`skip-${tokenId}`)
    try {
      await supabase.from('tokens').update({ status: 'skipped' }).eq('id', tokenId)
      await fetchData(user!.id)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredTokens = selectedDoctor === 'all'
    ? tokens
    : tokens.filter(t => t.doctor_id === selectedDoctor)

  const activeToken = filteredTokens.find(t => t.status === 'active')
  const waitingTokens = filteredTokens.filter(t => t.status === 'waiting')

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar role="clinic" name={user?.name || ''} />
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Queue Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">{user?.name}</p>
          </div>
          <Link href="/clinic/doctors" className="btn-primary text-sm py-1.5 px-4">
            + Add doctor
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            ['Doctors', doctors.length],
            ['Waiting', tokens.filter(t => t.status === 'waiting').length],
            ['In consultation', tokens.filter(t => t.status === 'active').length],
          ].map(([label, count]) => (
            <div key={label as string} className="card text-center">
              <div style={{ color: '#0F5C4D' }} className="text-2xl font-bold">{count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Doctor filter */}
        {doctors.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedDoctor('all')}
              className={selectedDoctor === 'all' ? 'btn-primary text-xs py-1 px-3' : 'btn-outline text-xs py-1 px-3'}
            >
              All doctors
            </button>
            {doctors.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDoctor(d.id)}
                className={selectedDoctor === d.id ? 'btn-primary text-xs py-1 px-3 whitespace-nowrap' : 'btn-outline text-xs py-1 px-3 whitespace-nowrap'}
              >
                Dr. {d.name}
              </button>
            ))}
          </div>
        )}

        {doctors.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">👨‍⚕️</div>
            <div className="text-sm font-medium text-gray-500 mb-1">No doctors yet</div>
            <div className="text-xs mb-4">Add a doctor to start managing your queue</div>
            <Link href="/clinic/doctors" className="btn-primary text-sm px-5 py-2 inline-block">Add doctor</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active consultation */}
            {activeToken && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">In Consultation</div>
                <div style={{ borderColor: '#0F5C4D', borderWidth: 2 }} className="card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span style={{ color: '#0F5C4D' }} className="text-xl font-bold">#{activeToken.token_number}</span>
                        <span className="badge badge-active">In progress</span>
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        {(activeToken.patients as unknown as { name: string })?.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Dr. {(activeToken.doctors as unknown as { name: string })?.name} ·{' '}
                        {activeToken.called_at && `Called ${new Date(activeToken.called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn-outline text-xs py-1.5 px-3"
                        onClick={() => skip(activeToken.id)}
                        disabled={actionLoading === `skip-${activeToken.id}`}
                      >
                        Skip
                      </button>
                      <button
                        className="btn-primary text-xs py-1.5 px-3"
                        onClick={() => complete(activeToken.id)}
                        disabled={actionLoading === activeToken.id}
                      >
                        {actionLoading === activeToken.id ? '…' : 'Complete ✓'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Call next buttons per doctor */}
            {selectedDoctor === 'all' && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Call Next Patient</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {doctors.map(doc => {
                    const doctorWaiting = tokens.filter(t => t.doctor_id === doc.id && t.status === 'waiting').length
                    const doctorActive = tokens.find(t => t.doctor_id === doc.id && t.status === 'active')
                    return (
                      <div key={doc.id} className="card flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-800">Dr. {doc.name}</div>
                          <div className="text-xs text-gray-400">{doctorWaiting} waiting</div>
                        </div>
                        <button
                          className="btn-primary text-xs py-1.5 px-3"
                          onClick={() => callNext(doc.id)}
                          disabled={doctorWaiting === 0 || !!doctorActive || actionLoading === `call-${doc.id}`}
                        >
                          {actionLoading === `call-${doc.id}` ? '…' : doctorActive ? 'Busy' : 'Call next'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedDoctor !== 'all' && !activeToken && waitingTokens.length > 0 && (
              <div className="flex justify-end">
                <button
                  className="btn-primary"
                  onClick={() => callNext(selectedDoctor)}
                  disabled={!!actionLoading}
                >
                  {actionLoading ? 'Calling…' : 'Call next patient'}
                </button>
              </div>
            )}

            {/* Waiting queue */}
            {waitingTokens.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Waiting Queue ({waitingTokens.length})
                </div>
                <div className="space-y-2">
                  {waitingTokens.map((token, idx) => (
                    <div key={token.id} className="card flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div style={{ background: '#e8f4f1', color: '#0F5C4D', minWidth: 28 }}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            #{token.token_number} · {(token.patients as unknown as { name: string })?.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            Dr. {(token.doctors as unknown as { name: string })?.name} ·{' '}
                            {new Date(token.booked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-waiting">Waiting</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredTokens.length === 0 && (
              <div className="text-center py-14 text-gray-400">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-sm">Queue is empty</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
