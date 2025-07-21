
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

interface SalesByPharmacistChartProps {
    data: { name: string; salesValue: number }[];
    config: ChartConfig;
}

export function SalesByPharmacistChart({ data, config }: SalesByPharmacistChartProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Pharmacist Performance</CardTitle>
                    <CardDescription>Total sales value by each pharmacist.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No data available for this selection.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pharmacist Performance</CardTitle>
                <CardDescription>Total sales value by each pharmacist in the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={config} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
                            <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                            <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={100} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                content={<ChartTooltipContent formatter={(value) => `₹${Number(value).toFixed(2)}`} />}
                            />
                            <Bar dataKey="salesValue" fill="var(--color-salesValue)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

    
