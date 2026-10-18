import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'gdg-design-studio',
    timestamp: new Date().toISOString(),
    cloudRunRevision: process.env.K_REVISION || 'local-dev',
  });
}
