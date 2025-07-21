
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';


interface TopSellingMedicinesChartProps {
    data: { name: string; quantity: number }[];
    config: ChartConfig;
}

export function TopSellingMedicinesChart({ data, config }: TopSellingMedicinesChartProps) {

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>High-Selling Medicines</CardTitle>
                    <CardDescription>Top medicines sold by quantity.</CardDescription>
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
                <CardTitle>High-Selling Medicines</CardTitle>
                <CardDescription>Top medicines sold by quantity in the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={config} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
                            <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis type="category" dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={100} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                content={<ChartTooltipContent />}
                            />
                            <Bar dataKey="quantity" fill="var(--color-quantity)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

    
