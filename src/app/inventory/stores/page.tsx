
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, Search, Undo, Pill, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";


const allStores = [
    { id: "STR002", name: "Downtown Pharmacy" },
    { id: "STR003", name: "Uptown Health" },
];

const storeInventory: { [key: string]: any[] } = {
    "STR002": [],
    "STR003": [],
};

const medicineOptions = [
    { value: "all", name: "All Medicines" },
];

const getStatus = (quantity: number, minStockLevel: number) => {
    if (quantity <= 0) return "Out of Stock";
    if (quantity < minStockLevel) return "Low Stock";
    return "In Stock";
};

export default function StoreInventoryPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [selectedStore, setSelectedStore] = useState("");
    const [selectedMedicine, setSelectedMedicine] = useState("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    const availableStores = useMemo(() => {
        if (user?.role === 'Admin') {
            return allStores;
        }
        if (user?.role === 'Pharmacist' && user.assignedStore) {
            return allStores.filter(s => s.id === user.assignedStore);
        }
        return [];
    }, [user]);

    useEffect(() => {
        if (availableStores.length > 0 && !selectedStore) {
            setSelectedStore(availableStores[0].id);
        }
    }, [availableStores, selectedStore]);


    const filteredInventory = useMemo(() => {
        let inventory = storeInventory[selectedStore as keyof typeof storeInventory] || [];

        if (selectedMedicine !== 'all') {
            inventory = inventory.filter(item => item.value === selectedMedicine);
        }

        if (dateRange?.from && dateRange?.to) {
            const interval = { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) };
            inventory = inventory.filter(item => isWithinInterval(item.date, interval));
        }

        return inventory;

    }, [selectedStore, selectedMedicine, dateRange]);


    const sidebarRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path !== '/');
    }, []);

     const stockManagementRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path.startsWith('/inventory') && hasPermission(route.path));
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
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger className="sm:hidden" />
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
                            <CardTitle>View Store Inventory</CardTitle>
                            <CardDescription>Select a store to view its current stock levels.</CardDescription>
                        </div>
                        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:flex-row sm:flex-wrap">
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
                            <Select 
                                value={selectedMedicine}
                                onValueChange={setSelectedMedicine}
                            >
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Select Medicine" />
                                </SelectTrigger>
                                <SelectContent>
                                    {medicineOptions.map(med => (
                                        <SelectItem key={med.value} value={med.value}>{med.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <DateRangePicker onUpdate={(values) => setDateRange(values.range)} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Medicine</TableHead>
                                    <TableHead className="text-right hidden sm:table-cell">Open</TableHead>
                                    <TableHead className="text-right hidden sm:table-cell">Rcvd</TableHead>
                                    <TableHead className="text-right hidden sm:table-cell">Sold</TableHead>
                                    <TableHead className="text-right font-bold">Avail</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInventory.length > 0 ? filteredInventory.map((item) => {
                                    const status = getStatus(item.quantity, item.minStockLevel);
                                    return (
                                    <TableRow key={item.name}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-right hidden sm:table-cell">{item.opening}</TableCell>
                                        <TableCell className="text-right hidden sm:table-cell">{item.received}</TableCell>
                                        <TableCell className="text-right hidden sm:table-cell">{item.sales}</TableCell>
                                        <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={status === 'In Stock' ? 'default' : status === 'Low Stock' ? 'secondary' : 'destructive'}>
                                                {status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                )}) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            No stock data available for the selected filters.
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
