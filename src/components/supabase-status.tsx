'use client'

import { Wifi, WifiOff } from 'lucide-react'
import { useSupabaseStatus } from '@/components/providers/supabase-provider'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

export default function SupabaseStatus() {
  // We will use a useEffect to avoid hydration mismatch for isConnected
  const [status, setStatus] = React.useState(false);
  const { isConnected } = useSupabaseStatus();

  React.useEffect(() => {
    setStatus(isConnected);
  }, [isConnected]);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          {status ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-1 text-xs">
          <p>Supabase: {status ? 'Connected' : 'Disconnected'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

import * as React from 'react';
