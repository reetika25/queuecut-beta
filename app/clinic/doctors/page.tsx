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
  created_at: string
}

export default function ClinicDoctorsPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', specialty: '' })
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const fetchDoctors = useCallback(async (clinicId: string) => {
    const { data } = await supabase.from('doctors').select('*').eq('clinic_id', clinicId).order('name')
    if (data) setDoctors(data)
  }, [])

  useEffect(() => {
    const init = async () => {
      const u = await getCurrentUser()
      if (!u || u.role !== 'clinic') { router.push('/auth/clinic/login'); return }
      setUser(u)
      await fetchDoctors(u.id)
      setLoading(false)
    }
    init()
  }, [router, fetchDoctors])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setAdding(true)
    setError('')
    try {
      const { error: insertError } = await supabase.from('doctors').insert({
        clinic_id: user.id,
        name: form.name.trim(),
        specialty: form.specialty.trim(),
        available: true
      })
      if (insertError) throw insertError
      setForm({ name: '', specialty: '' })
      setShowForm(false)
      await fetchDoctors(user.id)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add doctor')
    } finally {
      setAdding(false)
    }
  }

  const toggleAvailable = async (doctor: Doctor) => {
    await supabase.from('doctors').update({ available: !doctor.available }).eq('id', doctor.id)
    await fetchDoctors(user!.id)
  }

  const removeDoctor = async (doctorId: string) => {
    if (!confirm('Remove this doctor? Their queue history will be preserved.')) return
    await supabase.from('doctors').delete().eq('id', doctorId)
    await fetchDoctors(user!.id)
  }

  const specialties = ['General Practice', 'Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics', 'Gynecology', 'ENT', 'Ophthalmology', 'Neurology', 'Psychiatry', 'Other']

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar role="clinic" name={user?.name || ''} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link href="/clinic" style={{ color: '#0F5C4D' }} className="text-sm flex items-center gap-1 mb-5">
          ← Back to dashboard
        </Link>

        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-semibold text-gray-900">Doctors</h1>
          <button className="btn-primary text-sm py-1.5 px-4" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Add doctor'}
          </button>
        </div>

        {showForm && (
          <div className="card mb-5" style={{ borderColor: '#0F5C4D' }}>
            <h2 className="text-sm font-semibold text-gray-800 mb-3">New doctor</h2>
            {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-3">{error}</div>}
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Doctor name</label>
                <input
                  className="input-field"
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Arjun Mehta"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Specialty</label>
                <select
                  className="input-field"
                  value={form.specialty}
                  onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                  required
                >
                  <option value="">Select specialty</option>
                  {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button className="btn-primary w-full" type="submit" disabled={adding}>
                {adding ? 'Adding…' : 'Add doctor'}
              </button>
            </form>
          </div>
        )}

        {doctors.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">👨‍⚕️</div>
            <div className="text-sm font-medium text-gray-500 mb-1">No doctors yet</div>
            <div className="text-xs">Add your first doctor to start accepting patients</div>
          </div>
        ) : (
          <div className="space-y-2">
            {doctors.map(doc => (
              <div key={doc.id} className="card flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-800">Dr. {doc.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{doc.specialty}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAvailable(doc)}
                    className={`badge cursor-pointer ${doc.available ? 'badge-active' : 'badge-completed'}`}
                  >
                    {doc.available ? '● Available' : '○ Unavailable'}
                  </button>
                  <button
                    onClick={() => removeDoctor(doc.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors px-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
