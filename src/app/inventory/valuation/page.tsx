
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, Download, TrendingUp, Pill, Building, Undo, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getMedicines, Medicine } from "@/services/medicine-service";
import { getAvailableStockForLocation, InventoryItem } from "@/services/inventory-service";
import { getManufacturers, Manufacturer } from "@/services/manufacturer-service";
import { format } from 'date-fns';

interface ValuationItem {
    medicineId: string;
    medicineName: string;
    manufacturerId: string;
    manufacturerName: string;
    purchasePrice: number;
    quantity: number;
    valuation: number;
}

const allStores = [
    { id: "all", name: "All Locations" },
    { id: "warehouse", name: "Main Warehouse" },
    { id: "STR002", name: "Downtown Pharmacy" },
    { id: "STR003", name: "Uptown Health" },
];

export default function ValuationReportPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [pageLoading, setPageLoading] = useState(true);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [allInventory, setAllInventory] = useState<InventoryItem[]>([]);
    const [valuationData, setValuationData] = useState<ValuationItem[]>([]);

    const filtersRef = useRef({ store: "all", manufacturer: "all" });

    const availableStores = useMemo(() => {
        if (user?.role === 'Admin') return allStores;
        if (user?.role === 'Pharmacist' && user.assignedStore) {
            return allStores.filter(s => s.id === user.assignedStore);
        }
        return [];
    }, [user]);
    
     const fetchData = useCallback(async () => {
        setPageLoading(true);
        try {
            const [meds, mans, warehouseStock, downtownStock, uptownStock] = await Promise.all([
                getMedicines(),
                getManufacturers(),
                getAvailableStockForLocation("warehouse"),
                getAvailableStockForLocation("STR002"),
                getAvailableStockForLocation("STR003"),
            ]);
            setMedicines(meds);
            setManufacturers(mans);
            setAllInventory([...warehouseStock, ...downtownStock, ...uptownStock]);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load necessary data for valuation.' });
        }
        setPageLoading(false);
    }, [toast]);
    
    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, fetchData]);

    const calculateValuation = useCallback(() => {
        const medicineMap = new Map(medicines.map(m => [m.id, m]));
        let filteredInventory = [...allInventory];

        if (filtersRef.current.store !== 'all') {
            filteredInventory = filteredInventory.filter(item => item.locationId === filtersRef.current.store);
        }

        const valuationMap = new Map<string, ValuationItem>();

        for (const item of filteredInventory) {
            const medicineDetails = medicineMap.get(item.medicineId);
            if (!medicineDetails) continue;

            if (filtersRef.current.manufacturer !== 'all' && medicineDetails.manufacturerId !== filtersRef.current.manufacturer) {
                continue;
            }

            const existing = valuationMap.get(item.medicineId);
            if (existing) {
                existing.quantity += item.quantity;
                existing.valuation += item.quantity * medicineDetails.purchasePrice;
            } else {
                valuationMap.set(item.medicineId, {
                    medicineId: item.medicineId,
                    medicineName: item.medicineName,
                    manufacturerId: medicineDetails.manufacturerId,
                    manufacturerName: medicineDetails.manufacturerName,
                    purchasePrice: medicineDetails.purchasePrice,
                    quantity: item.quantity,
                    valuation: item.quantity * medicineDetails.purchasePrice,
                });
            }
        }
        setValuationData(Array.from(valuationMap.values()));
    }, [medicines, allInventory]);

    // Initial calculation on data load
    useEffect(() => {
        if (!pageLoading) {
            calculateValuation();
        }
    }, [pageLoading, calculateValuation]);
    
     const handleApplyFilters = () => {
        calculateValuation();
        toast({ title: 'Filters Applied', description: 'Valuation report has been updated.' });
    };

    const handleResetFilters = () => {
        filtersRef.current = { store: "all", manufacturer: "all" };
        calculateValuation();
        toast({ title: 'Filters Reset', description: 'Showing complete valuation report.' });
    };

    const handleDownloadReport = () => {
        if (valuationData.length === 0) {
            toast({ variant: "destructive", title: "No data", description: "There is no data to download." });
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,";
        const headers = ["Medicine", "Manufacturer", "Purchase Price", "Total Quantity", "Valuation"];
        csvContent += headers.join(",") + "\r\n";

        valuationData.forEach(item => {
            const row = [
                `"${item.medicineName}"`,
                `"${item.manufacturerName}"`,
                item.purchasePrice.toFixed(2),
                item.quantity,
                item.valuation.toFixed(2)
            ];
            csvContent += row.join(",") + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `stock_valuation_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const sidebarRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path !== '/');
    }, []);

     useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
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
    
    const stockManagementRoutes = sidebarRoutes.filter(r => r.path.startsWith('/inventory/') && r.inSidebar);
    const totalValuation = valuationData.reduce((acc, item) => acc + item.valuation, 0);

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
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 group-[[data-sidebar-state=expanded]]:sm:pl-56">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger />
           <div className="flex w-full items-center justify-between">
              <h1 className="text-xl font-semibold">Stock Valuation Report</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <CardTitle>Inventory Valuation</CardTitle>
                            <CardDescription>Calculate the financial value of your inventory based on purchase price.</CardDescription>
                        </div>
                         <div className="flex flex-wrap items-center gap-4">
                            <Select 
                                defaultValue={filtersRef.current.store} 
                                onValueChange={(v) => (filtersRef.current.store = v)}
                                disabled={user?.role === 'Pharmacist' && availableStores.length === 1}
                            >
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Select Location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableStores.map(store => (
                                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select 
                                defaultValue={filtersRef.current.manufacturer} 
                                onValueChange={(v) => (filtersRef.current.manufacturer = v)}
                            >
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Select Manufacturer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Manufacturers</SelectItem>
                                     {manufacturers.map(man => (
                                        <SelectItem key={man.id} value={man.id}>{man.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                                <Button onClick={handleApplyFilters}>Apply</Button>
                                <Button onClick={handleResetFilters} variant="outline">Reset</Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[200px]">Medicine</TableHead>
                                    <TableHead>Manufacturer</TableHead>
                                    <TableHead className="text-right">Unit Price (₹)</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right font-bold">Valuation (₹)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pageLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : valuationData.length > 0 ? (
                                    valuationData.map((item) => (
                                        <TableRow key={item.medicineId}>
                                            <TableCell className="font-medium">{item.medicineName}</TableCell>
                                            <TableCell>{item.manufacturerName}</TableCell>
                                            <TableCell className="text-right">{item.purchasePrice.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right font-bold">{item.valuation.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                  <TableRow><TableCell colSpan={5} className="h-24 text-center">No data to display for the selected filters.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="mt-6 flex justify-between items-center">
                        <Button size="sm" variant="outline" onClick={handleDownloadReport}><Download className="mr-2" /> Download Report</Button>
                        <div className="text-right">
                            <p className="text-lg font-bold">Total Stock Valuation: ₹{totalValuation.toFixed(2)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </main>
      </div>
    </div>
  );
}
