'use client'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function DangerZone() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDeleteAllData = async () => {
    setLoading(true)

    // In a real app, this should call a secure backend endpoint.
    // The password should be something more secure. For this demo, 'delete' is used.
    if (password !== 'delete') {
      toast({
        variant: 'destructive',
        title: 'Incorrect Password',
        description: 'The password to delete all data is incorrect.',
      })
      setLoading(false)
      return
    }

    try {
      const { error: recordsError } = await supabase.from('efficiency_records').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Placeholder to delete all
      if (recordsError) throw recordsError
      
      const { error: settingsError } = await supabase.from('settings').delete().eq('id', 1)
      if (settingsError) throw settingsError

      toast({
        title: 'Data Deleted',
        description: 'All application data has been successfully deleted.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Deleting Data',
        description: error.message,
      })
    } finally {
      setLoading(false)
      setPassword('')
    }
  }

  return (
    <Card className="m-0 mt-2 p-0 border-red-500">
      <CardHeader className="p-1">
        <CardTitle className="text-sm text-red-600">Danger Zone</CardTitle>
        <CardDescription className="text-xs">
          This action is irreversible. All data will be permanently deleted.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-1 space-y-2">
        <div className="flex items-center gap-2">
          <Input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Type 'delete' to confirm"
            className="h-6 text-xs p-1"
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="h-6 px-2 text-xs" disabled={password !== 'delete' || loading}>
                {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Delete All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all efficiency records and settings from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllData} className="bg-destructive hover:bg-destructive/90">
                  Yes, delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
