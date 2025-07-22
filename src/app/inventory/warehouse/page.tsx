
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, Pill, Undo, Building, MoreHorizontal, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryItem, getAvailableStockForLocation } from "@/services/inventory-service";
import { Medicine, getMedicines } from "@/services/medicine-service";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { DateRange } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Manufacturer, getManufacturers } from "@/services/manufacturer-service";
import { Purchase, getPurchases } from "@/services/purchase-service";
import { Transfer, getTransfers } from "@/services/transfer-service";
import { getManufacturerReturns, ManufacturerReturn } from "@/services/return-service";
import { isWithinInterval, startOfDay, endOfDay, parseISO, format } from "date-fns";
import type { WarehouseLedgerItem } from "@/lib/report-types";


const getStatus = (quantity: number, minStockLevel: number) => {
    if (quantity <= 0) return "Out of Stock";
    if (quantity <= minStockLevel) return "Low Stock";
    return "In Stock";
};

export default function WarehouseInventoryPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    
    const [pageLoading, setPageLoading] = useState(true);
    const [isLedgerLoading, setIsLedgerLoading] = useState(false);
    
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [manufacturerReturns, setManufacturerReturns] = useState<ManufacturerReturn[]>([]);
    
    const [stockLedger, setStockLedger] = useState<WarehouseLedgerItem[]>([]);
    const filtersRef = useRef<{dateRange?: DateRange; manufacturerId: string; medicineId: string}>({
        manufacturerId: 'all',
        medicineId: 'all',
    });

    const sidebarRoutes = useMemo(() => allAppRoutes.filter(route => route.path !== '/'), []);
    const stockManagementRoutes = useMemo(() => allAppRoutes.filter(route => route.path.startsWith('/inventory/') && hasPermission(route.path)), [hasPermission]);

    const fetchWarehouseData = useCallback(async () => {
        setPageLoading(true);
        try {
            const [stockItems, meds, mans, pur, trans, mfrReturns] = await Promise.all([
                getAvailableStockForLocation('warehouse'),
                getMedicines(),
                getManufacturers(),
                getPurchases(),
                getTransfers(),
                getManufacturerReturns(),
            ]);
            setInventory(stockItems);
            setMedicines(meds);
            setManufacturers(mans);
            setPurchases(pur);
            setTransfers(trans);
            setManufacturerReturns(mfrReturns);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load warehouse data.' });
        }
        setPageLoading(false);
    }, [toast]);
    
    useEffect(() => {
        if(user) {
            fetchWarehouseData();
        }
    }, [user, fetchWarehouseData]);
    
    const calculateStockLedger = useCallback(() => {
        if (!filtersRef.current.dateRange?.from || !filtersRef.current.dateRange?.to) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a date range to generate the report.' });
            return;
        }
        setIsLedgerLoading(true);

        const startDate = startOfDay(filtersRef.current.dateRange.from);
        const endDate = endOfDay(filtersRef.current.dateRange.to);

        const purchasesInDateRange = purchases.filter(p => isWithinInterval(parseISO(p.date), { start: startDate, end: endDate }));
        const transfersInDateRange = transfers.filter(t => isWithinInterval(parseISO(t.date), { start: startDate, end: endDate }));
        const returnsInDateRange = manufacturerReturns.filter(r => isWithinInterval(parseISO(r.date), { start: startDate, end: endDate }));
        
        const medicineMap = new Map<string, Medicine>(medicines.map(m => [m.id, m]));
        let medicineIds = new Set(inventory.map(i => i.medicineId));

        if (filtersRef.current.medicineId !== 'all') {
            medicineIds = new Set([filtersRef.current.medicineId]);
        } else if (filtersRef.current.manufacturerId !== 'all') {
            const manufacturerMeds = medicines.filter(m => m.manufacturerId === filtersRef.current.manufacturerId).map(m => m.id);
            medicineIds = new Set(manufacturerMeds);
        }

        const ledger: WarehouseLedgerItem[] = [];

        for(const medId of medicineIds) {
            const medicineDetails = medicineMap.get(medId);
            if (!medicineDetails) continue;

            const currentItem = inventory.find(i => i.medicineId === medId);
            const balance = currentItem?.quantity || 0;

            const receivedDuringPeriod = purchasesInDateRange.flatMap(p => p.items).filter(i => i.medicineId === medId).reduce((sum, i) => sum + i.quantity, 0);
            const transferredDuringPeriod = transfersInDateRange.filter(t => t.from === 'warehouse').flatMap(t => t.items).filter(i => i.medicineId === medId).reduce((sum, i) => sum + i.quantity, 0);
            const returnedFromStoreDuringPeriod = transfersInDateRange.filter(t => t.to === 'warehouse').flatMap(t => t.items).filter(i => i.medicineId === medId).reduce((sum, i) => sum + i.quantity, 0);
            const returnedToMfrDuringPeriod = returnsInDateRange.flatMap(r => r.items).filter(i => i.medicineId === medId).reduce((sum, i) => sum + i.quantity, 0);

            const opening = balance - receivedDuringPeriod - returnedFromStoreDuringPeriod + transferredDuringPeriod + returnedToMfrDuringPeriod;
            
            ledger.push({
                medicineId: medId,
                medicineName: medicineDetails.name,
                manufacturerName: medicineDetails.manufacturerName,
                opening,
                received: receivedDuringPeriod,
                returnedFromStore: returnedFromStoreDuringPeriod,
                returnedToManufacturer: returnedToMfrDuringPeriod,
                transferred: transferredDuringPeriod,
                balance,
            });
        }
        setStockLedger(ledger);
        setIsLedgerLoading(false);
    }, [inventory, medicines, purchases, transfers, manufacturerReturns, toast]);

    const handleDownloadReport = () => {
        if (stockLedger.length === 0) {
            toast({ variant: "destructive", title: "No data", description: "Generate a report before downloading." });
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,";
        const headers = ["Medicine", "Manufacturer", "Opening", "Received", "Returned (Stores)", "Returned (MFR)", "Transferred", "Balance"];
        csvContent += headers.join(",") + "\r\n";

        stockLedger.forEach(item => {
            const row = [`"${item.medicineName}"`, `"${item.manufacturerName}"`, item.opening, item.received, item.returnedFromStore, item.returnedToManufacturer, item.transferred, item.balance];
            csvContent += row.join(",") + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `warehouse_stock_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleResetFilters = () => {
        filtersRef.current = { dateRange: undefined, manufacturerId: 'all', medicineId: 'all' };
        setStockLedger([]);
    };


    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

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

    if (loading || pageLoading) {
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
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </SidebarContent>
                </Sidebar>
                <div className="flex flex-col sm:gap-4 sm:py-4">
                    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                        <SidebarTrigger />
                        <div className="flex w-full items-center justify-between">
                            <h1 className="text-xl font-semibold">Warehouse Stock Ledger</h1>
                            <ThemeToggle />
                        </div>
                    </header>
                    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                        <div className="space-y-4">
                             <Skeleton className="h-32 w-full" />
                             <Skeleton className="h-64 w-full" />
                        </div>
                    </main>
                </div>
            </div>
        );
    }
    
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
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger />
           <div className="flex w-full items-center justify-between">
              <h1 className="text-xl font-semibold">Warehouse Stock Ledger</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Filter Report</CardTitle>
                    <CardDescription>Use filters to generate the stock ledger report for a specific period.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DateRangePicker onUpdate={(v) => (filtersRef.current.dateRange = v.range)} />
                        <Select onValueChange={(v) => (filtersRef.current.manufacturerId = v)} defaultValue="all">
                            <SelectTrigger><SelectValue placeholder="Select Manufacturer" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Manufacturers</SelectItem>
                                {manufacturers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(v) => (filtersRef.current.medicineId = v)} defaultValue="all">
                            <SelectTrigger><SelectValue placeholder="Select Medicine" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Medicines</SelectItem>
                                {medicines.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-center gap-4">
                        <Button onClick={calculateStockLedger} disabled={isLedgerLoading}>
                            {isLedgerLoading ? 'Generating...' : 'Apply Filters'}
                        </Button>
                        <Button onClick={handleResetFilters} variant="outline">Reset</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Stock Ledger Report</CardTitle>
                        <CardDescription>Detailed stock movement in the main warehouse.</CardDescription>
                    </div>
                    <Button onClick={handleDownloadReport} variant="outline" size="sm" disabled={stockLedger.length === 0}>
                        <Download className="mr-2" /> Download Report
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Medicine</TableHead>
                                    <TableHead className="hidden lg:table-cell">Manufacturer</TableHead>
                                    <TableHead className="text-right">Opening</TableHead>
                                    <TableHead className="text-right">Received</TableHead>
                                    <TableHead className="text-right">Returned (Stores)</TableHead>
                                    <TableHead className="text-right">Returned (MFR)</TableHead>
                                    <TableHead className="text-right">Transferred</TableHead>
                                    <TableHead className="text-right font-bold">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLedgerLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                                    ))
                                ) : stockLedger.length > 0 ? (
                                    stockLedger.map((item) => (
                                        <TableRow key={item.medicineId}>
                                            <TableCell className="font-medium">{item.medicineName}</TableCell>
                                            <TableCell className="hidden lg:table-cell">{item.manufacturerName}</TableCell>
                                            <TableCell className="text-right">{item.opening}</TableCell>
                                            <TableCell className="text-right text-green-600">+{item.received}</TableCell>
                                            <TableCell className="text-right text-blue-600">+{item.returnedFromStore}</TableCell>
                                            <TableCell className="text-right text-red-600">-{item.returnedToManufacturer}</TableCell>
                                            <TableCell className="text-right text-orange-600">-{item.transferred}</TableCell>
                                            <TableCell className="text-right font-bold">{item.balance}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">
                                            {filtersRef.current.dateRange ? 'No stock movement data for this period.' : 'Please select a date range and apply filters to see the report.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </main>
      </div>
    </div>
  );
}
