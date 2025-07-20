
"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { summarizeDashboard } from "@/ai/flows/dashboard-summary-flow";
import { DashboardData } from "@/app/dashboard/types";
import { Sparkles } from "lucide-react";

interface AiSummaryProps {
    dashboardData: DashboardData;
}

export default function AiSummary({ dashboardData }: AiSummaryProps) {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [summary, setSummary] = useState('');

    const handleGenerateSummary = () => {
        startTransition(async () => {
            try {
                const result = await summarizeDashboard(dashboardData);
                setSummary(result);
            } catch (e: any) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: e.message || 'There was an error generating the summary.',
                });
            }
        });
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>AI Summary</CardTitle>
                <Button onClick={handleGenerateSummary} disabled={isPending} size="sm">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                </Button>
            </CardHeader>
            <CardContent>
                {isPending && (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                )}
                {summary && !isPending && (
                    <p className="text-sm text-muted-foreground">{summary}</p>
                )}
                {!summary && !isPending && (
                    <p className="text-sm text-muted-foreground">Click "Generate" to get an AI-powered summary of your dashboard.</p>
                )}
            </CardContent>
        </Card>
    );
}
