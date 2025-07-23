
"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, Pill, Building, Undo, Download, BarChart2, Edit, HeartCrack, DollarSign, Percent } from "lucide-react";
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
import { format, isWithinInterval, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Sale, getSales } from "@/services/sales-service";
import { getMedicines, Medicine } from "@/services/medicine-service";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfitLossItem extends Omit<Sale, 'items'> {
    medicineName: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    profit: number;
}

const allStores = [
    { value: "all", label: "All Stores" },
    { value: "STR002", label: "Downtown Pharmacy" },
    { value: "STR003", label: "Uptown Health" },
];

export default function ProfitLossReportPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    const initialFilters = {
        dateRange: undefined as DateRange | undefined,
        storeId: "all",
    };

    const [activeFilters, setActiveFilters] = useState(initialFilters);
    const filtersRef = useRef(initialFilters);

    const fetchReportData = useCallback(async () => {
        setDataLoading(true);
        try {
            const [salesData, medData] = await Promise.all([getSales(), getMedicines()]);
            setAllSales(salesData);
            setMedicines(medData);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load report data.' });
        }
        setDataLoading(false);
    }, [toast]);

    useEffect(() => {
        if(user) {
            fetchReportData();
        }
    }, [user, fetchReportData]);

    const reportItems = useMemo(() => {
        const medicineMap = new Map(medicines.map(m => [m.id, m]));
        
        const filteredSales = allSales.filter(sale => {
            let matches = true;
            if (activeFilters.dateRange?.from && activeFilters.dateRange?.to) {
                if (!isWithinInterval(parseISO(sale.createdAt), { start: activeFilters.dateRange.from, end: activeFilters.dateRange.to })) {
                    matches = false;
                }
            }
            if (activeFilters.storeId !== "all" && sale.storeId !== activeFilters.storeId) {
                matches = false;
            }
            return matches;
        });

        return filteredSales.flatMap(sale => 
            sale.items.map(item => {
                const medicineDetails = medicineMap.get(item.medicineValue);
                const purchasePrice = medicineDetails?.purchasePrice || 0;
                const profit = (item.price - purchasePrice) * item.quantity;

                return {
                    invoiceId: sale.invoiceId,
                    date: sale.createdAt,
                    patientName: sale.patientName,
                    storeName: sale.storeName,
                    soldBy: sale.soldBy,
                    medicineName: item.medicine,
                    quantity: item.quantity,
                    purchasePrice: purchasePrice,
                    sellingPrice: item.price,
                    profit: profit,
                };
            })
        ).sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    }, [allSales, medicines, activeFilters]);

    const analytics = useMemo(() => {
        const totalRevenue = reportItems.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);
        const totalCogs = reportItems.reduce((acc, item) => acc + (item.purchasePrice * item.quantity), 0);
        const totalProfit = totalRevenue - totalCogs;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        return { totalRevenue, totalCogs, totalProfit, profitMargin };
    }, [reportItems]);

    const handleApplyFilters = () => {
        setActiveFilters({...filtersRef.current});
    };

    const handleResetFilters = () => {
        filtersRef.current = initialFilters;
        setActiveFilters(initialFilters);
    };

    const sidebarRoutes = useMemo(() => allAppRoutes.filter(route => route.path !== '/'), []);
    const stockManagementRoutes = useMemo(() => allAppRoutes.filter(route => route.path.startsWith('/inventory/') && hasPermission(route.path)), [hasPermission]);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
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
                        {sidebarRoutes.filter(r => !r.path.startsWith('/inventory/') && r.inSidebar && hasPermission(r.path)).map((route) => {
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
            <div className="flex flex-col sm:gap-4 sm:py-4">
                <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <SidebarTrigger />
                    <div className="flex w-full items-center justify-between">
                        <h1 className="text-xl font-semibold">Profit & Loss Report</h1>
                        <ThemeToggle />
                    </div>
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profitability Analysis</CardTitle>
                            <CardDescription>Filter by date range and store to analyze your profit margins.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row md:items-end gap-4">
                                <div className="space-y-2">
                                    <Select defaultValue={filtersRef.current.storeId} onValueChange={v => (filtersRef.current.storeId = v)}>
                                        <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Select Store" /></SelectTrigger>
                                        <SelectContent>{allStores.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <DateRangePicker onUpdate={(values) => (filtersRef.current.dateRange = values.range)} />
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button onClick={handleApplyFilters}>Apply Filters</Button>
                                    <Button onClick={handleResetFilters} variant="outline">Reset Filters</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{analytics.totalRevenue.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total COGS</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₹{analytics.totalCogs.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">₹{analytics.totalProfit.toFixed(2)}</div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                                <Percent className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analytics.profitMargin.toFixed(2)}%</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Report</CardTitle>
                            <CardDescription>Line-item breakdown of profit for each sale.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Medicine</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Purchase Price (₹)</TableHead>
                                        <TableHead className="text-right">Selling Price (₹)</TableHead>
                                        <TableHead className="text-right">Profit (₹)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataLoading ? (
                                        Array.from({ length: 10 }).map((_, i) => (
                                            <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                                        ))
                                    ) : reportItems.length > 0 ? (
                                        reportItems.map((item, index) => (
                                            <TableRow key={`${item.invoiceId}-${index}`}>
                                                <TableCell>{format(parseISO(item.date), 'dd MMM, yyyy')}</TableCell>
                                                <TableCell>{item.medicineName}</TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{item.purchasePrice.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">{item.sellingPrice.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-bold text-green-600">{item.profit.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">No sales data found for the selected filters.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
