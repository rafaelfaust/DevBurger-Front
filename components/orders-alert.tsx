'use client'

import { BellRing, Volume2, VolumeX } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

import { claimAutoPrint, getPrintSettings, printOrder } from '@/lib/print-settings'

const POLL_MS = 10_000
const soundKey = 'orders-sound'

type Pulse = { waiting: string[]; version: string }

// Campainha gerada no navegador (sem arquivo de áudio): três toques de dois tons.
function ring(context: AudioContext) {
  const start = context.currentTime
  for (let i = 0; i < 3; i++) {
    for (const [offset, frequency] of [[0, 880], [0.18, 1320]] as const) {
      const at = start + i * 0.6 + offset
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.5, at + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.35)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start(at)
      oscillator.stop(at + 0.4)
    }
  }
}

// Preferência de som deste aparelho (localStorage), igual em todas as abas.
function readSoundSetting() {
  try {
    return localStorage.getItem(soundKey) !== 'off'
  } catch {
    return true
  }
}

function subscribeSoundSetting(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(soundKey, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(soundKey, onChange)
  }
}

function saveSoundSetting(on: boolean) {
  try {
    localStorage.setItem(soundKey, on ? 'on' : 'off')
  } catch {
    // Sem armazenamento: a preferência não fica salva.
  }
  window.dispatchEvent(new Event(soundKey))
}

// Fica no topo de todo o painel: toca enquanto houver pedido esperando a loja aceitar
// (status "Pedido confirmado") e atualiza a lista de pedidos quando algo muda.
export function OrdersAlert() {
  const router = useRouter()
  const pathname = usePathname()
  const [waiting, setWaiting] = useState(0)
  const soundOn = useSyncExternalStore(subscribeSoundSetting, readSoundSetting, () => true)
  // O navegador só libera som depois de um toque na página.
  const [blocked, setBlocked] = useState(false)
  const audio = useRef<AudioContext | null>(null)
  const last = useRef<Pulse | null>(null)
  const soundOnRef = useRef(soundOn)
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    pathnameRef.current = pathname
    soundOnRef.current = soundOn
  }, [pathname, soundOn])

  const getAudio = useCallback(() => {
    if (!audio.current) {
      const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Context) return null
      audio.current = new Context()
    }
    return audio.current
  }, [])

  const unlock = useCallback(async () => {
    const context = getAudio()
    if (context?.state === 'suspended') await context.resume().catch(() => {})
    setBlocked(context?.state !== 'running')
  }, [getAudio])

  useEffect(() => {
    // Qualquer toque na página libera o som.
    const onGesture = () => void unlock()
    window.addEventListener('pointerdown', onGesture)
    window.addEventListener('keydown', onGesture)
    return () => {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
  }, [unlock])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    async function poll() {
      try {
        const response = await fetch('/api/admin/orders/pulse', { cache: 'no-store' })
        // Sessão expirou ou não é admin: para de consultar.
        if (response.status === 401 || response.status === 403) return
        if (response.ok) handle((await response.json()) as Pulse)
      } catch {
        // Sem internet por um momento: tenta de novo no próximo ciclo.
      }
      if (!stopped) timer = setTimeout(poll, POLL_MS)
    }

    function handle(pulse: Pulse) {
      const previous = last.current
      last.current = pulse
      setWaiting(pulse.waiting.length)

      const fresh = previous ? pulse.waiting.filter(id => !previous.waiting.includes(id)) : []
      if (fresh.length) {
        const text = fresh.length === 1 ? 'Novo pedido chegou!' : `${fresh.length} pedidos novos chegaram!`
        toast.success(text)
        if (getPrintSettings().auto) {
          // Um de cada vez, para a impressora não receber tudo junto.
          fresh.filter(claimAutoPrint).forEach((id, index) => setTimeout(() => printOrder(id), index * 4000))
        }
        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(text, { body: 'Abra o painel para aceitar.', tag: 'novo-pedido' })
        }
      }

      if (pulse.waiting.length && soundOnRef.current) {
        const context = getAudio()
        if (context?.state === 'running') ring(context)
        else setBlocked(true)
      }

      if (previous && previous.version !== pulse.version && pathnameRef.current === '/admin/pedidos') {
        router.refresh()
      }
    }

    void poll()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [getAudio, router])

  // Contador na aba do navegador: "(2) Pedidos".
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, '')
    document.title = waiting ? `(${waiting}) ${base}` : base
  }, [waiting, pathname])

  async function toggleSound() {
    const next = !soundOn
    saveSoundSetting(next)
    if (next) {
      await unlock()
      const context = getAudio()
      if (context?.state === 'running') ring(context)
      if ('Notification' in window && Notification.permission === 'default') {
        void Notification.requestPermission()
      }
    }
  }

  return (
    <div className={`orders-alert${waiting ? ' is-ringing' : ''}`} role="status">
      {waiting ? (
        <Link className="orders-alert-count" href="/admin/pedidos">
          <BellRing size={18} />
          {waiting === 1 ? '1 pedido esperando aceite' : `${waiting} pedidos esperando aceite`}
        </Link>
      ) : (
        <span className="orders-alert-count">Aguardando pedidos</span>
      )}
      {soundOn && blocked && (
        <button className="text-button" onClick={() => void unlock()} type="button">
          Toque para ativar o som
        </button>
      )}
      <button
        aria-pressed={soundOn}
        className="orders-alert-sound"
        onClick={() => void toggleSound()}
        title={soundOn ? 'Silenciar aviso' : 'Ligar aviso sonoro'}
        type="button"
      >
        {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        {soundOn ? 'Som ligado' : 'Som desligado'}
      </button>
    </div>
  )
}
