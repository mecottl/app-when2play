import type { APIRoute } from 'astro';
import { getAvailability, setAvailability, getParticipantById } from '../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  const participantId = url.searchParams.get('participantId');
  if (!participantId) {
    return new Response(JSON.stringify({ error: 'participantId requerido' }), { status: 400 });
  }
  try {
    const slots = await getAvailability(participantId);
    return new Response(JSON.stringify({ slots }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Error al leer disponibilidad' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const participantId = body?.participantId;
    const slots = body?.slots;

    if (!participantId || !Array.isArray(slots)) {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400 });
    }

    const participant = await getParticipantById(participantId);
    if (!participant) {
      return new Response(JSON.stringify({ error: 'Participante no encontrado' }), { status: 404 });
    }

    await setAvailability(participantId, slots);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Error al guardar disponibilidad' }), { status: 500 });
  }
};