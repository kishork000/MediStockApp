
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
import { DollarSign, Home as HomeIcon, LayoutGrid, Package, Users, CreditCard, ShoppingCart, BarChart, Pill, Download, PlusSquare, Users2, Activity, Settings, GitBranch, LogOut } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import type { DashboardData } from "./dashboard/types";
import StatCard from "@/components/dashboard/StatCard";
import OverviewChart from "@/components/dashboard/OverviewChart";
import AiSummary from "@/components/dashboard/AiSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { allAppRoutes, AppRoute } from "@/lib/types";

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

const inventoryData = [
    { name: "Aspirin", quantity: 150, status: "In Stock" },
    { name: "Ibuprofen", quantity: 200, status: "In Stock" },
    { name: "Paracetamol", quantity: 45, status: "Low Stock" },
    { name: "Amoxicillin", quantity: 80, status: "In Stock" },
    { name: "Lisinopril", quantity: 120, status: "In Stock" },
    { name: "Metformin", quantity: 0, status: "Out of Stock" },
    { name: "Atorvastatin", quantity: 90, status: "In Stock" },
];

const salesData = [
    { id: "SALE001", customer: "John Doe", date: "2024-07-20", amount: "₹1245.50", status: "Paid" },
    { id: "SALE002", customer: "Jane Smith", date: "2024-07-20", amount: "₹3360.00", status: "Paid" },
    { id: "SALE003", customer: "Robert Brown", date: "2024-07-19", amount: "₹2000.00", status: "Paid" },
    { id: "SALE004", customer: "Emily White", date: "2024-07-19", amount: "₹700.75", status: "Pending" },
    { id: "SALE005", customer: "Michael Green", date: "2024-07-18", amount: "₹8984.30", status: "Paid" },
];


export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, logout, loading, hasPermission } = useAuth();
  const router = useRouter();

  const sidebarRoutes = useMemo(() => {
    return allAppRoutes.filter(route => hasPermission(route.path));
  }, [hasPermission]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  const dashboardData: DashboardData = {
    totalRevenue: "₹3,45,231.89",
    revenueChange: "+20.1% from last month",
    subscriptions: "+2350",
    subscriptionsChange: "+180.1% from last month",
    sales: "+12,234",
    salesChange: "+19% from last month",
    stockAvailability: "8,340",
    stockChange: "+5% from yesterday",
    overview: data,
  }

  useEffect(() => {
    setData(generateData());
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  }

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
        case 'Inventory': return <Package />;
        case 'Add Medicine': return <PlusSquare />;
        case 'Stock Transfer': return <GitBranch />;
        case 'Diseases': return <Activity />;
        case 'Reports': return <BarChart />;
        case 'Admin': return <Settings />;
        default: return <LayoutGrid />;
    }
  };


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
               <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => handleTabChange("dashboard")} isActive={activeTab === "dashboard"} tooltip="Dashboard">
                    <HomeIcon />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {sidebarRoutes.map((route) => {
                  if (route.path === '/') return null; // handled separately
                  if (route.inSidebar) {
                    return (
                       <SidebarMenuItem key={route.path}>
                          <SidebarMenuButton href={route.path} tooltip={route.name}>
                              {getIcon(route.name)}
                              <span>{route.name}</span>
                          </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  }
                  return null;
                })}
                 <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => handleTabChange("inventory")} isActive={activeTab === "inventory"} tooltip="Inventory">
                    <Package />
                    <span>Inventory</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => handleTabChange("reports")} isActive={activeTab === "reports"} tooltip="Reports">
                    <BarChart />
                    <span>Reports</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger className="sm:hidden" />
           <div className="flex w-full items-center justify-between">
                <h1 className="text-xl font-semibold">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h1>
                <div className="sm:hidden">
                    <Tabs value={activeTab} onValueChange={handleTabChange}>
                        <TabsList>
                            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                            <TabsTrigger value="inventory">Inventory</TabsTrigger>
                            <TabsTrigger value="reports">Reports</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="hidden sm:block">
                    <TabsList>
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="inventory">Inventory</TabsTrigger>
                        <TabsTrigger value="reports">Reports</TabsTrigger>
                    </TabsList>
                </div>
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
                          <OverviewChart data={data} />
                      </div>
                      <div className="lg:col-span-1">
                          <AiSummary dashboardData={dashboardData} />
                      </div>
                  </div>
                   <div className="lg:col-span-2">
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
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="inventory">
                <Card>
                  <CardHeader>
                    <CardTitle>Inventory</CardTitle>
                    <CardDescription>Manage your medicine inventory in the main warehouse.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Medicine</TableHead>
                                <TableHead className="text-right">Stock</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {inventoryData.map((item) => (
                                <TableRow key={item.name}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={item.status === 'In Stock' ? 'default' : item.status === 'Low Stock' ? 'secondary' : 'destructive'}>
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                <DropdownMenuItem>Restock</DropdownMenuItem>
                                                <DropdownMenuItem>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
                       <Button variant="outline">
                           <Download className="mr-2 h-4 w-4" />
                           Download Sales Report
                       </Button>
                       <Button variant="outline">
                           <Download className="mr-2 h-4 w-4" />
                           Download Inventory Report
                       </Button>
                       <Button variant="outline">
                           <Download className="mr-2 h-4 w-4" />
                           Download Financial Summary
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

    