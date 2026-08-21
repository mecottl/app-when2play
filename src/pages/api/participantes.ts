import type { APIRoute } from 'astro';
import { getOrCreateParticipant, getParticipantsBySala } from '../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  const salaId = url.searchParams.get('salaId');
  if (!salaId) {
    return new Response(JSON.stringify({ error: 'salaId requerido' }), { status: 400 });
  }
  const participants = await getParticipantsBySala(salaId);
  return new Response(JSON.stringify(participants), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const salaId = body?.salaId;
    const name = (body?.name ?? '').toString().trim();
    const numeroRaw = body?.numero;
    const numero =
      numeroRaw === '' || numeroRaw === undefined || numeroRaw === null ? null : Number(numeroRaw);

    if (!salaId) {
      return new Response(JSON.stringify({ error: 'salaId requerido' }), { status: 400 });
    }
    if (!name) {
      return new Response(JSON.stringify({ error: 'El nombre es requerido' }), { status: 400 });
    }
    if (name.length > 40) {
      return new Response(JSON.stringify({ error: 'El nombre es muy largo (máx. 40 caracteres)' }), { status: 400 });
    }
    if (numero !== null && (!Number.isInteger(numero) || numero < 0 || numero > 999)) {
      return new Response(JSON.stringify({ error: 'El número debe ser un entero entre 0 y 999' }), { status: 400 });
    }

    const participant = await getOrCreateParticipant(salaId, name, numero);
    return new Response(JSON.stringify(participant), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Ocurrió un error al registrar' }), { status: 500 });
  }
};