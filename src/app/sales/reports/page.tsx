
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { DateRange } from "react-day-picker";
import { addDays, parseISO, startOfDay, endOfDay } from "date-fns";

const salesData = [
    { pharmacist: "Pharmacist One", store: "Downtown Pharmacy", medicine: "Aspirin", quantity: 5, total: 50.00, date: "2024-07-28" },
    { pharmacist: "Pharmacist One", store: "Downtown Pharmacy", medicine: "Paracetamol", quantity: 10, total: 57.50, date: "2024-07-28" },
    { pharmacist: "Pharmacist Two", store: "Uptown Health", medicine: "Ibuprofen", quantity: 8, total: 124.00, date: "2024-07-29" },
    { pharmacist: "Pharmacist One", store: "Downtown Pharmacy", medicine: "Aspirin", quantity: 3, total: 30.00, date: "2024-07-29" },
    { pharmacist: "Admin User", store: "Downtown Pharmacy", medicine: "Atorvastatin", quantity: 2, total: 90.00, date: "2024-07-30" },
    { pharmacist: "Pharmacist Two", store: "Uptown Health", medicine: "Metformin", quantity: 5, total: 125.00, date: "2024-07-30" },
];

const stores = [
    { id: "all", name: "All Stores" },
    { id: "Downtown Pharmacy", name: "Downtown Pharmacy" },
    { id: "Uptown Health", name: "Uptown Health" },
];

const pharmacists = [
    { id: "all", name: "All Pharmacists" },
    { id: "Pharmacist One", name: "Pharmacist One" },
    { id: "Pharmacist Two", name: "Pharmacist Two" },
    { id: "Admin User", name: "Admin User" },
];

export default function SalesReportPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [filteredData, setFilteredData] = useState(salesData);
    const [selectedStore, setSelectedStore] = useState("all");
    const [selectedPharmacist, setSelectedPharmacist] = useState("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: new Date(2024, 6, 20),
      to: addDays(new Date(), 0), // Set 'to' date to today
    });

    const handleApplyFilters = () => {
        let data = [...salesData];

        if (selectedStore !== "all") {
            data = data.filter(sale => sale.store === selectedStore);
        }

        if (selectedPharmacist !== "all") {
            data = data.filter(sale => sale.pharmacist === selectedPharmacist);
        }

        if (dateRange?.from && dateRange?.to) {
            const fromDate = startOfDay(dateRange.from);
            const toDate = endOfDay(dateRange.to);
            data = data.filter(sale => {
                const saleDate = parseISO(sale.date);
                return saleDate >= fromDate && saleDate <= toDate;
            });
        }
        
        setFilteredData(data);
    };
    
    // Apply filters on initial load
    useEffect(() => {
        handleApplyFilters();
    }, []);


    const analytics = useMemo(() => {
        const totalSalesValue = filteredData.reduce((acc, sale) => acc + sale.total, 0);
        const totalItemsSold = filteredData.reduce((acc, sale) => acc + sale.quantity, 0);

        const highSellingMedicines = filteredData.reduce((acc, sale) => {
            const existing = acc.find(item => item.name === sale.medicine);
            if (existing) {
                existing.quantity += sale.quantity;
            } else {
                acc.push({ name: sale.medicine, quantity: sale.quantity });
            }
            return acc;
        }, [] as { name: string; quantity: number; }[]).sort((a, b) => b.quantity - a.quantity).slice(0, 5); // show top 5

        const pharmacistSales = filteredData.reduce((acc, sale) => {
            const existing = acc.find(item => item.name === sale.pharmacist);
            if (existing) {
                existing.salesValue += sale.total;
            } else {
                acc.push({ name: sale.pharmacist, salesValue: sale.total });
            }
            return acc;
        }, [] as { name: string; salesValue: number; }[]).sort((a, b) => b.salesValue - a.salesValue);
        
        return { totalSalesValue, totalItemsSold, highSellingMedicines, pharmacistSales };

    }, [filteredData]);


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
    
    const stockManagementRoutes = sidebarRoutes.filter(r => r.path.startsWith('/inventory'));

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
                           <SidebarMenuItem>
                                <SidebarMenuButton className="justify-between">
                                    <div className="flex items-center gap-3">
                                        <Package />
                                        <span>Stock Management</span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                </SidebarMenuButton>
                            </SidebarMenuItem>
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
                 
                 <SidebarMenuItem>
                  <SidebarMenuButton href="/inventory/reports" tooltip="Reports">
                    <BarChart />
                    <span>Inventory Reports</span>
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
              <h1 className="text-xl font-semibold">Sales Reports & Analytics</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <CardTitle>Sales Performance</CardTitle>
                            <CardDescription>Analyze sales data with powerful filters.</CardDescription>
                        </div>
                         <div className="flex flex-wrap items-center gap-2">
                            <Select value={selectedStore} onValueChange={setSelectedStore}>
                                <SelectTrigger className="w-full sm:w-[160px]">
                                    <SelectValue placeholder="Select Store" />
                                </SelectTrigger>
                                <SelectContent>
                                    {stores.map(store => (
                                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <Select value={selectedPharmacist} onValueChange={setSelectedPharmacist}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Select Pharmacist" />
                                </SelectTrigger>
                                <SelectContent>
                                    {pharmacists.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <DateRangePicker date={dateRange} setDate={setDateRange} />
                            <Button onClick={handleApplyFilters}><Filter className="mr-2 h-4 w-4" /> Apply</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Sales Value</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{analytics.totalSalesValue.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Items Sold</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analytics.totalItemsSold}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>High-Selling Medicines</CardTitle>
                                    <CardDescription>Top medicines sold by quantity in the selected period.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Medicine</TableHead>
                                                <TableHead className="text-right">Quantity Sold</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analytics.highSellingMedicines.length > 0 ? analytics.highSellingMedicines.map((item) => (
                                                <TableRow key={item.name}>
                                                    <TableCell className="font-medium">{item.name}</TableCell>
                                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="text-center">No data available for this selection.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                        <div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pharmacist Performance</CardTitle>
                                    <CardDescription>Total sales value by each pharmacist in the selected period.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Pharmacist</TableHead>
                                                <TableHead className="text-right">Total Sales (₹)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analytics.pharmacistSales.length > 0 ? analytics.pharmacistSales.map((item) => (
                                                <TableRow key={item.name}>
                                                    <TableCell className="font-medium">{item.name}</TableCell>
                                                    <TableCell className="text-right">{item.salesValue.toFixed(2)}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="text-center">No data available for this selection.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                     <div className="mt-6 flex justify-end items-center">
                        <Button size="sm" variant="outline"><Download className="mr-2" /> Download Full Report</Button>
                    </div>
                </CardContent>
            </Card>
        </main>
      </div>
    </div>
  );

    

    