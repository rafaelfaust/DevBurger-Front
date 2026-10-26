import type { CSSProperties } from 'react'

import { DEFAULT_SEGMENT, segmentDefaults, type Segment } from '@/lib/segments'

export type Theme = {
  ink: string
  muted: string
  paper: string
  card: string
  primary: string
  primaryDark: string
  accent: string
  line: string
  success: string
}

export type Assets = {
  logoPath: string
  faviconPath: string
  homeHeroPath: string
  catalogHeroPath: string
  loginImagePath: string
  registerImagePath: string
}

export type Branding = {
  brandName: string
  brandWordmarkLead: string
  brandWordmarkTrail: string
  siteDescription: string
  footerTagline: string
  homeEyebrow: string
  homeTitlePrefix: string
  homeTitleHighlight: string
  homeTitleSuffix: string
  homeCopy: string
  homeImageAlt: string
  homeHighlightTitle: string
  productsDescription: string
  productsEyebrow: string
  productsTitle: string
  productsCopy: string
  loadingLabel: string
  apiErrorLabel: string
  statementDescriptor: string
  namespace: string
  theme: Theme
  assets: Assets
}

// O que cada loja guarda no banco: só os campos que personalizou.
export type BrandingOverrides = Partial<
  Omit<Branding, 'theme' | 'assets' | 'namespace'>
> & {
  theme?: Partial<Theme>
  assets?: Partial<Assets>
}

export const defaultTheme: Theme = {
  ink: '#171512',
  muted: '#6f6a62',
  paper: '#f7f3eb',
  card: '#fffdf8',
  primary: '#f5b82e',
  primaryDark: '#d89300',
  accent: '#b9271e',
  line: '#ddd5c8',
  success: '#1c7a45'
}

export const defaultAssets: Assets = {
  logoPath: '/segments/outro/logo.svg',
  faviconPath: '/segments/outro/logo.svg',
  homeHeroPath: '/segments/outro/hero.svg',
  catalogHeroPath: '/segments/outro/hero.svg',
  loginImagePath: '/segments/outro/hero.svg',
  registerImagePath: '/segments/outro/hero.svg'
}

export function sanitizeNamespace(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function sanitizeStatementDescriptor(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 13)
    .toUpperCase()
}

export function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/:\d+$/, '')
}

// Campos vazios contam como "não personalizado".
const pick = (value: string | undefined, fallback: string) => value?.trim() || fallback

// Camadas: o que a loja personalizou > padrão do segmento > texto genérico.
export function buildBranding(
  namespace: string,
  fallbackName: string,
  custom: BrandingOverrides = {},
  segment: Segment = DEFAULT_SEGMENT
): Branding {
  const base = segmentDefaults(segment)
  const overrides: BrandingOverrides = {
    ...base,
    ...stripEmpty(custom as Record<string, string | undefined>),
    theme: { ...base.theme, ...stripEmpty(custom.theme) },
    assets: { ...base.assets, ...stripEmpty(custom.assets) }
  }
  const brandName = pick(overrides.brandName, fallbackName)
  const brandWords = brandName.split(/\s+/).filter(Boolean)
  const wordmarkLead = pick(overrides.brandWordmarkLead, brandWords[0] ?? brandName)
  const wordmarkTrail = overrides.brandWordmarkLead?.trim()
    ? (overrides.brandWordmarkTrail?.trim() ?? '')
    : pick(overrides.brandWordmarkTrail, brandWords.slice(1).join(' '))

  return {
    brandName,
    brandWordmarkLead: wordmarkLead.toUpperCase(),
    brandWordmarkTrail: wordmarkTrail.toUpperCase(),
    siteDescription: pick(
      overrides.siteDescription,
      `Peça online no cardápio da ${brandName}.`
    ),
    footerTagline: pick(overrides.footerTagline, 'Pedidos online com entrega rápida.'),
    homeEyebrow: pick(overrides.homeEyebrow, 'Delivery'),
    homeTitlePrefix: pick(overrides.homeTitlePrefix, 'Seu pedido pronto para'),
    homeTitleHighlight: pick(overrides.homeTitleHighlight, 'chegar'),
    homeTitleSuffix: pick(overrides.homeTitleSuffix, 'rapidinho.'),
    homeCopy: pick(
      overrides.homeCopy,
      'Escolha no cardápio, finalize em poucos cliques e acompanhe seu pedido.'
    ),
    homeImageAlt: pick(overrides.homeImageAlt, `${brandName} em destaque`),
    homeHighlightTitle: pick(overrides.homeHighlightTitle, 'Produtos em destaque'),
    productsDescription: pick(
      overrides.productsDescription,
      `Explore o cardápio completo da ${brandName}.`
    ),
    productsEyebrow: pick(overrides.productsEyebrow, 'Cardápio'),
    productsTitle: pick(overrides.productsTitle, `Cardápio ${brandName}`),
    productsCopy: pick(overrides.productsCopy, 'Escolha seus favoritos e monte o pedido.'),
    loadingLabel: pick(overrides.loadingLabel, `Carregando ${brandName}...`),
    apiErrorLabel: pick(overrides.apiErrorLabel, 'Tente novamente em alguns instantes.'),
    statementDescriptor: sanitizeStatementDescriptor(
      pick(overrides.statementDescriptor, brandName)
    ),
    namespace,
    theme: { ...defaultTheme, ...stripEmpty(overrides.theme) },
    assets: { ...defaultAssets, ...stripEmpty(overrides.assets) }
  }
}

function stripEmpty<T extends Record<string, string | undefined>>(value?: T): Partial<T> {
  if (!value) return {}
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => typeof item === 'string' && item.trim())
  ) as Partial<T>
}

export function getThemeStyle(value: Branding): CSSProperties {
  return {
    '--ink': value.theme.ink,
    '--muted': value.theme.muted,
    '--paper': value.theme.paper,
    '--card': value.theme.card,
    '--yellow': value.theme.primary,
    '--yellow-dark': value.theme.primaryDark,
    '--red': value.theme.accent,
    '--line': value.theme.line,
    '--green': value.theme.success
  } as CSSProperties
}

// Cada loja tem seu próprio host, então o localStorage já é separado por loja.
export const cartStorageKey = 'storefront:cart'
