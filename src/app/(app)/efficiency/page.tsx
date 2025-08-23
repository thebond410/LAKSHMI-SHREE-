
import { Suspense } from 'react'
import EfficiencyClientPage from './client-page'
import { Skeleton } from '@/components/ui/skeleton'

export default function EfficiencyPage() {
  return (
    <Suspense fallback={<EfficiencyPageSkeleton />}>
      <EfficiencyClientPage />
    </Suspense>
  )
}

function EfficiencyPageSkeleton() {
    return (
        <div className="flex flex-col h-[calc(100vh_-_2.5rem)] overflow-x-hidden">
            <div className="p-1 flex justify-between items-center border-b">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-36" />
                </div>
            </div>
            <div className="flex-1 overflow-auto p-1 space-y-2">
                <Skeleton className="w-full h-64" />
                <Skeleton className="w-full h-64" />
            </div>
        </div>
    )
}
