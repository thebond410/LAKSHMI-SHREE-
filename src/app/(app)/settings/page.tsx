import SettingsForm from "@/components/settings/settings-form"
import SqlScriptDisplay from "@/components/settings/sql-script-display"
import DangerZone from "@/components/settings/danger-zone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SettingsPage() {
  return (
    <div className="p-1">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-0.5 m-0">
          <TabsTrigger value="general" className="text-xs p-1">General</TabsTrigger>
          <TabsTrigger value="api" className="text-xs p-1">API</TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs p-1">WhatsApp</TabsTrigger>
          <TabsTrigger value="database" className="text-xs p-1">Database</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <Card className="m-0 p-0">
            <CardHeader className="p-1">
              <CardTitle className="text-sm">General Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-1">
              <SettingsForm fields={['total_machines', 'low_efficiency_threshold']} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="api">
          <Card className="m-0 p-0">
            <CardHeader className="p-1">
              <CardTitle className="text-sm">Gemini API Key</CardTitle>
            </CardHeader>
            <CardContent className="p-1">
               <SettingsForm fields={['gemini_api_key']} />
               <p className="text-xs text-muted-foreground mt-2 p-1 bg-yellow-100/50 border border-yellow-200 rounded-sm">
                Note: The Genkit AI flow is initialized on server start. After saving a new API key, a server restart may be required for it to become active.
               </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="whatsapp">
           <Card className="m-0 p-0">
            <CardHeader className="p-1">
              <CardTitle className="text-sm">WhatsApp Configuration</CardTitle>
            </CardHeader>
            <CardContent className="p-1">
              <SettingsForm fields={['whatsapp_number', 'whatsapp_message_template']} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="database">
            <SqlScriptDisplay />
            <DangerZone />
        </TabsContent>
      </Tabs>
    </div>
  )
}
