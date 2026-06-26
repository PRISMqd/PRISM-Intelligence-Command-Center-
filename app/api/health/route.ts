import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0',
  })
}
