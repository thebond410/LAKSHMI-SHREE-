
'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
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
import type { EfficiencyRecord, Settings } from '@/lib/types'
import { Skeleton } from '../ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { format, parseISO } from 'date-fns'
import { timeStringToSeconds, minutesToHHMM } from '@/lib/utils'
import { Button } from '../ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type CalculatedRecord = EfficiencyRecord & {
  efficiency: number
  diff_minutes: number
  hr: number
  loss_prd: number
  run_minutes: number
  total_minutes: number
}

const calculateFields = (r: EfficiencyRecord): CalculatedRecord => {
  const total_seconds = timeStringToSeconds(r.total_time);
  const run_seconds = timeStringToSeconds(r.run_time);
  const total_minutes = total_seconds / 60;
  const run_minutes = run_seconds / 60;
  const efficiency = total_minutes > 0 ? (run_minutes / total_minutes) * 100 : 0
  const diff_minutes = total_minutes - run_minutes
  const runTimeHours = run_minutes / 60;
  const hr = runTimeHours > 0 ? r.weft_meter / runTimeHours : 0
  const lossPrdHours = diff_minutes / 60;
  const loss_prd = hr * lossPrdHours
  return { ...r, efficiency, diff_minutes, hr, loss_prd, run_minutes, total_minutes }
}

