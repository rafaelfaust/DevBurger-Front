'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'

import { ImageUploadButton } from '@/components/image-upload-button'
import type { Assets, Branding, BrandingOverrides, Theme } from '@/lib/branding'

type TextField = {
  name: keyof Omit<BrandingOverrides, 'theme' | 'assets'>
  label: string
  maxLength: number
  multiline?: boolean
  hint?: string
}

const textSections: Array<{ title: string; fields: TextField[] }> = [
  {
    title: 'Identidade',
    fields: [
      { name: 'brandName', label: 'Nome da loja', maxLength: 60 },
      { name: 'brandWordmarkLead', label: 'Logo em texto: primeira parte', maxLength: 20 },
      { name: 'brandWordmarkTrail', label: 'Logo em texto: segunda parte (destacada)', maxLength: 20 },
      {
        name: 'statementDescriptor',
        label: 'Nome na fatura do cartão',
        maxLength: 13,
        hint: 'Até 13 letras. Aparece no extrato de quem paga online.'
      }
    ]
  },
  {
    title: 'Página inicial',
    fields: [
      { name: 'homeEyebrow', label: 'Chamada acima do título', maxLength: 60 },
      { name: 'homeTitlePrefix', label: 'Título: início', maxLength: 60 },
      { name: 'homeTitleHighlight', label: 'Título: palavra destacada', maxLength: 30 },
      { name: 'homeTitleSuffix', label: 'Título: final', maxLength: 60 },
      { name: 'homeCopy', label: 'Texto de apresentação', maxLength: 240, multiline: true },
      { name: 'homeHighlightTitle', label: 'Título da seção de destaques', maxLength: 60 }
    ]
  },
  {
    title: 'Cardápio e rodapé',
    fields: [
      { name: 'productsTitle', label: 'Título do cardápio', maxLength: 60 },
      { name: 'productsDescription', label: 'Descrição do cardápio', maxLength: 160 },
      { name: 'footerTagline', label: 'Frase do rodapé', maxLength: 120 },
      {
        name: 'siteDescription',
        label: 'Descrição para Google e WhatsApp',
        maxLength: 160,
        multiline: true
      }
    ]
  }
]

const colorFields: Array<{ name: keyof Theme; label: string }> = [
  { name: 'primary', label: 'Cor principal' },
  { name: 'primaryDark', label: 'Cor principal (escura)' },
  { name: 'accent', label: 'Cor de destaque' },
  { name: 'ink', label: 'Texto' },
  { name: 'paper', label: 'Fundo' },
  { name: 'card', label: 'Cartões' }
]

const imageFields: Array<{ name: keyof Assets; label: string }> = [
  { name: 'logoPath', label: 'Logo' },
  { name: 'faviconPath', label: 'Ícone da aba (favicon)' },
  { name: 'homeHeroPath', label: 'Imagem da página inicial' },
  { name: 'catalogHeroPath', label: 'Imagem do cardápio' },
  { name: 'loginImagePath', label: 'Imagem do login' },
  { name: 'registerImagePath', label: 'Imagem do cadastro' }
]

export function AppearanceForm({
  overrides,
  effective,
  domains
}: {
  overrides: BrandingOverrides
  effective: Branding
  domains: string[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const value = (name: string) => String(form.get(name) ?? '')

    const payload = {
      ...Object.fromEntries(
        textSections.flatMap(section => section.fields).map(field => [field.name, value(field.name)])
      ),
      theme: Object.fromEntries(colorFields.map(field => [field.name, value(`theme.${field.name}`)])),
      assets: Object.fromEntries(imageFields.map(field => [field.name, value(`assets.${field.name}`)]))
    }

    try {
      const response = await fetch('/api/admin/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)
      toast.success('Aparência salva')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="admin-form appearance-form" onSubmit={submit}>
      <p className="settings-hint">
        Campos vazios usam o texto padrão, mostrado em cinza dentro do campo.
      </p>

      {textSections.map(section => (
        <fieldset className="settings-group" key={section.title}>
          <legend>{section.title}</legend>
          {section.fields.map(field => {
            const props = {
              defaultValue: overrides[field.name] ?? '',
              id: field.name,
              maxLength: field.maxLength,
              name: field.name,
              placeholder: effective[field.name]
            }
            return (
              <label htmlFor={field.name} key={field.name}>
                {field.label}
                {field.multiline ? <textarea rows={3} {...props} /> : <input {...props} />}
                {field.hint && <small className="settings-hint">{field.hint}</small>}
              </label>
            )
          })}
        </fieldset>
      ))}

      <fieldset className="settings-group">
        <legend>Cores</legend>
        <div className="color-grid">
          {colorFields.map(field => (
            <label className="color-field" htmlFor={`theme.${field.name}`} key={field.name}>
              <input
                defaultValue={overrides.theme?.[field.name] ?? effective.theme[field.name]}
                id={`theme.${field.name}`}
                name={`theme.${field.name}`}
                type="color"
              />
              {field.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="settings-group">
        <legend>Imagens</legend>
        <p className="settings-hint">
          Envie um arquivo JPG, PNG ou WebP de até 4 MB, ou cole o endereço de
          uma imagem (https://...).
        </p>
        {imageFields.map(field => (
          <div className="image-field" key={field.name}>
            <label htmlFor={`assets.${field.name}`}>
              {field.label}
              <input
                defaultValue={overrides.assets?.[field.name] ?? ''}
                id={`assets.${field.name}`}
                name={`assets.${field.name}`}
                placeholder={effective.assets[field.name]}
              />
            </label>
            <ImageUploadButton label={field.label} targetId={`assets.${field.name}`} />
          </div>
        ))}
      </fieldset>

      <fieldset className="settings-group">
        <legend>Endereços da loja</legend>
        {domains.length ? (
          <ul className="domain-list">
            {domains.map(domain => (
              <li key={domain}>{domain}</li>
            ))}
          </ul>
        ) : (
          <p className="settings-hint">
            Nenhum domínio próprio cadastrado. A loja abre pelo endereço padrão
            da plataforma.
          </p>
        )}
      </fieldset>

      <button className="button" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar aparência'}
      </button>
    </form>
  )
}
