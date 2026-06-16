'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Token {
  id: string
  token_number: number
  status: 'waiting' | 'active' | 'completed' | 'skipped'
  booked_at: string
  called_at: string | null
  completed_at: string | null
  doctor_id: string
  clinic_id: string
  doctors: { name: string; specialty: string }
  clinics: { name: string; address: string }
}

export default function PatientTokenPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [queuePositions, setQueuePositions] = useState<Record<string, number>>({})

  const fetchTokens = useCallback(async (userId: string) => {
    const { data } = await supabase.from('tokens')
      .select('*, doctors(name, specialty), clinics(name, address)')
      .eq('patient_id', userId)
      .order('booked_at', { ascending: false })
      .limit(10)

    if (data) {
      setTokens(data)
      // Get queue position for each waiting token
      const positions: Record<string, number> = {}
      for (const token of data) {
        if (token.status === 'waiting') {
          const { count } = await supabase.from('tokens')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', token.doctor_id)
            .eq('status', 'waiting')
            .lt('token_number', token.token_number)
          positions[token.id] = (count || 0) + 1
        }
      }
      setQueuePositions(positions)
    }
  }, [])

 useEffect(() => {
  let channel: ReturnType<typeof supabase.channel> | null = null

  const init = async () => {
    const u = await getCurrentUser()

    if (!u || u.role !== 'patient') {
      router.push('/auth/patient/login')
      return
    }

    setUser(u)
    await fetchTokens(u.id)
    setLoading(false)

    await supabase.removeAllChannels()
    channel = supabase
     .channel(`patient-tokens-${u.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tokens',
          filter: `patient_id=eq.${u.id}`
        },
        () => fetchTokens(u.id)
      )
      .subscribe()
  }

  init()

  return () => {
  supabase.removeAllChannels()
}
}, [router])
  const activeTokens = tokens.filter(t => ['waiting', 'active'].includes(t.status))
  const pastTokens = tokens.filter(t => ['completed', 'skipped'].includes(t.status))

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar role="patient" name={user?.name || ''} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-gray-900">My tokens</h1>
          <Link href="/patient" className="btn-outline text-sm py-1.5 px-3">+ Book another</Link>
        </div>

        {activeTokens.length === 0 && pastTokens.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">🎫</div>
            <div className="text-sm font-medium text-gray-500">No tokens yet</div>
            <div className="text-xs mt-1">Book a token to see it here</div>
            <Link href="/patient" className="btn-primary mt-4 text-sm px-5 py-2 inline-block">Browse clinics</Link>
          </div>
        )}

        {activeTokens.length > 0 && (
          <div className="mb-6">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Active</div>
            <div className="space-y-3">
              {activeTokens.map(token => (
                <div key={token.id} className="card" style={token.status === 'active' ? { borderColor: '#0F5C4D', borderWidth: 2 } : {}}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: '#0F5C4D' }} className="text-2xl font-bold">#{token.token_number}</span>
                        <span className={`badge ${token.status === 'active' ? 'badge-active' : 'badge-waiting'}`}>
                          {token.status === 'active' ? '🟢 Your turn!' : '⏳ Waiting'}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-800">
                        Dr. {(token.doctors as unknown as { name: string })?.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {(token.clinics as unknown as { name: string })?.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Booked {new Date(token.booked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right">
                      {token.status === 'waiting' && queuePositions[token.id] !== undefined && (
                        <div>
                          <div className="text-xs text-gray-400">Position</div>
                          <div style={{ color: '#0F5C4D' }} className="text-xl font-bold">{queuePositions[token.id]}</div>
                        </div>
                      )}
                      {token.status === 'active' && (
                        <div className="text-xs text-green-600 font-medium">Please proceed</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pastTokens.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Past</div>
            <div className="space-y-2">
              {pastTokens.map(token => (
                <div key={token.id} className="card opacity-70">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-600">#{token.token_number}</span>
                        <span className={`badge ${token.status === 'completed' ? 'badge-completed' : 'badge-skipped'}`}>
                          {token.status === 'completed' ? 'Done' : 'Skipped'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Dr. {(token.doctors as unknown as { name: string })?.name} · {(token.clinics as unknown as { name: string })?.name}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(token.booked_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
