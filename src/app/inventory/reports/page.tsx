
"use client";

import { useMemo, useEffect } from "react";
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";

const transferReportData = [
    { id: "TINV-2024-001", from: "Main Warehouse", to: "Downtown Pharmacy", date: "2024-07-28", items: 2, status: "Completed" },
    { id: "TINV-2024-002", from: "Main Warehouse", to: "Uptown Health", date: "2024-07-27", items: 5, status: "Completed" },
    { id: "CNR-2024-001", from: "Downtown Pharmacy", to: "Main Warehouse", date: "2024-07-26", items: 1, status: "Returned" },
];

const stockLevelData = [
    { medicine: "Aspirin", warehouse: 1500, downtown: 150, uptown: 120, total: 1770 },
    { medicine: "Ibuprofen", warehouse: 2000, downtown: 20, uptown: 50, total: 2070 },
    { medicine: "Paracetamol", warehouse: 450, downtown: 100, uptown: 80, total: 630 },
]

export default function StockReportsPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const sidebarRoutes = useMemo(() => {
        return allAppRoutes.filter(route => hasPermission(route.path) && route.path !== '/');
    }, [hasPermission]);

     useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

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
    
    const stockManagementRoutes = sidebarRoutes.filter(r => r.path.startsWith('/inventory') && r.inSidebar);

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
                  <SidebarMenuButton href="/" tooltip="Dashboard">
                    <HomeIcon />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {sidebarRoutes.filter(r => !r.path.startsWith('/inventory') && r.inSidebar).map((route) => (
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
                                {stockManagementRoutes.map((route) => (
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger className="sm:hidden" />
           <div className="flex w-full items-center justify-between">
              <h1 className="text-xl font-semibold">Inventory Reports</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs defaultValue="transfers">
                <TabsList>
                    <TabsTrigger value="transfers">Transfer &amp; Return History</TabsTrigger>
                    <TabsTrigger value="levels">Overall Stock Levels</TabsTrigger>
                </TabsList>
                <TabsContent value="transfers">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Transfer &amp; Return Report</CardTitle>
                                <CardDescription>History of all stock movements between warehouse and stores.</CardDescription>
                            </div>
                            <Button size="sm" variant="outline"><Download className="mr-2" /> Download Report</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice/CNR ID</TableHead>
                                        <TableHead>From</TableHead>
                                        <TableHead>To</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-center">No. of Items</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transferReportData.map((report) => (
                                        <TableRow key={report.id}>
                                            <TableCell className="font-medium">{report.id}</TableCell>
                                            <TableCell>{report.from}</TableCell>
                                            <TableCell>{report.to}</TableCell>
                                            <TableCell>{report.date}</TableCell>
                                            <TableCell className="text-center">{report.items}</TableCell>
                                            <TableCell className="text-right">{report.status}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="levels">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Overall Stock Levels</CardTitle>
                                <CardDescription>Aggregated stock counts across all locations.</CardDescription>
                            </div>
                            <Button size="sm" variant="outline"><Download className="mr-2" /> Download Report</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Medicine</TableHead>
                                        <TableHead className="text-right">Warehouse</TableHead>
                                        <TableHead className="text-right">Downtown Pharmacy</TableHead>
                                        <TableHead className="text-right">Uptown Health</TableHead>
                                        <TableHead className="text-right font-bold">Total Stock</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stockLevelData.map((item) => (
                                        <TableRow key={item.medicine}>
                                            <TableCell className="font-medium">{item.medicine}</TableCell>
                                            <TableCell className="text-right">{item.warehouse}</TableCell>
                                            <TableCell className="text-right">{item.downtown}</TableCell>
                                            <TableCell className="text-right">{item.uptown}</TableCell>
                                            <TableCell className="text-right font-bold">{item.total}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
      </div>
    </div>
  );
}
