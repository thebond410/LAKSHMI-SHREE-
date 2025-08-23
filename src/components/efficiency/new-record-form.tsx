
'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format, parseISO } from "date-fns"
import { Loader2, Camera, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useState, useRef, useEffect } from "react"
import { extractEfficiencyData } from "@/ai/flows/extract-efficiency-data"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "../ui/date-picker"
import type { EfficiencyRecord } from '@/lib/types'

const timeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/; // HH:MM

const formSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  time: z.string().regex(timeRegex, "Invalid time (HH:MM)"),
  shift: z.enum(["Day", "Night"], { required_error: "Shift is required." }),
  machine_number: z.string().min(1, "M/C No. is required"),
  weft_meter: z.coerce.number().positive("Must be positive"),
  stops: z.coerce.number().int().min(0),
  total_time: z.string().regex(timeRegex, "Invalid format (HH:MM)"),
  run_time: z.string().regex(timeRegex, "Invalid format (HH:MM)"),
})

type NewRecordFormProps = {
  onSave: () => void
  onClose: () => void
  initialData?: EfficiencyRecord | null
}

const timeStringToMinutes = (time: string): number => {
    if (!time) return 0;
    const parts = time.split(':').map(Number);
    if (parts.some(isNaN) || parts.length < 2) return 0;
    const [h=0, m=0] = parts;
    return h * 60 + m;
}

const getDefaultValues = (initialData?: EfficiencyRecord | null, currentDate?: Date) => {
  if (initialData) {
    return {
      date: parseISO(initialData.date),
      time: format(parseISO(initialData.created_at), "HH:mm"),
      shift: initialData.shift,
      machine_number: initialData.machine_number,
      weft_meter: initialData.weft_meter,
      stops: initialData.stops,
      total_time: initialData.total_time,
      run_time: initialData.run_time,
    }
  }
  const dateToUse = currentDate || new Date();
  return {
    date: dateToUse,
    time: format(new Date(), "HH:mm"),
    shift: (new Date().getHours() >= 7 && new Date().getHours() < 19) ? 'Day' : 'Night',
    machine_number: "",
    weft_meter: 0,
    stops: 0,
    total_time: "00:00",
    run_time: "00:00",
  }
}

