'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth'

interface NavbarProps {
  role: 'patient' | 'clinic'
  name: string
}

export default function Navbar({ role, name }: NavbarProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav style={{ borderBottom: '1.5px solid #e8f4f1' }} className="bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={role === 'patient' ? '/patient' : '/clinic'} className="flex items-center gap-2">
          <div style={{ background: '#0F5C4D' }} className="w-7 h-7 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">Q</span>
          </div>
          <span style={{ color: '#0F5C4D' }} className="font-semibold text-sm">QueueCut</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{name}</span>
          <button onClick={handleSignOut} className="btn-outline text-sm py-1.5 px-3">Sign out</button>
        </div>
      </div>
    </nav>
  )
}
