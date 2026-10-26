import { NextResponse } from 'next/server'
import { z } from 'zod'

import { AuthError } from '@/lib/auth'
import { StoreError } from '@/lib/tenant'

// Converte erros conhecidos em resposta JSON com status; o resto vira 400 genérico.
export function errorResponse(error: unknown, fallback = 'Dados inválidos') {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ message: error.issues[0]?.message ?? fallback }, { status: 400 })
  }
  if (error instanceof StoreError || error instanceof AuthError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }
  console.error('[api]', error)
  return NextResponse.json({ message: fallback }, { status: 400 })
}
