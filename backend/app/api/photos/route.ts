import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// CORS helper — Angular dev server runs on a different port
function cors(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }));
}

/** GET /api/photos  — lista todas las fotos ordenadas por fecha */
export async function GET() {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return cors(NextResponse.json({ error: error.message }, { status: 500 }));
  return cors(NextResponse.json(data));
}

/** POST /api/photos  — agrega una nueva foto */
export async function POST(req: Request) {
  const body = await req.json();
  const { src, label } = body;

  if (!src) return cors(NextResponse.json({ error: 'src requerido' }, { status: 400 }));

  const { data, error } = await supabase
    .from('photos')
    .insert([{ src, label: label || 'Recuerdo Especial' }])
    .select()
    .single();

  if (error) return cors(NextResponse.json({ error: error.message }, { status: 500 }));
  return cors(NextResponse.json(data, { status: 201 }));
}
