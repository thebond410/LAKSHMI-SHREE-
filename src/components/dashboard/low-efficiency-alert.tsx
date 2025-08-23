'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { subDays, format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '../ui/skeleton'
import { timeStringToMinutes } from '@/lib/utils'

type LowEfficiencyMachine = {
  machine_number: string
  avg_efficiency: number
}

export default function LowEfficiencyAlert() {
  const [lowEffMachines, setLowEffMachines] = useState<LowEfficiencyMachine[]>([])
  const [settings, setSettings] = useState<{threshold: number, number: string} | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const threeDaysAgo = format(subDays(new Date(), 3), 'yyyy-MM-dd')

      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('low_efficiency_threshold, whatsapp_number')
        .eq('id', 1)
        .maybeSingle() 

      if (settingsError) {
        console.error('Error fetching settings:', settingsError)
      }

      const currentSettings = { 
        threshold: settingsData?.low_efficiency_threshold ?? 80, 
        number: settingsData?.whatsapp_number ?? '' 
      }
      setSettings(currentSettings)

      const { data, error } = await supabase
        .from('efficiency_records')
        .select('machine_number, total_time, run_time')
        .gte('date', threeDaysAgo)

      if (error) {
        console.error('Error fetching efficiency data:', error)
        setLoading(false)
        return
      }

      const grouped = data.reduce((acc, r) => {
        if (!acc[r.machine_number]) {
          acc[r.machine_number] = { total_minutes: 0, run_minutes: 0 }
        }
        acc[r.machine_number].total_minutes += timeStringToMinutes(r.total_time)
        acc[r.machine_number].run_minutes += timeStringToMinutes(r.run_time)
        return acc
      }, {} as Record<string, { total_minutes: number; run_minutes: number }>)

      const machines = Object.keys(grouped)
        .map(machine_number => ({
          machine_number,
          avg_efficiency: grouped[machine_number].total_minutes > 0 
            ? (grouped[machine_number].run_minutes / grouped[machine_number].total_minutes) * 100 
            : 0,
        }))
        .filter(m => m.avg_efficiency < currentSettings.threshold && m.avg_efficiency > 0)
        .sort((a, b) => a.avg_efficiency - b.avg_efficiency)

      setLowEffMachines(machines)
      setLoading(false)
    }

    fetchData()
  }, [])
  
  const handleWhatsApp = () => {
    if(!settings || !settings.number || lowEffMachines.length === 0) return;
    
    const report = lowEffMachines.map(m => `M/C ${m.machine_number}: ${m.avg_efficiency.toFixed(2)}%`).join('\n');
    const message = `Low Efficiency Report (last 3 days):\n\n${report}`;
    const url = `https://wa.me/${settings.number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return <Skeleton className="h-32 w-full" />
  }

  return (
    <Card className="m-0 p-0">
      <CardHeader className="p-1 flex-row items-center justify-between">
        <CardTitle className="text-sm">Low Efficiency Alert (Last 3 Days)</CardTitle>
        <Button onClick={handleWhatsApp} disabled={!settings?.number || lowEffMachines.length === 0} size="sm" className="h-auto p-1 text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path><path d="M14.05 2a9 9 0 0 1 8 7.94"></path><path d="M14.05 6A5 5 0 0 1 18 10"></path></svg>
          WhatsApp
        </Button>
      </CardHeader>
      <CardContent className="p-1">
        {lowEffMachines.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1">
            {lowEffMachines.map(m => (
              <div key={m.machine_number} className="text-center p-1 rounded-sm bg-red-100/50 border border-red-200">
                <p className="font-extrabold">M/C {m.machine_number}</p>
                <p>{m.avg_efficiency.toFixed(2)}%</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-center text-muted-foreground py-4">All machines are running efficiently.</p>
        )}
      </CardContent>
    </Card>
  )
}
