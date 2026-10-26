import { normalizeHost, sanitizeNamespace, type BrandingOverrides } from '@/lib/branding'
import { DEFAULT_SEGMENT, isSegment, type Segment } from '@/lib/segments'

// Lojas iniciais descritas no .env. Usado só pelo db:seed: em execução a marca vem do banco.
export type SeedTenant = {
  slug: string
  name: string
  hosts: string[]
  segment: Segment
  branding: BrandingOverrides
}

const env = (name: string) => process.env[name]?.trim() || undefined

function compact<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined)
  ) as T
}

function envBranding(): BrandingOverrides {
  return compact({
    brandName: env('NEXT_PUBLIC_BRAND_NAME'),
    brandWordmarkLead: env('NEXT_PUBLIC_BRAND_WORDMARK_LEAD'),
    brandWordmarkTrail: env('NEXT_PUBLIC_BRAND_WORDMARK_TRAIL'),
    siteDescription: env('NEXT_PUBLIC_SITE_DESCRIPTION'),
    footerTagline: env('NEXT_PUBLIC_FOOTER_TAGLINE'),
    homeEyebrow: env('NEXT_PUBLIC_HOME_EYEBROW'),
    homeTitlePrefix: env('NEXT_PUBLIC_HOME_TITLE_PREFIX'),
    homeTitleHighlight: env('NEXT_PUBLIC_HOME_TITLE_HIGHLIGHT'),
    homeTitleSuffix: env('NEXT_PUBLIC_HOME_TITLE_SUFFIX'),
    homeCopy: env('NEXT_PUBLIC_HOME_COPY'),
    homeImageAlt: env('NEXT_PUBLIC_HOME_IMAGE_ALT'),
    homeHighlightTitle: env('NEXT_PUBLIC_HOME_HIGHLIGHT_TITLE'),
    productsDescription: env('NEXT_PUBLIC_PRODUCTS_DESCRIPTION'),
    productsEyebrow: env('NEXT_PUBLIC_PRODUCTS_EYEBROW'),
    productsTitle: env('NEXT_PUBLIC_PRODUCTS_TITLE'),
    productsCopy: env('NEXT_PUBLIC_PRODUCTS_COPY'),
    loadingLabel: env('NEXT_PUBLIC_LOADING_LABEL'),
    apiErrorLabel: env('NEXT_PUBLIC_API_ERROR_LABEL'),
    statementDescriptor: env('NEXT_PUBLIC_BRAND_STATEMENT_DESCRIPTOR'),
    theme: compact({
      ink: env('NEXT_PUBLIC_THEME_INK'),
      muted: env('NEXT_PUBLIC_THEME_MUTED'),
      paper: env('NEXT_PUBLIC_THEME_PAPER'),
      card: env('NEXT_PUBLIC_THEME_CARD'),
      primary: env('NEXT_PUBLIC_THEME_PRIMARY'),
      primaryDark: env('NEXT_PUBLIC_THEME_PRIMARY_DARK'),
      accent: env('NEXT_PUBLIC_THEME_ACCENT'),
      line: env('NEXT_PUBLIC_THEME_LINE'),
      success: env('NEXT_PUBLIC_THEME_SUCCESS')
    }),
    assets: compact({
      logoPath: env('NEXT_PUBLIC_BRAND_LOGO_PATH'),
      faviconPath: env('NEXT_PUBLIC_BRAND_FAVICON_PATH'),
      homeHeroPath: env('NEXT_PUBLIC_BRAND_HOME_HERO_PATH'),
      catalogHeroPath: env('NEXT_PUBLIC_BRAND_CATALOG_HERO_PATH'),
      loginImagePath: env('NEXT_PUBLIC_BRAND_LOGIN_IMAGE_PATH'),
      registerImagePath: env('NEXT_PUBLIC_BRAND_REGISTER_IMAGE_PATH')
    })
  })
}

export function defaultTenantSlug() {
  return sanitizeNamespace(env('NEXT_PUBLIC_APP_NAMESPACE') ?? env('NEXT_PUBLIC_BRAND_NAME') ?? '') || 'storefront'
}

function defaultSegment(): Segment {
  const value = env('APP_DEFAULT_SEGMENT')
  return isSegment(value) ? value : DEFAULT_SEGMENT
}

function parseTenantConfig(): SeedTenant[] {
  const raw = env('APP_TENANT_CONFIG')
  if (!raw) return []

  try {
    const value = JSON.parse(raw) as unknown
    if (!Array.isArray(value)) return []

    return value.flatMap(item => {
      if (!item || typeof item !== 'object') return []
      const branding = (item.branding ?? {}) as BrandingOverrides & { namespace?: string }
      const slug = sanitizeNamespace(branding.namespace ?? item.key ?? '')
      if (!slug) return []

      const { namespace: _namespace, ...overrides } = branding
      void _namespace
      const hosts = Array.isArray(item.hosts)
        ? item.hosts
            .filter((host: unknown): host is string => typeof host === 'string')
            .map(normalizeHost)
            // Curingas (*.exemplo.com) agora são cobertos por PLATFORM_DOMAIN.
            .filter((host: string) => !host.startsWith('*.'))
        : []

      const segment = isSegment(item.segment) ? item.segment : DEFAULT_SEGMENT
      return [{ slug, name: overrides.brandName ?? slug, hosts, segment, branding: overrides }]
    })
  } catch {
    return []
  }
}

export function listSeedTenants(): SeedTenant[] {
  const branding = envBranding()
  const slug = defaultTenantSlug()

  return [
    { slug, name: branding.brandName ?? slug, hosts: [], segment: defaultSegment(), branding },
    ...parseTenantConfig().filter(tenant => tenant.slug !== slug)
  ]
}
