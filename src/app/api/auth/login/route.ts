import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = body.email?.toString().trim()
    const password = body.password?.toString()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi.' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Kredensial tidak valid. Silakan periksa email & password.' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Kredensial tidak valid. Silakan periksa email & password.' },
        { status: 401 }
      )
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    return NextResponse.json({ success: true, redirectUrl: '/dashboard' })
  } catch (err: any) {
    console.error('API /api/auth/login Error:', err)
    return NextResponse.json(
      { error: `Database error: ${err?.message || 'Gagal terhubung ke database.'}` },
      { status: 500 }
    )
  }
}
