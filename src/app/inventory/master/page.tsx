
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, MoreHorizontal, Trash2, Pill, Undo, Building } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


interface MedicineMaster {
    id: string;
    name: string;
    hsnCode: string;
    purchasePrice: number;
    sellingPrice: number;
    gstSlab: string;
    minStockLevel: number;
    unitType: string;
}

const initialMedicines: MedicineMaster[] = [
    { id: "MED001", name: "Aspirin 100mg", hsnCode: "300490", purchasePrice: 1.00, sellingPrice: 1.20, gstSlab: "5", minStockLevel: 100, unitType: 'PCS' },
    { id: "MED002", name: "Ibuprofen 200mg", hsnCode: "300490", purchasePrice: 2.50, sellingPrice: 3.00, gstSlab: "12", minStockLevel: 50, unitType: 'PCS' },
    { id: "MED003", name: "Paracetamol 500mg", hsnCode: "300490", purchasePrice: 0.50, sellingPrice: 0.60, gstSlab: "5", minStockLevel: 200, unitType: 'PCS' },
    { id: "MED004", name: "Amoxicillin 250mg", hsnCode: "300450", purchasePrice: 8.00, sellingPrice: 9.50, gstSlab: "12", minStockLevel: 50, unitType: 'STRIP' },
    { id: "MED005", name: "Atorvastatin 20mg", hsnCode: "300490", purchasePrice: 15.00, sellingPrice: 18.00, gstSlab: "12", minStockLevel: 75, unitType: 'PCS' },
];

export default function MedicineMasterPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const [medicines, setMedicines] = useState<MedicineMaster[]>(initialMedicines);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const sidebarRoutes = useMemo(() => allAppRoutes.filter(route => route.path !== '/'), []);
    const stockManagementRoutes = useMemo(() => allAppRoutes.filter(route => route.path.startsWith('/inventory/') && route.inSidebar && hasPermission(route.path)), [hasPermission]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleDelete = (id: string) => {
        setMedicines(medicines.filter(d => d.id !== id));
        toast({ title: "Success", description: "Medicine removed from master list." });
    };

    const handleAddMedicine = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("medicine-name") as string;
        const hsnCode = formData.get("hsn-code") as string;
        const purchasePrice = parseFloat(formData.get("purchase-price") as string);
        const sellingPrice = parseFloat(formData.get("selling-price") as string);
        const gstSlab = formData.get("gst-slab") as string;
        const minStockLevel = parseInt(formData.get("min-stock") as string, 10);
        const unitType = formData.get("unit-type") as string;

        if (name && hsnCode && purchasePrice && sellingPrice && gstSlab && minStockLevel && unitType) {
            const newMedicine: MedicineMaster = {
                id: `MED${(medicines.length + 1).toString().padStart(3, '0')}`,
                name,
                hsnCode,
                purchasePrice,
                sellingPrice,
                gstSlab,
                minStockLevel,
                unitType,
            };
            setMedicines([...medicines, newMedicine]);
            toast({ title: "Success", description: "Medicine added to master list." });
            setIsAddModalOpen(false);
            e.currentTarget.reset();
        } else {
            toast({ variant: "destructive", title: "Error", description: "Please fill all fields." });
        }
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
                <h1 className="text-xl font-semibold">Medicine Master</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <PlusSquare className="mr-2 h-4 w-4"/>
                        Add Medicine
                    </Button>
                    <ThemeToggle />
                </div>
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Medicine Master List</CardTitle>
                    <CardDescription>Central repository of all medicines available in the pharmacy.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden sm:table-cell">ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden md:table-cell">HSN</TableHead>
                                <TableHead className="hidden md:table-cell text-right">Selling Price (₹)</TableHead>
                                <TableHead className="hidden md:table-cell text-right">Unit</TableHead>
                                <TableHead className="hidden md:table-cell text-right">Min Stock</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {medicines.map((med) => (
                                <TableRow key={med.id}>
                                    <TableCell className="hidden sm:table-cell font-medium">{med.id}</TableCell>
                                    <TableCell>{med.name}</TableCell>
                                    <TableCell className="hidden md:table-cell">{med.hsnCode}</TableCell>
                                    <TableCell className="hidden md:table-cell text-right">{med.sellingPrice.toFixed(2)}</TableCell>
                                    <TableCell className="hidden md:table-cell text-right">{med.unitType}</TableCell>
                                    <TableCell className="hidden md:table-cell text-right">{med.minStockLevel}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDelete(med.id)} className="text-destructive">
                                                   <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </main>
      </div>

       <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogContent className="sm:max-w-lg">
                 <form onSubmit={handleAddMedicine}>
                    <DialogHeader>
                        <DialogTitle>Add New Medicine</DialogTitle>
                        <DialogDescription>
                            Define a new medicine in the master list with its properties.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="medicine-name">Medicine Name</Label>
                            <Input id="medicine-name" name="medicine-name" placeholder="e.g., Paracetamol 500mg" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="hsn-code">HSN Code</Label>
                                <Input id="hsn-code" name="hsn-code" placeholder="e.g., 300490" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="gst-slab">GST Slab</Label>
                                <Select name="gst-slab" required>
                                    <SelectTrigger id="gst-slab">
                                        <SelectValue placeholder="Select GST %" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">0%</SelectItem>
                                        <SelectItem value="5">5%</SelectItem>
                                        <SelectItem value="12">12%</SelectItem>
                                        <SelectItem value="18">18%</SelectItem>
                                        <SelectItem value="28">28%</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="purchase-price">Default Purchase Price (₹)</Label>
                                <Input id="purchase-price" name="purchase-price" type="number" step="0.01" placeholder="9.50" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="selling-price">Selling Price (₹)</Label>
                                <Input id="selling-price" name="selling-price" type="number" step="0.01" placeholder="10.50" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min-stock">Minimum Stock Level</Label>
                                <Input id="min-stock" name="min-stock" type="number" placeholder="50" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit-type">Unit Type</Label>
                                <Select name="unit-type" required>
                                    <SelectTrigger id="unit-type">
                                        <SelectValue placeholder="Select Unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PCS">Pieces (PCS)</SelectItem>
                                        <SelectItem value="BOX">Box</SelectItem>
                                        <SelectItem value="STRIP">Strip</SelectItem>
                                        <SelectItem value="BTL">Bottle (BTL)</SelectItem>
                                        <SelectItem value="TUBE">Tube</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Add to Master</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
