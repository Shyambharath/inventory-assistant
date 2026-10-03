import { NextRequest, NextResponse } from 'next/server'
import { seedDatabase, resetAndReseed, clearAllData } from '@/lib/seed'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    if (body.clear === true) {
      const result = clearAllData()
      return NextResponse.json(result)
    }

    const reset = body.reset === true
    const result = reset ? resetAndReseed() : seedDatabase()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
