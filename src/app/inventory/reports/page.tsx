
"use client";

import { useMemo, useEffect, useState, useCallback, useRef } from "react";
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, Download, TrendingUp, Undo, Pill, Building, Search, BarChart2, Eye, Edit, HeartCrack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Transfer, getTransfers } from "@/services/transfer-service";
import { InventoryItem, getAvailableStockForLocation } from "@/services/inventory-service";
import { Medicine, getMedicines } from "@/services/medicine-service";
import { Manufacturer, getManufacturers } from "@/services/manufacturer-service";
import { Purchase, getPurchases } from "@/services/purchase-service";
import { useToast } from "@/hooks/use-toast";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { DateRange } from "react-day-picker";
import { format, parseISO, isWithinInterval } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";


const allStores = [
    { id: "all", name: "All Stores" },
    { id: "warehouse", name: "Main Warehouse" },
    { id: "STR002", name: "Downtown Pharmacy" },
    { id: "STR003", name: "Uptown Health" },
];

const storeIdToKeyMap: Record<string, 'warehouse' | 'downtown' | 'uptown'> = {
    "warehouse": "warehouse",
    "STR002": "downtown",
    "STR003": "uptown"
};


export default function StockReportsPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    
    // Data states
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [stockLevels, setStockLevels] = useState<any[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    
    // Active filters state
    const [activeTab, setActiveTab] = useState("levels");
    const [filteredStockLevels, setFilteredStockLevels] = useState<any[]>([]);
    const [filteredTransfers, setFilteredTransfers] = useState<Transfer[]>([]);
    const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
    
    // Refs for pending filter values
    const stockFiltersRef = useRef({ store: "all", manufacturer: "all", search: "" });
    const transferFiltersRef = useRef({ store: "all", dateRange: undefined as DateRange | undefined, searchId: "" });
    const purchaseFiltersRef = useRef({ manufacturer: "all", dateRange: undefined as DateRange | undefined, searchId: "" });

    const [dataLoading, setDataLoading] = useState(true);
    
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedItemDetails, setSelectedItemDetails] = useState<Purchase | Transfer | null>(null);

     const availableStores = useMemo(() => {
        if (user?.role === 'Admin') return allStores;
        if (user?.role === 'Pharmacist' && user.assignedStore) {
            return allStores.filter(s => s.id === user.assignedStore || s.id === 'all');
        }
        return [];
    }, [user]);

    const fetchReportsData = useCallback(async () => {
        setDataLoading(true);
        try {
            const [transfersData, downtownStock, uptownStock, warehouseStock, medicinesData, manufacturersData, purchasesData] = await Promise.all([
                getTransfers(),
                getAvailableStockForLocation("STR002"),
                getAvailableStockForLocation("STR003"),
                getAvailableStockForLocation("warehouse"),
                getMedicines(),
                getManufacturers(),
                getPurchases(),
            ]);
            setTransfers(transfersData);
            setMedicines(medicinesData);
            setManufacturers(manufacturersData);
            setPurchases(purchasesData);

            const allStockItems = new Map<string, any>();
             const processStock = (stock: InventoryItem[], locationKey: 'downtown' | 'uptown' | 'warehouse') => {
                stock.forEach(item => {
                    const medicineInfo = medicinesData.find(m => m.id === item.medicineId);
                    if (!allStockItems.has(item.medicineId)) {
                        allStockItems.set(item.medicineId, {
                            medicineId: item.medicineId,
                            medicineName: item.medicineName,
                            manufacturerId: medicineInfo?.manufacturerId,
                            warehouse: 0,
                            downtown: 0,
                            uptown: 0,
                        });
                    }
                    allStockItems.get(item.medicineId)[locationKey] = item.quantity;
                });
            };

            processStock(downtownStock, 'downtown');
            processStock(uptownStock, 'uptown');
            processStock(warehouseStock, 'warehouse');
            
            const combinedStock = Array.from(allStockItems.values()).map(item => ({
                ...item,
                total: item.warehouse + item.downtown + item.uptown,
            }));

            setStockLevels(combinedStock);
            setFilteredStockLevels(combinedStock);
            setFilteredTransfers(transfersData);
            setFilteredPurchases(purchasesData);

        } catch (error) {
            console.error(error)
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load report data.' });
        }
        setDataLoading(false);
    }, [toast]);

    useEffect(() => {
        if(user) {
            fetchReportsData();
        }
    }, [user, fetchReportsData]);

    const applyFilters = (tab: string) => {
        if (tab === 'levels') {
            let filtered = [...stockLevels];
            const storeFilter = stockFiltersRef.current.store;
            const manufacturerFilter = stockFiltersRef.current.manufacturer;
            const searchFilter = stockFiltersRef.current.search.toLowerCase();

            if (searchFilter) {
                filtered = filtered.filter(item => item.medicineName.toLowerCase().includes(searchFilter));
            }
            if (storeFilter !== 'all') {
                const storeKey = storeIdToKeyMap[storeFilter];
                if (storeKey) {
                    filtered = filtered.filter(item => item[storeKey] > 0);
                }
            }
            if (manufacturerFilter !== 'all') {
                filtered = filtered.filter(item => item.manufacturerId === manufacturerFilter);
            }
            setFilteredStockLevels(filtered);

        } else if (tab === 'transfers') {
            let filtered = [...transfers];
            if (transferFiltersRef.current.store !== 'all') {
                filtered = filtered.filter(t => t.from === transferFiltersRef.current.store || t.to === transferFiltersRef.current.store);
            }
            if (transferFiltersRef.current.dateRange?.from && transferFiltersRef.current.dateRange.to) {
                filtered = filtered.filter(t => isWithinInterval(parseISO(t.date), { start: transferFiltersRef.current.dateRange!.from!, end: transferFiltersRef.current.dateRange!.to! }));
            }
            if (transferFiltersRef.current.searchId) {
                filtered = filtered.filter(t => t.id.toLowerCase().includes(transferFiltersRef.current.searchId.toLowerCase()));
            }
            setFilteredTransfers(filtered);
        } else if (tab === 'purchase') {
             let filtered = [...purchases];
            if (purchaseFiltersRef.current.manufacturer !== 'all') {
                filtered = filtered.filter(p => p.manufacturerId === purchaseFiltersRef.current.manufacturer);
            }
            if (purchaseFiltersRef.current.dateRange?.from && purchaseFiltersRef.current.dateRange.to) {
                filtered = filtered.filter(p => isWithinInterval(parseISO(p.date), { start: purchaseFiltersRef.current.dateRange!.from!, end: purchaseFiltersRef.current.dateRange!.to! }));
            }
            if (purchaseFiltersRef.current.searchId) {
                filtered = filtered.filter(p => p.invoiceId.toLowerCase().includes(purchaseFiltersRef.current.searchId.toLowerCase()));
            }
            setFilteredPurchases(filtered);
        }
    };
    
    const resetFilters = (tab: string) => {
        if (tab === 'levels') {
            stockFiltersRef.current = { store: "all", manufacturer: "all", search: "" };
            setFilteredStockLevels(stockLevels);
        } else if (tab === 'transfers') {
            transferFiltersRef.current = { store: "all", dateRange: undefined, searchId: "" };
            setFilteredTransfers(transfers);
        } else if (tab === 'purchase') {
            purchaseFiltersRef.current = { manufacturer: "all", dateRange: undefined, searchId: "" };
            setFilteredPurchases(purchases);
        }
        // Re-render with default filters
        applyFilters(tab);
    }
    
    const openDetailsModal = (item: Purchase | Transfer) => {
        setSelectedItemDetails(item);
        setIsDetailModalOpen(true);
    };

    const downloadReport = (tab: string) => {
        let csvContent = "data:text/csv;charset=utf-8,";
        let headers: string[] = [];
        let rows: any[] = [];
        let filename = `report_${new Date().toISOString().split('T')[0]}.csv`;

        if (tab === 'levels') {
            headers = ["Medicine", "Warehouse", "Downtown", "Uptown", "Total Stock"];
            rows = filteredStockLevels;
            filename = `stock_levels_report.csv`;
            csvContent += headers.join(",") + "\n";
            rows.forEach(item => {
                let row = [ `"${item.medicineName}"`, item.warehouse, item.downtown, item.uptown, item.total ];
                csvContent += row.join(",") + "\n";
            });
        } else if (tab === 'transfers') {
            headers = ["ID", "From", "To", "Date", "Items", "Status"];
            rows = filteredTransfers;
            filename = `transfers_report.csv`;
            csvContent += headers.join(",") + "\n";
             rows.forEach(item => {
                let row = [ item.id, allStores.find(s => s.id === item.from)?.name, allStores.find(s => s.id === item.to)?.name, format(parseISO(item.date), 'dd MMM, yyyy'), item.items.length, item.status];
                csvContent += row.join(",") + "\n";
            });
        } else if (tab === 'purchase') {
            headers = ["Invoice ID", "Date", "Manufacturer", "Items", "Amount"];
            rows = filteredPurchases;
            filename = `purchases_report.csv`;
            csvContent += headers.join(",") + "\n";
             rows.forEach(item => {
                let row = [ item.invoiceId, format(parseISO(item.date), 'dd MMM, yyyy'), `"${item.manufacturerName}"`, item.items.length, item.totalAmount.toFixed(2)];
                csvContent += row.join(",") + "\n";
            });
        }
        
        if(rows.length === 0) {
            toast({ variant: 'destructive', title: 'No Data', description: 'Cannot download an empty report.'});
            return;
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const sidebarRoutes = useMemo(() => allAppRoutes.filter(route => route.path !== '/'), []);
    const stockManagementRoutes = useMemo(() => allAppRoutes.filter(route => route.path.startsWith('/inventory/') && route.inSidebar), []);

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
                {sidebarRoutes.filter(r => r.inSidebar && hasPermission(r.path) && !r.path.startsWith('/inventory/')).map((route) => {
                     const isParentRoute = sidebarRoutes.some(child => child.path.startsWith(route.path) && child.path !== route.path);
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
              <h1 className="text-xl font-semibold">Inventory Reports</h1>
               <div className="flex items-center gap-2">
                    <ThemeToggle />
               </div>
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <TabsList>
                        <TabsTrigger value="levels">Overall Stock Levels</TabsTrigger>
                        <TabsTrigger value="transfers">Inter-Store Transfers</TabsTrigger>
                        <TabsTrigger value="purchase">Purchase History</TabsTrigger>
                    </TabsList>
                    <Button variant="outline" size="sm" onClick={() => downloadReport(activeTab)}>
                       <Download className="mr-2 h-4 w-4"/> Download Report
                    </Button>
                </div>
                <TabsContent value="levels">
                     <Card>
                        <CardHeader>
                             <CardTitle>Overall Stock Levels</CardTitle>
                             <CardDescription>Aggregated stock counts across locations. Filter by store or manufacturer.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-grow">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input type="search" placeholder="Search by medicine name..." className="pl-8" defaultValue={stockFiltersRef.current.search} onChange={e => (stockFiltersRef.current.search = e.target.value)} />
                                </div>
                                <Select defaultValue={stockFiltersRef.current.store} onValueChange={(v) => (stockFiltersRef.current.store = v)} disabled={user?.role === 'Pharmacist' && availableStores.length === 1}>
                                    <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select Store" /></SelectTrigger>
                                    <SelectContent>{availableStores.map(store => (<SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>))}</SelectContent>
                                </Select>
                                <Select defaultValue={stockFiltersRef.current.manufacturer} onValueChange={(v) => (stockFiltersRef.current.manufacturer = v)}>
                                    <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select Manufacturer" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Manufacturers</SelectItem>
                                        {manufacturers.map(m => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => applyFilters('levels')}>Apply Filters</Button>
                                <Button onClick={() => resetFilters('levels')} variant="outline">Reset</Button>
                            </div>
                            <Table>
                                <TableHeader>
                                     <TableRow>
                                        <TableHead>Medicine</TableHead>
                                        <TableHead className="text-right">Warehouse</TableHead>
                                        <TableHead className="text-right">Downtown</TableHead>
                                        <TableHead className="text-right">Uptown</TableHead>
                                        <TableHead className="text-right font-bold">Total Stock</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {dataLoading ? (Array.from({length:5}).map((_, i) =>  <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-5"/></TableCell></TableRow>))
                                     : filteredStockLevels.length > 0 ? filteredStockLevels.map((item: any) => (
                                        <TableRow key={item.medicineId}>
                                            <TableCell className="font-medium">{item.medicineName}</TableCell>
                                            <TableCell className="text-right">{item.warehouse}</TableCell>
                                            <TableCell className="text-right">{item.downtown}</TableCell>
                                            <TableCell className="text-right">{item.uptown}</TableCell>
                                            <TableCell className="text-right font-bold">{item.total}</TableCell>
                                        </TableRow>
                                    )) : (
                                      <TableRow><TableCell colSpan={5} className="h-24 text-center">No data to display for the selected filters.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="transfers">
                    <Card>
                        <CardHeader>
                            <CardTitle>Transfer &amp; Return Report</CardTitle>
                            <CardDescription>History of all stock movements between warehouse and stores.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input type="search" placeholder="Search by Invoice/CNR ID..." className="pl-8 w-full sm:w-[200px]" defaultValue={transferFiltersRef.current.searchId} onChange={e => (transferFiltersRef.current.searchId = e.target.value)} />
                                </div>
                                <Select defaultValue={transferFiltersRef.current.store} onValueChange={(v) => (transferFiltersRef.current.store = v)} disabled={user?.role === 'Pharmacist' && availableStores.length === 1}>
                                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select Store" /></SelectTrigger>
                                    <SelectContent>{availableStores.map(store => (<SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>))}</SelectContent>
                                </Select>
                                <DateRangePicker onUpdate={(values) => (transferFiltersRef.current.dateRange = values.range)} />
                                <Button onClick={() => applyFilters('transfers')}>Apply Filters</Button>
                                <Button onClick={() => resetFilters('transfers')} variant="outline">Reset</Button>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>From</TableHead>
                                        <TableHead>To</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-center">No. of Items</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataLoading ? (Array.from({length:5}).map((_, i) =>  <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-5"/></TableCell></TableRow>))
                                    : filteredTransfers.length > 0 ? filteredTransfers.map((report) => (
                                        <TableRow key={report.id}>
                                            <TableCell className="font-medium">{report.id}</TableCell>
                                            <TableCell>{allStores.find(s => s.id === report.from)?.name}</TableCell>
                                            <TableCell>{allStores.find(s => s.id === report.to)?.name}</TableCell>
                                            <TableCell>{format(parseISO(report.date), 'dd MMM, yyyy')}</TableCell>
                                            <TableCell className="text-center">{report.items.length}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge>{report.status}</Badge>
                                            </TableCell>
                                             <TableCell className="text-right">
                                                <Button variant="outline" size="icon" onClick={() => openDetailsModal(report)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                      <TableRow><TableCell colSpan={7} className="h-24 text-center">No transfer data to display for the selected filters.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="purchase">
                    <Card>
                         <CardHeader>
                           <CardTitle>Purchase History</CardTitle>
                           <CardDescription>History of all stock purchases from manufacturers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input type="search" placeholder="Search by Invoice ID..." className="pl-8 w-full sm:w-[200px]" defaultValue={purchaseFiltersRef.current.searchId} onChange={e => (purchaseFiltersRef.current.searchId = e.target.value)} />
                                </div>
                                <Select defaultValue={purchaseFiltersRef.current.manufacturer} onValueChange={(v) => (purchaseFiltersRef.current.manufacturer = v)}>
                                    <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select Manufacturer" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Manufacturers</SelectItem>
                                        {manufacturers.map(m => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                <DateRangePicker onUpdate={(values) => (purchaseFiltersRef.current.dateRange = values.range)} />
                                <Button onClick={() => applyFilters('purchase')}>Apply Filters</Button>
                                <Button onClick={() => resetFilters('purchase')} variant="outline">Reset</Button>
                           </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Manufacturer</TableHead>
                                        <TableHead className="text-center">No. of Items</TableHead>
                                        <TableHead className="text-right">Amount (₹)</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataLoading ? (Array.from({length:5}).map((_, i) =>  <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-5"/></TableCell></TableRow>))
                                    : filteredPurchases.length > 0 ? filteredPurchases.map((purchase) => (
                                        <TableRow key={purchase.invoiceId}>
                                            <TableCell>{purchase.invoiceId}</TableCell>
                                            <TableCell>{format(parseISO(purchase.date), 'dd MMM, yyyy')}</TableCell>
                                            <TableCell>{purchase.manufacturerName}</TableCell>
                                            <TableCell className="text-center">{purchase.items.length}</TableCell>
                                            <TableCell className="text-right">{purchase.totalAmount.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="icon" onClick={() => openDetailsModal(purchase)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                      <TableRow><TableCell colSpan={6} className="h-24 text-center">No purchase data to display for the selected filters.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
      </div>

       <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
            <DialogContent className="sm:max-w-lg">
                 {selectedItemDetails && (
                    <>
                        <DialogHeader>
                            <DialogTitle>
                                {'invoiceId' in selectedItemDetails ? 'Purchase Details' : 'Transfer/Return Details'}
                            </DialogTitle>
                            <DialogDescription>
                                Invoice ID: {'invoiceId' in selectedItemDetails ? selectedItemDetails.invoiceId : selectedItemDetails.id}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Medicine</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        {'pricePerUnit' in selectedItemDetails.items[0] && <TableHead className="text-right">Price/Unit (₹)</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedItemDetails.items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.medicineName}</TableCell>
                                            <TableCell>{item.quantity}</TableCell>
                                            {'pricePerUnit' in item && <TableCell className="text-right">{item.pricePerUnit.toFixed(2)}</TableCell>}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    </div>
  );
}
