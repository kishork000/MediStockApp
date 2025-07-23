
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, Pill, Undo, Building, MoreHorizontal, Download, Search, BarChart2, Edit, HeartCrack } from "lucide-react";
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
import { DamagedStockLog, getDamagedStockLogs } from "@/services/damaged-stock-service";
import { isWithinInterval, startOfDay, endOfDay, parseISO, format } from "date-fns";
import type { WarehouseLedgerItem, StoreLedgerItem } from "@/lib/report-types";
import { Input } from "@/components/ui/input";
import { getSales, Sale } from "@/services/sales-service";


const allLocations = [
    { id: "warehouse", name: "Main Warehouse" },
    { id: "STR002", name: "Downtown Pharmacy" },
    { id: "STR003", name: "Uptown Health" },
];


export default function StockLedgerPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    
    const [pageLoading, setPageLoading] = useState(true);
    const [isLedgerLoading, setIsLedgerLoading] = useState(false);
    
    // Master Data
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    
    // Transactional Data
    const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
    const [allPurchases, setAllPurchases] = useState<Purchase[]>([]);
    const [allTransfers, setAllTransfers] = useState<Transfer[]>([]);
    const [allManufacturerReturns, setAllManufacturerReturns] = useState<ManufacturerReturn[]>([]);
    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [allDamagedStock, setAllDamagedStock] = useState<DamagedStockLog[]>([]);

    const [stockLedger, setStockLedger] = useState<(WarehouseLedgerItem | StoreLedgerItem)[]>([]);
    const filtersRef = useRef<{ dateRange?: DateRange; locationId: string; medicineId: string; }>({
        locationId: 'warehouse',
        medicineId: 'all',
    });

    const sidebarRoutes = useMemo(() => allAppRoutes.filter(route => route.path !== '/'), []);
    const stockManagementRoutes = useMemo(() => allAppRoutes.filter(route => route.path.startsWith('/inventory/') && route.inSidebar), [hasPermission]);

    const fetchAllData = useCallback(async () => {
        setPageLoading(true);
        try {
            const [
                stockWarehouse, stockDowntown, stockUptown, 
                meds, 
                pur, trans, mfrReturns, sales, damaged
            ] = await Promise.all([
                getAvailableStockForLocation('warehouse'),
                getAvailableStockForLocation('STR002'),
                getAvailableStockForLocation('STR003'),
                getMedicines(),
                getPurchases(),
                getTransfers(),
                getManufacturerReturns(),
                getSales(),
                getDamagedStockLogs()
            ]);
            setAllInventory([...stockWarehouse, ...stockDowntown, ...stockUptown]);
            setMedicines(meds);
            setAllPurchases(pur);
            setAllTransfers(trans);
            setAllManufacturerReturns(mfrReturns);
            setAllSales(sales);
            setAllDamagedStock(damaged);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load ledger data.' });
        }
        setPageLoading(false);
    }, [toast]);
    
    useEffect(() => {
        if(user) {
            fetchAllData();
        }
    }, [user, fetchAllData]);
    
    const calculateStockLedger = useCallback(() => {
        if (!filtersRef.current.dateRange?.from || !filtersRef.current.dateRange?.to) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a date range to generate the report.' });
            return;
        }
        setIsLedgerLoading(true);

        const startDate = startOfDay(filtersRef.current.dateRange.from);
        const endDate = endOfDay(filtersRef.current.dateRange.to);
        const locationId = filtersRef.current.locationId;

        const medicineMap = new Map(medicines.map(m => [m.id, m]));
        
        let medicineIdsToProcess: string[];
        if (filtersRef.current.medicineId !== 'all') {
             medicineIdsToProcess = [filtersRef.current.medicineId];
        } else {
             const locationInventory = allInventory.filter(i => i.locationId === locationId);
             medicineIdsToProcess = Array.from(new Set(locationInventory.map(i => i.medicineId)));
        }

        const ledger: (WarehouseLedgerItem | StoreLedgerItem)[] = [];

        for(const medId of medicineIdsToProcess) {
            const medicineDetails = medicineMap.get(medId);
            if (!medicineDetails) continue;

            const currentStock = allInventory.find(i => i.medicineId === medId && i.locationId === locationId)?.quantity || 0;
            const balance = currentStock;

            if (locationId === 'warehouse') {
                 const purchasesDuringPeriod = allPurchases.filter(p => isWithinInterval(parseISO(p.date), { start: startDate, end: endDate }))
                    .flatMap(p => p.items).filter(i => i.medicineId === medId).reduce((sum, i) => sum + i.quantity, 0);
                 const transferredDuringPeriod = allTransfers.filter(t => t.from === 'warehouse' && isWithinInterval(parseISO(t.date), { start: startDate, end: endDate }))
                    .flatMap(t => t.items).filter(i => i.medicineId === medId).reduce((sum, i) => sum + i.quantity, 0);
                 const returnedFromStoreDuringPeriod = allTransfers.filter(t => t.to === 'warehouse' && isWithinInterval(parseISO(t.date), { start: startDate, end: endDate }))
                    .flatMap(t => t.items).filter(i => i.medicineId === medId).reduce((sum, i) => sum + i.quantity, 0);
                 const returnedToMfrDuringPeriod = allManufacturerReturns.filter(r => isWithinInterval(parseISO(r.date), { start: startDate, end: endDate }))
                    .flatMap(r => r.items).filter(i => i.medicineId === medId).reduce((sum, i) => sum + i.quantity, 0);
                 const damagedDuringPeriod = allDamagedStock.filter(d => d.locationId === locationId && d.medicineId === medId && isWithinInterval(parseISO(d.date), { start: startDate, end: endDate }))
                    .reduce((sum, d) => sum + d.quantity, 0);

                const opening = balance - purchasesDuringPeriod - returnedFromStoreDuringPeriod + transferredDuringPeriod + returnedToMfrDuringPeriod + damagedDuringPeriod;
                const totalStock = opening + purchasesDuringPeriod + returnedFromStoreDuringPeriod;

                ledger.push({
                    type: 'warehouse', medicineId: medId, medicineName: medicineDetails.name, manufacturerName: medicineDetails.manufacturerName,
                    opening, received: purchasesDuringPeriod, totalStock, returnedFromStore: returnedFromStoreDuringPeriod,
                    returnedToManufacturer: returnedToMfrDuringPeriod, transferred: transferredDuringPeriod, damaged: damagedDuringPeriod, balance,
                });

            } else { // Store Ledger
                const salesDuringPeriod = allSales.filter(s => s.storeId === locationId && isWithinInterval(parseISO(s.createdAt), { start: startDate, end: endDate }))
                    .flatMap(s => s.items).filter(i => i.medicineValue === medId).reduce((sum, i) => sum + i.quantity, 0);
                const receivedFromWH = allTransfers.filter(t => t.to === locationId && isWithinInterval(parseISO(t.date), { start: startDate, end: endDate }))
                    .flatMap(t => t.items).filter(i => i.medicineId === medId).reduce((sum, i) => sum + i.quantity, 0);
                const returnedToWH = allTransfers.filter(t => t.from === locationId && isWithinInterval(parseISO(t.date), { start: startDate, end: endDate }))
                    .flatMap(t => t.items).filter(i => i.medicineId === medId).reduce((sum, i) => sum + i.quantity, 0);
                const damagedDuringPeriod = allDamagedStock.filter(d => d.locationId === locationId && d.medicineId === medId && isWithinInterval(parseISO(d.date), { start: startDate, end: endDate }))
                    .reduce((sum, d) => sum + d.quantity, 0);

                const opening = balance - receivedFromWH + salesDuringPeriod + returnedToWH + damagedDuringPeriod;

                 ledger.push({
                    type: 'store', medicineId: medId, medicineName: medicineDetails.name, opening,
                    received: receivedFromWH, sales: salesDuringPeriod, returned: returnedToWH, damaged: damagedDuringPeriod, balance,
                });
            }
        }
        setStockLedger(ledger);
        setIsLedgerLoading(false);
    }, [allInventory, medicines, allPurchases, allTransfers, allManufacturerReturns, allSales, allDamagedStock, toast]);


    const handleDownloadReport = () => {
        if (stockLedger.length === 0) {
            toast({ variant: "destructive", title: "No data", description: "Generate a report before downloading." });
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,";
        
        let headers: string[];
        if (filtersRef.current.locationId === 'warehouse') {
             headers = ["Medicine", "Manufacturer", "Opening", "Received (Purchase)", "Returned (Stores)", "Total Stock", "Returned (MFR)", "Transferred (to Stores)", "Damaged", "Balance"];
        } else {
             headers = ["Medicine", "Opening", "Received (from WH)", "Sales", "Returned (to WH)", "Damaged", "Balance"];
        }
        csvContent += headers.join(",") + "\n";

        stockLedger.forEach(item => {
            let row: (string | number)[];
            if(item.type === 'warehouse') {
                 row = [`"${item.medicineName}"`, `"${item.manufacturerName}"`, item.opening, item.received, item.returnedFromStore, item.totalStock, item.returnedToManufacturer, item.transferred, item.damaged, item.balance];
            } else {
                 row = [`"${item.medicineName}"`, item.opening, item.received, item.sales, item.returned, item.damaged, item.balance];
            }
            csvContent += row.join(",") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filtersRef.current.locationId}_stock_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleResetFilters = () => {
        filtersRef.current = { dateRange: undefined, locationId: 'warehouse', medicineId: 'all' };
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
            case 'Universal Report': return <BarChart2 />;
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
                            <h1 className="text-xl font-semibold">Stock Ledger</h1>
                            <ThemeToggle />
                        </div>
                    </header>
                    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                        <div className="space-y-4">
                             <Skeleton className="h-40 w-full" />
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
                {sidebarRoutes.filter(r => r.inSidebar && hasPermission(r.path) && !r.path.startsWith('/inventory/')).map((route) => (
                    <SidebarMenuItem key={route.path}>
                        <SidebarMenuButton href={route.path} tooltip={route.name} isActive={pathname.startsWith(route.path)}>
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
              <h1 className="text-xl font-semibold">Stock Ledger</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Filter Report</CardTitle>
                    <CardDescription>Use filters to generate the stock ledger report for a specific period and location.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DateRangePicker onUpdate={(v) => (filtersRef.current.dateRange = v.range)} />
                         <Select onValueChange={(v) => (filtersRef.current.locationId = v)} defaultValue="warehouse">
                            <SelectTrigger><SelectValue placeholder="Select Location" /></SelectTrigger>
                            <SelectContent>
                                {allLocations.map(l =>  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(v) => (filtersRef.current.medicineId = v)} defaultValue="all">
                            <SelectTrigger><SelectValue placeholder="Select Medicine" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Medicines</SelectItem>
                                {medicines.map(m =>  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
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
                        <CardTitle>Stock Ledger: {allLocations.find(l => l.id === filtersRef.current.locationId)?.name}</CardTitle>
                        <CardDescription>Detailed stock movement report.</CardDescription>
                    </div>
                    <Button onClick={handleDownloadReport} variant="outline" size="sm" disabled={stockLedger.length === 0}>
                        <Download className="mr-2" /> Download Report
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="hidden md:block relative w-full overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                {filtersRef.current.locationId === 'warehouse' ? (
                                    <TableRow>
                                        <TableHead>Medicine</TableHead>
                                        <TableHead>Opening</TableHead>
                                        <TableHead>Received</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Ret (Stores)</TableHead>
                                        <TableHead>Transferred</TableHead>
                                        <TableHead>Ret (MFR)</TableHead>
                                        <TableHead>Damaged</TableHead>
                                        <TableHead className="font-bold">Balance</TableHead>
                                    </TableRow>
                                ) : (
                                     <TableRow>
                                        <TableHead>Medicine</TableHead>
                                        <TableHead>Opening</TableHead>
                                        <TableHead>Received</TableHead>
                                        <TableHead>Sales</TableHead>
                                        <TableHead>Returned</TableHead>
                                        <TableHead>Damaged</TableHead>
                                        <TableHead className="font-bold">Balance</TableHead>
                                    </TableRow>
                                )}
                            </TableHeader>
                            <TableBody>
                                {isLedgerLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan={9}><Skeleton className="h-5 w-full"/></TableCell></TableRow>
                                    ))
                                ) : stockLedger.length > 0 ? (
                                    stockLedger.map((item) => (
                                        item.type === 'warehouse' ? (
                                        <TableRow key={item.medicineId}>
                                            <TableCell className="font-medium">{item.medicineName}</TableCell>
                                            <TableCell>{item.opening}</TableCell>
                                            <TableCell className="text-green-600">+{item.received}</TableCell>
                                            <TableCell>{item.totalStock}</TableCell>
                                            <TableCell className="text-blue-600">+{item.returnedFromStore}</TableCell>
                                            <TableCell className="text-orange-600">-{item.transferred}</TableCell>
                                            <TableCell className="text-red-600">-{item.returnedToManufacturer}</TableCell>
                                            <TableCell className="text-red-600">-{item.damaged}</TableCell>
                                            <TableCell className="font-bold">{item.balance}</TableCell>
                                        </TableRow>
                                        ) : (
                                        <TableRow key={item.medicineId}>
                                            <TableCell className="font-medium">{item.medicineName}</TableCell>
                                            <TableCell>{item.opening}</TableCell>
                                            <TableCell className="text-green-600">+{item.received}</TableCell>
                                            <TableCell className="text-red-600">-{item.sales}</TableCell>
                                            <TableCell className="text-orange-600">-{item.returned}</TableCell>
                                            <TableCell className="text-red-600">-{item.damaged}</TableCell>
                                            <TableCell className="font-bold">{item.balance}</TableCell>
                                        </TableRow>
                                        )
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            {filtersRef.current.dateRange ? 'No stock movement data for this period.' : 'Please select a date range and apply filters to see the report.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="md:hidden text-center p-8">
                        <p className="text-muted-foreground">The detailed ledger report is only available on desktop. Please use a larger screen to view this table.</p>
                    </div>
                </CardContent>
            </Card>
        </main>
      </div>
    </div>
  );
}
