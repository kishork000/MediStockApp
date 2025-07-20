
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
import { DollarSign, Home as HomeIcon, LayoutGrid, Package, Settings, Users, CreditCard, ShoppingCart, FileText, BarChart } from "lucide-react";
import { useEffect, useState } from "react";
import type { DashboardData } from "./dashboard/types";
import StatCard from "@/components/dashboard/StatCard";
import OverviewChart from "@/components/dashboard/OverviewChart";
import AiSummary from "@/components/dashboard/AiSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          <div className="flex items-center gap-2">
            <LayoutGrid className="size-6" />
            <h1 className="text-lg font-semibold">MediStock</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" isActive>
                <HomeIcon />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#">
                <ShoppingCart />
                Sales
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#">
                <Package />
                Inventory
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#">
                <BarChart />
                Reports
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton href="#">
                <Users />
                Admin
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger className="sm:hidden" />
           <h1 className="text-xl font-semibold">MediStock Manager</h1>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs defaultValue="dashboard">
              <TabsList>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
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
                        title="Subscriptions"
                        value={dashboardData.subscriptions}
                        change={dashboardData.subscriptionsChange}
                        icon={Users}
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
                <p>Sales management will go here.</p>
              </TabsContent>
              <TabsContent value="inventory">
                <p>Inventory management will go here.</p>
              </TabsContent>
               <TabsContent value="reports">
                <p>Reports will go here.</p>
              </TabsContent>
            </Tabs>
        </main>
      </div>
    </div>
  );
}
