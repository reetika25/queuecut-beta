import { supabase } from './supabase'

export type UserRole = 'patient' | 'clinic'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  name: string
}

export async function signUp(email: string, password: string, name: string, role: UserRole, extra?: Record<string, string>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, name, ...extra } }
  })
  if (error) throw error

  const userId = data.user?.id
  if (!userId) throw new Error('No user ID returned')

  if (role === 'patient') {
    const { error: dbError } = await supabase.from('patients').insert({
      id: userId,
      email,
      name,
      phone: extra?.phone || ''
    })
    if (dbError) throw dbError
  } else {
    const { error: dbError } = await supabase.from('clinics').insert({
      id: userId,
      email,
      name,
      address: extra?.address || '',
      specialty: extra?.specialty || ''
    })
    if (dbError) throw dbError
  }

  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return {
    id: user.id,
    email: user.email!,
    role: user.user_metadata.role as UserRole,
    name: user.user_metadata.name
  }
}
