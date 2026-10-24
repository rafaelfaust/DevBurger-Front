import { HoursForm } from '@/components/hours-form'
import { getOpeningHoursSettings } from '@/lib/store'

export default async function OpeningHoursPage() {
  const settings = await getOpeningHoursSettings()

  return (
    <>
      <div className="admin-heading">
        <p className="eyebrow">Loja</p>
        <h1>Horários</h1>
      </div>
      <HoursForm {...settings} />
    </>
  )
}
