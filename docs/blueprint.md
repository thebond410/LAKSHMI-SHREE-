# **App Name**: Manoj Patel

## Core Features:

- Supabase Status Icon: Display real-time Supabase connection status.
- Today's Performance Card View: Display performance data in a three-column grid with color-coded efficiency levels.
- Performance Chart: Generate bar charts visualizing Weft Meter data for day and night shifts over the last 30 days.
- Low Efficiency Alert: Highlight machines with low average efficiency and generate a WhatsApp report via a button.
- New Efficiency Record Form: Streamline data entry with a compact, three-column form and date picker defaulting to the current date. Persist the selected date after saving.
- AI Scanning Options: Use AI to automatically extract data from machine display images to populate the new record form, activated by 'Scan' and 'Upload' buttons. This is achieved by reasoning through and extracting data using the tool. Examples of the keys to extract: 'All stops', 'Total time', 'Run time len', 'Cloth length'.
- Live API Key: Enable immediate use of a new Gemini API key upon saving in settings.

## Style Guidelines:

- Primary color: HSL (210, 65%, 65%) which is RGB hex value #54A3EE for clarity and reliability. 
- Background color: HSL (210, 20%, 95%) which is RGB hex value #F0F4F8.
- Accent color: HSL (180, 75%, 50%) which is RGB hex value #26C6AB, creating a contrasting vibrant touch.
- Font: 'Inter' (sans-serif) for both headlines and body text, emphasizing the app's modern, neutral look. The 11px bold font requirement applies to all text, optimizing screen real estate on mobile devices.
- Simple, clear icons for navigation and status indicators, such as the Supabase connection icon.
- Dense, functional layout with zero padding or margins, optimizing screen real estate.
- Subtle transitions and animations to enhance the user experience, such as feedback upon data saving.