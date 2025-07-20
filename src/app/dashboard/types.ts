import {z} from 'zod';

export const DashboardDataSchema = z.object({
  totalRevenue: z.string().describe('The total revenue.'),
  revenueChange: z
    .string()
    .describe('The change in revenue from the previous period.'),
  subscriptions: z.string().describe('The number of new subscriptions.'),
  subscriptionsChange: z
    .string()
    .describe('The change in subscriptions from the previous period.'),
  sales: z.string().describe('The number of sales.'),
  salesChange: z.string().describe('The change in sales from the previous period.'),
  stockAvailability: z.string().describe('The current stock availability.'),
  stockChange: z
    .string()
    .describe('The change in stock from the previous period.'),
  overview: z
    .array(
      z.object({
        name: z.string(),
        total: z.number(),
      })
    )
    .describe('An array of monthly overview data.'),
});
export type DashboardData = z.infer<typeof DashboardDataSchema>;
