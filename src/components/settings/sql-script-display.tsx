
'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

const sqlScript = `
-- Drop the old table if it exists to avoid conflicts
-- Make sure to back up your data if needed before running this.
-- DROP TABLE IF EXISTS "efficiency_records";

-- Create ENUM type for shift
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_type') THEN
        CREATE TYPE shift_type AS ENUM ('Day', 'Night');
    END IF;
END$$;


-- Table for storing efficiency records from machines
CREATE TABLE IF NOT EXISTS "efficiency_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "date" date NOT NULL,
  "time" time NOT NULL,
  "shift" shift_type NOT NULL, -- 'Day' or 'Night'
  "machine_number" text NOT NULL,
  "weft_meter" numeric(10, 2) NOT NULL,
  "stops" integer NOT NULL,
  "total_time" text NOT NULL, -- Format 'HH:MM'
  "run_time" text NOT NULL -- Format 'HH:MM'
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

-- =================================================================
-- RLS POLICIES - REQUIRED FOR APP TO WORK
-- Run these queries in your Supabase SQL editor to allow the app
-- to read, write, update, and delete data.
-- =================================================================

-- 1. Enable RLS for the tables
alter table "efficiency_records" enable row level security;
alter table "settings" enable row level security;

-- 2. Create policies to allow public access
-- These policies allow anyone with the anon key to perform actions.

-- Policies for efficiency_records
drop policy if exists "Public access for all actions" on "efficiency_records";
create policy "Public access for all actions" on "efficiency_records"
for all -- covers SELECT, INSERT, UPDATE, DELETE
using (true)
with check (true);

-- Policies for settings
drop policy if exists "Public access for all actions" on "settings";
create policy "Public access for all actions" on "settings"
for all -- covers SELECT, INSERT, UPDATE, DELETE
using (true)
with check (true);
`.trim()

export default function SqlScriptDisplay() {
  return (
    <Card className="m-0 mt-2 p-0">
      <CardHeader className="p-1">
        <CardTitle className="text-sm">Database Schema & Policies</CardTitle>
        <CardDescription className="text-xs">
          This is the SQL script used to set up the database and required policies. Copy and run the RLS policies in your Supabase SQL Editor.
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
