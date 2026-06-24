import type { Category, Product } from '@/lib/types'

export const demoCategories: Category[] = [
  { id: 1, name: 'Destaques' },
  { id: 2, name: 'Combos' },
  { id: 3, name: 'Bebidas' }
]

export const demoProducts: Product[] = [
  {
    id: 101,
    name: 'Sanduiche Especial',
    price: 29.9,
    category_id: 1,
    offer: true,
    url: '/assets/bannerHome.webp'
  },
  {
    id: 102,
    name: 'Receita da Casa',
    price: 34.9,
    category_id: 1,
    offer: true,
    url: '/assets/bannerProduct.webp'
  },
  {
    id: 103,
    name: 'Combo Premium',
    price: 42.9,
    category_id: 2,
    url: '/assets/bannerCart.webp'
  },
  {
    id: 104,
    name: 'Bebida Gelada',
    price: 8,
    category_id: 3,
    url: '/assets/logo.png'
  }
]
