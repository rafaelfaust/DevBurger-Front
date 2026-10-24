// Turnos por dia da semana (0 = domingo). Um turno com fechamento menor ou igual
// à abertura atravessa a meia-noite (ex.: 18:00 → 02:00).
export type Shift = { open: string; close: string }
export type OpeningHours = Partial<Record<Weekday, Shift[]>>
export type Weekday = '0' | '1' | '2' | '3' | '4' | '5' | '6'

// null = segue o horário; "open"/"closed" = o dono forçou pelo painel.
export type StatusOverride = 'open' | 'closed' | null

export const weekdays: Weekday[] = ['0', '1', '2', '3', '4', '5', '6']
export const weekdayLabels: Record<Weekday, string> = {
  '0': 'Domingo',
  '1': 'Segunda',
  '2': 'Terça',
  '3': 'Quarta',
  '4': 'Quinta',
  '5': 'Sexta',
  '6': 'Sábado'
}

export const MAX_SHIFTS_PER_DAY = 3
export const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

export type StoreStatus = {
  open: boolean
  // Texto curto para o cliente: "Fecha às 23:00", "Abre amanhã às 11:00".
  label: string
  reason: 'schedule' | 'paused' | 'forced_open' | 'no_schedule'
}

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// Dia da semana e minutos do dia no fuso da loja.
function localClock(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date)
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? ''
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  return { weekday, minutes: Number(get('hour')) * 60 + Number(get('minute')) }
}

const shiftsOf = (hours: OpeningHours, weekday: number) =>
  hours[String(((weekday % 7) + 7) % 7) as Weekday] ?? []

const overnight = (shift: Shift) => toMinutes(shift.close) <= toMinutes(shift.open)

export function hasSchedule(hours: OpeningHours) {
  return weekdays.some(day => (hours[day]?.length ?? 0) > 0)
}

// Turno aberto agora, se houver (inclui o turno de ontem que passou da meia-noite).
function currentShift(hours: OpeningHours, weekday: number, minutes: number) {
  for (const shift of shiftsOf(hours, weekday)) {
    const open = toMinutes(shift.open)
    const close = toMinutes(shift.close)
    if (overnight(shift) ? minutes >= open : minutes >= open && minutes < close) {
      return shift
    }
  }
  for (const shift of shiftsOf(hours, weekday - 1)) {
    if (overnight(shift) && minutes < toMinutes(shift.close)) return shift
  }
  return null
}

function nextOpening(hours: OpeningHours, weekday: number, minutes: number) {
  for (let offset = 0; offset < 7; offset++) {
    const day = weekday + offset
    const starts = shiftsOf(hours, day)
      .map(shift => shift.open)
      .filter(open => offset > 0 || toMinutes(open) > minutes)
      .sort()
    if (starts.length) {
      const when =
        offset === 0
          ? 'hoje'
          : offset === 1
            ? 'amanhã'
            : weekdayLabels[String(day % 7) as Weekday].toLowerCase()
      return `Abre ${when} às ${starts[0]}`
    }
  }
  return null
}

export function getStoreStatus(
  hours: OpeningHours,
  override: StatusOverride,
  timeZone: string,
  now = new Date()
): StoreStatus {
  const { weekday, minutes } = localClock(now, timeZone)

  if (override === 'closed') {
    return {
      open: false,
      label: 'Pausado no momento',
      reason: 'paused'
    }
  }
  if (override === 'open') {
    return { open: true, label: 'Aberto agora', reason: 'forced_open' }
  }
  if (!hasSchedule(hours)) {
    return { open: true, label: 'Aberto agora', reason: 'no_schedule' }
  }

  const shift = currentShift(hours, weekday, minutes)
  if (shift) {
    const label =
      shift.open === shift.close ? 'Aberto 24 horas' : `Aberto · fecha às ${shift.close}`
    return { open: true, label, reason: 'schedule' }
  }

  return {
    open: false,
    label: nextOpening(hours, weekday, minutes) ?? 'Fechado',
    reason: 'schedule'
  }
}
