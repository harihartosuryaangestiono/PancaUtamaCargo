import { requireAuth } from '@/lib/session'
import { getBcaMutationsAction } from '@/app/actions/bcaMutationActions'
import { BcaMutationView } from './BcaMutationView'

export default async function BcaMutationsPage() {
  await requireAuth()
  const data = await getBcaMutationsAction()

  return (
    <BcaMutationView
      initialMutations={data.mutations}
      initialSummary={data.summary}
    />
  )
}
