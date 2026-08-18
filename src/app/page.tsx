import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  } else {
    redirect('/dashboard')
  }
}
