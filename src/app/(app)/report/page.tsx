'use client'
import { useState } from 'react'
import { DateRange } from "react-day-picker"
import ReportFilters from '@/components/report/report-filters'
import ReportView from '@/components/report/report-view'
import type { EfficiencyRecord } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function ReportPage() {
  const [filters, setFilters] = useState<{ dateRange?: DateRange; machine?: string; shift?: string }>({})
  const [records, setRecords] = useState<EfficiencyRecord[]>([])
  
  const handleDownloadPdf = () => {
    const doc = new jsPDF()
    autoTable(doc, {
      head: [['Date', 'M/C', 'Shift', 'Effi(%)', 'Stops', 'Tot.Time', 'Run.Time', 'Weft']],
      body: records.map(r => {
        const efficiency = r.total_time > 0 ? (r.run_time / r.total_time) * 100 : 0
        return [
          r.date,
          r.machine_number,
          r.shift,
          efficiency.toFixed(2),
          r.stops,
          r.total_time,
          r.run_time,
          r.weft_meter,
        ]
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [38, 198, 171] },
    })
    doc.save('report.pdf')
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center p-1 border-b">
        <ReportFilters onFilterChange={setFilters} />
        <Button onClick={handleDownloadPdf} size="sm" className="h-auto p-1 text-xs gap-1">
          <Download className="h-3 w-3" />
          Download PDF
        </Button>
      </div>
      <ReportView filters={filters} onDataLoaded={setRecords} />
    </div>
  )
}
