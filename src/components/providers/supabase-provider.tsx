'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

type SupabaseContextType = {
  isConnected: boolean;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export default function SupabaseProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(false)

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupChannel = () => {
      channel = supabase
        .channel('supabase-connection-status')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
           // Any event means we are connected
           if (!isConnected) {
            setIsConnected(true);
           }
        })
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            setIsConnected(true)
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setIsConnected(false)
          }
        });
    }
    
    setupChannel();

    // Check connection status periodically as a fallback
    const interval = setInterval(async () => {
      const { error } = await supabase.from('efficiency_records').select('id').limit(1)
      setIsConnected(!error);
    }, 10000);

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
      clearInterval(interval);
    }
  }, [isConnected])

  return (
    <SupabaseContext.Provider value={{ isConnected }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabaseStatus = () => {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabaseStatus must be used within a SupabaseProvider')
  }
  return context
}
