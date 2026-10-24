'use client'

import { Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

// Envia a imagem e escreve o endereço devolvido no campo de texto indicado.
export function ImageUploadButton({ targetId, label }: { targetId: string; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  async function upload(file: File) {
    setLoading(true)
    const body = new FormData()
    body.append('file', file)

    try {
      const response = await fetch('/api/admin/uploads', { method: 'POST', body })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      const target = document.getElementById(targetId)
      if (target instanceof HTMLInputElement) target.value = data.url
      toast.success('Imagem enviada. Salve para aplicar.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao enviar a imagem')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        accept="image/jpeg,image/png,image/webp"
        aria-label={`Escolher arquivo: ${label}`}
        hidden
        id={`${targetId}-file`}
        onChange={event => {
          const file = event.target.files?.[0]
          if (file) upload(file)
        }}
        ref={inputRef}
        type="file"
      />
      <button
        className="text-button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <Upload size={15} /> {loading ? 'Enviando...' : 'Enviar imagem'}
      </button>
    </>
  )
}
