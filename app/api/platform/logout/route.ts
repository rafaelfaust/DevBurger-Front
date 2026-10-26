import { NextResponse } from 'next/server'

import { signOutPlatform } from '@/lib/platform-auth'

export async function POST() {
  await signOutPlatform()
  return NextResponse.json({ ok: true })
}
