'use server'

import { prisma } from '@/lib/prisma'
import { createSession, deleteSession, getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const email = formData.get('email')?.toString().trim()
  const password = formData.get('password')?.toString()

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi.' }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return { error: 'Kredensial tidak valid. Silakan periksa email & password.' }
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return { error: 'Kredensial tidak valid. Silakan periksa email & password.' }
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (err: any) {
    console.error('Login action error:', err)
    return { error: `Database error: ${err?.message || String(err)}` }
  }

  redirect('/dashboard')
}

export async function logoutAction() {
  await deleteSession()
  redirect('/login')
}

export async function getCurrentUserAction() {
  return await getSession()
}
