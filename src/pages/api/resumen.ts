import type { APIRoute } from 'astro';
import { getAggregatedAvailability, getParticipantsBySala } from '../../lib/db';

export const GET: APIRoute = async ({ url }) => {
  const salaId = url.searchParams.get('salaId');
  if (!salaId) {
    return new Response(JSON.stringify({ error: 'salaId requerido' }), { status: 400 });
  }
  try {
    const aggregated = await getAggregatedAvailability(salaId);
    const participants = await getParticipantsBySala(salaId);
    return new Response(
      JSON.stringify({ aggregated, totalParticipants: participants.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Error al generar resumen' }), { status: 500 });
  }
};