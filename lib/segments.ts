import type { Assets, BrandingOverrides, Theme } from '@/lib/branding'

// Tipo de loja. Define textos, cores, imagens e cardápio de exemplo iniciais;
// tudo pode ser trocado depois em Admin → Aparência.
export const segments = [
  'hamburgueria',
  'pizzaria',
  'acai',
  'japonesa',
  'marmitaria',
  'lanchonete',
  'doceria',
  'outro'
] as const

export type Segment = (typeof segments)[number]

export const DEFAULT_SEGMENT: Segment = 'outro'

type SampleProduct = { name: string; priceCents: number; category: number; offer?: boolean }

type SegmentPreset = {
  label: string
  texts: Pick<
    BrandingOverrides,
    | 'homeEyebrow'
    | 'homeTitlePrefix'
    | 'homeTitleHighlight'
    | 'homeTitleSuffix'
    | 'homeCopy'
    | 'productsEyebrow'
    | 'productsCopy'
    | 'footerTagline'
  >
  // Cor principal clara (fundo dos botões, texto escuro por cima) e destaque escuro.
  theme: Pick<Theme, 'primary' | 'primaryDark' | 'accent'>
  assets?: Partial<Assets>
  categories: string[]
  products: SampleProduct[]
}

const illustration = (segment: Segment): Partial<Assets> => ({
  homeHeroPath: `/segments/${segment}/hero.svg`,
  catalogHeroPath: `/segments/${segment}/hero.svg`,
  loginImagePath: `/segments/${segment}/hero.svg`,
  registerImagePath: `/segments/${segment}/hero.svg`,
  logoPath: `/segments/${segment}/logo.svg`,
  faviconPath: `/segments/${segment}/logo.svg`
})

