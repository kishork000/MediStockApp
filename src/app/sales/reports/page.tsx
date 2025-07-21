
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, Filter, Download, ArrowLeft } from "lucide-react";
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
import { addDays, parseISO, startOfDay, endOfDay, format } from "date-fns";
import { SalesByPharmacistChart } from "@/components/sales/SalesByPharmacistChart";
import { TopSellingMedicinesChart } from "@/components/sales/TopSellingMedicinesChart";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const salesData = [
    { invoiceId: "SALE001", pharmacist: "Pharmacist One", store: "Downtown Pharmacy", medicine: "Aspirin", quantity: 5, total: 50.00, date: "2024-07-28", paymentMethod: "Cash", patientName: "Alice Johnson", storeId: "STR002" },
    { invoiceId: "SALE002", pharmacist: "Pharmacist One", store: "Downtown Pharmacy", medicine: "Paracetamol", quantity: 10, total: 57.50, date: "2024-07-28", paymentMethod: "Online", patientName: "Bob Williams", storeId: "STR002" },
    { invoiceId: "SALE003", pharmacist: "Pharmacist Two", store: "Uptown Health", medicine: "Ibuprofen", quantity: 8, total: 124.00, date: "2024-07-29", paymentMethod: "Cash", patientName: "Charlie Brown", storeId: "STR003" },
    { invoiceId: "SALE004", pharmacist: "Pharmacist One", store: "Downtown Pharmacy", medicine: "Aspirin", quantity: 3, total: 30.00, date: "2024-07-29", paymentMethod: "Cash", patientName: "Diana Miller", storeId: "STR002" },
    { invoiceId: "SALE005", pharmacist: "Admin User", store: "Downtown Pharmacy", medicine: "Atorvastatin", quantity: 2, total: 90.00, date: "2024-07-30", paymentMethod: "Online", patientName: "Ethan Davis", storeId: "STR002" },
    { invoiceId: "SALE006", pharmacist: "Pharmacist Two", store: "Uptown Health", medicine: "Metformin", quantity: 5, total: 125.00, date: "2024-07-30", paymentMethod: "Online", patientName: "Alice Johnson", storeId: "STR003" },
];

const allStores = [
    { id: "all", name: "All Stores", storeId: "all" },
    { id: "Downtown Pharmacy", name: "Downtown Pharmacy", storeId: "STR002" },
    { id: "Uptown Health", name: "Uptown Health", storeId: "STR003" },
];

const pharmacists = [
    { id: "all", name: "All Pharmacists" },
    { id: "Pharmacist One", name: "Pharmacist One" },
    { id: "Pharmacist Two", name: "Pharmacist Two" },
    { id: "Admin User", name: "Admin User" },
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

    const [filteredData, setFilteredData] = useState(salesData);
    const [selectedStore, setSelectedStore] = useState("all");
    const [selectedPharmacist, setSelectedPharmacist] = useState("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    
    const [isSalesDetailModalOpen, setIsSalesDetailModalOpen] = useState(false);
    const [modalView, setModalView] = useState<'summary' | 'cash' | 'online'>('summary');


    const availableStores = useMemo(() => {
        if (user?.role === 'Admin') {
            return allStores;
        }
        if (user?.role === 'Pharmacist' && user.assignedStore) {
            return allStores.filter(s => s.storeId === user.assignedStore || s.storeId === 'all');
        }
        return [];
    }, [user]);

    
    const handleApplyFilters = () => {
        let data = [...salesData];

        if (selectedStore !== "all") {
            const store = allStores.find(s => s.id === selectedStore);
            if (store) {
                 data = data.filter(sale => sale.storeId === store.storeId);
            }
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
    
    // Apply filters on initial load and when user changes
    useEffect(() => {
        if (user?.role === 'Pharmacist' && user.assignedStore) {
            const assignedStore = allStores.find(s => s.storeId === user.assignedStore);
            if(assignedStore) {
                setSelectedStore(assignedStore.id);
            }
        } else if (user?.role === 'Admin') {
            setSelectedStore('all');
        }
    }, [user]);

    useEffect(() => {
        handleApplyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStore, selectedPharmacist, dateRange, user]);


    const analytics = useMemo(() => {
        const totalSalesValue = filteredData.reduce((acc, sale) => acc + sale.total, 0);
        const cashSalesValue = filteredData.filter(s => s.paymentMethod === 'Cash').reduce((acc, sale) => acc + sale.total, 0);
        const onlineSalesValue = filteredData.filter(s => s.paymentMethod === 'Online').reduce((acc, sale) => acc + sale.total, 0);
        
        const totalItemsSold = filteredData.reduce((acc, sale) => acc + sale.quantity, 0);
        const cashInvoices = filteredData.filter(s => s.paymentMethod === 'Cash');
        const onlineInvoices = filteredData.filter(s => s.paymentMethod === 'Online');


        const highSellingMedicines = filteredData.reduce((acc, sale) => {
            const existing = acc.find(item => item.name === sale.medicine);
            if (existing) {
                existing.quantity += sale.quantity;
            } else {
                acc.push({ name: sale.medicine, quantity: sale.quantity });
            }
            return acc;
        }, [] as { name: string; quantity: number; }[]).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

        const pharmacistSales = filteredData.reduce((acc, sale) => {
            const existing = acc.find(item => item.name === sale.pharmacist);
            if (existing) {
                existing.salesValue += sale.total;
            } else {
                acc.push({ name: sale.pharmacist, salesValue: sale.total });
            }
            return acc;
        }, [] as { name: string; salesValue: number; }[]).sort((a, b) => b.salesValue - a.salesValue);
        
        const salesOverTime = filteredData.reduce((acc, sale) => {
            const saleDate = format(parseISO(sale.date), "MMM dd");
            const existing = acc.find(item => item.date === saleDate);
            if (existing) {
                existing.total += sale.total;
            } else {
                acc.push({ date: saleDate, total: sale.total });
            }
            return acc;
        }, [] as { date: string; total: number; }[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


        return { totalSalesValue, cashSalesValue, onlineSalesValue, totalItemsSold, highSellingMedicines, pharmacistSales, salesOverTime, cashInvoices, onlineInvoices };

    }, [filteredData]);


    const sidebarRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path !== '/');
    }, []);

    const stockManagementRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path.startsWith('/inventory/') && hasPermission(route.path));
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
                        <SidebarMenuButton href="/" tooltip="Dashboard">
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
        <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger className="sm:hidden" />
           <div className="flex w-full items-center justify-between">
              <h1 className="text-xl font-semibold">Sales Reports</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                            <div>
                                <CardTitle>Sales Performance</CardTitle>
                                <CardDescription>Analyze sales data with powerful filters.</CardDescription>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                                <Select 
                                    value={selectedStore} 
                                    onValueChange={setSelectedStore}
                                    disabled={user?.role === 'Pharmacist'}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Select Store" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableStores.map(store => (
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
                                <DateRangePicker onUpdate={(values) => setDateRange(values.range)} />
                            </div>
                        </div>
                    </CardHeader>
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
                                        <TableCell>{sale.pharmacist}</TableCell>
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
                                {analytics.cashInvoices.map(inv => (
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
                                 {analytics.onlineInvoices.map(inv => (
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
