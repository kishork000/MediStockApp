
"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, Download, TrendingUp, Filter, Pill, Building, Undo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { DateRange } from "react-day-picker";
import { addDays, isWithinInterval } from "date-fns";


const valuationData: any[] = [];

const allStores = [
    { id: "all", name: "All Locations" },
    { id: "STR001", name: "Main Warehouse" },
    { id: "STR002", name: "Downtown Pharmacy" },
    { id: "STR003", name: "Uptown Health" },
];


export default function ValuationReportPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [selectedStore, setSelectedStore] = useState("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const availableStores = useMemo(() => {
        if (user?.role === 'Admin') {
            return allStores;
        }
        if (user?.role === 'Pharmacist' && user.assignedStore) {
            return allStores.filter(s => s.id === user.assignedStore);
        }
        return [];
    }, [user]);

    useEffect(() => {
        if (user?.role === 'Pharmacist' && availableStores.length > 0) {
            setSelectedStore(availableStores[0].id);
        } else if (user?.role === 'Admin') {
            setSelectedStore('all');
        }
    }, [user, availableStores]);


    const filteredValuationData = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return valuationData;
        // In a real app, filtering would also apply to the selected store.
        return valuationData.filter(item => isWithinInterval(item.date, { start: dateRange.from!, end: dateRange.to! }));
    }, [dateRange]);


    const sidebarRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path !== '/');
    }, []);

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
            case 'Medicine Master': return <Pill />;
            case 'Manufacturer Master': return <Building />;
            case 'Add Stock': return <PlusSquare />;
            case 'Return to Manufacturer': return <Undo />;
            case 'Stock Transfer': return <GitBranch />;
            case 'Inventory Reports': return <BarChart />;
            case 'Valuation Report': return <TrendingUp />;
            case 'Diseases': return <Activity />;
            case 'Admin': return <Settings />;
            default: return <LayoutGrid />;
        }
    };
    
    const stockManagementRoutes = sidebarRoutes.filter(r => r.path.startsWith('/inventory/') && r.inSidebar);
    const totalValuation = filteredValuationData.reduce((acc, item) => acc + (item.balance * item.price), 0);

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
                        <SidebarMenuButton href="/" tooltip="Dashboard">
                            <HomeIcon />
                            <span>Dashboard</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
                
                {sidebarRoutes.filter(r => !r.path.startsWith('/inventory/') && r.inSidebar && hasPermission(r.path) && r.path !== '/admin').map((route) => (
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
                 {hasPermission('/admin') && (
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/admin" tooltip="Admin" isActive={pathname === '/admin'}>
                            {getIcon('Admin')}
                            <span>Admin</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
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
              <h1 className="text-xl font-semibold">Stock Valuation Report</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <CardTitle>Inventory Valuation</CardTitle>
                            <CardDescription>Detailed report of stock movement and valuation.</CardDescription>
                        </div>
                         <div className="flex flex-wrap items-center gap-4">
                            <Select 
                                value={selectedStore} 
                                onValueChange={setSelectedStore}
                                disabled={user?.role === 'Pharmacist' && availableStores.length === 1}
                            >
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Select Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableStores.map(store => (
                                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <DateRangePicker onUpdate={(values) => setDateRange(values.range)} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[200px]">Medicine</TableHead>
                                    <TableHead className="text-right">Opening Stock</TableHead>
                                    <TableHead className="text-right">Received</TableHead>
                                    <TableHead className="text-right">Sales</TableHead>
                                    <TableHead className="text-right font-semibold">Balance Stock</TableHead>
                                    <TableHead className="text-right font-bold">Valuation (₹)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredValuationData.length > 0 ? filteredValuationData.map((item, index) => (
                                    <TableRow key={`${item.medicine}-${index}`}>
                                        <TableCell className="font-medium">{item.medicine}</TableCell>
                                        <TableCell className="text-right">{item.opening}</TableCell>
                                        <TableCell className="text-right">{item.received}</TableCell>
                                        <TableCell className="text-right">{item.sales}</TableCell>
                                        <TableCell className="text-right font-semibold">{item.balance}</TableCell>
                                        <TableCell className="text-right font-bold">{(item.balance * item.price).toFixed(2)}</TableCell>
                                    </TableRow>
                                )) : (
                                  <TableRow><TableCell colSpan={6} className="h-24 text-center">No data to display.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="mt-6 flex justify-between items-center">
                        <Button size="sm" variant="outline"><Download className="mr-2" /> Download Report</Button>
                        <div className="text-right">
                            <p className="text-lg font-bold">Total Stock Valuation: ₹{totalValuation.toFixed(2)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
      </div>
    </div>
  );
}
