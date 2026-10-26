import { SettingsForm } from '@/components/settings-form'
import { getStoreSettings } from '@/lib/store'

export default async function SettingsPage() {
  const settings = await getStoreSettings()

  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">Loja</p>
        <h1>Configurações</h1>
      </div>
      <SettingsForm settings={settings} />
    </>
  )
}
