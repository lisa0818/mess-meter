import { supabase } from './supabase';

export interface Poll {
  id: string;
  hostel_id: string | null;
  title: string;
  meal_date: string;
  closes_at: string;
  status: 'open' | 'closed';
  created_at?: string;
}

export interface PollOptionResult {
  option_id: string;
  title: string;
  subtitle?: string;
  is_veg: boolean;
  votes: number;
}

export interface CreatePollInput {
  hostel_id?: string | null;
  title: string;
  meal_date: string;
  closes_at: string;
  options: {
    title: string;
    subtitle?: string;
    is_veg: boolean;
  }[];
}

export async function getActivePolls(hostelId?: string | null): Promise<Poll[]> {
  try {
    let query = supabase
      .from('polls')
      .select('id, hostel_id, title, meal_date, closes_at, status, created_at')
      .eq('status', 'open')
      .order('closes_at', { ascending: true });

    if (hostelId) {
      query = query.or(`hostel_id.eq.${hostelId},hostel_id.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      // If table has not been created yet in Supabase, silently return empty array
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return [];
      }
      console.warn('getActivePolls query warning:', error.message);
      return [];
    }
    return data ?? [];
  } catch (err: any) {
    if (!err?.message?.includes('schema cache')) {
      console.warn('getActivePolls error:', err);
    }
    return [];
  }
}

export async function getPollDetails(pollId: string): Promise<Poll | null> {
  const { data, error } = await supabase
    .from('polls')
    .select('id, hostel_id, title, meal_date, closes_at, status, created_at')
    .eq('id', pollId)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      return null;
    }
    console.warn('getPollDetails error:', error.message);
    return null;
  }
  return data;
}

export async function getPollResults(pollId: string): Promise<PollOptionResult[]> {
  // Try RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc('poll_results', {
    p_poll_id: pollId,
  });

  if (!rpcError && rpcData) {
    return (rpcData as any[]).map((r) => ({
      option_id: r.option_id,
      title: r.title,
      subtitle: r.subtitle,
      is_veg: r.is_veg,
      votes: Number(r.votes || 0),
    }));
  }

  // Fallback: direct table join / query if RPC doesn't exist yet
  const { data: options, error: optError } = await supabase
    .from('poll_options')
    .select('id, title, subtitle, is_veg, sort_order')
    .eq('poll_id', pollId)
    .order('sort_order', { ascending: true });

  if (optError || !options) return [];

  const { data: votes } = await supabase
    .from('poll_votes')
    .select('option_id')
    .eq('poll_id', pollId);

  const voteCounts: Record<string, number> = {};
  (votes || []).forEach((v) => {
    voteCounts[v.option_id] = (voteCounts[v.option_id] || 0) + 1;
  });

  return options.map((o) => ({
    option_id: o.id,
    title: o.title,
    subtitle: o.subtitle,
    is_veg: o.is_veg,
    votes: voteCounts[o.id] || 0,
  }));
}

export async function getMyVote(pollId: string, userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return null;
    return data?.option_id ?? null;
  } catch {
    return null;
  }
}

export async function castVote(
  pollId: string,
  optionId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase.from('poll_votes').insert({
    poll_id: pollId,
    option_id: optionId,
    user_id: userId,
  });

  if (error) {
    if (error.code === '23505') {
      throw new Error('ALREADY_VOTED');
    }
    throw error;
  }
}

export async function createPoll(
  input: CreatePollInput,
  userId: string
): Promise<string> {
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .insert({
      hostel_id: input.hostel_id ?? null,
      title: input.title,
      meal_date: input.meal_date,
      closes_at: input.closes_at,
      created_by: userId,
      status: 'open',
    })
    .select('id')
    .single();

  if (pollError || !poll) throw pollError || new Error('Failed to create poll');

  const optionsToInsert = input.options.map((opt, index) => ({
    poll_id: poll.id,
    title: opt.title,
    subtitle: opt.subtitle || null,
    is_veg: opt.is_veg,
    sort_order: index,
  }));

  const { error: optError } = await supabase
    .from('poll_options')
    .insert(optionsToInsert);

  if (optError) throw optError;

  return poll.id;
}

export async function closePoll(pollId: string): Promise<void> {
  const { error } = await supabase
    .from('polls')
    .update({ status: 'closed' })
    .eq('id', pollId);

  if (error) throw error;
}
