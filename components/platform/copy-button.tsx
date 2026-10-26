'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'

export function CopyButton({ text, label }: { text: string; label: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copiado')
    } catch {
      toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.')
    }
  }

  return (
    <button className="button button-secondary" onClick={copy} type="button">
      <Copy size={16} /> {label}
    </button>
  )
}
