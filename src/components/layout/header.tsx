'use client'
import Link from 'next/link'
import { LayoutDashboard, FilePlus2, BarChart3, Settings } from 'lucide-react'
import SupabaseStatus from '@/components/supabase-status'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/efficiency', icon: FilePlus2, label: 'Efficiency' },
  { href: '/report', icon: BarChart3, label: 'Report' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 m-0 p-0">
      <div className="container flex h-auto max-w-full items-center justify-between p-1">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2 mr-2">
            <span className="font-extrabold text-base text-primary">Manoj Patel</span>
          </Link>
          <nav className="flex items-center gap-1">
            <TooltipProvider delayDuration={0}>
              {navItems.map((item) => (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-primary/10 hover:text-primary',
                        pathname.startsWith(item.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="p-1 text-xs bg-primary text-primary-foreground">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </nav>
        </div>
        <SupabaseStatus />
      </div>
    </header>
  )
}
