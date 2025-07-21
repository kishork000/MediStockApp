
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
  prompt: `You are a business analyst. Summarize the following dashboard data in a short, easy-to-read paragraph. Highlight the most important changes and trends.

Total Revenue: {{{totalRevenue}}} ({{{revenueChange}}})
Total Sales: {{{sales}}} ({{{salesChange}}})
New Prescriptions: {{{subscriptions}}} ({{{subscriptionsChange}}})
Stock Availability: {{{stockAvailability}}} ({{{stockChange}}})

Monthly Sales Overview:
{{#each overview}}
- {{this.name}}: {{{this.total}}}
{{/each}}
`,
});

const summarizeDashboardFlow = ai.defineFlow(
  {
    name: 'summarizeDashboardFlow',
    inputSchema: DashboardDataSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function summarizeDashboard(input: DashboardData): Promise<string> {
  return await summarizeDashboardFlow(input);
}
