'use client'

import { useEffect } from 'react'

// Abre a janela de impressão assim que a comanda aparece.
// No Chrome aberto com --kiosk-printing, imprime direto sem perguntar.
export function AutoPrint() {
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timer)
  }, [])

  return null
}
