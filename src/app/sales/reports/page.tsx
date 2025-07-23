
"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, Filter, Download, ArrowLeft, Pill, Building, Undo, BarChart2, Edit, HeartCrack } from "lucide-react";
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
import { isWithinInterval, parseISO, startOfDay, endOfDay, format } from "date-fns";
import { SalesByPharmacistChart } from "@/components/sales/SalesByPharmacistChart";
import { TopSellingMedicinesChart } from "@/components/sales/TopSellingMedicinesChart";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sale, SaleItem, getSales } from "@/services/sales-service";
import { useToast } from "@/hooks/use-toast";

const allStores = [
    { id: "all", name: "All Stores", storeId: "all" },
    { id: "STR002", name: "Downtown Pharmacy", storeId: "STR002" },
    { id: "STR003", name: "Uptown Health", storeId: "STR003" },
];

const salesOverTimeChartConfig = {
  total: {
    label: "Total Sales",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const highSellingChartConfig = {
  quantity: {
    label: "Quantity",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const pharmacistSalesChartConfig = {
  salesValue: {
    label: "Sales Value",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function SalesReportPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [pharmacists, setPharmacists] = useState<{id: string, name: string}[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    
    const initialFilters: {
        store: string;
        pharmacist: string;
        dateRange: DateRange | undefined;
    } = {
        store: "all",
        pharmacist: "all",
        dateRange: undefined,
    };
    
    const [activeFilters, setActiveFilters] = useState(initialFilters);
    const filtersRef = useRef(initialFilters);

    const [isSalesDetailModalOpen, setIsSalesDetailModalOpen] = useState(false);
    const [modalView, setModalView] = useState('summary');

    const availableStores = useMemo(() => {
        if (user?.role === 'Admin') {
            return allStores;
        }
        if (user?.role === 'Pharmacist' && user.assignedStore) {
            return allStores.filter(s => s.storeId === user.assignedStore || s.storeId === 'all');
        }
        return [];
    }, [user]);

    const fetchReportData = useCallback(async () => {
        try {
            const salesData = await getSales();
            setAllSales(salesData);
            setFilteredData(salesData.flatMap(s => s.items.map(i => ({...i, ...s}))));
            
            const uniquePharmacists = [...new Set(salesData.map(s => s.soldBy))];
            setPharmacists([
                { id: 'all', name: 'All Pharmacists' },
                ...uniquePharmacists.map(p => ({ id: p, name: p }))
            ]);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load sales data.' });
        }
    }, [toast]);

    useEffect(() => {
        if (user) {
            fetchReportData();
        }
    }, [user, fetchReportData]);

    
    const handleApplyFilters = () => {
        let salesToFilter = [...allSales];
        const currentFilters = filtersRef.current;
        setActiveFilters(currentFilters);

        if (currentFilters.store !== "all") {
             salesToFilter = salesToFilter.filter(sale => sale.storeId === currentFilters.store);
        }

        if (currentFilters.pharmacist !== "all") {
            salesToFilter = salesToFilter.filter(sale => sale.soldBy === currentFilters.pharmacist);
        }

        if (currentFilters.dateRange?.from && currentFilters.dateRange?.to) {
            const fromDate = startOfDay(currentFilters.dateRange.from);
            const toDate = endOfDay(currentFilters.dateRange.to);
            salesToFilter = salesToFilter.filter(sale => {
                const saleDate = parseISO(sale.createdAt);
                return saleDate >= fromDate && saleDate  < toDate;
            });
        }
        
        const reportItems = salesToFilter.flatMap(sale => 
            sale.items.map(item => ({
                ...item,
                invoiceId: sale.invoiceId,
                date: sale.createdAt,
                patientName: sale.patientName,
                patientMobile: sale.patientMobile,
                storeName: sale.storeName,
                soldBy: sale.soldBy,
                paymentMethod: sale.paymentMethod,
                total: item.quantity * item.price
            }))
        );

        setFilteredData(reportItems);
    };

    const handleResetFilters = () => {
        filtersRef.current = initialFilters;
        handleApplyFilters();
    };
    
    // Apply filters on initial load and when user changes
    useEffect(() => {
        if (user?.role === 'Pharmacist' && user.assignedStore) {
            filtersRef.current.store = user.assignedStore;
        } else if (user?.role === 'Admin') {
            filtersRef.current.store = 'all';
        }
        handleApplyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, allSales]);


    const analytics = useMemo(() => {
        const totalSalesValue = filteredData.reduce((acc, sale) => acc + sale.total, 0);
        const cashSalesValue = filteredData.filter(s => s.paymentMethod === 'Cash').reduce((acc, sale) => acc + sale.total, 0);
        const onlineSalesValue = filteredData.filter(s => s.paymentMethod === 'Online').reduce((acc, sale) => acc + sale.total, 0);
        
        const totalItemsSold = filteredData.reduce((acc, sale) => acc + sale.quantity, 0);
        const cashInvoices = [...new Set(filteredData.filter(s => s.paymentMethod === 'Cash').map(s => s.invoiceId))]
            .map(id => filteredData.find(s => s.invoiceId === id))
            .filter(Boolean);
        
        const onlineInvoices = [...new Set(filteredData.filter(s => s.paymentMethod === 'Online').map(s => s.invoiceId))]
            .map(id => filteredData.find(s => s.invoiceId === id))
            .filter(Boolean);

        const highSellingMedicines = filteredData.reduce((acc: { name: string; quantity: number }[], sale: any) => {
            const existing = acc.find(item => item.name === sale.medicine);
            if (existing) {
                existing.quantity += sale.quantity;
            } else {
                acc.push({ name: sale.medicine, quantity: sale.quantity });
            }
            return acc;
        }, []).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

        const pharmacistSales = filteredData.reduce((acc: { name: string; salesValue: number }[], sale: any) => {
            const existing = acc.find(item => item.name === sale.soldBy);
            if (existing) {
                existing.salesValue += sale.total;
            } else {
                acc.push({ name: sale.soldBy, salesValue: sale.total });
            }
            return acc;
        }, []).sort((a, b) => b.salesValue - a.salesValue);
        
        const salesOverTime = filteredData.reduce((acc: { date: string; total: number }[], sale: any) => {
            const saleDate = format(parseISO(sale.date), "MMM dd");
            const existing = acc.find(item => item.date === saleDate);
            if (existing) {
                existing.total += sale.total;
            } else {
                acc.push({ date: saleDate, total: sale.total });
            }
            return acc;
        }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


        return { totalSalesValue, cashSalesValue, onlineSalesValue, totalItemsSold, highSellingMedicines, pharmacistSales, salesOverTime, cashInvoices, onlineInvoices };

    }, [filteredData]);


    const sidebarRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path !== '/');
    }, []);

    const stockManagementRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path.startsWith('/inventory/') && route.inSidebar);
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
            case 'Universal Report': return <BarChart2 />;
            case 'Profit & Loss Report': return <TrendingUp />;
            case 'Sales Reports': return <BarChart />;
            case 'Warehouse Stock': return <Warehouse />;
            case 'Stock Ledger': return <BarChart2 />;
            case 'Store Stock': return <Package />;
            case 'Medicine Master': return <Pill />;
            case 'Manufacturer Master': return <Building />;
            case 'Add Stock': return <PlusSquare />;
            case 'Return to Manufacturer': return <Undo />;
            case 'Stock Transfer': return <GitBranch />;
            case 'Stock Adjustment': return <Edit />;
            case 'Damaged Stock': return <HeartCrack />;
            case 'Inventory Reports': return <BarChart />;
            case 'Valuation Report': return <TrendingUp />;
            case 'Diseases': return <Activity />;
            case 'Admin': return <Settings />;
            default: return <LayoutGrid />;
        }
    };

    const handleSalesCardClick = () => {
        setModalView('summary');
        setIsSalesDetailModalOpen(true);
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
                {hasPermission('/') && (
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/" tooltip="Dashboard" isActive={pathname === '/'}>
                            <HomeIcon />
                            <span>Dashboard</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
                {sidebarRoutes.filter(r => r.inSidebar && hasPermission(r.path) && !r.path.startsWith('/inventory/')).map((route) => {
                     const isParentRoute = sidebarRoutes.some(child => child.path.startsWith(route.path + '/') && child.path !== route.path);
                     const isActive = isParentRoute ? pathname.startsWith(route.path) : pathname === route.path;
                    return (
                    <SidebarMenuItem key={route.path}>
                        <SidebarMenuButton href={route.path} tooltip={route.name} isActive={isActive}>
                            {getIcon(route.name)}
                            <span>{route.name}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )})}

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
              <h1 className="text-xl font-semibold">Sales Reports</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Sales Performance</CardTitle>
                        <CardDescription>Analyze sales data with powerful filters.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-end gap-4">
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 flex-grow">
                                <div className="space-y-2">
                                    <Select 
                                        defaultValue={filtersRef.current.store}
                                        onValueChange={(v) => (filtersRef.current.store = v)}
                                        disabled={user?.role === 'Pharmacist'}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Store" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableStores.map(store => (
                                                <SelectItem key={store.id} value={store.storeId}>{store.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                     <Select defaultValue={filtersRef.current.pharmacist} onValueChange={(v) => (filtersRef.current.pharmacist = v)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Pharmacist" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {pharmacists.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <DateRangePicker onUpdate={(values) => (filtersRef.current.dateRange = values.range)} />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button onClick={handleApplyFilters}>Apply Filters</Button>
                                <Button onClick={handleResetFilters} variant="outline">Reset Filters</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="cursor-pointer hover:bg-muted" onClick={handleSalesCardClick}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sales Value</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{analytics.totalSalesValue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Click to see details</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Items Sold</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.totalItemsSold}</div>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales Over Time</CardTitle>
                            <CardDescription>Total sales value in the selected period.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px] w-full">
                           <ChartContainer config={salesOverTimeChartConfig}>
                               <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.salesOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                        <Tooltip content={<ChartTooltipContent formatter={(value) => `₹${Number(value).toFixed(2)}`} />} />
                                        <Area type="monotone" dataKey="total" stroke="var(--color-total)" fill="var(--color-total)" fillOpacity={0.3} />
                                    </AreaChart>
                               </ResponsiveContainer>
                           </ChartContainer>
                        </CardContent>
                    </Card>
                     <TopSellingMedicinesChart data={analytics.highSellingMedicines} config={highSellingChartConfig} />
                </div>
                 <SalesByPharmacistChart data={analytics.pharmacistSales} config={pharmacistSalesChartConfig} />
                 
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Detailed Sales Report</CardTitle>
                            <CardDescription>A log of all sales transactions within the filtered period.</CardDescription>
                        </div>
                         <Button size="sm" variant="outline"><Download className="mr-2" /> Download Report</Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice ID</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Pharmacist</TableHead>
                                    <TableHead>Medicine</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Total (₹)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map(sale => (
                                    <TableRow key={sale.invoiceId + sale.medicine}>
                                        <TableCell>{sale.invoiceId}</TableCell>
                                        <TableCell>{sale.patientName}</TableCell>
                                        <TableCell>{sale.soldBy}</TableCell>
                                        <TableCell>{sale.medicine}</TableCell>
                                        <TableCell className="text-right">{sale.quantity}</TableCell>
                                        <TableCell className="text-right">{sale.total.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </main>
      </div>
      <Dialog open={isSalesDetailModalOpen} onOpenChange={setIsSalesDetailModalOpen}>
        <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
                <DialogTitle>Sales Breakdown</DialogTitle>
                <DialogDescription>
                    Detailed view of cash and online sales for the selected period.
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Cash Sales Summary</CardTitle>
                        <CardDescription>Total: ₹{analytics.cashSalesValue.toFixed(2)} from {analytics.cashInvoices.length} invoices.</CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto">
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice ID</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead className="text-right">Amount (₹)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {analytics.cashInvoices.map((inv: any) => (
                                    <TableRow key={inv.invoiceId}>
                                        <TableCell>{inv.invoiceId}</TableCell>
                                        <TableCell>{inv.patientName}</TableCell>
                                        <TableCell className="text-right">{inv.total.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
                 <Card>
                     <CardHeader>
                        <CardTitle>Online Sales Summary</CardTitle>
                        <CardDescription>Total: ₹{analytics.onlineSalesValue.toFixed(2)} from {analytics.onlineInvoices.length} invoices.</CardDescription>
                    </CardHeader>
                     <CardContent className="max-h-96 overflow-y-auto">
                        <Table>
                             <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice ID</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead className="text-right">Amount (₹)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {analytics.onlineInvoices.map((inv: any) => (
                                    <TableRow key={inv.invoiceId}>
                                        <TableCell>{inv.invoiceId}</TableCell>
                                        <TableCell>{inv.patientName}</TableCell>
                                        <TableCell className="text-right">{inv.total.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
