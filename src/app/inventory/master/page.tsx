
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
import { Medicine, getMedicines, addMedicine, updateMedicine, deleteMedicine } from "@/services/medicine-service";
import { Skeleton } from "@/components/ui/skeleton";


const defaultFormState: Omit<Medicine, 'id'> = {
    name: "",
    hsnCode: "",
    purchasePrice: 0,
    sellingPrice: 0,
    gstSlab: "",
    minStockLevel: 0,
    unitType: "",
};


export default function MedicineMasterPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
    const [formState, setFormState] = useState(defaultFormState);


    const sidebarRoutes = useMemo(() => allAppRoutes.filter(route => route.path !== '/'), []);
    const stockManagementRoutes = useMemo(() => allAppRoutes.filter(route => route.path.startsWith('/inventory/') && route.inSidebar && hasPermission(route.path)), [hasPermission]);

    const fetchMedicines = async () => {
        setDataLoading(true);
        try {
            const medicinesFromDb = await getMedicines();
            setMedicines(medicinesFromDb);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch medicines.'});
        }
        setDataLoading(false);
    };
    
    useEffect(() => {
        if(user) {
            fetchMedicines();
        }
    }, [user]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    const openAddModal = () => {
        setModalMode('add');
        setFormState(defaultFormState);
        setSelectedMedicine(null);
        setIsModalOpen(true);
    }

    const openEditModal = (medicine: Medicine) => {
        setModalMode('edit');
        setSelectedMedicine(medicine);
        setFormState({
            name: medicine.name,
            hsnCode: medicine.hsnCode,
            purchasePrice: medicine.purchasePrice,
            sellingPrice: medicine.sellingPrice,
            gstSlab: medicine.gstSlab,
            minStockLevel: medicine.minStockLevel,
            unitType: medicine.unitType,
        });
        setIsModalOpen(true);
    }
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const isNumberField = ['purchasePrice', 'sellingPrice', 'minStockLevel'].includes(name);
        setFormState(prev => ({ ...prev, [name]: isNumberField ? parseFloat(value) || 0 : value }));
    };

    const handleSelectChange = (name: 'gstSlab' | 'unitType', value: string) => {
        setFormState(prev => ({...prev, [name]: value}));
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteMedicine(id);
            await fetchMedicines();
            toast({ title: "Success", description: "Medicine removed from master list." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to remove medicine." });
        }
    };

    const handleAddOrUpdateMedicine = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const { name, hsnCode, purchasePrice, sellingPrice, gstSlab, minStockLevel, unitType } = formState;

        if (name && hsnCode && purchasePrice > 0 && sellingPrice > 0 && gstSlab && minStockLevel > 0 && unitType) {
            try {
                if(modalMode === 'edit' && selectedMedicine) {
                    await updateMedicine(selectedMedicine.id, formState);
                    toast({ title: "Success", description: "Medicine details updated." });
                } else {
                    await addMedicine(formState);
                    toast({ title: "Success", description: "Medicine added to master list." });
                }
                await fetchMedicines();
                setIsModalOpen(false);
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to save medicine." });
            }
        } else {
            toast({ variant: "destructive", title: "Error", description: "Please fill all fields correctly. Prices and stock must be greater than zero." });
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
                    <Button onClick={openAddModal}>
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
                            {dataLoading ? (
                                Array.from({length: 5}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell className="hidden md:table-cell text-right"><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell className="hidden md:table-cell text-right"><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell className="hidden md:table-cell text-right"><Skeleton className="h-4 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : medicines.map((med) => (
                                <TableRow key={med.id}>
                                    <TableCell className="font-medium">{med.name}</TableCell>
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
                                                <DropdownMenuItem onSelect={() => openEditModal(med)}>Edit</DropdownMenuItem>
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

       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-lg">
                 <form onSubmit={handleAddOrUpdateMedicine}>
                    <DialogHeader>
                        <DialogTitle>{modalMode === 'edit' ? 'Edit Medicine' : 'Add New Medicine'}</DialogTitle>
                        <DialogDescription>
                            {modalMode === 'edit' ? 'Update the details for this medicine.' : 'Define a new medicine in the master list with its properties.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Medicine Name</Label>
                            <Input id="name" name="name" value={formState.name} onChange={handleFormChange} placeholder="e.g., Paracetamol 500mg" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="hsnCode">HSN Code</Label>
                                <Input id="hsnCode" name="hsnCode" value={formState.hsnCode} onChange={handleFormChange} placeholder="e.g., 300490" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="gstSlab">GST Slab</Label>
                                <Select name="gstSlab" value={formState.gstSlab} onValueChange={(v) => handleSelectChange('gstSlab', v)} required>
                                    <SelectTrigger id="gstSlab">
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
                                <Label htmlFor="purchasePrice">Default Purchase Price (₹)</Label>
                                <Input id="purchasePrice" name="purchasePrice" value={formState.purchasePrice} onChange={handleFormChange} type="number" step="0.01" placeholder="9.50" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sellingPrice">Selling Price (₹)</Label>
                                <Input id="sellingPrice" name="sellingPrice" value={formState.sellingPrice} onChange={handleFormChange} type="number" step="0.01" placeholder="10.50" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                                <Input id="minStockLevel" name="minStockLevel" value={formState.minStockLevel} onChange={handleFormChange} type="number" placeholder="50" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unitType">Unit Type</Label>
                                <Select name="unitType" value={formState.unitType} onValueChange={(v) => handleSelectChange('unitType', v)} required>
                                    <SelectTrigger id="unitType">
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
                        <Button type="submit">{modalMode === 'edit' ? 'Save Changes' : 'Add to Master'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
