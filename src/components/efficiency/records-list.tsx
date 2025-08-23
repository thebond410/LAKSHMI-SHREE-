'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import type { EfficiencyRecord } from '@/lib/types'
import { Skeleton } from '../ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { format } from 'date-fns'
import { timeStringToSeconds, secondsToHHMMSS } from '@/lib/utils'

type CalculatedRecord = EfficiencyRecord & {
  efficiency: number
  diff_seconds: number
  hr: number
  loss_prd: number
  total_seconds: number
  run_seconds: number
}

const calculateFields = (r: EfficiencyRecord): CalculatedRecord => {
  const total_seconds = timeStringToSeconds(r.total_time);
  const run_seconds = timeStringToSeconds(r.run_time);
  const efficiency = total_seconds > 0 ? (run_seconds / total_seconds) * 100 : 0
  const diff_seconds = total_seconds - run_seconds
  const runTimeHours = run_seconds / 3600;
  const hr = runTimeHours > 0 ? r.weft_meter / runTimeHours : 0
  const lossPrdHours = diff_seconds / 3600;
  const loss_prd = hr * lossPrdHours
  return { ...r, efficiency, diff_seconds, hr, loss_prd, total_seconds, run_seconds }
}

const RecordsTable = ({ records, title }: { records: CalculatedRecord[], title: string }) => {
  const totals = useMemo(() => {
    return records.reduce((acc, r) => {
      acc.weft += r.weft_meter
      acc.loss_prd += r.loss_prd
      return acc
    }, { weft: 0, loss_prd: 0 })
  }, [records])

  return (
    <Card className="m-0 p-0">
      <CardHeader className="p-1">
        <CardTitle className="text-sm">{title} - {format(new Date(), 'dd/MM/yyyy')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {['Date', 'M/C', 'Effi(%)', 'Stops', 'Tot.T', 'Run.T', 'Diff', 'Weft', 'H/R', 'Loss'].map(h => 
                <TableHead key={h} className="h-auto p-1 text-center">{h}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map(r => (
              <TableRow key={r.id} className="text-center [&_td]:p-1">
                <TableCell>{format(new Date(r.date), 'dd/MM')}</TableCell>
                <TableCell>{r.machine_number}</TableCell>
                <TableCell className={r.efficiency > 90 ? 'text-green-600' : r.efficiency > 80 ? 'text-blue-600' : 'text-red-600'}>{r.efficiency.toFixed(2)}</TableCell>
                <TableCell>{r.stops}</TableCell>
                <TableCell>{r.total_time}</TableCell>
                <TableCell>{r.run_time}</TableCell>
                <TableCell>{secondsToHHMMSS(r.diff_seconds)}</TableCell>
                <TableCell>{r.weft_meter.toFixed(2)}</TableCell>
                <TableCell>{r.hr.toFixed(2)}</TableCell>
                <TableCell>{r.loss_prd.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
             <TableRow className="text-center font-extrabold [&_td]:p-1">
                <TableCell colSpan={7}>Total</TableCell>
                <TableCell>{totals.weft.toFixed(2)}</TableCell>
                <TableCell></TableCell>
                <TableCell>{totals.loss_prd.toFixed(2)}</TableCell>
             </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  )
}


export default function RecordsList() {
  const [records, setRecords] = useState<CalculatedRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true)
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const { data, error } = await supabase
        .from('efficiency_records')
        .select('*')
        .eq('date', todayStr)
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Error fetching records:", error)
      } else {
        setRecords(data.map(calculateFields))
      }
      setLoading(false)
    }

    fetchRecords()

    const channel = supabase.channel('efficiency_records_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'efficiency_records' },
        () => fetchRecords()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const dayRecords = useMemo(() => records.filter(r => r.shift === 'Day'), [records])
  const nightRecords = useMemo(() => records.filter(r => r.shift === 'Night'), [records])

  if (loading) {
    return <Skeleton className="w-full h-64" />
  }

  return (
    <div className="space-y-2">
      <RecordsTable records={dayRecords} title="Day Shift" />
      <RecordsTable records={nightRecords} title="Night Shift" />
    </div>
  )
}
