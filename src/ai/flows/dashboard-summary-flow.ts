
'use server';
/**
 * @fileOverview A flow for generating a dashboard summary.
 *
 * - summarizeDashboard - A function that generates a summary for dashboard data.
 */

import {ai} from '@/ai/genkit';
import {DashboardData, DashboardDataSchema} from '@/app/dashboard/types';
import {z} from 'zod';

const prompt = ai.definePrompt({
  name: 'dashboardSummaryPrompt',
  input: {schema: DashboardDataSchema},
  output: {schema: z.string()},
  prompt: `You are a business analyst. Your task is to summarize the following dashboard data into a concise, easy-to-read paragraph. 
Focus on highlighting the most important changes and trends in revenue, sales, and stock. 
Always provide a textual summary, even if the data seems unremarkable.

Here is the data:
Total Revenue: {{{totalRevenue}}} (change: {{{revenueChange}}})
Total Sales: {{{sales}}} (change: {{{salesChange}}})
New Prescriptions: {{{subscriptions}}} (change: {{{subscriptionsChange}}})
Stock Availability: {{{stockAvailability}}} (change: {{{stockChange}}})

Monthly Sales Figures:
{{#each overview}}
- {{this.name}}: {{this.total}}
{{/each}}

Please provide your summary now.`,
});

const summarizeDashboardFlow = ai.defineFlow(
  {
    name: 'summarizeDashboardFlow',
    inputSchema: DashboardDataSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const {output} = await prompt(input);
    // Ensure we always return a string, providing a fallback if the model returns null/undefined.
    return (
      output || 'AI summary could not be generated at this time. Please try again.'
    );
  }
);

export async function summarizeDashboard(input: DashboardData): Promise<string> {
  return await summarizeDashboardFlow(input);
}
