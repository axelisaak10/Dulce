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

/** GET /api/notes — lista todas las notas ordenadas por fecha */
export async function GET() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return cors(NextResponse.json({ error: error.message }, { status: 500 }));
  return cors(NextResponse.json(data));
}

/** POST /api/notes — agrega una nueva nota */
export async function POST(req: Request) {
  const body = await req.json();
  const { title, text, color } = body;

  if (!text?.trim()) return cors(NextResponse.json({ error: 'text requerido' }, { status: 400 }));

  const { data, error } = await supabase
    .from('notes')
    .insert([{
      title: title?.trim() ?? '',
      text: text.trim(),
      color: color ?? '#ff4d4d',
    }])
    .select()
    .single();

  if (error) return cors(NextResponse.json({ error: error.message }, { status: 500 }));
  return cors(NextResponse.json(data, { status: 201 }));
}
