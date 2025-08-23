'use client'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Settings } from "@/lib/types"

const settingsSchema = z.object({
  total_machines: z.coerce.number().int().optional().nullable(),
  low_efficiency_threshold: z.coerce.number().int().optional().nullable(),
  gemini_api_key: z.string().optional().nullable(),
  whatsapp_number: z.string().optional().nullable(),
  whatsapp_message_template: z.string().optional().nullable(),
})

type SettingsFormProps = {
  fields: (keyof Settings)[]
}

const fieldLabels: Record<keyof Settings, string> = {
  id: "ID",
  total_machines: "Total Machines",
  low_efficiency_threshold: "Low Efficiency Threshold (%)",
  gemini_api_key: "Gemini API Key",
  whatsapp_number: "Default WhatsApp Number",
  whatsapp_message_template: "WhatsApp Message Template",
}

const WhatsAppTemplateDescription = () => (
    <div className="text-xs text-muted-foreground mt-1 p-1 space-y-1">
        <p className="font-bold">Available placeholders:</p>
        <div className="grid grid-cols-3 gap-x-2">
            <span>`{date}`</span>
            <span>`{time}`</span>
            <span>`{mc}`</span>
            <span>`{shift}`</span>
            <span>`{eff}`</span>
            <span>`{weft}`</span>
            <span>`{stops}`</span>
        </div>
    </div>
)

export default function SettingsForm({ fields }: SettingsFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {},
  })

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single()
      
      if (data) {
        form.reset(data)
      }
    }
    fetchSettings()
  }, [form])
  
  async function onSubmit(values: z.infer<typeof settingsSchema>) {
    setLoading(true)
    const { data, error } = await supabase
      .from('settings')
      .upsert({ id: 1, ...values })
      .select()
      .single()

    if (error) {
      toast({ variant: "destructive", title: "Error saving settings", description: error.message })
    } else {
      toast({ title: "Settings saved successfully" })
      form.reset(data)
    }
    setLoading(false)
  }

  const renderField = (fieldName: keyof Settings) => {
    const isTextArea = fieldName === 'whatsapp_message_template';
    const isNumber = ['total_machines', 'low_efficiency_threshold'].includes(fieldName);

    return (
      <FormField
        key={fieldName}
        control={form.control}
        name={fieldName as any}
        render={({ field }) => (
          <FormItem className="m-0 p-0 space-y-0.5">
            <FormLabel className="text-xs m-0 p-0">{fieldLabels[fieldName]}</FormLabel>
            <FormControl>
              {isTextArea ? (
                <>
                    <Textarea {...field} value={field.value ?? ""} className="text-xs p-1" />
                    <WhatsAppTemplateDescription />
                </>
              ) : (
                <Input type={isNumber ? 'number' : 'text'} {...field} value={field.value ?? ""} className="h-6 text-xs p-1" />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        {fields.map(renderField)}
        <Button type="submit" size="sm" disabled={loading} className="h-6 px-2 text-xs">
          {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          Save Settings
        </Button>
      </form>
    </Form>
  )
}
