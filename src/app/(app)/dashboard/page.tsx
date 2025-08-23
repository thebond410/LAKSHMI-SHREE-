'use client'
import { useState } from 'react'
import PerformanceCards from '@/components/dashboard/performance-cards'
import PerformanceChart from '@/components/dashboard/performance-chart'
import LowEfficiencyAlert from '@/components/dashboard/low-efficiency-alert'
import DailySummaryCards from '@/components/dashboard/daily-summary-cards'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardPage() {
  const [view, setView] = useState('cards')

  return (
    <div className="space-y-2">
      <Tabs value={view} onValueChange={setView} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto p-0.5 m-0">
          <TabsTrigger value="cards" className="text-xs p-1">Card View</TabsTrigger>
          <TabsTrigger value="charts" className="text-xs p-1">Chart View</TabsTrigger>
        </TabsList>
        <TabsContent value="cards" className="mt-2 space-y-2">
          <DailySummaryCards />
          <LowEfficiencyAlert />
          <Card className="m-0 p-0">
             <CardHeader className="p-1">
                <CardTitle className="text-sm">Machine-wise Performance (Today vs Yesterday)</CardTitle>
            </CardHeader>
             <CardContent className="p-1">
                <PerformanceCards />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="charts" className="mt-2">
          <Card className="m-0 p-0">
            <CardHeader className="p-1">
              <CardTitle className="text-sm">Last 30 Days Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PerformanceChart />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
