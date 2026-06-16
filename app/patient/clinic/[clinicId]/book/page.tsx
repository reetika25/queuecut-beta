'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Doctor {
  id: string
  name: string
  specialty: string
}

interface Clinic {
  id: string
  name: string
}

export default function BookTokenPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const clinicId = params.clinicId as string
  const doctorId = searchParams.get('doctor') || ''

  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [queueCount, setQueueCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [alreadyBooked, setAlreadyBooked] = useState(false)

  useEffect(() => {
    const init = async () => {
      const u = await getCurrentUser()
      if (!u || u.role !== 'patient') { router.push('/auth/patient/login'); return }
      setUser(u)

      const [{ data: docData }, { data: clinicData }, { count }] = await Promise.all([
        supabase.from('doctors').select('*').eq('id', doctorId).single(),
        supabase.from('clinics').select('id, name').eq('id', clinicId).single(),
        supabase.from('tokens').select('*', { count: 'exact', head: true })
          .eq('doctor_id', doctorId).in('status', ['waiting', 'active'])
      ])

      // Check if patient already has an active token for this doctor
      const { data: existing } = await supabase.from('tokens')
        .select('id')
        .eq('patient_id', u.id)
        .eq('doctor_id', doctorId)
        .in('status', ['waiting', 'active'])
        .limit(1)

      if (existing && existing.length > 0) setAlreadyBooked(true)
      if (docData) setDoctor(docData)
      if (clinicData) setClinic(clinicData)
      setQueueCount(count || 0)
      setLoading(false)
    }
    init()
  }, [router, clinicId, doctorId])

  const handleBook = async () => {
    if (!user) return
    setBooking(true)
    setError('')
    try {
      // Get the next token number for this doctor
      const { data: lastToken } = await supabase.from('tokens')
        .select('token_number')
        .eq('doctor_id', doctorId)
        .order('token_number', { ascending: false })
        .limit(1)

      const nextNumber = (lastToken?.[0]?.token_number || 0) + 1

      const { error: insertError } = await supabase.from('tokens').insert({
        patient_id: user.id,
        clinic_id: clinicId,
        doctor_id: doctorId,
        token_number: nextNumber,
        status: 'waiting',
        booked_at: new Date().toISOString()
      })

      if (insertError) throw insertError
      router.push('/patient/token')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setBooking(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar role="patient" name={user?.name || ''} />
      <div className="max-w-lg mx-auto px-4 py-6">
        <Link href={`/patient/clinic/${clinicId}`} style={{ color: '#0F5C4D' }} className="text-sm flex items-center gap-1 mb-5">
          ← Back to clinic
        </Link>

        <h1 className="text-xl font-bold text-gray-900 mb-1">Book a token</h1>
        <p className="text-sm text-gray-500 mb-6">Confirm your appointment slot below.</p>

        <div className="card mb-4">
          <div className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">Appointment details</div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Clinic</span>
              <span className="font-medium text-gray-800">{clinic?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Doctor</span>
              <span className="font-medium text-gray-800">Dr. {doctor?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Specialty</span>
              <span className="font-medium text-gray-800">{doctor?.specialty}</span>
            </div>
            <div style={{ borderTop: '1px solid #e8f4f1' }} className="pt-2 flex justify-between text-sm">
              <span className="text-gray-500">Current queue</span>
              <span className="font-medium text-gray-800">{queueCount} ahead of you</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Your token number</span>
              <span style={{ color: '#0F5C4D' }} className="font-bold">#{queueCount + 1}</span>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-4">{error}</div>}

        {alreadyBooked ? (
          <div className="bg-yellow-50 text-yellow-700 text-sm rounded-lg p-4 mb-4">
            You already have an active token with this doctor.{' '}
            <Link href="/patient/token" style={{ color: '#0F5C4D' }} className="font-medium underline">View it →</Link>
          </div>
        ) : (
          <button className="btn-primary w-full py-3" onClick={handleBook} disabled={booking}>
            {booking ? 'Booking…' : `Confirm booking — Token #${queueCount + 1}`}
          </button>
        )}
      </div>
    </div>
  )
}
