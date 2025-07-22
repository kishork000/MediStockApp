
"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, Download, TrendingUp, Undo, Pill, Building, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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


const allStores = [
    { id: "all", name: "All Stores" },
    { id: "warehouse", name: "Main Warehouse" },
    { id: "STR002", name: "Downtown Pharmacy" },
    { id: "STR003", name: "Uptown Health" },
];


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

    // Filter states
    const [selectedStore, setSelectedStore] = useState("all");
    const [selectedManufacturer, setSelectedManufacturer] = useState("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [searchId, setSearchId] = useState("");

    const [dataLoading, setDataLoading] = useState(true);

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
             const processStock = (stock: InventoryItem[], locationKey: string) => {
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

    // Apply filters
    const filteredStockLevels = useMemo(() => {
        let filtered = [...stockLevels];

        if (selectedStore !== 'all') {
             const storeKey = allStores.find(s => s.id === selectedStore)?.name.toLowerCase().replace(/ /g, '') === 'downtownpharmacy' ? 'downtown' : allStores.find(s => s.id === selectedStore)?.name.toLowerCase() === 'uptownhealth' ? 'uptown' : 'warehouse';
             filtered = filtered.filter(item => item[storeKey] > 0);
        }
        
        if (selectedManufacturer !== 'all') {
            filtered = filtered.filter(item => item.manufacturerId === selectedManufacturer);
        }
        
        return filtered;
    }, [selectedStore, selectedManufacturer, stockLevels]);

    const filteredTransfers = useMemo(() => {
        let filtered = [...transfers];
        if (selectedStore !== 'all') {
            filtered = filtered.filter(t => t.from === selectedStore || t.to === selectedStore);
        }
        if (dateRange?.from && dateRange.to) {
            filtered = filtered.filter(t => isWithinInterval(parseISO(t.date), { start: dateRange.from!, end: dateRange.to! }));
        }
         if (searchId) {
            filtered = filtered.filter(t => t.id.toLowerCase().includes(searchId.toLowerCase()));
        }
        return filtered;
    }, [selectedStore, dateRange, searchId, transfers]);

    const filteredPurchases = useMemo(() => {
        let filtered = [...purchases];
         if (selectedManufacturer !== 'all') {
            filtered = filtered.filter(p => p.manufacturerId === selectedManufacturer);
        }
        if (dateRange?.from && dateRange.to) {
            filtered = filtered.filter(p => isWithinInterval(parseISO(p.date), { start: dateRange.from!, end: dateRange.to! }));
        }
        if (searchId) {
            filtered = filtered.filter(p => p.invoiceId.toLowerCase().includes(searchId.toLowerCase()));
        }
        return filtered;
    }, [selectedManufacturer, dateRange, searchId, purchases]);


    const sidebarRoutes = useMemo(() => allAppRoutes.filter(route => route.path !== '/'), []);
    const stockManagementRoutes = useMemo(() => allAppRoutes.filter(route => route.path.startsWith('/inventory/') && route.inSidebar && hasPermission(route.path)), [hasPermission]);

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
    
    const handleClearFilters = () => {
        setSelectedStore('all');
        setSelectedManufacturer('all');
        setDateRange(undefined);
        setSearchId('');
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
              <h1 className="text-xl font-semibold">Inventory Reports</h1>
               <div className="flex items-center gap-2">
                    <ThemeToggle />
               </div>
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs defaultValue="levels" onValueChange={handleClearFilters}>
                <TabsList>
                    <TabsTrigger value="levels">Overall Stock Levels</TabsTrigger>
                    <TabsTrigger value="transfers">Inter-Store Transfers</TabsTrigger>
                    <TabsTrigger value="purchase">Purchase History</TabsTrigger>
                </TabsList>
                <TabsContent value="levels">
                     <Card>
                        <CardHeader>
                             <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <CardTitle>Overall Stock Levels</CardTitle>
                                <div className="flex items-center gap-2">
                                     <Select value={selectedStore} onValueChange={setSelectedStore} disabled={user?.role === 'Pharmacist' && availableStores.length === 1}>
                                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select Store" /></SelectTrigger>
                                        <SelectContent>{availableStores.map(store => (<SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>))}</SelectContent>
                                    </Select>
                                     <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select Manufacturer" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Manufacturers</SelectItem>
                                            {manufacturers.map(m => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>
                             <CardDescription>Aggregated stock counts across locations. Filter by store or manufacturer.</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                     {dataLoading ? (Array.from({length:5}).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><div className="h-4 bg-muted rounded-full w-full animate-pulse"/></TableCell></TableRow>))
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
                             <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <CardTitle>Transfer &amp; Return Report</CardTitle>
                                <div className="flex flex-wrap items-center gap-2">
                                     <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input type="search" placeholder="Search by Invoice/CNR ID..." className="pl-8 w-full sm:w-[200px]" value={searchId} onChange={e => setSearchId(e.target.value)} />
                                    </div>
                                     <Select value={selectedStore} onValueChange={setSelectedStore} disabled={user?.role === 'Pharmacist' && availableStores.length === 1}>
                                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select Store" /></SelectTrigger>
                                        <SelectContent>{availableStores.map(store => (<SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>))}</SelectContent>
                                    </Select>
                                     <DateRangePicker onUpdate={(values) => setDateRange(values.range)} />
                                </div>
                            </div>
                            <CardDescription>History of all stock movements between warehouse and stores.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>From</TableHead>
                                        <TableHead>To</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-center">No. of Items</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataLoading ? (Array.from({length:5}).map((_, i) => <TableRow key={i}><TableCell colSpan={6}><div className="h-4 bg-muted rounded-full w-full animate-pulse"/></TableCell></TableRow>))
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
                                        </TableRow>
                                    )) : (
                                      <TableRow><TableCell colSpan={6} className="h-24 text-center">No transfer data to display for the selected filters.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="purchase">
                    <Card>
                         <CardHeader>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                               <CardTitle>Purchase History</CardTitle>
                               <div className="flex flex-wrap items-center gap-2">
                                     <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input type="search" placeholder="Search by Invoice ID..." className="pl-8 w-full sm:w-[200px]" value={searchId} onChange={e => setSearchId(e.target.value)} />
                                    </div>
                                     <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
                                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Select Manufacturer" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Manufacturers</SelectItem>
                                            {manufacturers.map(m => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                     <DateRangePicker onUpdate={(values) => setDateRange(values.range)} />
                               </div>
                           </div>
                           <CardDescription>History of all stock purchases from manufacturers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Manufacturer</TableHead>
                                        <TableHead className="text-center">No. of Items</TableHead>
                                        <TableHead className="text-right">Amount (₹)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dataLoading ? (Array.from({length:5}).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><div className="h-4 bg-muted rounded-full w-full animate-pulse"/></TableCell></TableRow>))
                                    : filteredPurchases.length > 0 ? filteredPurchases.map((purchase) => (
                                        <TableRow key={purchase.invoiceId}>
                                            <TableCell>{purchase.invoiceId}</TableCell>
                                            <TableCell>{format(parseISO(purchase.date), 'dd MMM, yyyy')}</TableCell>
                                            <TableCell>{purchase.manufacturerName}</TableCell>
                                            <TableCell className="text-center">{purchase.items.length}</TableCell>
                                            <TableCell className="text-right">{purchase.totalAmount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )) : (
                                      <TableRow><TableCell colSpan={5} className="h-24 text-center">No purchase data to display for the selected filters.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
      </div>
    </div>
  );
}
