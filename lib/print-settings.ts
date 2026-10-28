'use client'

import { useSyncExternalStore } from 'react'

// Impressora é do aparelho (computador do balcão), então a configuração fica no navegador.
export type PrintSettings = {
  // Largura da bobina em mm.
  paper: '58' | '80'
  // 2 vias = cozinha + entregador.
  copies: 1 | 2
  // Imprime sozinho quando chega pedido novo.
  auto: boolean
}

const key = 'print-settings'
const defaults: PrintSettings = { paper: '80', copies: 1, auto: false }

let cachedRaw: string | null | undefined
let cached = defaults

function read(): PrintSettings {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(key)
  } catch {
    // Sem armazenamento: usa o padrão.
  }
  // Mesmo objeto enquanto nada mudar (exigência do useSyncExternalStore).
  if (raw === cachedRaw) return cached
  cachedRaw = raw
  try {
    const parsed = raw ? (JSON.parse(raw) as Partial<PrintSettings>) : {}
    cached = {
      paper: parsed.paper === '58' ? '58' : '80',
      copies: parsed.copies === 2 ? 2 : 1,
      auto: parsed.auto === true
    }
  } catch {
    cached = defaults
  }
  return cached
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(key, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(key, onChange)
  }
}

export const getPrintSettings = read

export function savePrintSettings(next: PrintSettings) {
  try {
    localStorage.setItem(key, JSON.stringify(next))
  } catch {
    // Sem armazenamento: a preferência não fica salva.
  }
  window.dispatchEvent(new Event(key))
}

export function usePrintSettings() {
  return useSyncExternalStore(subscribe, read, () => defaults)
}

// Pedidos já impressos automaticamente, para duas abas abertas não imprimirem duas vezes.
const printedKey = 'printed-orders'

export function claimAutoPrint(orderId: string) {
  try {
    const printed: string[] = JSON.parse(localStorage.getItem(printedKey) ?? '[]')
    if (printed.includes(orderId)) return false
    localStorage.setItem(printedKey, JSON.stringify([orderId, ...printed].slice(0, 200)))
  } catch {
    // Sem armazenamento: imprime mesmo assim.
  }
  return true
}

export function printUrl(orderId: string, settings = read()) {
  return `/impressao/pedido/${orderId}?papel=${settings.paper}&vias=${settings.copies}`
}

// Imprime sem sair da tela: carrega a comanda num quadro invisível, que chama a impressão sozinho.
export function printOrder(orderId: string) {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0'
  const remove = () => frame.remove()
  frame.addEventListener('load', () => {
    frame.contentWindow?.addEventListener('afterprint', () => setTimeout(remove, 500))
  })
  // Garantia caso o navegador não avise o fim da impressão.
  setTimeout(remove, 120_000)
  frame.src = printUrl(orderId)
  document.body.append(frame)
}
