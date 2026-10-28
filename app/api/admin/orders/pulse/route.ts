import { NextResponse } from 'next/server'

import { AuthError } from '@/lib/auth'
import { getOrdersPulse, StoreError } from '@/lib/store'

// Chamado pelo painel a cada poucos segundos para tocar o aviso de pedido novo.
export async function GET() {
  try {
    return NextResponse.json(await getOrdersPulse(), {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (error) {
    const known = error instanceof StoreError || error instanceof AuthError
    return NextResponse.json(
      { message: known ? error.message : 'Falha ao consultar pedidos' },
      { status: known ? error.status : 500 }
    )
  }
}
