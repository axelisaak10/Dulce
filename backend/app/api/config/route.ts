import { NextResponse } from 'next/server';

function cors(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

/**
 * GET /api/config
 * Returns global config values — especially the love start date used
 * by the Angular front-end timer.
 *
 * To change the date: edit LOVE_START_DATE in .env.local
 */
export async function GET() {
  return cors(NextResponse.json({
    startDate: process.env.LOVE_START_DATE ?? '2025-03-15T00:00:00',
  }));
}
