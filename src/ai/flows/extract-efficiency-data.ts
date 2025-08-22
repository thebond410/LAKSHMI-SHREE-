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
  weftMeter: z.number().describe('The weft meter reading from the display.'),
  stops: z.number().describe('The number of stops from the display.'),
  totalTime: z.number().describe('The total time from the display.'),
  runTime: z.number().describe('The run time from the display.'),
  machineNumber: z.string().describe('The machine number from the display.'),
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
  prompt: `You are an expert in extracting data from images of machine displays in a factory setting.

  Given an image of a machine display, extract the following information:
  - Weft Meter (Cloth length): A number representing the weft meter reading.
  - Stops (All stops): A number representing the total number of stops.
  - Total Time: A number representing the total time the machine has been running.
  - Run Time (Run time len): A number representing the run time length.
  - Machine Number: A string representing the machine number, identifiable from the steel plate or the display.

  Return the extracted data in JSON format.

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
