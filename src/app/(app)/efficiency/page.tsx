
'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import NewRecordForm from '@/components/efficiency/new-record-form'
import RecordsList from '@/components/efficiency/records-list'
import { PlusCircle, Calendar as CalendarIcon } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { format, parseISO } from 'date-fns'
import type { EfficiencyRecord } from '@/lib/types'

const getInitialDate = (): Date => {
  if (typeof window === 'undefined') {
    return new Date();
  }
  const storedDate = localStorage.getItem('efficiencyDate');
  if (storedDate) {
    const date = parseISO(storedDate);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return new Date();
}

export default function EfficiencyPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  // key to force re-render/re-fetch of records list after a save
  const [recordsVersion, setRecordsVersion] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate())
  const [editingRecord, setEditingRecord] = useState<EfficiencyRecord | null>(null)
  
  useEffect(() => {
    localStorage.setItem('efficiencyDate', selectedDate.toISOString());
  }, [selectedDate]);

  const handleSave = () => {
    // Increment version to trigger re-fetch in RecordsList
    setRecordsVersion(v => v + 1)
    if (editingRecord) { // if we were editing
      setEditingRecord(null) 
      setIsFormOpen(false) 
    }
  }
  
  const handleEdit = (record: EfficiencyRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  }
  
  const handleAddNew = () => {
    setEditingRecord(null); // Ensure we are not in edit mode
    setIsFormOpen(true);
  }

  const handleCloseForm = () => {
    setEditingRecord(null);
    setIsFormOpen(false);
  }
  
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
        setSelectedDate(date);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh_-_2.5rem)] overflow-x-hidden">
      <div className="p-1 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
            <Button size="sm" onClick={isFormOpen && !editingRecord ? handleCloseForm : handleAddNew} className="gap-1 px-2 py-1 h-auto text-xs">
              <PlusCircle className="h-3 w-3" />
              {isFormOpen && !editingRecord ? 'Close Form' : 'New Record'}
            </Button>
            <DatePicker date={selectedDate} onDateChange={handleDateChange} />
        </div>
      </div>
      
      {isFormOpen && (
        <div className="p-1 border-b">
          <NewRecordForm 
            onSave={handleSave} 
            onClose={handleCloseForm} 
            initialData={editingRecord}
            currentDate={selectedDate}
          />
        </div>
      )}

      <div className="flex-1 overflow-auto p-1">
        <RecordsList key={recordsVersion} date={format(selectedDate, 'yyyy-MM-dd')} onEdit={handleEdit} />
      </div>
    </div>
  )
}
