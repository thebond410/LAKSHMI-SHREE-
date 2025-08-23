'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import type { EfficiencyRecord } from '@/lib/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Skeleton } from '../ui/skeleton'
import { DateRange } from 'react-day-picker'
import { minutesToHHMM, timeStringToMinutes } from '@/lib/utils'

type ReportViewProps = {
  filters: {
    dateRange?: DateRange,
    machine?: string,
    shift?: string,
  }
  onDataLoaded: (records: EfficiencyRecord[]) => void
}

type CalculatedRecord = EfficiencyRecord & {
  efficiency: number
  diff: number
  hr: number
  loss_prd: number
}

const calculateFields = (r: EfficiencyRecord): CalculatedRecord => {
  const total_minutes = timeStringToMinutes(r.total_time);
  const run_minutes = timeStringToMinutes(r.run_time);
  const efficiency = total_minutes > 0 ? (run_minutes / total_minutes) * 100 : 0
  const diff = total_minutes - run_minutes
  const runTimeHours = run_minutes / 60;
  const hr = runTimeHours > 0 ? r.weft_meter / runTimeHours : 0
  const lossPrdHours = diff / 60;
  const loss_prd = hr * lossPrdHours
  return { ...r, efficiency, diff, hr, loss_prd }
}

export default function ReportView({ filters, onDataLoaded }: ReportViewProps) {
  const [records, setRecords] = useState<CalculatedRecord[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true)
      let query = supabase
        .from('efficiency_records')
        .select('*')

      if (filters.dateRange?.from) {
        query = query.gte('date', format(filters.dateRange.from, 'yyyy-MM-dd'))
      }
      if (filters.dateRange?.to) {
        query = query.lte('date', format(filters.dateRange.to, 'yyyy-MM-dd'))
      }
      if (filters.machine) {
        query = query.eq('machine_number', filters.machine)
      }
      if (filters.shift) {
        query = query.eq('shift', filters.shift)
      }

      query = query.order('date', { ascending: false }).order('shift').order('machine_number')

      const { data, error } = await query

      if (error) {
        console.error("Error fetching report data", error)
      } else {
        const calculatedData = data.map(calculateFields);
        setRecords(calculatedData)
        onDataLoaded(data);
      }
      setLoading(false)
    }

    fetchRecords()
  }, [filters, onDataLoaded])

  const groupedByDate = useMemo(() => {
    return records.reduce((acc, r) => {
      const date = r.date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(r)
      return acc
    }, {} as Record<string, CalculatedRecord[]>)
  }, [records])
  
  const sortedDates = useMemo(() => Object.keys(groupedByDate).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()), [groupedByDate])

  if (loading) {
    return <Skeleton className="h-96 w-full" />
  }

  return (
    <div className="overflow-x-auto">
      {sortedDates.length === 0 && !loading ? <p className="text-center p-8 text-muted-foreground">No records found for the selected filters.</p> : null}
      {sortedDates.map(date => {
        const dateRecords = groupedByDate[date];
        const totals = dateRecords.reduce((acc, r) => {
            acc.weft += r.weft_meter;
            acc.loss_prd += r.loss_prd;
            return acc;
        }, {weft: 0, loss_prd: 0});

        return (
          <div key={date} className="mb-2">
            <h3 className="font-extrabold p-1 bg-muted/50 text-sm">Date: {format(new Date(date), 'dd/MM/yyyy')}</h3>
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {['M/C', 'Shift', 'Effi(%)', 'Stops', 'Tot.T', 'Run.T', 'Diff', 'Weft', 'H/R', 'Loss'].map(h => 
                    <TableHead key={h} className="h-auto p-1 text-center">{h}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dateRecords.map(r => (
                  <TableRow key={r.id} className="text-center [&_td]:p-1">
                    <TableCell>{r.machine_number}</TableCell>
                    <TableCell>{r.shift}</TableCell>
                    <TableCell>{r.efficiency.toFixed(2)}</TableCell>
                    <TableCell>{r.stops}</TableCell>
                    <TableCell>{r.total_time}</TableCell>
                    <TableCell>{r.run_time}</TableCell>
                    <TableCell>{minutesToHHMM(r.diff)}</TableCell>
                    <TableCell>{r.weft_meter.toFixed(2)}</TableCell>
                    <TableCell>{r.hr.toFixed(2)}</TableCell>
                    <TableCell>{r.loss_prd.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="text-center font-extrabold bg-muted/30 [&_td]:p-1">
                    <TableCell colSpan={7}>Total for {format(new Date(date), 'dd/MM')}</TableCell>
                    <TableCell>{totals.weft.toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                    <TableCell>{totals.loss_prd.toFixed(2)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )
      })}
    </div>
  )
}
