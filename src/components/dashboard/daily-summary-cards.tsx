
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { subDays, format, parseISO } from 'date-fns'
import { cn, timeStringToSeconds } from '@/lib/utils'
import { Skeleton } from '../ui/skeleton'
import Link from 'next/link'

type DailySummary = {
  date: string
  total_weft: number
  avg_efficiency: number
}

export default function DailySummaryCards() {
  const [summaryData, setSummaryData] = useState<DailySummary[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true)
      const endDate = new Date()
      const startDate = subDays(endDate, 8) // 9 days including today

      const { data, error } = await supabase
        .from('efficiency_records')
        .select('date, weft_meter, total_time, run_time')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))

      if (error) {
        console.error('Error fetching daily summary data:', error)
        setLoading(false)
        return
      }

      if (!data) {
        setLoading(false)
        return
      }

      const groupedByDate = data.reduce((acc, record) => {
        const date = record.date
        if (!acc[date]) {
          acc[date] = { total_weft: 0, total_seconds: 0, run_seconds: 0, count: 0 }
        }
        acc[date].total_weft += record.weft_meter
        acc[date].total_seconds += timeStringToSeconds(record.total_time)
        acc[date].run_seconds += timeStringToSeconds(record.run_time)
        acc[date].count += 1
        return acc
      }, {} as Record<string, { total_weft: number; total_seconds: number; run_seconds: number, count: number }>)

      const summaries: DailySummary[] = []
      for (let i = 0; i < 9; i++) {
        const date = format(subDays(endDate, i), 'yyyy-MM-dd')
        const dayData = groupedByDate[date]
        if (dayData) {
          summaries.push({
            date,
            total_weft: dayData.total_weft,
            avg_efficiency: dayData.total_seconds > 0 ? (dayData.run_seconds / dayData.total_seconds) * 100 : 0,
          })
        } else {
          summaries.push({
            date,
            total_weft: 0,
            avg_efficiency: 0,
          })
        }
      }

      setSummaryData(summaries)
      setLoading(false)
    }

    fetchSummary()
  }, [])
  
  const handleCardClick = (date: string) => {
      // Dates from DB don't have timezone, parseISO treats them as local.
      const dateObj = parseISO(date);
      // setItem in localStorage and then navigate.
      // Efficiency page will pick it up from localStorage.
      localStorage.setItem('efficiencyDate', dateObj.toISOString());
      router.push('/efficiency');
  }

  if (loading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  return (
    <Card className="m-0 p-0">
      <CardHeader className="p-1">
        <CardTitle className="text-sm">Last 9 Days Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-1">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
          {summaryData.map(summary => {
             const effColor =
                summary.avg_efficiency >= 90
                ? 'bg-green-200/50 border-green-500'
                : summary.avg_efficiency > 80
                ? 'bg-blue-200/50 border-blue-500'
                : summary.avg_efficiency > 0 
                ? 'bg-red-200/50 border-red-500'
                : 'bg-stone-200/50 border-stone-500'

            return (
                <Card 
                  key={summary.date} 
                  className={cn('p-1 cursor-pointer hover:shadow-lg transition-shadow', effColor)}
                  onClick={() => handleCardClick(summary.date)}
                >
                    <CardHeader className="p-1">
                        <CardTitle className="text-center text-[11px] font-bold">{format(parseISO(summary.date), 'dd/MM/yyyy')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-1 text-center text-[11px] font-bold">
                         <div className="grid grid-cols-2 gap-1">
                            <div className="font-extrabold">Weft</div>
                            <div className="font-extrabold">Eff(%)</div>
                            <div>{summary.total_weft.toFixed(1)}m</div>
                            <div>{summary.avg_efficiency.toFixed(2)}%</div>
                         </div>
                    </CardContent>
                </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
