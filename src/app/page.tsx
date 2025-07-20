
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Home as HomeIcon, Settings, LayoutGrid, DollarSign, Users, CreditCard, Package, Sparkles } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { summarizeDashboard } from "@/ai/flows/dashboard-summary-flow";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const generateData = () => [
  { name: "Jan", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Feb", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Mar", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Apr", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "May", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Jun", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Jul", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Aug", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Sep", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Oct", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Nov", total: Math.floor(Math.random() * 5000) + 1000 },
  { name: "Dec", total: Math.floor(Math.random() * 5000) + 1000 },
];


export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState('');

  const dashboardData = {
    totalRevenue: "$45,231.89",
    revenueChange: "+20.1% from last month",
    subscriptions: "+2350",
    subscriptionsChange: "+180.1% from last month",
    sales: "+12,234",
    salesChange: "+19% from last month",
    stockAvailability: "8,340",
    stockChange: "+5% from yesterday",
    overview: data,
  }

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


  useEffect(() => {
    setData(generateData());
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <LayoutGrid className="size-6" />
            <h1 className="text-lg font-semibold">App Name</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" isActive>
                <HomeIcon />
                Home
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#">
                <Settings />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6">
           <SidebarTrigger className="md:hidden" />
           <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0">
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.totalRevenue}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.revenueChange}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Subscriptions
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.subscriptions}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.subscriptionsChange}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.sales}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.salesChange}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Availability</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.stockAvailability}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.stockChange}
                </p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2 lg:col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
             <Card className="md:col-span-2 lg:col-span-4">
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
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}
