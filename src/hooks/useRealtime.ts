import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Table = 'posts' | 'comments' | 'messages'

export function useRealtime(table: Table, onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, onUpdate)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table, onUpdate])
}