export default function NewRecordForm({ onSave, onClose, initialData }: NewRecordFormProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(initialData),
  })

  useEffect(() => {
    form.reset(getDefaultValues(initialData))
  }, [initialData, form])
  
  const formatTimeToSeconds = (timeStr: string): string => {
    if (!timeStr) return "00:00";
    const parts = timeStr.split(":");
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return "00:00";
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true)
    
    // Check for duplicate record if not editing
    if (!initialData) {
      const { data: existingRecord, error: fetchError } = await supabase
        .from("efficiency_records")
        .select('id')
        .eq('date', format(values.date, "yyyy-MM-dd"))
        .eq('shift', values.shift)
        .eq('machine_number', values.machine_number)
        .maybeSingle();

      if (fetchError) {
        toast({
          variant: "destructive",
          title: "Error checking for duplicates",
          description: fetchError.message,
        });
        setIsSaving(false);
        return;
      }

      if (existingRecord) {
        toast({
          variant: "destructive",
          title: "Duplicate Record",
          description: `A record for M/C ${values.machine_number} on this date and shift already exists.`,
        });
        setIsSaving(false);
        return;
      }
    }

    if (timeStringToMinutes(values.run_time) > timeStringToMinutes(values.total_time)) {
        toast({
            variant: "destructive",
            title: "Invalid Input",
            description: "Run Time cannot be greater than Total Time.",
        })
        setIsSaving(false);
        return;
    }

    const recordPayload = {
      date: format(values.date, "yyyy-MM-dd"),
      time: `${values.time}:00`,
      shift: values.shift,
      machine_number: values.machine_number,
      weft_meter: values.weft_meter,
      stops: values.stops,
      total_time: values.total_time, // Keep as HH:MM
      run_time: values.run_time,     // Keep as HH:MM
      created_at: new Date(values.date.setHours(
        parseInt(values.time.split(':')[0]),
        parseInt(values.time.split(':')[1])
      )).toISOString(),
    }

    let error;

    if (initialData) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("efficiency_records")
        .update(recordPayload)
        .eq('id', initialData.id)
      error = updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from("efficiency_records")
        .insert(recordPayload)
      error = insertError;
    }

    if (error) {
      toast({
        variant: "destructive",
        title: `Error ${initialData ? 'updating' : 'saving'} record`,
        description: error.message,
      })
    } else {
      toast({
        title: `Record ${initialData ? 'Updated' : 'Saved'}`,
      })
      onSave()
      if (initialData) {
        onClose(); // Close form only on update
      } else {
         form.reset(getDefaultValues(null, values.date))
      }
    }
    setIsSaving(false)
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return
    setIsScanning(true)
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      try {
        const photoDataUri = reader.result as string
        const result = await extractEfficiencyData({ photoDataUri })
        
        if (result) {
          form.setValue("time", formatTimeToSeconds(result.time))
          form.setValue("machine_number", result.machineNumber)
          form.setValue("weft_meter", result.weftMeter)
          form.setValue("stops", result.stops)
          form.setValue("total_time", formatTimeToSeconds(result.totalTime))
          form.setValue("run_time", formatTimeToSeconds(result.runTime))
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsScanning(false)
      }
    }
    reader.onerror = () => {
        setIsScanning(false)
    }
  }

  const formItemClass = "m-0 p-0 space-y-0.5"
  const formLabelClass = "text-xs m-0 p-0"
  const formInputClass = "h-6 text-xs p-1"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
         {/* Row 1 */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className={cn("flex flex-col", formItemClass)}>
                  <FormLabel className={formLabelClass}>Date</FormLabel>
                   <DatePicker date={field.value} onDateChange={field.onChange} buttonClassName={formInputClass} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem className={formItemClass}>
                    <FormLabel className={formLabelClass}>Time</FormLabel>
                    <FormControl><Input type="time" {...field} className={formInputClass} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
             <FormField
                control={form.control}
                name="machine_number"
                render={({ field }) => (
                    <FormItem className={formItemClass}>
                        <FormLabel className={formLabelClass}>M/C No.</FormLabel>
                        <FormControl><Input {...field} className={formInputClass} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        {/* Row 2 */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
             <FormField
                control={form.control}
                name="shift"
                render={({ field }) => (
                    <FormItem className={formItemClass}>
                        <FormLabel className={formLabelClass}>Shift</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger className={formInputClass}>
                                    <SelectValue placeholder="Select shift" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Day">Day</SelectItem>
                                <SelectItem value="Night">Night</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
             <FormField control={form.control} name="weft_meter" render={({ field }) => (
                <FormItem className={formItemClass}>
                    <FormLabel className={formLabelClass}>Weft Meter</FormLabel>
                    <FormControl><Input type="number" step="0.1" {...field} className={formInputClass} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
             <FormField control={form.control} name="stops" render={({ field }) => (
                <FormItem className={formItemClass}>
                    <FormLabel className={formLabelClass}>Stops</FormLabel>
                    <FormControl><Input type="number" {...field} className={formInputClass} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
        </div>
         {/* Row 3 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <FormField control={form.control} name="total_time" render={({ field }) => (
                <FormItem className={formItemClass}>
                    <FormLabel className={formLabelClass}>Total Time (HH:MM)</FormLabel>
                    <FormControl><Input placeholder="HH:MM" {...field} className={formInputClass} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="run_time" render={({ field }) => (
                <FormItem className={formItemClass}>
                    <FormLabel className={formLabelClass}>Run Time (HH:MM)</FormLabel>
                    <FormControl><Input placeholder="HH:MM" {...field} className={formInputClass} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} className="hidden" />
          <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} className="hidden" />
          
          <Button type="button" size="sm" onClick={() => cameraInputRef.current?.click()} disabled={isScanning} className="text-xs h-6 px-2 bg-blue-500 hover:bg-blue-600 text-white gap-1">
            {isScanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />} Scan
          </Button>
          <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isScanning} className="text-xs h-6 px-2 bg-green-500 hover:bg-green-600 text-white gap-1">
             {isScanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />} Upload
          </Button>

          <div className="flex-grow" />

          <Button type="submit" size="sm" disabled={isSaving || isScanning} className="text-xs h-6 px-2">
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null} {initialData ? 'Update Record' : 'Save Record'}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClose} className="text-xs h-6 px-2">Close</Button>
        </div>
      </form>
    </Form>
  )
}
