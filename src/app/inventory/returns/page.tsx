
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, Undo, PlusCircle, Trash2, Pill, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";

interface ReturnItem {
    id: number;
    medicine: string;
    medicineLabel: string;
    quantity: number;
}

const medicineOptions: any[] = [];


export default function ReturnToManufacturerPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [currentReturnItem, setCurrentReturnItem] = useState({ medicine: "", quantity: 1 });
    const [debitNoteNumber, setDebitNoteNumber] = useState("");

    const sidebarRoutes = useMemo(() => allAppRoutes.filter(route => route.path !== '/'), []);
    const stockManagementRoutes = useMemo(() => allAppRoutes.filter(route => route.path.startsWith('/inventory/') && route.inSidebar && hasPermission(route.path)), [hasPermission]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);


    const handleAddReturnItem = () => {
        const selectedMedicine = medicineOptions.find(m => m.value === currentReturnItem.medicine);
        if (!selectedMedicine || currentReturnItem.quantity <= 0) return;

        const newItem: ReturnItem = {
            id: Date.now(),
            medicine: selectedMedicine.value,
            medicineLabel: selectedMedicine.label,
            quantity: currentReturnItem.quantity,
        };

        setReturnItems(prevItems => [...prevItems, newItem]);
        setCurrentReturnItem({ medicine: "", quantity: 1 });
    };

    const handleRemoveReturnItem = (id: number) => {
        setReturnItems(returnItems.filter(item => item.id !== id));
    };

    const handleProcessReturn = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!debitNoteNumber) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a Debit Note number.' });
            return;
        }
        if (returnItems.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please add at least one item to return.' });
            return;
        }

        // In a real app, this would be an API call
        console.log({ debitNoteNumber, items: returnItems });
        toast({ title: 'Success', description: 'Return processed and stock updated.' });
        setReturnItems([]);
        setDebitNoteNumber("");
    }

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
              <h1 className="text-xl font-semibold">Return to Manufacturer</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Create Debit Note for Returns</CardTitle>
                    <CardDescription>Select items from the warehouse to return to the manufacturer.</CardDescription>
                </CardHeader>
                <CardContent>
                     <form className="space-y-6" onSubmit={handleProcessReturn}>
                        <div className="space-y-2">
                            <Label htmlFor="debit-note-number">Debit Note (DN) Number</Label>
                            <Input id="debit-note-number" placeholder="e.g., DN-2024-001" value={debitNoteNumber} onChange={e => setDebitNoteNumber(e.target.value)} required />
                        </div>
                        
                        <div className="p-4 border rounded-lg space-y-4">
                            <h3 className="font-semibold">Add Medicine to Return</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="return-medicine">Medicine (from WH)</Label>
                                    <Select value={currentReturnItem.medicine} onValueChange={(value) => setCurrentReturnItem({...currentReturnItem, medicine: value})}>
                                        <SelectTrigger id="return-medicine"><SelectValue placeholder="Select medicine" /></SelectTrigger>
                                        <SelectContent>{medicineOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
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
                            <Undo className="mr-2 h-4 w-4" />
                            Process Return
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
      </div>
    </div>
  );
}
