import { cookies } from 'next/headers'

import { getSessionCookieNames } from '@/lib/branding-server'
import { getSessionUser } from '@/lib/auth'
import {
  createLocalOrder,
  listLocalCategories,
  listLocalOrders,
  listLocalProducts,
  LocalStoreError
} from '@/lib/local-store'
import type { Category, Order, Product } from '@/lib/types'

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 500
  ) {
    super(message)
  }
}

export const getToken = async () => {
  const sessionCookieNames = await getSessionCookieNames()
  return (await cookies()).get(sessionCookieNames.token)?.value
}

export async function getProducts(): Promise<Product[]> {
  try {
    return await listLocalProducts()
  } catch (error) {
    if (error instanceof LocalStoreError) {
      throw new ApiError(error.message, error.status)
    }

    throw new ApiError('Falha ao carregar produtos', 500)
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    return await listLocalCategories()
  } catch (error) {
    if (error instanceof LocalStoreError) {
      throw new ApiError(error.message, error.status)
    }

    throw new ApiError('Falha ao carregar categorias', 500)
  }
}

export async function getOrders(): Promise<Order[]> {
  const token = await getToken()
  if (!token) throw new ApiError('Não autenticado', 401)

  try {
    return await listLocalOrders()
  } catch (error) {
    if (error instanceof LocalStoreError) {
      throw new ApiError(error.message, error.status)
    }

    throw new ApiError('Falha ao carregar pedidos', 500)
  }
}

export async function createBackendOrder(
  products: Array<{ id: number; quantity: number }>
) {
  const token = await getToken()
  if (!token) return null

  const user = await getSessionUser()
  if (!user) return null

  try {
    return await createLocalOrder({
      products,
      user: {
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    if (error instanceof LocalStoreError) return null
    return null
  }
}
