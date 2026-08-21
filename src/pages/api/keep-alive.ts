import type { APIRoute } from 'astro';
import { pingDatabase } from '../../lib/db';

export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${import.meta.env.CRON_SECRET}`;

  if (!import.meta.env.CRON_SECRET || authHeader !== expected) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
  }

  try {
    await pingDatabase();
    return new Response(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Error al hacer ping a la base de datos' }), { status: 500 });
  }
};