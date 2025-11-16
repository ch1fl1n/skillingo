// Broadcast a message to a Supabase Realtime channel
// Usage: await broadcastMessage(channel, 'eventName', 'broadcast', { key: 'value' })
export async function broadcastMessage(
  channel: unknown,
  eventName: string,
  type: 'broadcast' | 'presence' | 'postgres_changes',
  payload: unknown,
  options?: Record<string, unknown>
): Promise<'ok' | 'timed out' | 'error'> {
  return await (channel as { send: (msg: unknown) => Promise<'ok' | 'timed out' | 'error'> }).send({
    type,
    event: eventName,
    payload,
    ...(options || {}),
  });
}
// Get all Supabase Realtime channels
// Usage: const channels = getAllChannels()
export function getAllChannels(): unknown[] {
  // @ts-expect-error: access to internal supabase._subs or use getChannels if available
  return supabase.getChannels ? supabase.getChannels() : (supabase as unknown)._subs || [];
}
// Unsubscribe from all Supabase Realtime channels
// Usage: await unsubscribeFromAllChannels()
export async function unsubscribeFromAllChannels(): Promise<Array<'ok' | 'error' | 'timed out'>> {
  // @ts-expect-error: access to internal supabase._subs
  const channels = supabase.getChannels ? supabase.getChannels() : (supabase as unknown)._subs || [];
  const results = await Promise.all(
    channels.map((channel: unknown) => (channel as { unsubscribe: () => Promise<'ok' | 'error' | 'timed out'> }).unsubscribe())
  );
  return results;
}
// Unsubscribe from a Supabase Realtime channel
// Usage: await unsubscribeFromChannel(channel)
export async function unsubscribeFromChannel(channel: unknown): Promise<'ok' | 'error' | 'timed out'> {
  return await (channel as { unsubscribe: () => Promise<'ok' | 'error' | 'timed out'> }).unsubscribe();
}
// Subscribe to a Supabase Realtime channel
export function subscribeToChannel({ type, filter, callback }: {
  type: 'presence' | 'postgres_changes' | 'broadcast' | 'system',
  filter: Record<string, unknown>,
  callback: (payload: unknown) => void
}) {
  let channel: unknown;
  switch (type) {
    case 'postgres_changes':
      // @ts-expect-error - Supabase channel types are restrictive
      channel = supabase.channel('custom-db-changes')
        .on(
          'postgres_changes',
          {
            event: filter.event,
            schema: filter.schema,
            table: filter.table,
          },
          callback
        )
        .subscribe();
      break;
    case 'broadcast':
      // @ts-expect-error - Supabase channel types are restrictive
      channel = supabase.channel('custom-broadcast')
        .on('broadcast', { event: filter.event }, callback)
        .subscribe();
      break;
    case 'presence':
      // @ts-expect-error - Supabase channel types are restrictive
      channel = supabase.channel('custom-presence')
        .on('presence', { event: filter.event }, callback)
        .subscribe();
      break;
    case 'system':
      channel = supabase.channel('custom-system')
        .on('system', { event: filter.event }, callback)
        .subscribe();
      break;
    default:
      throw new Error('Unsupported channel type');
  }
  return channel;
}
import { supabase } from './supabase';
import { FunctionInvokeOptions } from '@supabase/supabase-js';

export const invokeEdgeFunction = async (functionName: string, options?: FunctionInvokeOptions) => {
  const { data, error } = await supabase.functions.invoke(functionName, options);

  if (error) {
    throw error;
  }

  return data;
};
