'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { ImageUploadButton } from '@/components/image-upload-button'
import {
  buildBranding,
  type Assets,
  type Branding,
  type BrandingOverrides,
  type Theme
} from '@/lib/branding'
import { segmentPresets, segments, type Segment } from '@/lib/segments'

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
  domains,
  segment: initialSegment
}: {
  overrides: BrandingOverrides
  effective: Branding
  domains: string[]
  segment: Segment
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [segment, setSegment] = useState(initialSegment)
  // Só as cores escolhidas pela loja; vazio = cor do segmento.
  const [customColors, setCustomColors] = useState<Partial<Theme>>(overrides.theme ?? {})

  // Padrões do segmento escolhido, para mostrar na hora ao trocar o tipo de loja.
  const preview = useMemo(
    () => buildBranding(effective.namespace, effective.brandName, {}, segment),
    [effective.namespace, effective.brandName, segment]
  )

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const form = new FormData(event.currentTarget)
    const value = (name: string) => String(form.get(name) ?? '')

    const payload = {
      segment,
      ...Object.fromEntries(
        textSections.flatMap(section => section.fields).map(field => [field.name, value(field.name)])
      ),
      theme: Object.fromEntries(
        colorFields.map(field => {
          const color = customColors[field.name] ?? ''
          return [field.name, color.toLowerCase() === preview.theme[field.name].toLowerCase() ? '' : color]
        })
      ),
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
      <fieldset className="settings-group">
        <legend>Tipo de loja</legend>
        <label htmlFor="segment">
          Segmento
          <select id="segment" onChange={event => setSegment(event.target.value as Segment)} value={segment}>
            {segments.map(item => (
              <option key={item} value={item}>
                {segmentPresets[item].label}
              </option>
            ))}
          </select>
        </label>
        <p className="settings-hint">
          O segmento define os textos, cores e imagens padrão. O que você
          personalizar abaixo continua valendo.
        </p>
      </fieldset>

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
              placeholder: preview[field.name]
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
                id={`theme.${field.name}`}
                onChange={event =>
                  setCustomColors(current => ({ ...current, [field.name]: event.target.value }))
                }
                type="color"
                value={customColors[field.name] || preview.theme[field.name]}
              />
              {field.label}
            </label>
          ))}
        </div>
        <button
          className="text-button"
          disabled={!Object.values(customColors).some(Boolean)}
          onClick={() => setCustomColors({})}
          type="button"
        >
          Usar as cores do segmento
        </button>
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
                placeholder={preview.assets[field.name]}
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
