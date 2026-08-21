import type { APIRoute } from 'astro';
import { createSala, getSalaByCodigo } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const nombre = (body?.nombre ?? '').toString().trim();

    if (!nombre) {
      return new Response(JSON.stringify({ error: 'El nombre de la sala es requerido' }), { status: 400 });
    }
    if (nombre.length > 60) {
      return new Response(JSON.stringify({ error: 'El nombre es muy largo (máx. 60 caracteres)' }), { status: 400 });
    }

    const sala = await createSala(nombre);
    return new Response(JSON.stringify(sala), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'No se pudo crear la sala' }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ url }) => {
  const codigo = url.searchParams.get('codigo');
  if (!codigo) {
    return new Response(JSON.stringify({ error: 'codigo requerido' }), { status: 400 });
  }
  try {
    const sala = await getSalaByCodigo(codigo);
    if (!sala) {
      return new Response(JSON.stringify({ error: 'No existe una sala con ese código' }), { status: 404 });
    }
    return new Response(JSON.stringify(sala), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Error al buscar la sala' }), { status: 500 });
  }
};