import { supabase } from './supabase';

export interface Sala {
  id: string;
  codigo: string;
  nombre: string;
}

export interface Participant {
  id: string;
  name: string;
  numero: number | null;
  sala_id: string;
}

function randomCode(length = 5): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }
  return code;
}

export async function createSala(nombre: string): Promise<Sala> {
  const cleanName = nombre.trim();
  for (let attempt = 0; attempt < 5; attempt++) {
    const codigo = randomCode();
    const { data, error } = await supabase
      .from('salas')
      .insert({ codigo, nombre: cleanName })
      .select('id, codigo, nombre')
      .single();
    if (!error) return data;
    if (error.code !== '23505') throw error; // 23505 = código duplicado, reintenta
  }
  throw new Error('No se pudo generar un código único, intenta de nuevo');
}

export async function getSalaByCodigo(codigo: string): Promise<Sala | null> {
  const { data, error } = await supabase
    .from('salas')
    .select('id, codigo, nombre')
    .eq('codigo', codigo.trim())
    .maybeSingle();
  if (error) throw error;
  return data;
}


export async function getOrCreateParticipant(
  salaId: string,
  name: string,
  numero: number | null
): Promise<Participant> {
  const normalized = name.trim();

  const { data: existing, error: findError } = await supabase
    .from('participants')
    .select('id, name, numero, sala_id')
    .eq('sala_id', salaId)
    .ilike('name', normalized)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from('participants')
    .insert({ sala_id: salaId, name: normalized, numero })
    .select('id, name, numero, sala_id')
    .single();

  if (insertError) throw insertError;
  return created;
}

export async function getParticipantById(id: string): Promise<Participant | null> {
  const { data, error } = await supabase
    .from('participants')
    .select('id, name, numero, sala_id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getParticipantsBySala(salaId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('id, name, numero, sala_id')
    .eq('sala_id', salaId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getAvailability(participantId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('availability')
    .select('slot')
    .eq('participant_id', participantId);

  if (error) throw error;
  return (data ?? []).map((row) => row.slot);
}

export async function setAvailability(participantId: string, slots: string[]): Promise<void> {
  const uniqueSlots = Array.from(new Set(slots));

  const { error: deleteError } = await supabase
    .from('availability')
    .delete()
    .eq('participant_id', participantId);

  if (deleteError) throw deleteError;

  if (uniqueSlots.length === 0) return;

  const rows = uniqueSlots.map((slot) => ({ participant_id: participantId, slot }));
  const { error: insertError } = await supabase.from('availability').insert(rows);

  if (insertError) throw insertError;
}

export async function getAggregatedAvailability(salaId: string): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from('availability')
    .select('slot, participants!inner(name, sala_id)')
    .eq('participants.sala_id', salaId);

  if (error) throw error;

  const counts: Record<string, string[]> = {};
  for (const row of data ?? []) {
    const name = (row as any).participants?.name;
    if (!name) continue;
    if (!counts[row.slot]) counts[row.slot] = [];
    counts[row.slot].push(name);
  }
  return counts;
}

export async function pingDatabase(): Promise<void> {
  const { error } = await supabase.from('salas').select('id').limit(1);
  if (error) throw error;
}