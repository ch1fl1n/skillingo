// Broadcast a message to a Supabase Realtime channel
// Usage: await broadcastMessage(channel, 'eventName', 'broadcast', { key: 'value' })
export async function broadcastMessage(
  channel: any,
  eventName: string,
  type: 'broadcast' | 'presence' | 'postgres_changes',
  payload: any,
  options?: any
): Promise<'ok' | 'timed out' | 'error'> {
  return await channel.send({
    type,
    event: eventName,
    payload,
    ...options,
  });
}
// Get all Supabase Realtime channels
// Usage: const channels = getAllChannels()
export function getAllChannels(): any[] {
  // @ts-ignore: access to internal supabase._subs or use getChannels if available
  return supabase.getChannels ? supabase.getChannels() : (supabase as any)._subs || [];
}
// Unsubscribe from all Supabase Realtime channels
// Usage: await unsubscribeFromAllChannels()
export async function unsubscribeFromAllChannels(): Promise<Array<'ok' | 'error' | 'timed out'>> {
  // @ts-ignore: access to internal supabase._subs
  const channels = supabase.getChannels ? supabase.getChannels() : (supabase as any)._subs || [];
  const results = await Promise.all(
    channels.map((channel: any) => channel.unsubscribe())
  );
  return results;
}
// Unsubscribe from a Supabase Realtime channel
// Usage: await unsubscribeFromChannel(channel)
export async function unsubscribeFromChannel(channel: any): Promise<'ok' | 'error' | 'timed out'> {
  return await channel.unsubscribe();
}
// Subscribe to a Supabase Realtime channel
export function subscribeToChannel({ type, filter, callback }: {
  type: 'presence' | 'postgres_changes' | 'broadcast' | 'system',
  filter: any,
  callback: (payload: any) => void
}) {
  let channel;
  switch (type) {
    case 'postgres_changes':
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
      channel = supabase.channel('custom-broadcast')
        .on('broadcast', { event: filter.event }, callback)
        .subscribe();
      break;
    case 'presence':
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
