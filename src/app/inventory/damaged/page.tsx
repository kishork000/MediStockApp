
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, Undo, Pill, Building, Edit, BarChart2, HeartCrack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { getAvailableStockForLocation, InventoryItem } from "@/services/inventory-service";
import { recordDamagedStock } from "@/services/damaged-stock-service";
import { Skeleton } from "@/components/ui/skeleton";

const allLocations = [
    { id: "warehouse", name: "Main Warehouse" },
    { id: "STR002", name: "Downtown Pharmacy" },
    { id: "STR003", name: "Uptown Health" },
];


export default function DamagedStockPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [location, setLocation] = useState("");
    const [medicineId, setMedicineId] = useState("");
    const [quantity, setQuantity] = useState("1");
    const [reason, setReason] = useState("");
    
    const [locationStock, setLocationStock] = useState<InventoryItem[]>([]);
    const [isStockLoading, setIsStockLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const sidebarRoutes = useMemo(() => allAppRoutes.filter(route => route.path !== '/'), []);
    const stockManagementRoutes = useMemo(() => allAppRoutes.filter(route => route.path.startsWith('/inventory/') && hasPermission(route.path)), [hasPermission]);

    const handleLocationChange = useCallback(async (selectedLocation: string) => {
        setLocation(selectedLocation);
        setMedicineId("");
        setQuantity("1");
        setReason("");
        if (selectedLocation) {
            setIsStockLoading(true);
            try {
                const stock = await getAvailableStockForLocation(selectedLocation);
                setLocationStock(stock);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load stock for this location.' });
            } finally {
                setIsStockLoading(false);
            }
        } else {
            setLocationStock([]);
        }
    }, [toast]);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const selectedStockItem = locationStock.find(item => item.medicineId === medicineId);

        if (!location || !medicineId || !quantity || !reason.trim() || !user || !selectedStockItem) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields.' });
            return;
        }

        const qtyToRemove = parseInt(quantity, 10);
        if (isNaN(qtyToRemove) || qtyToRemove <= 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid, positive quantity.' });
            return;
        }
        
        if (qtyToRemove > selectedStockItem.quantity) {
             toast({ variant: 'destructive', title: 'Error', description: `Cannot remove more than available stock (${selectedStockItem.quantity}).` });
            return;
        }
        
        setIsSubmitting(true);
        try {
            await recordDamagedStock(
                location,
                medicineId,
                selectedStockItem.medicineName,
                qtyToRemove,
                reason,
                { id: user.id, name: user.name }
            );

            toast({ title: 'Success', description: 'Damaged stock has been recorded and inventory updated.' });
            
            // Reset form
            handleLocationChange(location); // Refetch stock for the location
            setMedicineId("");
            setQuantity("1");
            setReason("");

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to record damaged stock.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    

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
            case 'Universal Report': return <BarChart />;
            case 'Sales Reports': return <BarChart />;
            case 'Stock Ledger': return <BarChart2 />;
            case 'Warehouse Stock': return <Warehouse />;
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
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 group-[[data-sidebar-state=expanded]]:sm:pl-56">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger />
           <div className="flex w-full items-center justify-between">
              <h1 className="text-xl font-semibold">Damaged Stock Adjustment</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card className="max-w-2xl mx-auto w-full">
                <CardHeader>
                    <CardTitle>Record Damaged Stock</CardTitle>
                    <CardDescription>Use this form to write off damaged or expired stock. This action is irreversible and logged for auditing.</CardDescription>
                </CardHeader>
                <CardContent>
                     <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                           <Label htmlFor="location">Location</Label>
                           <Select value={location} onValueChange={handleLocationChange} required>
                               <SelectTrigger id="location">
                                   <SelectValue placeholder="Select a location" />
                               </SelectTrigger>
                               <SelectContent>
                                   {allLocations.map(loc => (
                                       <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                                   ))}
                               </SelectContent>
                           </Select>
                        </div>

                         <div className="space-y-2">
                           <Label htmlFor="medicine">Medicine</Label>
                           <Select value={medicineId} onValueChange={setMedicineId} disabled={!location || isStockLoading} required>
                               <SelectTrigger id="medicine">
                                   <SelectValue placeholder={isStockLoading ? "Loading medicines..." : "Select a medicine"} />
                               </SelectTrigger>
                               <SelectContent>
                                   {locationStock.map(item => (
                                       <SelectItem key={item.medicineId} value={item.medicineId}>{item.medicineName} (Avail: {item.quantity})</SelectItem>
                                   ))}
                               </SelectContent>
                           </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity to Write-Off</Label>
                            <Input id="quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} disabled={!medicineId} required min="1"/>
                        </div>
                       
                        <div className="space-y-2">
                           <Label htmlFor="reason">Reason for Damage/Write-Off</Label>
                           <Textarea id="reason" placeholder="e.g., Expired batch, Water damage to packaging." value={reason} onChange={e => setReason(e.target.value)} required />
                        </div>
                        
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : <><HeartCrack className="mr-2 h-4 w-4" /> Record Damaged Stock</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
      </div>
    </div>
  );
}
