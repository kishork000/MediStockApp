'use server';
/**
 * @fileOverview A flow for generating a dashboard summary.
 *
 * - summarizeDashboard - A function that generates a summary for dashboard data.
 * - DashboardDataSchema - The input type for the summarizeDashboard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const DashboardDataSchema = z.object({
  totalRevenue: z.string().describe('The total revenue.'),
  revenueChange: z.string().describe('The change in revenue from the previous period.'),
  subscriptions: z.string().describe('The number of new subscriptions.'),
  subscriptionsChange: z.string().describe('The change in subscriptions from the previous period.'),
  sales: z.string().describe('The number of sales.'),
  salesChange: z.string().describe('The change in sales from the previous period.'),
  stockAvailability: z.string().describe('The current stock availability.'),
  stockChange: z.string().describe('The change in stock from the previous period.'),
  overview: z.array(z.object({
    name: z.string(),
    total: z.number(),
  })).describe('An array of monthly overview data.'),
});
export type DashboardData = z.infer<typeof DashboardDataSchema>;

const prompt = ai.definePrompt({
  name: 'dashboardSummaryPrompt',
  input: {schema: DashboardDataSchema},
  output: {schema: z.string()},
  prompt: `You are a business analyst. Summarize the following dashboard data in a short, easy-to-read paragraph. Highlight the most important changes and trends.

Total Revenue: {{{totalRevenue}}} ({{{revenueChange}}})
Subscriptions: {{{subscriptions}}} ({{{subscriptionsChange}}})
Sales: {{{sales}}} ({{{salesChange}}})
Stock Availability: {{{stockAvailability}}} ({{{stockChange}}})

Monthly Overview Data:
{{#each overview}}
- {{name}}: \${{total}}
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
