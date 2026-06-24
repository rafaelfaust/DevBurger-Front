import { cookies } from 'next/headers'

import { sessionCookieNames } from '@/lib/branding'
import { demoCategories, demoProducts } from '@/lib/demo-data'
import type { Category, Order, Product } from '@/lib/types'

const baseUrl = (
  process.env.APP_BACKEND_URL ?? process.env.DEV_BURGER_API_URL
)?.replace(/\/$/, '')

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 500
  ) {
    super(message)
  }
}

const getToken = async () =>
  (await cookies()).get(sessionCookieNames.token)?.value

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  if (!baseUrl) throw new ApiError('APP_BACKEND_URL não configurada', 503)

  const response = await fetch(`${baseUrl}/${path.replace(/^\//, '')}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    },
    cache: 'no-store'
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(data?.message ?? 'Falha na comunicação com a API', response.status)
  }

  return data as T
}

const demoEnabled = process.env.ALLOW_DEMO_CATALOG === 'true'

export async function getProducts(): Promise<Product[]> {
  try {
    return await apiRequest<Product[]>('products')
  } catch (error) {
    if (demoEnabled) return demoProducts
    throw error
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    return await apiRequest<Category[]>('categories')
  } catch (error) {
    if (demoEnabled) return demoCategories
    throw error
  }
}

export async function getOrders(): Promise<Order[]> {
  const token = await getToken()
  if (!token) throw new ApiError('Não autenticado', 401)
  return apiRequest<Order[]>('orders', {}, token)
}

export async function createBackendOrder(
  products: Array<{ id: number; quantity: number }>
) {
  const token = await getToken()
  if (!token) return null

  try {
    return await apiRequest<{ _id?: string; id?: string }>(
      'orders',
      { method: 'POST', body: JSON.stringify({ products }) },
      token
    )
  } catch {
    return null
  }
}
