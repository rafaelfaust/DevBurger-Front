import { NextResponse } from 'next/server'
import { z } from 'zod'

import { AuthError } from '@/lib/auth'
import { MAX_SHIFTS_PER_DAY, timePattern, weekdays, type Shift } from '@/lib/opening-hours'
import { StoreError, updateOpeningHours } from '@/lib/store'

const time = z.string().regex(timePattern, 'Horário inválido')
const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3))

// Turnos do mesmo dia não podem se sobrepor (o que vira a meia-noite precisa ser o último).
// Abertura igual ao fechamento é um turno de 24 horas (ex.: 00:00 às 00:00).
function shiftsAreValid(shifts: Shift[]) {
  const sorted = [...shifts].sort((a, b) => minutes(a.open) - minutes(b.open))
  return sorted.every((shift, index) => {
    const next = sorted[index + 1]
    if (!next) return true
    const close = minutes(shift.close) <= minutes(shift.open) ? 24 * 60 : minutes(shift.close)
    return close <= minutes(next.open)
  })
}

const day = z
  .array(z.object({ open: time, close: time }))
  .max(MAX_SHIFTS_PER_DAY, `No máximo ${MAX_SHIFTS_PER_DAY} turnos por dia`)
  .refine(shiftsAreValid, 'Os turnos de um dia não podem se sobrepor')

const schema = z.object({
  hours: z.object(Object.fromEntries(weekdays.map(weekday => [weekday, day.optional()]))),
  override: z.enum(['open', 'closed']).nullable()
})

export async function PUT(request: Request) {
  try {
    const payload = schema.parse(await request.json())
    // Dias sem turno não são guardados.
    const hours = Object.fromEntries(
      Object.entries(payload.hours).filter(([, shifts]) => shifts?.length)
    )
    return NextResponse.json(await updateOpeningHours({ hours, override: payload.override }))
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? (error.issues[0]?.message ?? 'Dados inválidos')
        : error instanceof StoreError || error instanceof AuthError
          ? error.message
          : 'Dados inválidos'
    const status =
      error instanceof StoreError || error instanceof AuthError ? error.status : 400
    return NextResponse.json({ message }, { status })
  }
}