const RecordsTable = ({ records, title, date, settings, onDelete, onEdit, onSort, sortDescriptor }: { records: CalculatedRecord[], title: string, date: string, settings: Settings | null, onDelete: (id: string) => void, onEdit: (record: EfficiencyRecord) => void, onSort: (key: keyof CalculatedRecord) => void, sortDescriptor: {key: keyof CalculatedRecord, direction: 'asc' | 'desc'} | null }) => {
  const { toast } = useToast()

  const headers: { key: keyof CalculatedRecord | 'actions', label: string }[] = [
    { key: 'machine_number', label: 'M/C' },
    { key: 'time', label: 'Time' },
    { key: 'efficiency', label: 'Effi(%)' },
    { key: 'stops', label: 'Stops' },
    { key: 'total_time', label: 'Tot.T' },
    { key: 'run_time', label: 'Run.T' },
    { key: 'diff_minutes', label: 'Diff' },
    { key: 'weft_meter', label: 'Weft' },
    { key: 'hr', label: 'H/R' },
    { key: 'loss_prd', label: 'Loss' },
    { key: 'actions', label: 'Actions' },
  ]
  
  const sortedRecords = useMemo(() => {
    if (!sortDescriptor || !sortDescriptor.key) return records;
    const { key, direction } = sortDescriptor;

    return [...records].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];
      
      // Handle numeric sorting for machine_number
      if (key === 'machine_number') {
        const numA = parseInt(aVal as string, 10);
        const numB = parseInt(bVal as string, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return direction === 'asc' ? numA - numB : numB - numA;
        }
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        if (key === 'time' || key === 'total_time' || key === 'run_time') {
           const timeA = timeStringToSeconds(aVal)
           const timeB = timeStringToSeconds(bVal)
           return direction === 'asc' ? timeA - timeB : timeB - timeA
        }
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
  }, [records, sortDescriptor]);

  const totals = useMemo(() => {
    return records.reduce((acc, r) => {
      acc.weft += r.weft_meter
      acc.loss_prd += r.loss_prd
      return acc
    }, { weft: 0, loss_prd: 0 })
  }, [records])

  const handleWhatsApp = (record: CalculatedRecord) => {
    if (!settings?.whatsapp_number || !settings.whatsapp_message_template) {
        toast({ variant: 'destructive', title: 'WhatsApp not configured', description: 'Please set WhatsApp number and message template in settings.'})
        return;
    }
    const message = settings.whatsapp_message_template
        .replace('{date}', record.date)
        .replace('{time}', format(parseISO(record.created_at), "HH:mm"))
        .replace('{mc}', record.machine_number)
        .replace('{shift}', record.shift)
        .replace('{eff}', record.efficiency.toFixed(2))
        .replace('{weft}', record.weft_meter.toFixed(2))
        .replace('{stops}', record.stops.toString());
        
    const url = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
  
  const formatTime = (timeStr: string) => {
      if (!timeStr) return "00:00";
      const parts = timeStr.split(":");
      return parts.slice(0, 2).join(":");
  };

  return (
    <Card className="m-0 p-0">
      <CardHeader className="p-1">
        <CardTitle className="text-sm">{title} - {format(new Date(date.replace(/-/g, '/')), 'dd/MM/yyyy')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="text-[11px] font-bold w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {headers.map(h => 
                  <TableHead key={h.key} className="h-auto p-[3px] text-center cursor-pointer whitespace-nowrap" onClick={() => h.key !== 'actions' && onSort(h.key as keyof CalculatedRecord)}>
                      {h.label}
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.map(r => (
                <TableRow key={r.id} className="text-center [&_td]:p-[3px] [&_td]:whitespace-nowrap">
                  <TableCell className="font-extrabold">{r.machine_number}</TableCell>
                  <TableCell>{formatTime(r.time)}</TableCell>
                  <TableCell className={`font-extrabold ${r.efficiency > 90 ? 'text-green-600' : r.efficiency > 80 ? 'text-blue-600' : 'text-red-600'}`}>{r.efficiency.toFixed(2)}</TableCell>
                  <TableCell className="font-extrabold text-orange-600">{r.stops}</TableCell>
                  <TableCell>{r.total_time}</TableCell>
                  <TableCell>{r.run_time}</TableCell>
                  <TableCell className="text-red-500">{minutesToHHMM(r.diff_minutes)}</TableCell>
                  <TableCell className="text-purple-600 font-extrabold">{r.weft_meter.toFixed(2)}</TableCell>
                  <TableCell>{r.hr.toFixed(2)}</TableCell>
                  <TableCell className="text-red-600 font-extrabold">{r.loss_prd.toFixed(2)}</TableCell>
                  <TableCell className="flex justify-center items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => onEdit(r)}>
                          <Pencil className="h-3 w-3 text-blue-500" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleWhatsApp(r)}>
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => onDelete(r.id)}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
               <TableRow className="text-center font-extrabold [&_td]:p-1">
                  <TableCell colSpan={7}>Total</TableCell>
                  <TableCell className="text-purple-600">{totals.weft.toFixed(2)}</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-red-600">{totals.loss_prd.toFixed(2)}</TableCell>
                  <TableCell></TableCell>
               </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}


export default function RecordsList({ date, onEdit }: { date: string, onEdit: (record: EfficiencyRecord) => void }) {
  const [records, setRecords] = useState<CalculatedRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [sortDescriptor, setSortDescriptor] = useState<{key: keyof CalculatedRecord, direction: 'asc' | 'desc'} | null>({key: 'machine_number', direction: 'asc'})
  const { toast } = useToast()

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('efficiency_records')
      .select('*')
      .eq('date', date)

    if (error) {
      console.error("Error fetching records:", error)
      toast({ variant: 'destructive', title: 'Error fetching records', description: error.message})
    } else {
      const sortedData = data.sort((a,b) => parseInt(a.machine_number) - parseInt(b.machine_number));
      setRecords(sortedData.map(calculateFields))
    }
    setLoading(false)
  }, [date, toast])

  const handleSort = (key: keyof CalculatedRecord) => {
    setSortDescriptor(prev => {
        if (prev?.key === key) {
            return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc'}
        }
        return {key, direction: 'asc'}
    })
  }

  useEffect(() => {
    const fetchSettings = async () => {
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle()
        if (error) {
            console.error('Error fetching settings:', error)
        } else {
            setSettings(data)
        }
    }
    fetchSettings()
    fetchRecords()

    const channel = supabase.channel(`efficiency_records_list_${date}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'efficiency_records', filter: `date=eq.${date}` },
        (payload) => {
            fetchRecords();
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [date, fetchRecords])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this record?')) return
    const { error } = await supabase.from('efficiency_records').delete().eq('id', id)
    if (error) {
        toast({ variant: 'destructive', title: 'Error removing record', description: error.message })
    } else {
        toast({ title: 'Record Removed' })
        fetchRecords()
    }
  }

  const dayRecords = useMemo(() => records.filter(r => r.shift === 'Day'), [records])
  const nightRecords = useMemo(() => records.filter(r => r.shift === 'Night'), [records])

  if (loading) {
    return <Skeleton className="w-full h-64" />
  }

  return (
    <div className="space-y-2">
      <RecordsTable records={dayRecords} title="Day Shift" date={date} settings={settings} onDelete={handleDelete} onEdit={onEdit} onSort={handleSort} sortDescriptor={sortDescriptor} />
      <RecordsTable records={nightRecords} title="Night Shift" date={date} settings={settings} onDelete={handleDelete} onEdit={onEdit} onSort={handleSort} sortDescriptor={sortDescriptor} />
    </div>
  )
}
