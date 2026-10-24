import { AppearanceForm } from '@/components/appearance-form'
import { getAppearance } from '@/lib/store'

export default async function AppearancePage() {
  const appearance = await getAppearance()

  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">Loja</p>
        <h1>Aparência</h1>
      </div>
      <AppearanceForm {...appearance} />
    </>
  )
}
