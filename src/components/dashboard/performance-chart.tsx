'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { subDays, format } from 'date-fns'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Skeleton } from '../ui/skeleton'

type ChartData = {
  date: string
  Day: number
  Night: number
}

export default function PerformanceChart() {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true)
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('efficiency_records')
        .select('date, shift, weft_meter')
        .gte('date', thirtyDaysAgo)

      if (error) {
        console.error('Error fetching chart data:', error)
        setLoading(false)
        return
      }

      const groupedByDate = data.reduce((acc, record) => {
        const date = format(new Date(record.date), 'dd/MM')
        if (!acc[date]) {
          acc[date] = { Day: 0, Night: 0 }
        }
        if (record.shift === 'Day') {
          acc[date].Day += record.weft_meter
        } else {
          acc[date].Night += record.weft_meter
        }
        return acc
      }, {} as Record<string, { Day: number; Night: number }>)

      const formattedData = Object.keys(groupedByDate).map(date => ({
        date,
        Day: groupedByDate[date].Day,
        Night: groupedByDate[date].Night,
      })).sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());

      setChartData(formattedData)
      setLoading(false)
    }

    fetchChartData()
  }, [])
  
  if (loading) {
    return <Skeleton className="h-48 w-full" />
  }

  const renderChart = (dataKey: 'Day' | 'Night', title: string) => (
    <Card className="m-0 p-0 border-0 shadow-none">
      <CardHeader className="p-1">
        <CardTitle className="text-xs text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip
              contentStyle={{ fontSize: '10px', padding: '2px 5px', backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              labelStyle={{ fontWeight: 'bold' }}
              wrapperClassName="text-xs"
            />
            <Bar dataKey={dataKey} fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
      {renderChart('Day', 'Day Shift Weft Meter')}
      {renderChart('Night', 'Night Shift Weft Meter')}
    </div>
  )
}
