
"use client";

import { useMemo, useEffect, useState } from "react";
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, Download, TrendingUp, Undo, Pill, Building } from "lucide-react";
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
import { Transfer, getTransfers } from "@/services/transfer-service";
import { InventoryItem, getAvailableStockForLocation } from "@/services/inventory-service";
import { useToast } from "@/hooks/use-toast";

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
    const [selectedStore, setSelectedStore] = useState("all");
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [stockLevels, setStockLevels] = useState<InventoryItem[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

     const availableStores = useMemo(() => {
        if (user?.role === 'Admin') return allStores;
        if (user?.role === 'Pharmacist' && user.assignedStore) {
            return allStores.filter(s => s.id === user.assignedStore || s.id === 'all');
        }
        return [];
    }, [user]);

    const fetchReportsData = async () => {
        setDataLoading(true);
        try {
            const [transfersData, downtownStock, uptownStock, warehouseStock] = await Promise.all([
                getTransfers(),
                getAvailableStockForLocation("STR002"),
                getAvailableStockForLocation("STR003"),
                getAvailableStockForLocation("warehouse"),
            ]);
            setTransfers(transfersData);

            const allStockItems = new Map<string, any>();

            const processStock = (stock: InventoryItem[], locationKey: string) => {
                stock.forEach(item => {
                    if (!allStockItems.has(item.medicineId)) {
                        allStockItems.set(item.medicineId, {
                            medicineId: item.medicineId,
                            medicineName: item.medicineName,
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

            setStockLevels(combinedStock as any);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load report data.' });
        }
        setDataLoading(false);
    }

    useEffect(() => {
        if(user) {
            fetchReportsData();
        }
    }, [user, toast]);

    useEffect(() => {
        if (user?.role === 'Pharmacist' && availableStores.length > 0) {
            setSelectedStore(availableStores[0].id);
        } else if (user?.role === 'Admin') {
            setSelectedStore('all');
        }
    }, [user, availableStores]);


    const filteredTransfers = useMemo(() => {
        if (selectedStore === 'all') return transfers;
        return transfers.filter(t => t.from === selectedStore || t.to === selectedStore);
    }, [selectedStore, transfers]);

    const filteredStockLevels = useMemo(() => {
        if (selectedStore === 'all' || selectedStore === 'warehouse') return stockLevels;
        const storeKey = allStores.find(s => s.id === selectedStore)?.name.toLowerCase().replace(' ', '') === 'downtownpharmacy' ? 'downtown' : 'uptown';
        
        return stockLevels
            .filter(item => item[storeKey] > 0)
            .map(item => ({
                medicineId: item.medicineId,
                medicineName: item.medicineName,
                storeStock: item[storeKey],
                warehouse: item.warehouse,
                total: item[storeKey] + item.warehouse,
            }));
    }, [selectedStore, stockLevels]);
    
    const stockLevelStoreName = useMemo(() => {
        return allStores.find(s => s.id === selectedStore)?.name || "Store Stock";
    }, [selectedStore]);


    const sidebarRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path !== '/');
    }, []);
    
    const stockManagementRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path.startsWith('/inventory/') && route.inSidebar && hasPermission(route.path));
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
                    <Select 
                        value={selectedStore} 
                        onValueChange={setSelectedStore}
                        disabled={user?.role === 'Pharmacist' && availableStores.length === 1}
                    >
                        <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Select Store" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableStores.map(store => (
                                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <ThemeToggle />
               </div>
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs defaultValue="levels">
                <TabsList>
                    <TabsTrigger value="levels">Overall Stock Levels</TabsTrigger>
                    <TabsTrigger value="transfers">Inter-Store Transfers</TabsTrigger>
                    <TabsTrigger value="purchase">Purchase & Returns</TabsTrigger>
                </TabsList>
                <TabsContent value="levels">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Overall Stock Levels</CardTitle>
                                <CardDescription>Aggregated stock counts across locations.</CardDescription>
                            </div>
                            <Button size="sm" variant="outline"><Download className="mr-2" /> Download Report</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                     <TableRow>
                                        <TableHead>Medicine</TableHead>
                                        {selectedStore === 'all' || selectedStore === 'warehouse' ? (
                                            <>
                                                <TableHead className="text-right">Warehouse</TableHead>
                                                <TableHead className="text-right">Downtown Pharmacy</TableHead>
                                                <TableHead className="text-right">Uptown Health</TableHead>
                                            </>
                                        ) : (
                                            <>
                                                <TableHead className="text-right">Warehouse</TableHead>
                                                <TableHead className="text-right">{stockLevelStoreName}</TableHead>
                                            </>
                                        )}
                                        <TableHead className="text-right font-bold">Total Stock</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {dataLoading ? (Array.from({length:5}).map((_, i) => <TableRow key={i}><TableCell colSpan={5}><div className="h-4 bg-muted rounded-full w-full animate-pulse"/></TableCell></TableRow>))
                                     : filteredStockLevels.length > 0 ? filteredStockLevels.map((item: any) => (
                                        <TableRow key={item.medicineId}>
                                            <TableCell className="font-medium">{item.medicineName}</TableCell>
                                            {selectedStore === 'all' || selectedStore === 'warehouse' ? (
                                                <>
                                                    <TableCell className="text-right">{item.warehouse}</TableCell>
                                                    <TableCell className="text-right">{item.downtown}</TableCell>
                                                    <TableCell className="text-right">{item.uptown}</TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell className="text-right">{item.warehouse}</TableCell>
                                                    <TableCell className="text-right">{item.storeStock}</TableCell>
                                                </>
                                            )}
                                            <TableCell className="text-right font-bold">{item.total}</TableCell>
                                        </TableRow>
                                    )) : (
                                      <TableRow><TableCell colSpan={5} className="h-24 text-center">No data to display.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="transfers">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Transfer &amp; Return Report</CardTitle>
                                <CardDescription>History of all stock movements between warehouse and stores.</CardDescription>
                            </div>
                            <Button size="sm" variant="outline"><Download className="mr-2" /> Download Report</Button>
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
                                            <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-center">{report.items.length}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge>{report.status}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                      <TableRow><TableCell colSpan={6} className="h-24 text-center">No transfer data to display.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="purchase">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Purchase &amp; Manufacturer Return History</CardTitle>
                                <CardDescription>History of all stock purchases and returns to manufacturers.</CardDescription>
                            </div>
                            <Button size="sm" variant="outline"><Download className="mr-2" /> Download Report</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-center">No. of Items</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                      <TableRow><TableCell colSpan={5} className="h-24 text-center">No data to display.</TableCell></TableRow>
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
