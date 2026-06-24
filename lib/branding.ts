import type { CSSProperties } from 'react'

import { headers } from 'next/headers'

type Theme = {
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
}

type BrandingOverrides = Partial<Omit<Branding, 'theme' | 'statementDescriptor'>> & {
  statementDescriptor?: string
  theme?: Partial<Theme>
}

type TenantConfig = {
  key: string
  hosts: string[]
  branding?: BrandingOverrides
}

function sanitizeNamespace(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function sanitizeStatementDescriptor(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 13)
    .toUpperCase()
}

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/:\d+$/, '')
}

function createBaseTheme(): Theme {
  return {
    ink: process.env.NEXT_PUBLIC_THEME_INK?.trim() || '#171512',
    muted: process.env.NEXT_PUBLIC_THEME_MUTED?.trim() || '#6f6a62',
    paper: process.env.NEXT_PUBLIC_THEME_PAPER?.trim() || '#f7f3eb',
    card: process.env.NEXT_PUBLIC_THEME_CARD?.trim() || '#fffdf8',
    primary: process.env.NEXT_PUBLIC_THEME_PRIMARY?.trim() || '#f5b82e',
    primaryDark: process.env.NEXT_PUBLIC_THEME_PRIMARY_DARK?.trim() || '#d89300',
    accent: process.env.NEXT_PUBLIC_THEME_ACCENT?.trim() || '#b9271e',
    line: process.env.NEXT_PUBLIC_THEME_LINE?.trim() || '#ddd5c8',
    success: process.env.NEXT_PUBLIC_THEME_SUCCESS?.trim() || '#1c7a45'
  }
}

function buildBranding(overrides: BrandingOverrides = {}): Branding {
  const brandName = overrides.brandName ?? process.env.NEXT_PUBLIC_BRAND_NAME?.trim() ?? 'Sua Marca'
  const brandWords = brandName.split(/\s+/).filter(Boolean)
  const wordmarkLead =
    overrides.brandWordmarkLead ??
    process.env.NEXT_PUBLIC_BRAND_WORDMARK_LEAD?.trim() ??
    brandWords[0] ??
    brandName
  const wordmarkTrail =
    overrides.brandWordmarkTrail ??
    process.env.NEXT_PUBLIC_BRAND_WORDMARK_TRAIL?.trim() ??
    brandWords.slice(1).join(' ')
  const namespaceSource =
    overrides.namespace ?? process.env.NEXT_PUBLIC_APP_NAMESPACE?.trim() ?? brandName
  const theme = { ...createBaseTheme(), ...overrides.theme }

  return {
    brandName,
    brandWordmarkLead: wordmarkLead.toUpperCase(),
    brandWordmarkTrail: wordmarkTrail.toUpperCase(),
    siteDescription:
      overrides.siteDescription ??
      process.env.NEXT_PUBLIC_SITE_DESCRIPTION?.trim() ??
      'Plataforma white-label para delivery, catálogo digital, pedidos e checkout online.',
    footerTagline:
      overrides.footerTagline ??
      process.env.NEXT_PUBLIC_FOOTER_TAGLINE?.trim() ??
      'Operação digital pronta para vender com a identidade do seu cliente.',
    homeEyebrow:
      overrides.homeEyebrow ??
      process.env.NEXT_PUBLIC_HOME_EYEBROW?.trim() ??
      'White-label para delivery e restaurantes',
    homeTitlePrefix:
      overrides.homeTitlePrefix ??
      process.env.NEXT_PUBLIC_HOME_TITLE_PREFIX?.trim() ??
      'Seu delivery pronto para',
    homeTitleHighlight:
      overrides.homeTitleHighlight ??
      process.env.NEXT_PUBLIC_HOME_TITLE_HIGHLIGHT?.trim() ??
      'vender',
    homeTitleSuffix:
      overrides.homeTitleSuffix ??
      process.env.NEXT_PUBLIC_HOME_TITLE_SUFFIX?.trim() ??
      'online.',
    homeCopy:
      overrides.homeCopy ??
      process.env.NEXT_PUBLIC_HOME_COPY?.trim() ??
      'Catálogo, carrinho, checkout seguro e operação administrativa em uma única plataforma white-label.',
    homeImageAlt:
      overrides.homeImageAlt ??
      process.env.NEXT_PUBLIC_HOME_IMAGE_ALT?.trim() ??
      `${brandName} em destaque`,
    homeHighlightTitle:
      overrides.homeHighlightTitle ??
      process.env.NEXT_PUBLIC_HOME_HIGHLIGHT_TITLE?.trim() ??
      'Produtos em destaque',
    productsDescription:
      overrides.productsDescription ??
      process.env.NEXT_PUBLIC_PRODUCTS_DESCRIPTION?.trim() ??
      `Explore o catálogo completo da ${brandName}.`,
    productsEyebrow:
      overrides.productsEyebrow ??
      process.env.NEXT_PUBLIC_PRODUCTS_EYEBROW?.trim() ??
      'Catálogo digital',
    productsTitle:
      overrides.productsTitle ??
      process.env.NEXT_PUBLIC_PRODUCTS_TITLE?.trim() ??
      `Cardápio ${brandName}`,
    productsCopy:
      overrides.productsCopy ??
      process.env.NEXT_PUBLIC_PRODUCTS_COPY?.trim() ??
      'Produtos organizados para conversão, operação rápida e atualização simples.',
    loadingLabel:
      overrides.loadingLabel ??
      process.env.NEXT_PUBLIC_LOADING_LABEL?.trim() ??
      `Carregando ${brandName}...`,
    apiErrorLabel:
      overrides.apiErrorLabel ??
      process.env.NEXT_PUBLIC_API_ERROR_LABEL?.trim() ??
      `Verifique a integração principal da ${brandName} e tente novamente.`,
    statementDescriptor: sanitizeStatementDescriptor(
      overrides.statementDescriptor ??
        process.env.NEXT_PUBLIC_BRAND_STATEMENT_DESCRIPTOR?.trim() ??
        brandName
    ),
    namespace: sanitizeNamespace(namespaceSource) || 'storefront',
    theme
  }
}

