
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, ArrowRightLeft, Undo2, PlusCircle, Trash2, LogOut, ChevronDown, Warehouse, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";


interface TransferItem {
    id: number;
    medicine: string;
    medicineLabel: string;
    quantity: number;
}

const medicineOptions = [
    { value: "aspirin", label: "Aspirin (WH Stock: 500)" },
    { value: "ibuprofen", label: "Ibuprofen (WH Stock: 800)" },
    { value: "paracetamol", label: "Paracetamol (WH Stock: 1200)" },
    { value: "amoxicillin", label: "Amoxicillin (WH Stock: 300)" },
];

const storeOptions = [
    { value: "store1", label: "Downtown Pharmacy" },
    { value: "store2", label: "Uptown Health" },
];

export default function StockTransferPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState("transfer");
    
    // State for Transfer
    const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
    const [currentTransferItem, setCurrentTransferItem] = useState({ medicine: "", quantity: 1 });
    
    // State for Return
    const [returnItems, setReturnItems] = useState<TransferItem[]>([]);
    const [currentReturnItem, setCurrentReturnItem] = useState({ medicine: "", quantity: 1 });


    const sidebarRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path !== '/');
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);


    const handleAddTransferItem = () => {
        const selectedMedicine = medicineOptions.find(m => m.value === currentTransferItem.medicine);
        if (!selectedMedicine || currentTransferItem.quantity <= 0) return;

        const newItem: TransferItem = {
            id: Date.now(),
            medicine: selectedMedicine.value,
            medicineLabel: selectedMedicine.label,
            quantity: currentTransferItem.quantity,
        };

        setTransferItems(prevItems => [...prevItems, newItem]);
        setCurrentTransferItem({ medicine: "", quantity: 1 });
    };

    const handleRemoveTransferItem = (id: number) => {
        setTransferItems(transferItems.filter(item => item.id !== id));
    };
    
    const handleAddReturnItem = () => {
        // In a real app, medicine options would be based on the selected store's stock
         const selectedMedicine = medicineOptions.find(m => m.value === currentReturnItem.medicine);
        if (!selectedMedicine || currentReturnItem.quantity <= 0) return;

        const newItem: TransferItem = {
            id: Date.now(),
            medicine: selectedMedicine.value,
            medicineLabel: selectedMedicine.label.replace("WH Stock", "Store Stock"), // Mock label
            quantity: currentReturnItem.quantity,
        };

        setReturnItems(prevItems => [...prevItems, newItem]);
        setCurrentReturnItem({ medicine: "", quantity: 1 });
    };

    const handleRemoveReturnItem = (id: number) => {
        setReturnItems(returnItems.filter(item => item.id !== id));
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
            case 'Dashboard': return <HomeIcon />;
            case 'Patients': return <Users2 />;
            case 'Sales': return <ShoppingCart />;
            case 'Warehouse Stock': return <Warehouse />;
            case 'Store Stock': return <Package />;
            case 'Add Medicine': return <PlusSquare />;
            case 'Stock Transfer': return <GitBranch />;
            case 'Inventory Reports': return <BarChart />;
            case 'Valuation Report': return <TrendingUp />;
            case 'Diseases': return <Activity />;
            case 'Admin': return <Settings />;
            default: return <LayoutGrid />;
        }
    };
    
    const stockManagementRoutes = sidebarRoutes.filter(r => r.path.startsWith('/inventory') && r.inSidebar);

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
                
                {sidebarRoutes.filter(r => !r.path.startsWith('/inventory/') && r.inSidebar && hasPermission(r.path)).map((route) => (
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
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger className="sm:hidden" />
           <div className="flex w-full items-center justify-between">
              <h1 className="text-xl font-semibold">Stock Transfer &amp; Returns</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="transfer">Transfer to Store</TabsTrigger>
                    <TabsTrigger value="return">Return to Warehouse</TabsTrigger>
                </TabsList>

                <TabsContent value="transfer">
                     <Card>
                        <CardHeader>
                            <CardTitle>Transfer Stock to Store</CardTitle>
                            <CardDescription>Move inventory from the main warehouse to a specific store.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="transfer-invoice-number">Transfer Invoice Number</Label>
                                        <Input id="transfer-invoice-number" placeholder="e.g., TINV-2024-001" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="destination-store">Destination Store</Label>
                                        <Select>
                                            <SelectTrigger id="destination-store">
                                                <SelectValue placeholder="Select a store" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {storeOptions.map(store => (
                                                    <SelectItem key={store.value} value={store.value}>{store.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                
                                <div className="p-4 border rounded-lg space-y-4">
                                    <h3 className="font-semibold">Add Medicine to Transfer</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="transfer-medicine">Medicine (from WH)</Label>
                                            <Select value={currentTransferItem.medicine} onValueChange={(value) => setCurrentTransferItem({...currentTransferItem, medicine: value})}>
                                                <SelectTrigger id="transfer-medicine"><SelectValue placeholder="Select medicine" /></SelectTrigger>
                                                <SelectContent>{medicineOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="transfer-quantity">Quantity</Label>
                                            <Input id="transfer-quantity" type="number" placeholder="1" value={currentTransferItem.quantity} onChange={(e) => setCurrentTransferItem({...currentTransferItem, quantity: parseInt(e.target.value, 10) || 1})} min="1"/>
                                        </div>
                                        <div className="flex items-end">
                                            <Button type="button" onClick={handleAddTransferItem} className="w-full"><PlusCircle className="mr-2" /> Add to List</Button>
                                        </div>
                                    </div>
                                </div>

                                {transferItems.length > 0 && (
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Medicine</TableHead>
                                                <TableHead className="text-center">Quantity</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transferItems.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.medicineLabel}</TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveTransferItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                                
                                <Button type="submit">
                                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                                    Process Transfer
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="return">
                     <Card>
                        <CardHeader>
                            <CardTitle>Return Stock to Warehouse</CardTitle>
                            <CardDescription>Return inventory from a store back to the main warehouse.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="return-store">Select Store</Label>
                                        <Select>
                                            <SelectTrigger id="return-store"><SelectValue placeholder="Select a store" /></SelectTrigger>
                                            <SelectContent>{storeOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cnr-number">Credit Note (CNR) Number</Label>
                                        <Input id="cnr-number" placeholder="e.g., CNR-2024-001" />
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg space-y-4">
                                    <h3 className="font-semibold">Add Medicine to Return</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="return-medicine">Medicine (from Store)</Label>
                                            <Select value={currentReturnItem.medicine} onValueChange={(value) => setCurrentReturnItem({...currentReturnItem, medicine: value})}>
                                                <SelectTrigger id="return-medicine"><SelectValue placeholder="Select medicine" /></SelectTrigger>
                                                <SelectContent>
                                                     {/* This would be dynamically populated based on selected store's stock */}
                                                    <SelectItem value="paracetamol">Paracetamol (Stock: 45)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="return-quantity">Quantity</Label>
                                            <Input id="return-quantity" type="number" placeholder="1" value={currentReturnItem.quantity} onChange={(e) => setCurrentReturnItem({...currentReturnItem, quantity: parseInt(e.target.value, 10) || 1})} min="1"/>
                                        </div>
                                        <div className="flex items-end">
                                            <Button type="button" onClick={handleAddReturnItem} className="w-full"><PlusCircle className="mr-2" /> Add to List</Button>
                                        </div>
                                    </div>
                                </div>

                                {returnItems.length > 0 && (
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Medicine</TableHead>
                                                <TableHead className="text-center">Quantity</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {returnItems.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.medicineLabel}</TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveReturnItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                                <Button type="submit">
                                    <Undo2 className="mr-2 h-4 w-4" />
                                    Process Return
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
      </div>
    </div>
  );
}
