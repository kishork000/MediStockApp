
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
import { DollarSign, Home as HomeIcon, LayoutGrid, Package, Users, CreditCard, ShoppingCart, BarChart, Pill, Download, PlusSquare, Users2, Activity, Settings, GitBranch, LogOut, TrendingUp, Warehouse } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
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

const generateData = (factor = 1) => [
  { name: "Jan", total: Math.floor(Math.random() * 5000 * factor) + 1000 },
  { name: "Feb", total: Math.floor(Math.random() * 5000 * factor) + 1000 },
  { name: "Mar", total: Math.floor(Math.random() * 5000 * factor) + 1000 },
  { name: "Apr", total: Math.floor(Math.random() * 5000 * factor) + 1000 },
  { name: "May", total: Math.floor(Math.random() * 5000 * factor) + 1000 },
  { name: "Jun", total: Math.floor(Math.random() * 5000 * factor) + 1000 },
  { name: "Jul", total: Math.floor(Math.random() * 5000 * factor) + 1000 },
  { name: "Aug", total: Math.floor(Math.random() * 5000 * factor) + 1000 },
  { name: "Sep", total: Math.floor(Math.random() * 5000 * factor) + 1000 },
  { name: "Oct", total: Math.floor(Math.random() * 5000 * factor) + 1000 },
  { name: "Nov", total: Math.floor(Math.random() * 5000 * factor) + 1000 },
  { name: "Dec", total: Math.floor(Math.random() * 5000 * factor) + 1000 },
];

const companyWideData: DashboardData = {
    totalRevenue: "₹3,45,231.89",
    revenueChange: "+20.1% from last month",
    sales: "+12,234",
    salesChange: "+19% from last month",
    stockAvailability: "8,340",
    stockChange: "+5% from yesterday",
    subscriptions: "+2350",
    subscriptionsChange: "+180.1% from last month",
    overview: generateData(),
};

const downtownPharmacyData: DashboardData = {
    totalRevenue: "₹1,12,890.45",
    revenueChange: "+15.2% from last month",
    sales: "+4,812",
    salesChange: "+22% from last month",
    stockAvailability: "1,450",
    stockChange: "-2% from yesterday",
    subscriptions: "+980",
    subscriptionsChange: "+150% from last month",
    overview: generateData(0.4),
};

const uptownHealthData: DashboardData = {
    totalRevenue: "₹98,540.10",
    revenueChange: "+25.8% from last month",
    sales: "+3,990",
    salesChange: "+15% from last month",
    stockAvailability: "1,820",
    stockChange: "+8% from yesterday",
    subscriptions: "+750",
    subscriptionsChange: "+210% from last month",
    overview: generateData(0.3),
};

const getDashboardData = (user: { role: string, assignedStore?: string } | null): DashboardData => {
    if (!user) return companyWideData;
    if (user.role === 'Admin') return companyWideData;
    if (user.assignedStore === 'STR002') return downtownPharmacyData;
    if (user.assignedStore === 'STR003') return uptownHealthData;
    return companyWideData; // Default to company wide
};


const salesData = [
    { id: "SALE001", customer: "John Doe", date: "2024-07-20", amount: "₹1245.50", status: "Paid" },
    { id: "SALE002", customer: "Jane Smith", date: "2024-07-20", amount: "₹3360.00", status: "Paid" },
    { id: "SALE003", customer: "Robert Brown", date: "2024-07-19", amount: "₹2000.00", status: "Paid" },
    { id: "SALE004", customer: "Emily White", date: "2024-07-19", amount: "₹700.75", status: "Pending" },
    { id: "SALE005", customer: "Michael Green", date: "2024-07-18", amount: "₹8984.30", status: "Paid" },
];


export default function Home() {
  const { user, logout, loading, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const sidebarRoutes = useMemo(() => {
    return allAppRoutes.filter(route => route.path !== '/');
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const dashboardData = useMemo(() => getDashboardData(user), [user]);
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
        case 'Sales Reports': return <BarChart />;
        case 'Warehouse Stock': return <Warehouse />;
        case 'Store Stock': return <Package />;
        case 'Add Medicine': return <PlusSquare />;
        case 'Stock Transfer': return <GitBranch />;
        case 'Inventory Reports': return <BarChart />;
        case 'Valuation Report': return <TrendingUp />;
        case 'Diseases': return <Activity />;
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
                {hasPermission('/') && (
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/" tooltip="Dashboard" isActive={pathname === '/'}>
                            <HomeIcon />
                            <span>Dashboard</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
                
                {sidebarRoutes.filter(r => !r.path.startsWith('/inventory/') && r.inSidebar && hasPermission(r.path)).map((route) => (
                    <SidebarMenuItem key={route.path}>
                        <SidebarMenuButton href={route.path} tooltip={route.name} isActive={pathname === route.path}>
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
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger className="sm:hidden" />
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
                  </div>
                  <div className="grid gap-4 md:gap-8 lg:grid-cols-2 lg:col-span-2">
                      <div className="lg:col-span-1">
                          <OverviewChart data={dashboardData.overview} />
                      </div>
                      <div className="lg:col-span-1">
                          <AiSummary dashboardData={dashboardData} />
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
                                        <TableHead className="hidden sm:table-cell">ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="hidden md:table-cell">Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {salesData.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell className="hidden sm:table-cell font-medium">{sale.id}</TableCell>
                                            <TableCell>{sale.customer}</TableCell>
                                            <TableCell className="hidden md:table-cell">{sale.date}</TableCell>
                                            <TableCell className="text-right">{sale.amount}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={sale.status === 'Paid' ? 'default' : 'secondary'}>
                                                    {sale.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
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
                          <Link href="/sales/reports">
                           <Download className="mr-2 h-4 w-4" />
                           View Sales Report
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
