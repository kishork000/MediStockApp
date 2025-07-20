
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
import { DollarSign, Home as HomeIcon, LayoutGrid, Package, Settings, Users, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import type { DashboardData } from "./dashboard/types";
import StatCard from "@/components/dashboard/StatCard";
import OverviewChart from "@/components/dashboard/OverviewChart";
import AiSummary from "@/components/dashboard/AiSummary";

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
          <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
             <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <StatCard 
                  title="Total Revenue"
                  value={dashboardData.totalRevenue}
                  change={dashboardData.revenueChange}
                  icon={DollarSign}
                />
                 <StatCard 
                  title="Subscriptions"
                  value={dashboardData.subscriptions}
                  change={dashboardData.subscriptionsChange}
                  icon={Users}
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
             </div>
             <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <div className="lg:col-span-2 xl:col-span-3">
                    <OverviewChart data={data} />
                </div>
                <div className="lg:col-span-2 xl:col-span-3">
                    <AiSummary dashboardData={dashboardData} />
                </div>
             </div>
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}
