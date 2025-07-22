
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, Pill, Building, Undo, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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


const allStores = [
    { value: "all", label: "All Stores" },
    { value: "STR002", label: "Downtown Pharmacy" },
    { value: "STR003", label: "Uptown Health" },
];

export default function UniversalReportPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [pharmacists, setPharmacists] = useState<string[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    const [filters, setFilters] = useState({
        dateRange: undefined as DateRange | undefined,
        patientId: "",
        patientMobile: "",
        medicineId: "all",
        storeId: "all",
        pharmacistName: "all",
        invoiceNo: "",
    });

    const fetchReportData = useCallback(async () => {
        setDataLoading(true);
        try {
            const [salesData, medData] = await Promise.all([getSales(), getMedicines()]);
            setAllSales(salesData);
            setMedicines(medData);
            
            const uniquePharmacists = [...new Set(salesData.map(s => s.soldBy))];
            setPharmacists(uniquePharmacists);

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

    const filteredSales = useMemo(() => {
        return allSales.filter(sale => {
            let matches = true;
            if (filters.dateRange?.from && filters.dateRange?.to) {
                if (!isWithinInterval(parseISO(sale.createdAt), { start: filters.dateRange.from, end: filters.dateRange.to })) {
                    matches = false;
                }
            }
            if (filters.patientId && !sale.patientId.toLowerCase().includes(filters.patientId.toLowerCase())) {
                matches = false;
            }
            if (filters.patientMobile && !sale.patientMobile.includes(filters.patientMobile)) {
                matches = false;
            }
            if (filters.storeId !== "all" && sale.storeId !== filters.storeId) {
                matches = false;
            }
            if (filters.pharmacistName !== "all" && sale.soldBy !== filters.pharmacistName) {
                matches = false;
            }
             if (filters.invoiceNo && !sale.invoiceId.toLowerCase().includes(filters.invoiceNo.toLowerCase())) {
                matches = false;
            }
            if (filters.medicineId !== 'all') {
                if (!sale.items.some(item => item.medicineValue === filters.medicineId)) {
                    matches = false;
                }
            }
            return matches;
        });
    }, [allSales, filters]);
    
    const handleFilterChange = (key: keyof typeof filters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleDownload = () => {
        if (filteredSales.length === 0) {
            toast({ variant: 'destructive', title: 'No Data', description: 'There is no data to download for the current filters.' });
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        const headers = ["Invoice ID", "Date", "Patient Name", "Patient Mobile", "Store", "Pharmacist", "Medicine", "Quantity", "Price", "GST %", "Total"];
        csvContent += headers.join(",") + "\r\n";

        filteredSales.forEach(sale => {
            sale.items.forEach(item => {
                const row = [
                    sale.invoiceId,
                    format(parseISO(sale.createdAt), 'yyyy-MM-dd HH:mm'),
                    `"${sale.patientName}"`,
                    sale.patientMobile,
                    sale.storeName,
                    sale.soldBy,
                    `"${item.medicine}"`,
                    item.quantity,
                    item.price.toFixed(2),
                    item.gst,
                    item.total.toFixed(2),
                ];
                csvContent += row.join(",") + "\r\n";
            });
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "universal_sales_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            case 'Dashboard': return <HomeIcon />; case 'Patients': return <Users2 />; case 'Sales': return <ShoppingCart />; case 'Universal Report': return <BarChart />; case 'Warehouse Stock': return <Warehouse />; case 'Store Stock': return <Package />; case 'Medicine Master': return <Pill />; case 'Manufacturer Master': return <Building />; case 'Add Stock': return <PlusSquare />; case 'Return to Manufacturer': return <Undo />; case 'Stock Transfer': return <GitBranch />; case 'Inventory Reports': return <BarChart />; case 'Valuation Report': return <TrendingUp />; case 'Diseases': return <Activity />; case 'Admin': return <Settings />; default: return <LayoutGrid />;
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
                                <SidebarMenuButton href="/admin" tooltip="Admin" isActive={pathname.startsWith('/admin')}>
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
                        <h1 className="text-xl font-semibold">Universal Sales Report</h1>
                        <ThemeToggle />
                    </div>
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Filter Report</CardTitle>
                            <CardDescription>Use any combination of filters to generate a sales report. All sales data is shown by default.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <div>
                                    <Label>Date Range</Label>
                                    <DateRangePicker onUpdate={(values) => handleFilterChange('dateRange', values.range)} className="w-full" />
                                </div>
                                <div>
                                    <Label htmlFor="invoiceNo">Invoice No.</Label>
                                    <Input id="invoiceNo" placeholder="INV-..." value={filters.invoiceNo} onChange={e => handleFilterChange('invoiceNo', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="patientId">Patient ID</Label>
                                    <Input id="patientId" placeholder="PAT-..." value={filters.patientId} onChange={e => handleFilterChange('patientId', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="patientMobile">Patient Mobile</Label>
                                    <Input id="patientMobile" placeholder="987..." value={filters.patientMobile} onChange={e => handleFilterChange('patientMobile', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="storeId">Store</Label>
                                    <Select value={filters.storeId} onValueChange={v => handleFilterChange('storeId', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{allStores.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="pharmacistName">Pharmacist</Label>
                                    <Select value={filters.pharmacistName} onValueChange={v => handleFilterChange('pharmacistName', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Pharmacists</SelectItem>
                                            {pharmacists.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="lg:col-span-2">
                                    <Label htmlFor="medicineId">Medicine</Label>
                                    <Select value={filters.medicineId} onValueChange={v => handleFilterChange('medicineId', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Medicines</SelectItem>
                                            {medicines.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Report Results</CardTitle>
                                <CardDescription>Found {filteredSales.length} matching sale records.</CardDescription>
                            </div>
                            <Button onClick={handleDownload} variant="outline" size="sm">
                                <Download className="mr-2" /> Download Report
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Medicine</TableHead>
                                        <TableHead>Store</TableHead>
                                        <TableHead className="text-right">Total (₹)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell colSpan={6}><Skeleton className="h-5 w-full" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredSales.length > 0 ? (
                                        filteredSales.map(sale => (
                                            <TableRow key={sale.invoiceId}>
                                                <TableCell className="font-medium">{sale.invoiceId}</TableCell>
                                                <TableCell>{format(parseISO(sale.createdAt), 'dd MMM, yyyy')}</TableCell>
                                                <TableCell>{sale.patientName} <span className="text-muted-foreground text-xs block">{sale.patientMobile}</span></TableCell>
                                                <TableCell>
                                                    <ul className="list-disc list-inside">
                                                        {sale.items.map((item, index) => <li key={index}>{item.medicine} (x{item.quantity})</li>)}
                                                    </ul>
                                                </TableCell>
                                                <TableCell>{sale.storeName}</TableCell>
                                                <TableCell className="text-right font-bold">{sale.grandTotal.toFixed(2)}</TableCell>
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
