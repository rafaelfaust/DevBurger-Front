import type { CSSProperties } from 'react'

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

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || 'Sua Marca'
const brandWords = brandName.split(/\s+/).filter(Boolean)
const brandWordmarkLead =
  process.env.NEXT_PUBLIC_BRAND_WORDMARK_LEAD?.trim() ||
  brandWords[0] ||
  brandName
const brandWordmarkTrail =
  process.env.NEXT_PUBLIC_BRAND_WORDMARK_TRAIL?.trim() ||
  brandWords.slice(1).join(' ')
const namespace =
  sanitizeNamespace(process.env.NEXT_PUBLIC_APP_NAMESPACE?.trim() || brandName) ||
  'storefront'

const theme = {
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

export const branding = {
  brandName,
  brandWordmarkLead: brandWordmarkLead.toUpperCase(),
  brandWordmarkTrail: brandWordmarkTrail.toUpperCase(),
  siteDescription:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION?.trim() ||
    'Plataforma white-label para delivery, catálogo digital, pedidos e checkout online.',
  footerTagline:
    process.env.NEXT_PUBLIC_FOOTER_TAGLINE?.trim() ||
    'Operação digital pronta para vender com a identidade do seu cliente.',
  homeEyebrow:
    process.env.NEXT_PUBLIC_HOME_EYEBROW?.trim() ||
    'White-label para delivery e restaurantes',
  homeTitlePrefix:
    process.env.NEXT_PUBLIC_HOME_TITLE_PREFIX?.trim() || 'Seu delivery pronto para',
  homeTitleHighlight:
    process.env.NEXT_PUBLIC_HOME_TITLE_HIGHLIGHT?.trim() || 'vender',
  homeTitleSuffix:
    process.env.NEXT_PUBLIC_HOME_TITLE_SUFFIX?.trim() || 'online.',
  homeCopy:
    process.env.NEXT_PUBLIC_HOME_COPY?.trim() ||
    'Catálogo, carrinho, checkout seguro e operação administrativa em uma única plataforma white-label.',
  homeImageAlt:
    process.env.NEXT_PUBLIC_HOME_IMAGE_ALT?.trim() || `${brandName} em destaque`,
  homeHighlightTitle:
    process.env.NEXT_PUBLIC_HOME_HIGHLIGHT_TITLE?.trim() || 'Produtos em destaque',
  productsDescription:
    process.env.NEXT_PUBLIC_PRODUCTS_DESCRIPTION?.trim() ||
    `Explore o catálogo completo da ${brandName}.`,
  productsEyebrow:
    process.env.NEXT_PUBLIC_PRODUCTS_EYEBROW?.trim() || 'Catálogo digital',
  productsTitle:
    process.env.NEXT_PUBLIC_PRODUCTS_TITLE?.trim() || `Cardápio ${brandName}`,
  productsCopy:
    process.env.NEXT_PUBLIC_PRODUCTS_COPY?.trim() ||
    'Produtos organizados para conversão, operação rápida e atualização simples.',
  loadingLabel:
    process.env.NEXT_PUBLIC_LOADING_LABEL?.trim() || `Carregando ${brandName}...`,
  apiErrorLabel:
    process.env.NEXT_PUBLIC_API_ERROR_LABEL?.trim() ||
    `Verifique a integração principal da ${brandName} e tente novamente.`,
  statementDescriptor: sanitizeStatementDescriptor(
    process.env.NEXT_PUBLIC_BRAND_STATEMENT_DESCRIPTOR?.trim() || brandName
  ),
  namespace,
  theme
}

export const themeStyle = {
  '--ink': theme.ink,
  '--muted': theme.muted,
  '--paper': theme.paper,
  '--card': theme.card,
  '--yellow': theme.primary,
  '--yellow-dark': theme.primaryDark,
  '--red': theme.accent,
  '--line': theme.line,
  '--green': theme.success
} as CSSProperties

export const sessionCookieNames = {
  token: `${namespace}_token`,
  user: `${namespace}_user`
}

export const cartStorageKey = `${namespace}:cart`