'use client'
import { useEffect, useState } from 'react'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'

type ReportFiltersProps = {
  onFilterChange: (filters: { dateRange?: DateRange, machine?: string, shift?: string }) => void
}

export default function ReportFilters({ onFilterChange }: ReportFiltersProps) {
  const [date, setDate] = useState<DateRange | undefined>()
  const [machine, setMachine] = useState<string>('')
  const [shift, setShift] = useState<string>('')
  const [machines, setMachines] = useState<string[]>([])

  useEffect(() => {
    const fetchMachines = async () => {
      const { data, error } = await supabase
        .from('efficiency_records')
        .select('machine_number')
      
      if (data) {
        const uniqueMachines = [...new Set(data.map(item => item.machine_number))].sort((a,b) => parseInt(a) - parseInt(b))
        setMachines(uniqueMachines)
      }
    }
    fetchMachines()
  }, [])

  useEffect(() => {
    onFilterChange({ dateRange: date, machine, shift })
  }, [date, machine, shift, onFilterChange])

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            size="sm"
            className={cn("w-[180px] justify-start text-left font-normal h-6 px-2 text-xs", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-1 h-3 w-3" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yy")} - {format(date.to, "dd/MM/yy")}
                </>
              ) : (
                format(date.from, "dd/MM/yy")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <Select value={machine} onValueChange={setMachine}>
        <SelectTrigger className="w-[80px] h-6 px-2 text-xs">
          <SelectValue placeholder="M/C" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All M/C</SelectItem>
          {machines.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={shift} onValueChange={setShift}>
        <SelectTrigger className="w-[80px] h-6 px-2 text-xs">
          <SelectValue placeholder="Shift" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Shifts</SelectItem>
          <SelectItem value="A">Day</SelectItem>
          <SelectItem value="B">Night</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
