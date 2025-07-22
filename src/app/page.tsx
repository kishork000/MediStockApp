
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { DollarSign, Home as HomeIcon, LayoutGrid, Package, Users, CreditCard, ShoppingCart, BarChart, Pill, Download, PlusSquare, Users2, Activity, Settings, GitBranch, LogOut, TrendingUp, Warehouse, BookOpen } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { DashboardData } from "./dashboard/types";
import StatCard from "@/components/dashboard/StatCard";
import OverviewChart from "@/components/dashboard/OverviewChart";
import AiSummary from "@/components/dashboard/AiSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes, AppRoute } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Building, Undo } from "lucide-react";
import StockAlerts from "@/components/dashboard/StockAlerts";
import { getSales, Sale } from "@/services/sales-service";
import { getAvailableStockForLocation, InventoryItem } from "@/services/inventory-service";
import { format, parseISO, subMonths } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";


const emptyDashboardData: DashboardData = {
    totalRevenue: "₹0.00",
    revenueChange: " ",
    sales: "0",
    salesChange: " ",
    stockAvailability: "0",
    stockChange: " ",
    subscriptions: "0",
    subscriptionsChange: " ",
    overview: [],
};


export default function Home() {
  const { user, logout, loading, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [dashboardData, setDashboardData] = useState<DashboardData>(emptyDashboardData);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const sidebarRoutes = useMemo(() => {
    return allAppRoutes.filter(route => route.path !== '/');
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);

    try {
        const [sales, warehouseStock, downtownStock, uptownStock] = await Promise.all([
            getSales(),
            getAvailableStockForLocation('warehouse'),
            getAvailableStockForLocation('STR002'),
            getAvailableStockForLocation('STR003'),
        ]);

        // Filter sales based on user role and assigned store
        const userSales = user.role === 'Admin'
            ? sales
            : sales.filter(s => s.storeId === user.assignedStore);

        // Calculate metrics
        const totalRevenue = userSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
        const salesCount = userSales.length;

        const allStock = [...warehouseStock, ...downtownStock, ...uptownStock];
        const totalStock = allStock.reduce((sum, item) => sum + item.quantity, 0);

        // Generate overview data for the chart (last 12 months)
        const overview = Array.from({ length: 12 }).map((_, i) => {
            const date = subMonths(new Date(), i);
            return {
                name: format(date, 'MMM'),
                total: 0,
            };
        }).reverse();

        userSales.forEach(sale => {
            const month = format(parseISO(sale.createdAt), 'MMM');
            const monthData = overview.find(d => d.name === month);
            if (monthData) {
                monthData.total += sale.grandTotal;
            }
        });
        
        setDashboardData({
            totalRevenue: `₹${totalRevenue.toFixed(2)}`,
            sales: salesCount.toString(),
            stockAvailability: totalStock.toString(),
            subscriptions: salesCount.toString(), // Using sales count as a proxy for prescriptions
            overview,
            // Note: "change" metrics are not implemented as they require historical data comparison
            revenueChange: " ",
            salesChange: " ",
            stockChange: " ",
            subscriptionsChange: " ",
        });
        
        setRecentSales(userSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));

    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
    } finally {
        setDataLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
      fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const dashboardTitle = useMemo(() => {
      if(user?.role === 'Admin') return 'Company Dashboard';
      if(user?.assignedStore === 'STR002') return 'Downtown Pharmacy Dashboard';
      if(user?.assignedStore === 'STR003') return 'Uptown Health Dashboard';
      return 'Dashboard'
  }, [user]);


  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  const getIcon = (name: string) => {
    switch (name) {
        case 'Dashboard': return <HomeIcon />;
        case 'Patients': return <Users2 />;
        case 'Sales': return <ShoppingCart />;
        case 'Universal Report': return <BarChart />;
        case 'Sales Reports': return <BarChart />;
        case 'Warehouse Stock': return <Warehouse />;
        case 'Store Stock': return <Package />;
        case 'Medicine Master': return <Pill />;
        case 'Manufacturer Master': return <Building />;
        case 'Add Stock': return <PlusSquare />;
        case 'Return to Manufacturer': return <Undo />;
        case 'Stock Transfer': return <GitBranch />;
        case 'Inventory Reports': return <BarChart />;
        case 'Valuation Report': return <TrendingUp />;
        case 'Diseases': return <Activity />;
        case 'Documentation': return <BookOpen />;
        case 'Admin': return <Settings />;
        default: return <LayoutGrid />;
    }
  };

  const stockManagementRoutes = sidebarRoutes.filter(r => r.path.startsWith('/inventory/') && r.inSidebar);


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Sidebar>
          <SidebarHeader>
            <SidebarMenuButton className="pointer-events-none">
              <LayoutGrid className="size-6" />
              <span className="text-lg font-semibold">MediStock</span>
            </SidebarMenuButton>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
                {sidebarRoutes.filter(r => r.inSidebar && hasPermission(r.path) && !r.path.startsWith('/inventory/')).map((route) => (
                    <SidebarMenuItem key={route.path}>
                        <SidebarMenuButton href={route.path} tooltip={route.name} isActive={pathname.startsWith(route.path)}>
                            {getIcon(route.name)}
                            <span>{route.name}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}

                {hasPermission('/inventory') && (
                    <Collapsible className="w-full" defaultOpen={pathname.startsWith('/inventory')}>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton className="justify-between">
                                <div className="flex items-center gap-3">
                                    <Package />
                                    <span>Stock Management</span>
                                </div>
                                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <SidebarMenu className="ml-7 mt-2 border-l pl-3">
                                {stockManagementRoutes.filter(route => hasPermission(route.path)).map((route) => (
                                    <SidebarMenuItem key={route.path}>
                                        <SidebarMenuButton href={route.path} tooltip={route.name} size="sm" isActive={pathname === route.path}>
                                            {getIcon(route.name)}
                                            <span>{route.name}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </SidebarMenu>
          </SidebarContent>
           <SidebarFooter>
              <SidebarMenu>
                  <SidebarMenuItem>
                      <SidebarMenuButton onClick={logout} tooltip="Logout">
                          <LogOut />
                          <span>Logout</span>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
          </SidebarFooter>
      </Sidebar>
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger />
           <div className="flex w-full items-center justify-between">
                <h1 className="text-xl font-semibold">{dashboardTitle}</h1>
                <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs defaultValue="dashboard" className="w-full">
                <TabsList>
                    <TabsTrigger value="dashboard">Overview</TabsTrigger>
                    <TabsTrigger value="sales">Recent Sales</TabsTrigger>
                    <TabsTrigger value="reports">Generate Reports</TabsTrigger>
                </TabsList>
              <TabsContent value="dashboard">
                <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:grid-cols-2">
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:col-span-2">
                    {dataLoading ? Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-28" />) :
                        <>
                          <StatCard 
                            title="Total Revenue"
                            value={dashboardData.totalRevenue}
                            change={dashboardData.revenueChange}
                            icon={DollarSign}
                          />
                          <StatCard 
                            title="Sales"
                            value={dashboardData.sales}
                            change={dashboardData.salesChange}
                            icon={CreditCard}
                          />
                          <StatCard 
                            title="Stock Availability"
                            value={dashboardData.stockAvailability}
                            change={dashboardData.stockChange}
                            icon={Package}
                          />
                          <StatCard 
                            title="New Prescriptions"
                            value={dashboardData.subscriptions}
                            change={dashboardData.subscriptionsChange}
                            icon={Pill}
                          />
                        </>
                    }
                  </div>
                  <div className="grid gap-4 md:gap-8 lg:grid-cols-2 lg:col-span-2">
                      <div className="lg:col-span-1">
                          {dataLoading ? <Skeleton className="h-[438px]" /> : <OverviewChart data={dashboardData.overview} />}
                      </div>
                      <div className="space-y-4 lg:col-span-1">
                          <AiSummary dashboardData={dashboardData} />
                          <StockAlerts />
                      </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="sales">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Sales</CardTitle>
                            <CardDescription>A list of the most recent transactions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="hidden sm:table-cell">Invoice ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="hidden md:table-cell">Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataLoading ? Array.from({length: 5}).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-5" /></TableCell></TableRow>) :
                                     recentSales.length > 0 ? recentSales.map((sale) => (
                                        <TableRow key={sale.invoiceId}>
                                            <TableCell className="hidden sm:table-cell font-medium">{sale.invoiceId}</TableCell>
                                            <TableCell>{sale.patientName}</TableCell>
                                            <TableCell className="hidden md:table-cell">{format(parseISO(sale.createdAt), "PPP")}</TableCell>
                                            <TableCell className="text-right">₹{sale.grandTotal.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={sale.paymentMethod === 'Cash' ? 'default' : 'secondary'}>
                                                    {sale.paymentMethod}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                      <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">No recent sales data available.</TableCell>
                                      </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
              </TabsContent>
               <TabsContent value="reports">
                <Card>
                    <CardHeader>
                        <CardTitle>Generate Reports</CardTitle>
                        <CardDescription>Download detailed reports for sales, inventory, and finances.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                       <Button variant="outline" asChild>
                          <Link href="/reports">
                           <Download className="mr-2 h-4 w-4" />
                           View Universal Report
                          </Link>
                       </Button>
                       <Button variant="outline" asChild>
                           <Link href="/inventory/reports">
                             <Download className="mr-2 h-4 w-4" />
                             View Inventory Report
                           </Link>
                       </Button>
                       <Button variant="outline" asChild>
                           <Link href="/inventory/valuation">
                             <Download className="mr-2 h-4 w-4" />
                             View Valuation Report
                           </Link>
                       </Button>
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </main>
      </div>
    </div>
  );
}

    