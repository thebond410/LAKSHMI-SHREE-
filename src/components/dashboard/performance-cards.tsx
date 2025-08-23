'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { subDays, format, startOfDay } from 'date-fns'
import { cn, timeStringToSeconds } from '@/lib/utils'
import { Skeleton } from '../ui/skeleton'
import type { EfficiencyRecord } from '@/lib/types'

type PerformanceData = {
  machine_number: string;
  today_weft: number;
  yesterday_weft: number;
  today_efficiency: number;
  yesterday_efficiency: number;
};

const EfficiencyCard = ({ data }: { data: PerformanceData }) => {
  const effColor =
    data.today_efficiency > 90
      ? 'bg-green-200/50 border-green-500'
      : data.today_efficiency > 80
      ? 'bg-blue-200/50 border-blue-500'
      : 'bg-red-200/50 border-red-500'

  return (
    <Card className={cn('p-1', effColor)}>
      <CardHeader className="p-1">
        <CardTitle className="text-center text-sm">M/C {data.machine_number}</CardTitle>
      </CardHeader>
      <CardContent className="p-1 text-center">
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="font-bold">Today</div>
          <div className="font-bold">Yesterday</div>
          <div>{data.today_weft.toFixed(1)}m</div>
          <div>{data.yesterday_weft.toFixed(1)}m</div>
          <div>{data.today_efficiency.toFixed(2)}%</div>
          <div>{data.yesterday_efficiency.toFixed(2)}%</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PerformanceCards() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true)
      const today = startOfDay(new Date());
      const yesterday = startOfDay(subDays(today, 1));
      const todayStr = format(today, 'yyyy-MM-dd');
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('efficiency_records')
        .select('machine_number, date, weft_meter, total_time, run_time')
        .in('date', [todayStr, yesterdayStr]);

      if (error) {
        console.error('Error fetching performance data:', error.message)
        setLoading(false)
        return
      }

      const recordsData: EfficiencyRecord[] = data || [];

      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('total_machines')
        .eq('id', 1)
        .single();
      
      if (settingsError) {
          console.error("Error fetching settings for total machines:", settingsError.message);
      }

      const totalMachines = settingsData?.total_machines ?? 0;
      const allMachineNumbers = Array.from({ length: totalMachines }, (_, i) => (i + 1).toString());

      const groupedByMachine = recordsData.reduce((acc, record) => {
        if (!acc[record.machine_number]) {
          acc[record.machine_number] = []
        }
        acc[record.machine_number].push(record)
        return acc
      }, {} as Record<string, EfficiencyRecord[]>);
      
      const processedData: PerformanceData[] = allMachineNumbers.map(machineNumber => {
        const records = groupedByMachine[machineNumber] || [];
        const todayRecords = records.filter(r => r.date === todayStr);
        const yesterdayRecords = records.filter(r => r.date === yesterdayStr);

        const calcMetrics = (recs: EfficiencyRecord[]) => {
          if (recs.length === 0) return { weft: 0, efficiency: 0 };
          const totalWeft = recs.reduce((sum, r) => sum + r.weft_meter, 0);
          const totalSeconds = recs.reduce((sum, r) => sum + timeStringToSeconds(r.total_time), 0);
          const runSeconds = recs.reduce((sum, r) => sum + timeStringToSeconds(r.run_time), 0);
          return {
            weft: totalWeft,
            efficiency: totalSeconds > 0 ? (runSeconds / totalSeconds) * 100 : 0
          }
        }
        
        const todayMetrics = calcMetrics(todayRecords);
        const yesterdayMetrics = calcMetrics(yesterdayRecords);

        return {
          machine_number: machineNumber,
          today_weft: todayMetrics.weft,
          yesterday_weft: yesterdayMetrics.weft,
          today_efficiency: todayMetrics.efficiency,
          yesterday_efficiency: yesterdayMetrics.efficiency,
        };
      }).sort((a,b) => parseInt(a.machine_number) - parseInt(b.machine_number));

      setPerformanceData(processedData)
      setLoading(false)
    }

    fetchPerformance()
  }, [])

  if (loading) {
    return <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
    </div>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1">
      {performanceData.map(data => (
        <EfficiencyCard key={data.machine_number} data={data} />
      ))}
    </div>
  )
}
