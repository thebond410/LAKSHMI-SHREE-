'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

const sqlScript = `
-- Drop the old table if it exists to avoid conflicts
-- Make sure to back up your data if needed before running this.
-- DROP TABLE IF EXISTS "efficiency_records";

-- Table for storing efficiency records from machines
CREATE TABLE IF NOT EXISTS "efficiency_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "date" date NOT NULL,
  "shift" character(1) NOT NULL, -- 'A' for Day, 'B' for Night
  "machine_number" text NOT NULL,
  "weft_meter" numeric(8, 2) NOT NULL,
  "stops" integer NOT NULL,
  "total_minutes" integer NOT NULL,
  "run_minutes" integer NOT NULL
);

-- Table for storing application settings
-- This table is expected to have only one row with id = 1
CREATE TABLE IF NOT EXISTS "settings" (
  "id" integer PRIMARY KEY,
  "total_machines" integer,
  "low_efficiency_threshold" integer,
  "gemini_api_key" text,
  "whatsapp_number" text,
  "whatsapp_message_template" text
);

-- Enable Realtime for tables
-- Make sure to do this in your Supabase dashboard under Database > Replication
-- for both efficiency_records and settings tables.

-- RLS Policies (Example - adjust as needed if you add authentication)
-- alter table efficiency_records enable row level security;
-- create policy "Public access" on efficiency_records for select using (true);
-- create policy "Public access" on efficiency_records for insert with check (true);

-- alter table settings enable row level security;
-- create policy "Public access" on settings for select using (true);
-- create policy "Public access" on settings for update using (true);
`.trim()

export default function SqlScriptDisplay() {
  return (
    <Card className="m-0 mt-2 p-0">
      <CardHeader className="p-1">
        <CardTitle className="text-sm">Database Schema</CardTitle>
        <CardDescription className="text-xs">
          This is the SQL script used to set up the database. Use this as a reference.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-1">
        <ScrollArea className="h-48 w-full rounded-md border p-2">
          <pre className="text-xs whitespace-pre-wrap">
            <code>{sqlScript}</code>
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
