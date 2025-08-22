import PerformanceCards from '@/components/dashboard/performance-cards'
import PerformanceChart from '@/components/dashboard/performance-chart'
import LowEfficiencyAlert from '@/components/dashboard/low-efficiency-alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-2">
      <PerformanceCards />

      <Card className="m-0 p-0">
        <CardHeader className="p-1">
          <CardTitle className="text-sm">Last 30 Days Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PerformanceChart />
        </CardContent>
      </Card>

      <LowEfficiencyAlert />
    </div>
  )
}
