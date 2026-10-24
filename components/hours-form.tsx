'use client'

import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

import {
  MAX_SHIFTS_PER_DAY,
  weekdayLabels,
  weekdays,
  type OpeningHours,
  type Shift,
  type StatusOverride,
  type StoreStatus,
  type Weekday
} from '@/lib/opening-hours'

// Segunda primeiro, como o restaurante costuma pensar a semana.
const orderedDays: Weekday[] = [...weekdays.slice(1), weekdays[0]]
const businessDays: Weekday[] = ['2', '3', '4', '5']

export function HoursForm({
  hours: initialHours,
  override: initialOverride,
  status
}: {
  hours: OpeningHours
  override: StatusOverride
  status: StoreStatus
}) {
  const router = useRouter()
  const [hours, setHours] = useState<OpeningHours>(initialHours)
  const [override, setOverride] = useState<StatusOverride>(initialOverride)
  const [loading, setLoading] = useState(false)

  const setDay = (day: Weekday, shifts: Shift[]) => setHours(current => ({ ...current, [day]: shifts }))
  const shiftsOf = (day: Weekday) => hours[day] ?? []

  function updateShift(day: Weekday, index: number, field: keyof Shift, value: string) {
    setDay(
      day,
      shiftsOf(day).map((shift, i) => (i === index ? { ...shift, [field]: value } : shift))
    )
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours, override })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      toast.success(`Horários salvos · ${data.label}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="admin-form hours-form" onSubmit={submit}>
      <div className={`store-status ${status.open ? 'is-open' : 'is-closed'}`}>
        <strong>{status.open ? 'Loja aberta' : 'Loja fechada'}</strong>
        <span>{status.label}</span>
      </div>

      <fieldset className="settings-group">
        <legend>Situação da loja</legend>
        <label htmlFor="override">
          Recebimento de pedidos
          <select
            id="override"
            onChange={event => setOverride((event.target.value || null) as StatusOverride)}
            value={override ?? ''}
          >
            <option value="">Seguir o horário de funcionamento</option>
            <option value="closed">Pausar pedidos agora</option>
            <option value="open">Manter aberta fora do horário</option>
          </select>
        </label>
      </fieldset>

      <fieldset className="settings-group">
        <legend>Horário de funcionamento</legend>
        <p className="settings-hint">
          Sem nenhum turno cadastrado a loja fica sempre aberta. Um turno que
          fecha depois da meia-noite (ex.: 18:00 às 02:00) continua no dia
          seguinte.
        </p>
        <div className="hours-grid">
          {orderedDays.map(day => (
            <div className="hours-day" key={day}>
              <strong>{weekdayLabels[day]}</strong>
              <div className="hours-shifts">
                {!shiftsOf(day).length && <span className="settings-hint">Fechado</span>}
                {shiftsOf(day).map((shift, index) => (
                  <div className="hours-shift" key={index}>
                    <input
                      aria-label={`${weekdayLabels[day]}, turno ${index + 1}: abre`}
                      id={`hours-${day}-${index}-open`}
                      onChange={event => updateShift(day, index, 'open', event.target.value)}
                      required
                      type="time"
                      value={shift.open}
                    />
                    <span>às</span>
                    <input
                      aria-label={`${weekdayLabels[day]}, turno ${index + 1}: fecha`}
                      id={`hours-${day}-${index}-close`}
                      onChange={event => updateShift(day, index, 'close', event.target.value)}
                      required
                      type="time"
                      value={shift.close}
                    />
                    <button
                      aria-label={`Remover turno ${index + 1} de ${weekdayLabels[day]}`}
                      className="icon-button"
                      onClick={() => setDay(day, shiftsOf(day).filter((_, i) => i !== index))}
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              {shiftsOf(day).length < MAX_SHIFTS_PER_DAY && (
                <button
                  className="text-button"
                  onClick={() => {
                    const last = shiftsOf(day).at(-1)
                    setDay(day, [
                      ...shiftsOf(day),
                      last ? { open: '18:00', close: '23:00' } : { open: '11:00', close: '15:00' }
                    ])
                  }}
                  type="button"
                >
                  <Plus size={15} /> Turno
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          className="text-button"
          disabled={!shiftsOf('1').length}
          onClick={() =>
            businessDays.forEach(day => setDay(day, shiftsOf('1').map(shift => ({ ...shift }))))
          }
          type="button"
        >
          Copiar o horário de segunda para terça a sexta
        </button>
      </fieldset>

      <button className="button" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar horários'}
      </button>
    </form>
  )
}
