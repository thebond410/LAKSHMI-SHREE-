// This file is machine generated - changes may be lost.

'use server';

/**
 * @fileOverview This file defines a Genkit flow to extract efficiency data from an image of a machine display.
 *
 * - extractEfficiencyData - The main function to trigger the data extraction flow.
 * - ExtractEfficiencyDataInput - The input type for the extractEfficiencyData function.
 * - ExtractEfficiencyDataOutput - The output type for the extractEfficiencyData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractEfficiencyDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the machine display, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractEfficiencyDataInput = z.infer<typeof ExtractEfficiencyDataInputSchema>;

const ExtractEfficiencyDataOutputSchema = z.object({
  weftMeter: z.number().describe('The weft meter reading from the display (Cloth length).'),
  stops: z.number().describe('The number of stops from the display (All stops).'),
  totalTime: z.string().describe("The total time from the display in HH:MM format. It's labeled 'Total Time'."),
  runTime: z.string().describe("The run time from the display in HH:MM format. It's labeled 'Run time len'."),
  machineNumber: z.string().describe('The machine number from the display, identifiable from the steel plate or the display.'),
});
export type ExtractEfficiencyDataOutput = z.infer<typeof ExtractEfficiencyDataOutputSchema>;

export async function extractEfficiencyData(
  input: ExtractEfficiencyDataInput
): Promise<ExtractEfficiencyDataOutput> {
  return extractEfficiencyDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractEfficiencyDataPrompt',
  input: {schema: ExtractEfficiencyDataInputSchema},
  output: {schema: ExtractEfficiencyDataOutputSchema},
  prompt: `You are an expert in extracting structured data from images of machine displays in a factory setting. Your task is to be fast and precise.

  Given an image of a machine display, extract the following information. Pay close attention to the labels on the display to correctly identify each value.
  
  - Weft Meter (Cloth length): A number.
  - Stops (All stops): A number.
  - Total Time: A time value in HH:MM format from the "Total Time" field.
  - Run Time (Run time len): A time value in HH:MM format from the "Run time len" field.
  - Machine Number: A string representing the machine number, which may be on a steel plate near the display or on the screen itself.

  Return ONLY the extracted data in a valid JSON object. Do not include any extra text or explanations.

  Here is the image of the machine display:
  {{media url=photoDataUri}}
  `,
});

const extractEfficiencyDataFlow = ai.defineFlow(
  {
    name: 'extractEfficiencyDataFlow',
    inputSchema: ExtractEfficiencyDataInputSchema,
    outputSchema: ExtractEfficiencyDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
