'use client'

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useState, useRef } from "react"
import { extractEfficiencyData } from "@/ai/flows/extract-efficiency-data"

const timeWithSecondsRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]:[0-5][0-9]$/; // HH:MM:SS
const timeWithoutSecondsRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/; // HH:MM

const formSchema = z.object({
  date: z.date({
    required_error: "A date is required.",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  machine_number: z.string().min(1, "M/C No. is required"),
  weft_meter: z.coerce.number().positive("Must be positive"),
  stops: z.coerce.number().int().min(0),
  total_time: z.string().regex(/^([0-9]+):[0-5][0-9]:[0-5][0-9]$/, "Invalid format (HH:MM:SS)"),
  run_time: z.string().regex(/^([0-9]+):[0-5][0-9]:[0-5][0-9]$/, "Invalid format (HH:MM:SS)"),
})

type NewRecordFormProps = {
  onSave: () => void
  onClose: () => void
}

const timeStringToSeconds = (time: string): number => {
    if (!time) return 0;
    const parts = time.split(':').map(Number);
    if (parts.some(isNaN)) return 0;
    const [h=0, m=0, s=0] = parts;
    return h * 3600 + m * 60 + s;
}

export default function NewRecordForm({ onSave, onClose }: NewRecordFormProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      time: format(new Date(), "HH:mm"),
      machine_number: "",
      weft_meter: 0,
      stops: 0,
      total_time: "00:00:00",
      run_time: "00:00:00",
    },
  })
  
  const formatTimeToSeconds = (timeStr: string): string => {
    if (timeWithSecondsRegex.test(timeStr)) return timeStr;
    if (timeWithoutSecondsRegex.test(timeStr)) return `${timeStr}:00`;
    return "00:00:00";
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true)
    const [hours] = values.time.split(':').map(Number);
    const shift = (hours >= 7 && hours < 19) ? 'Day' : 'Night';
    
    if (timeStringToSeconds(values.run_time) > timeStringToSeconds(values.total_time)) {
        toast({
            variant: "destructive",
            title: "Invalid Input",
            description: "Run Time cannot be greater than Total Time.",
        })
        setIsSaving(false);
        return;
    }

    const { error } = await supabase.from("efficiency_records").insert({
      date: format(values.date, "yyyy-MM-dd"),
      shift: shift,
      machine_number: values.machine_number,
      weft_meter: values.weft_meter,
      stops: values.stops,
      total_time: values.total_time,
      run_time: values.run_time,
    })

    if (error) {
      toast({
        variant: "destructive",
        title: "Error saving record",
        description: error.message,
      })
    } else {
      toast({
        title: "Record saved",
        description: `Efficiency record for M/C ${values.machine_number} has been saved.`,
      })
      onSave()
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
          form.setValue("machine_number", result.machineNumber)
          form.setValue("weft_meter", result.weftMeter)
          form.setValue("stops", result.stops)
          form.setValue("total_time", formatTimeToSeconds(result.totalTime))
          form.setValue("run_time", formatTimeToSeconds(result.runTime))
          toast({ title: "Scan successful", description: "Form fields populated from image." })
        } else {
           toast({ variant: "destructive", title: "Scan failed", description: "Could not extract data from image." })
        }
      } catch (error) {
        console.error(error)
        toast({ variant: "destructive", title: "Scan error", description: "An error occurred during AI processing." })
      } finally {
        setIsScanning(false)
      }
    }
    reader.onerror = () => {
        toast({ variant: "destructive", title: "File read error" })
        setIsScanning(false)
    }
  }

  const formItemClass = "m-0 p-0 space-y-0.5"
  const formLabelClass = "text-xs m-0 p-0"
  const formInputClass = "h-6 text-xs p-1"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {/* Inputs here */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className={cn("flex flex-col", formItemClass)}>
                  <FormLabel className={formLabelClass}>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-2 text-left font-normal", !field.value && "text-muted-foreground", formInputClass)}
                        >
                          {field.value ? format(field.value, "dd/MM/yy") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
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
            <FormField control={form.control} name="machine_number" render={({ field }) => (
                <FormItem className={formItemClass}>
                    <FormLabel className={formLabelClass}>M/C No.</FormLabel>
                    <FormControl><Input {...field} className={formInputClass} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
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
            <FormField control={form.control} name="total_time" render={({ field }) => (
                <FormItem className={formItemClass}>
                    <FormLabel className={formLabelClass}>Total Time (HH:MM:SS)</FormLabel>
                    <FormControl><Input placeholder="HH:MM:SS" {...field} className={formInputClass} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="run_time" render={({ field }) => (
                <FormItem className={formItemClass}>
                    <FormLabel className={formLabelClass}>Run Time (HH:MM:SS)</FormLabel>
                    <FormControl><Input placeholder="HH:MM:SS" {...field} className={formInputClass} /></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} className="hidden" />
          <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])} className="hidden" />
          
          <Button type="button" size="sm" variant="outline" onClick={() => cameraInputRef.current?.click()} disabled={isScanning} className="text-xs h-6 px-2">
            {isScanning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null} Scan
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isScanning} className="text-xs h-6 px-2">
             {isScanning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null} Upload
          </Button>

          <div className="flex-grow" />

          <Button type="submit" size="sm" disabled={isSaving || isScanning} className="text-xs h-6 px-2">
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null} Save Record
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClose} className="text-xs h-6 px-2">Close</Button>
        </div>
      </form>
    </Form>
  )
}
