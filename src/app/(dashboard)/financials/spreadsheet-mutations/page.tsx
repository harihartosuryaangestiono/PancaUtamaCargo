import { requireAuth } from '@/lib/session'
import { getKasMutationsAction, getKasSummaryAction } from '@/app/actions/kasMutationActions'
import { SpreadsheetMutationView } from './SpreadsheetMutationView'

export default async function SpreadsheetMutationsPage() {
  await requireAuth()
  const mutations = await getKasMutationsAction()
  const summary = await getKasSummaryAction(2026)

  return (
    <SpreadsheetMutationView
      initialMutations={mutations}
      initialSummary={summary}
    />
  )
}