export const segmentPresets: Record<Segment, SegmentPreset> = {
  hamburgueria: {
    label: 'Hamburgueria',
    texts: {
      homeEyebrow: 'Hamburgueria artesanal',
      homeTitlePrefix: 'Seu burger pronto para',
      homeTitleHighlight: 'chegar',
      homeTitleSuffix: 'quentinho.',
      homeCopy: 'Lanches montados na hora, com entrega rápida e pedido em poucos cliques.',
      productsEyebrow: 'Cardápio',
      productsCopy: 'Burgers, combos e porções para matar a fome.',
      footerTagline: 'Burgers feitos na hora, direto para você.'
    },
    theme: { primary: '#f5b82e', primaryDark: '#d89300', accent: '#b9271e' },
    // Fotos reais que já vinham com o projeto.
    assets: {
      homeHeroPath: '/assets/bannerHome.webp',
      catalogHeroPath: '/assets/bannerProduct.webp',
      loginImagePath: '/assets/login-img.webp',
      registerImagePath: '/assets/user-img.webp',
      logoPath: '/segments/hamburgueria/logo.svg',
      faviconPath: '/segments/hamburgueria/logo.svg'
    },
    categories: ['Burgers', 'Combos', 'Porções', 'Bebidas'],
    products: [
      { name: 'X-Burger', priceCents: 2990, category: 0, offer: true },
      { name: 'X-Bacon', priceCents: 3490, category: 0, offer: true },
      { name: 'Combo Clássico', priceCents: 4290, category: 1 },
      { name: 'Batata Frita', priceCents: 1800, category: 2 },
      { name: 'Refrigerante Lata', priceCents: 700, category: 3 }
    ]
  },
  pizzaria: {
    label: 'Pizzaria',
    texts: {
      homeEyebrow: 'Pizzaria',
      homeTitlePrefix: 'Sua pizza pronta para',
      homeTitleHighlight: 'chegar',
      homeTitleSuffix: 'quentinha.',
      homeCopy: 'Massa leve, forno quente e entrega rápida até a sua casa.',
      productsEyebrow: 'Cardápio',
      productsCopy: 'Pizzas salgadas e doces, do jeito que você gosta.',
      footerTagline: 'Pizza saindo do forno direto para você.'
    },
    theme: { primary: '#f6a04d', primaryDark: '#d9822b', accent: '#a32d1f' },
    categories: ['Pizzas Salgadas', 'Pizzas Doces', 'Bebidas'],
    products: [
      { name: 'Pizza Mussarela', priceCents: 4990, category: 0, offer: true },
      { name: 'Pizza Calabresa', priceCents: 5290, category: 0, offer: true },
      { name: 'Pizza Portuguesa', priceCents: 5690, category: 0 },
      { name: 'Pizza de Chocolate', priceCents: 4990, category: 1 },
      { name: 'Refrigerante 2 litros', priceCents: 1400, category: 2 }
    ]
  },
  acai: {
    label: 'Açaí e sorvetes',
    texts: {
      homeEyebrow: 'Açaí e sorvetes',
      homeTitlePrefix: 'Monte seu açaí do',
      homeTitleHighlight: 'seu jeito',
      homeTitleSuffix: 'e receba em casa.',
      homeCopy: 'Açaí cremoso, sorvetes e complementos para todos os gostos.',
      productsEyebrow: 'Cardápio',
      productsCopy: 'Escolha o tamanho e peça em poucos cliques.',
      footerTagline: 'Açaí geladinho, entregue rapidinho.'
    },
    theme: { primary: '#c9a7ff', primaryDark: '#a67de8', accent: '#5b2a86' },
    categories: ['Açaí', 'Sorvetes', 'Bebidas'],
    products: [
      { name: 'Açaí 300 ml', priceCents: 1690, category: 0, offer: true },
      { name: 'Açaí 500 ml', priceCents: 2290, category: 0, offer: true },
      { name: 'Açaí 700 ml', priceCents: 2890, category: 0 },
      { name: 'Milkshake', priceCents: 1990, category: 1 },
      { name: 'Água Mineral', priceCents: 400, category: 2 }
    ]
  },
  japonesa: {
    label: 'Culinária japonesa',
    texts: {
      homeEyebrow: 'Culinária japonesa',
      homeTitlePrefix: 'Sushi fresquinho pronto para',
      homeTitleHighlight: 'chegar',
      homeTitleSuffix: 'na sua mesa.',
      homeCopy: 'Combinados, temakis e pratos quentes preparados na hora.',
      productsEyebrow: 'Cardápio',
      productsCopy: 'Combinados para dividir ou pedir só para você.',
      footerTagline: 'Comida japonesa com entrega cuidadosa.'
    },
    theme: { primary: '#ff8f7a', primaryDark: '#e86d57', accent: '#1f2a44' },
    categories: ['Combinados', 'Sushis e Temakis', 'Pratos Quentes', 'Bebidas'],
    products: [
      { name: 'Combinado 20 peças', priceCents: 6990, category: 0, offer: true },
      { name: 'Hot Roll 8 unidades', priceCents: 2990, category: 1, offer: true },
      { name: 'Temaki de Salmão', priceCents: 3290, category: 1 },
      { name: 'Yakisoba', priceCents: 3990, category: 2 },
      { name: 'Chá Gelado', priceCents: 800, category: 3 }
    ]
  },
  marmitaria: {
    label: 'Marmitaria e comida caseira',
    texts: {
      homeEyebrow: 'Comida caseira',
      homeTitlePrefix: 'Almoço caseiro pronto para',
      homeTitleHighlight: 'chegar',
      homeTitleSuffix: 'na hora certa.',
      homeCopy: 'Marmitas e pratos do dia feitos com tempero de casa.',
      productsEyebrow: 'Cardápio do dia',
      productsCopy: 'Escolha o tamanho da marmita e o prato do dia.',
      footerTagline: 'Comida de verdade, todo dia.'
    },
    theme: { primary: '#9fd36b', primaryDark: '#78b046', accent: '#8a4b16' },
    categories: ['Marmitas', 'Pratos Executivos', 'Sobremesas', 'Bebidas'],
    products: [
      { name: 'Marmita Pequena', priceCents: 1890, category: 0, offer: true },
      { name: 'Marmita Grande', priceCents: 2490, category: 0, offer: true },
      { name: 'Executivo de Frango', priceCents: 2990, category: 1 },
      { name: 'Pudim', priceCents: 900, category: 2 },
      { name: 'Suco Natural', priceCents: 800, category: 3 }
    ]
  },
  lanchonete: {
    label: 'Lanchonete e salgados',
    texts: {
      homeEyebrow: 'Lanches e salgados',
      homeTitlePrefix: 'Seu lanche pronto para',
      homeTitleHighlight: 'matar a fome',
      homeTitleSuffix: 'rapidinho.',
      homeCopy: 'Salgados, lanches e bebidas com pedido rápido e entrega ágil.',
      productsEyebrow: 'Cardápio',
      productsCopy: 'Salgados fresquinhos e lanches feitos na hora.',
      footerTagline: 'Lanche bom, entregue rápido.'
    },
    theme: { primary: '#ffd166', primaryDark: '#e6b23c', accent: '#c4441d' },
    categories: ['Salgados', 'Lanches', 'Bebidas'],
    products: [
      { name: 'Coxinha', priceCents: 700, category: 0, offer: true },
      { name: 'Pastel de Carne', priceCents: 990, category: 0, offer: true },
      { name: 'Misto Quente', priceCents: 1200, category: 1 },
      { name: 'Suco de Laranja', priceCents: 800, category: 2 }
    ]
  },
  doceria: {
    label: 'Doceria e confeitaria',
    texts: {
      homeEyebrow: 'Doces e bolos',
      homeTitlePrefix: 'Doces feitos com carinho para',
      homeTitleHighlight: 'adoçar',
      homeTitleSuffix: 'o seu dia.',
      homeCopy: 'Bolos, doces e tortas feitos artesanalmente, com entrega cuidadosa.',
      productsEyebrow: 'Cardápio',
      productsCopy: 'Encomende para hoje ou para a sua festa.',
      footerTagline: 'Confeitaria artesanal com entrega.'
    },
    theme: { primary: '#ffb3c7', primaryDark: '#f28aa5', accent: '#8c2f5a' },
    categories: ['Bolos', 'Doces', 'Tortas'],
    products: [
      { name: 'Bolo de Pote', priceCents: 1490, category: 0, offer: true },
      { name: 'Caixa com 6 brigadeiros', priceCents: 1800, category: 1, offer: true },
      { name: 'Fatia de Torta', priceCents: 1690, category: 2 },
      { name: 'Bolo Inteiro', priceCents: 8990, category: 0 }
    ]
  },
  outro: {
    label: 'Outro tipo de loja',
    texts: {},
    theme: { primary: '#8fd3c9', primaryDark: '#5fb3a8', accent: '#1f5f73' },
    categories: ['Destaques', 'Produtos', 'Bebidas'],
    products: [
      { name: 'Produto Especial', priceCents: 2990, category: 0, offer: true },
      { name: 'Combo da Casa', priceCents: 3990, category: 1 },
      { name: 'Bebida', priceCents: 800, category: 2 }
    ]
  }
}

export function isSegment(value: unknown): value is Segment {
  return typeof value === 'string' && (segments as readonly string[]).includes(value)
}

// Padrões do segmento, aplicados por baixo do que a loja personalizou.
export function segmentDefaults(segment: Segment): BrandingOverrides {
  const preset = segmentPresets[segment]
  return {
    ...preset.texts,
    theme: { ...preset.theme },
    assets: { ...illustration(segment), ...preset.assets }
  }
}

export const sampleProductImage = (segment: Segment) => `/segments/${segment}/product.svg`
