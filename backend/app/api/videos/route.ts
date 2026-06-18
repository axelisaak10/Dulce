import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function cors(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

/** GET /api/videos — lista todos los videos ordenados por fecha */
export async function GET() {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return cors(NextResponse.json({ error: error.message }, { status: 500 }));
  return cors(NextResponse.json(data));
}

/** POST /api/videos — agrega un nuevo video */
export async function POST(req: Request) {
  const body = await req.json();
  const { yt_id } = body;

  if (!yt_id) return cors(NextResponse.json({ error: 'yt_id requerido' }, { status: 400 }));

  const { data, error } = await supabase
    .from('videos')
    .insert([{ yt_id }])
    .select()
    .single();

  if (error) return cors(NextResponse.json({ error: error.message }, { status: 500 }));
  return cors(NextResponse.json(data, { status: 201 }));
}
