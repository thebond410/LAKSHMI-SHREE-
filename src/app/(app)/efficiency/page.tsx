'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import NewRecordForm from '@/components/efficiency/new-record-form'
import RecordsList from '@/components/efficiency/records-list'
import { PlusCircle } from 'lucide-react'

export default function EfficiencyPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  // key to force re-render/re-fetch of records list after a save
  const [recordsVersion, setRecordsVersion] = useState(0)

  const handleSave = () => {
    // Increment version to trigger re-fetch in RecordsList
    setRecordsVersion(v => v + 1)
  }

  return (
    <div className="flex flex-col h-[calc(100vh_-_2.5rem)]">
      <div className="p-1">
        <Button size="sm" onClick={() => setIsFormOpen(prev => !prev)} className="gap-1 px-2 py-1 h-auto text-xs">
          <PlusCircle className="h-3 w-3" />
          {isFormOpen ? 'Close Form' : 'New Efficiency Record'}
        </Button>
      </div>
      
      {isFormOpen && (
        <div className="p-1 border-b">
          <NewRecordForm onSave={handleSave} onClose={() => setIsFormOpen(false)} />
        </div>
      )}

      <div className="flex-1 overflow-auto p-1">
        <RecordsList key={recordsVersion} />
      </div>
    </div>
  )
}
