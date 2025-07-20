
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DollarSign, Home as HomeIcon, LayoutGrid, Package, Users, CreditCard, ShoppingCart, BarChart, Pill, Download } from "lucide-react";
import { useEffect, useState } from "react";
import type { DashboardData } from "./dashboard/types";
import StatCard from "@/components/dashboard/StatCard";
import OverviewChart from "@/components/dashboard/OverviewChart";
import AiSummary from "@/components/dashboard/AiSummary";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";

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
    { id: "SALE001", customer: "John Doe", date: "2024-07-20", amount: "$15.50", status: "Paid" },
    { id: "SALE002", customer: "Jane Smith", date: "2024-07-20", amount: "$42.00", status: "Paid" },
    { id: "SALE003", customer: "Robert Brown", date: "2024-07-19", amount: "$25.00", status: "Paid" },
    { id: "SALE004", customer: "Emily White", date: "2024-07-19", amount: "$8.75", status: "Pending" },
    { id: "SALE005", customer: "Michael Green", date: "2024-07-18", amount: "$112.30", status: "Paid" },
];


export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  const dashboardData: DashboardData = {
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

  useEffect(() => {
    setData(generateData());
  }, []);

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
                  <SidebarMenuButton onClick={() => setActiveTab("dashboard")} isActive={activeTab === "dashboard"} tooltip="Dashboard">
                    <HomeIcon />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveTab("sales")} isActive={activeTab === "sales"} tooltip="Sales">
                    <ShoppingCart />
                    <span>Sales</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveTab("inventory")} isActive={activeTab === "inventory"} tooltip="Inventory">
                    <Package />
                    <span>Inventory</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveTab("reports")} isActive={activeTab === "reports"} tooltip="Reports">
                    <BarChart />
                    <span>Reports</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton href="#" tooltip="Admin">
                    <Users />
                    <span>Admin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
      </Sidebar>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger className="sm:hidden" />
           <h1 className="text-xl font-semibold">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
           </h1>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="dashboard">
                <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
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
                  <div className="grid gap-4 md:gap-8 grid-cols-1">
                      <div className="col-span-1">
                          <OverviewChart data={data} />
                      </div>
                      <div className="col-span-1">
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
                                    <TableHead>ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {salesData.map((sale) => (
                                    <TableRow key={sale.id}>
                                        <TableCell className="font-medium">{sale.id}</TableCell>
                                        <TableCell>{sale.customer}</TableCell>
                                        <TableCell>{sale.date}</TableCell>
                                        <TableCell>{sale.amount}</TableCell>
                                        <TableCell>
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
              <TabsContent value="inventory">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Medicine</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inventoryData.map((item) => (
                            <TableRow key={item.name}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                    <Badge variant={item.status === 'In Stock' ? 'default' : item.status === 'Low Stock' ? 'secondary' : 'destructive'}>
                                        {item.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
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