function parseTenantConfig(): TenantConfig[] {
  const raw = process.env.APP_TENANT_CONFIG?.trim()
  if (!raw) return []

  try {
    const value = JSON.parse(raw) as unknown
    if (!Array.isArray(value)) return []

    return value.flatMap(item => {
      if (!item || typeof item !== 'object') return []

      const key = typeof item.key === 'string' ? item.key : ''
      const hosts = Array.isArray(item.hosts)
        ? item.hosts.filter((host: unknown): host is string => typeof host === 'string')
        : []

      if (!key || !hosts.length) return []

      return [{ key, hosts: hosts.map(normalizeHost), branding: item.branding as BrandingOverrides }]
    })
  } catch {
    return []
  }
}

function hostMatches(pattern: string, host: string) {
  if (pattern.startsWith('*.')) {
    return host.endsWith(pattern.slice(1))
  }

  return host === pattern
}

async function getRequestHost(request?: Request) {
  if (request) {
    return normalizeHost(
      request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? new URL(request.url).host
    )
  }

  const headerStore = await headers()
  return normalizeHost(
    headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? ''
  )
}

const tenantConfig = parseTenantConfig()

export const branding = buildBranding()

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

export async function getTenantBranding(request?: Request): Promise<Branding> {
  const host = await getRequestHost(request)
  const tenant = tenantConfig.find(item => item.hosts.some(pattern => hostMatches(pattern, host)))

  if (!tenant) return branding
  return buildBranding(tenant.branding)
}

export async function getSessionCookieNames(request?: Request) {
  const resolvedBranding = await getTenantBranding(request)

  return {
    token: `${resolvedBranding.namespace}_token`,
    user: `${resolvedBranding.namespace}_user`
  }
}

export const cartStorageKey = `${branding.namespace}:cart`