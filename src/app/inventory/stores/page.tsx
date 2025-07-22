
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, Search, Undo, Pill, Building, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay, parseISO, format } from "date-fns";
import { Input } from "@/components/ui/input";
import { InventoryItem, getAvailableStockForLocation } from "@/services/inventory-service";
import { Medicine, getMedicines } from "@/services/medicine-service";
import { Sale, getSales } from "@/services/sales-service";
import { Transfer, getTransfers } from "@/services/transfer-service";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface EnrichedInventoryItem extends InventoryItem {
    minStockLevel: number;
}

interface StockLedgerItem {
    medicineId: string;
    medicineName: string;
    opening: number;
    received: number;
    returned: number;
    sales: number;
    balance: number;
}

const allStores = [
    { id: "STR002", name: "Downtown Pharmacy" },
    { id: "STR003", name: "Uptown Health" },
];

const getStatus = (quantity: number, minStockLevel: number) => {
    if (quantity <= 0) return "Out of Stock";
    if (quantity <= minStockLevel) return "Low Stock";
    return "In Stock";
};

export default function StoreInventoryPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const pathname = usePathname();
    const [selectedStore, setSelectedStore] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const [pageLoading, setPageLoading] = useState(true);
    const [storeInventory, setStoreInventory] = useState<EnrichedInventoryItem[]>([]);
    
    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [allTransfers, setAllTransfers] = useState<Transfer[]>([]);
    const [allMedicines, setAllMedicines] = useState<Medicine[]>([]);
    const [stockLedger, setStockLedger] = useState<StockLedgerItem[]>([]);
    const [isLedgerLoading, setIsLedgerLoading] = useState(false);
    const filtersRef = useRef<{dateRange?: DateRange, medicineId: string}>({ medicineId: 'all' });

    const availableStores = useMemo(() => {
        if (user?.role === 'Admin') return allStores;
        if (user?.role === 'Pharmacist' && user.assignedStore) return allStores.filter(s => s.id === user.assignedStore);
        return [];
    }, [user]);
    
    const sidebarRoutes = useMemo(() => allAppRoutes.filter(route => route.path !== '/'), []);
    const stockManagementRoutes = useMemo(() => allAppRoutes.filter(route => route.path.startsWith('/inventory') && route.inSidebar && hasPermission(route.path)), [hasPermission]);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (availableStores.length > 0 && !selectedStore) {
            setSelectedStore(availableStores[0].id);
        }
    }, [availableStores, selectedStore]);
    
    const fetchStoreData = useCallback(async () => {
        if (!selectedStore) return;
        setPageLoading(true);
        try {
            const [stockItems, medicines, sales, transfers] = await Promise.all([
                getAvailableStockForLocation(selectedStore),
                getMedicines(),
                getSales(),
                getTransfers(),
            ]);

            const medicineMap = new Map<string, Medicine>(medicines.map(m => [m.id, m]));
            setAllMedicines(medicines);
            setAllSales(sales);
            setAllTransfers(transfers);

            const enrichedStock = stockItems.map(item => {
                const medicineDetails = medicineMap.get(item.medicineId);
                return {
                    ...item,
                    minStockLevel: medicineDetails?.storeMinStockLevel || 0,
                };
            });
            setStoreInventory(enrichedStock);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load store inventory.' });
        }
        setPageLoading(false);
    }, [selectedStore, toast]);

    useEffect(() => {
        fetchStoreData();
    }, [fetchStoreData]);
    
    const calculateStockLedger = () => {
        if (!filtersRef.current.dateRange?.from || !filtersRef.current.dateRange?.to) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a date range to generate the report.' });
            return;
        }
        setIsLedgerLoading(true);

        const startDate = startOfDay(filtersRef.current.dateRange.from);
        const endDate = endOfDay(filtersRef.current.dateRange.to);

        const salesInDateRange = allSales.filter(s => s.storeId === selectedStore && isWithinInterval(parseISO(s.createdAt), { start: startDate, end: endDate }));
        const transfersInDateRange = allTransfers.filter(t => (t.to === selectedStore || t.from === selectedStore) && isWithinInterval(parseISO(t.date), { start: startDate, end: endDate }));

        let medicineIds: Set<string>;

        if (filtersRef.current.medicineId === 'all') {
            medicineIds = new Set([...storeInventory.map(i => i.medicineId), ...salesInDateRange.flatMap(s => s.items.map(i => i.medicineValue)), ...transfersInDateRange.flatMap(t => t.items.map(i => i.medicineId))]);
        } else {
            medicineIds = new Set([filtersRef.current.medicineId]);
        }

        const ledger: StockLedgerItem[] = [];

        for(const medId of medicineIds) {
            const currentItem = storeInventory.find(i => i.medicineId === medId);
            if(!currentItem) continue;

            const salesDuringPeriod = salesInDateRange.flatMap(s => s.items).filter(i => i.medicineValue === medId).reduce((sum, i) => sum + i.quantity, 0);
            const transfersToStore = transfersInDateRange.filter(t => t.to === selectedStore).flatMap(t => t.items).filter(i => i.medicineId === medId).reduce((sum, i) => sum + i.quantity, 0);
            const returnsFromStore = transfersInDateRange.filter(t => t.from === selectedStore).flatMap(t => t.items).filter(i => i.medicineId === medId).reduce((sum, i) => sum + i.quantity, 0);
            
            const balance = currentItem.quantity;
            const opening = balance - transfersToStore + returnsFromStore + salesDuringPeriod;
            
            ledger.push({
                medicineId: medId,
                medicineName: currentItem.medicineName,
                opening: opening,
                received: transfersToStore,
                returned: returnsFromStore,
                sales: salesDuringPeriod,
                balance: balance,
            });
        }
        setStockLedger(ledger);
        setIsLedgerLoading(false);
    };

    const handleDownloadReport = () => {
        if (stockLedger.length === 0) {
            toast({ variant: "destructive", title: "No data", description: "Generate a report before downloading." });
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,";
        const headers = ["Medicine", "Opening Stock", "Received", "Returned", "Sales", "Balance Stock"];
        csvContent += headers.join(",") + "\r\n";

        stockLedger.forEach(item => {
            const row = [item.medicineName, item.opening, item.received, item.returned, item.sales, item.balance];
            csvContent += row.join(",") + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `store_stock_report_${selectedStore}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-2xl">Loading...</div>
            </div>
        );
    }
    
    const getIcon = (name: string) => {
        switch (name) {
            case 'Dashboard': return <HomeIcon />; case 'Patients': return <Users2 />; case 'Sales': return <ShoppingCart />; case 'Sales Reports': return <BarChart />; case 'Warehouse Stock': return <Warehouse />; case 'Store Stock': return <Package />; case 'Medicine Master': return <Pill />; case 'Manufacturer Master': return <Building />; case 'Add Stock': return <PlusSquare />; case 'Return to Manufacturer': return <Undo />; case 'Stock Transfer': return <GitBranch />; case 'Inventory Reports': return <BarChart />; case 'Valuation Report': return <TrendingUp />; case 'Diseases': return <Activity />; case 'Admin': return <Settings />; default: return <LayoutGrid />;
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
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger />
           <div className="flex w-full items-center justify-between">
              <h1 className="text-xl font-semibold">Store Stock Status</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <div className="flex-shrink-0">
                            <CardTitle>Detailed Stock Ledger</CardTitle>
                            <CardDescription>Generate a detailed report of stock movement for the selected store.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Card>
                        <CardHeader>
                           <CardTitle>Filter Report</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-end">
                            <div className="w-full sm:w-auto space-y-2">
                                <p className="text-sm font-medium">Store</p>
                                <Select 
                                    value={selectedStore} 
                                    onValueChange={setSelectedStore}
                                    disabled={user?.role === 'Pharmacist' && availableStores.length === 1}
                                 >
                                    <SelectTrigger className="w-full sm:w-[200px]">
                                        <SelectValue placeholder="Select a store" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableStores.map(store => (
                                            <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full sm:w-auto space-y-2">
                                <p className="text-sm font-medium">Date Range</p>
                                <DateRangePicker onUpdate={(v) => (filtersRef.current.dateRange = v.range)} />
                            </div>
                             <div className="w-full sm:w-auto space-y-2 flex-grow">
                                <p className="text-sm font-medium">Medicine</p>
                                <Select onValueChange={(value) => filtersRef.current.medicineId = value} defaultValue="all">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Medicine" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Medicines</SelectItem>
                                        {allMedicines.map(med => <SelectItem key={med.id} value={med.id}>{med.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-full sm:w-auto flex gap-2">
                                <Button onClick={calculateStockLedger} disabled={isLedgerLoading} className="w-full sm:w-auto">
                                    {isLedgerLoading ? 'Generating...' : 'Apply Filters'}
                                </Button>
                                <Button variant="outline" onClick={() => { setStockLedger([]); filtersRef.current = {medicineId: 'all'}; }} className="w-full sm:w-auto">Reset</Button>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-between items-center">
                         <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search medicine..."
                                className="w-full sm:w-[300px] pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="sm" onClick={handleDownloadReport} className="ml-auto">
                            <Download className="mr-2 h-4 w-4" />
                            Download Report
                        </Button>
                    </div>
                    <div className="relative w-full overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Medicine</TableHead>
                                    <TableHead className="text-right">Opening</TableHead>
                                    <TableHead className="text-right">Received</TableHead>
                                    <TableHead className="text-right">Returned</TableHead>
                                    <TableHead className="text-right">Sales</TableHead>
                                    <TableHead className="text-right font-bold">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                            {isLedgerLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : stockLedger.length > 0 ? stockLedger.filter(item => item.medicineName.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                                <TableRow key={item.medicineId}>
                                    <TableCell className="font-medium">{item.medicineName}</TableCell>
                                    <TableCell className="text-right">{item.opening}</TableCell>
                                    <TableCell className="text-right text-green-600">+{item.received}</TableCell>
                                    <TableCell className="text-right text-orange-600">-{item.returned}</TableCell>
                                    <TableCell className="text-right text-red-600">-{item.sales}</TableCell>
                                    <TableCell className="text-right font-bold">{item.balance}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        {pageLoading ? 'Loading store data...' : (filtersRef.current.dateRange ? 'No stock movement data for this period.' : 'Please select a date range and apply filters to see the report.')}
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
