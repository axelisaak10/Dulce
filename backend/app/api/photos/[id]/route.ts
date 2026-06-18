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

/** DELETE /api/photos/[id] */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabase.from('photos').delete().eq('id', id);
  if (error) return cors(NextResponse.json({ error: error.message }, { status: 500 }));
  return cors(NextResponse.json({ success: true }));
}
