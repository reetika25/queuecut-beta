'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Clinic {
  id: string
  name: string
  address: string
  specialty: string
}

interface Doctor {
  id: string
  name: string
  specialty: string
  available: boolean
  _queue_count?: number
}

export default function ClinicDetailPage() {
  const router = useRouter()
  const params = useParams()
  const clinicId = params.clinicId as string
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null)
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const u = await getCurrentUser()
      if (!u || u.role !== 'patient') { router.push('/auth/patient/login'); return }
      setUser(u)

      const [{ data: clinicData }, { data: doctorData }] = await Promise.all([
        supabase.from('clinics').select('*').eq('id', clinicId).single(),
        supabase.from('doctors').select('*').eq('clinic_id', clinicId).order('name')
      ])

      if (!clinicData) { router.push('/patient'); return }
      setClinic(clinicData)

      if (doctorData) {
        const enriched = await Promise.all(doctorData.map(async (doc) => {
          const { count } = await supabase.from('tokens')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', doc.id)
            .in('status', ['waiting', 'active'])
          return { ...doc, _queue_count: count || 0 }
        }))
        setDoctors(enriched)
      }
      setLoading(false)
    }
    init()
  }, [router, clinicId])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar role="patient" name={user?.name || ''} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link href="/patient" style={{ color: '#0F5C4D' }} className="text-sm flex items-center gap-1 mb-5">
          ← Back to clinics
        </Link>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{clinic?.name}</h1>
          <div className="text-sm text-gray-500 mt-0.5">{clinic?.specialty}</div>
          {clinic?.address && <div className="text-xs text-gray-400 mt-1">{clinic.address}</div>}
        </div>

        <h2 className="text-sm font-semibold text-gray-700 mb-3">Available doctors</h2>

        {doctors.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-3xl mb-2">👨‍⚕️</div>
            <div className="text-sm">No doctors added yet</div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {doctors.map(doc => (
              <div key={doc.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">Dr. {doc.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{doc.specialty || clinic?.specialty}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {doc._queue_count === 0 ? 'No queue' : `${doc._queue_count} in queue`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`badge ${doc.available ? 'badge-active' : 'badge-completed'}`}>
                      {doc.available ? 'Available' : 'Unavailable'}
                    </span>
                    {doc.available && (
                      <Link href={`/patient/clinic/${clinicId}/book?doctor=${doc.id}`} className="btn-primary text-xs py-1.5 px-3">
                        Book token
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
