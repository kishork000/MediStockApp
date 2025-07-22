
"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, MoreHorizontal, Trash2, Pill, Undo, Building, Search, Eye } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { fetchGstDetails } from "@/services/gstin-service";
import { Manufacturer, addManufacturer, getManufacturers, updateManufacturer, deleteManufacturer } from "@/services/manufacturer-service";
import { Skeleton } from "@/components/ui/skeleton";


const defaultFormState: Omit<Manufacturer, 'id'> = {
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    gstin: "",
    cin: "",
};


export default function ManufacturerMasterPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
    
    const [formState, setFormState] = useState(defaultFormState);
    const [isFetchingGst, startFetchingGst] = useTransition();

    const sidebarRoutes = useMemo(() => allAppRoutes.filter(route => route.path !== '/'), []);
    const stockManagementRoutes = useMemo(() => allAppRoutes.filter(route => route.path.startsWith('/inventory/') && route.inSidebar && hasPermission(route.path)), [hasPermission]);

    const fetchManufacturers = async () => {
        setDataLoading(true);
        const manufacturersFromDb = await getManufacturers();
        setManufacturers(manufacturersFromDb);
        setDataLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchManufacturers();
        }
    }, [user]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    
    const openAddModal = () => {
        setFormState(defaultFormState);
        setIsAddModalOpen(true);
    };

    const openViewModal = (man: Manufacturer) => {
        setSelectedManufacturer(man);
        setIsViewModalOpen(true);
    };

    const openEditModal = (man: Manufacturer) => {
        setSelectedManufacturer(man);
        setFormState(man);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteManufacturer(id);
            await fetchManufacturers();
            toast({ title: "Success", description: "Manufacturer removed from master list." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to remove manufacturer." });
        }
    };

    const handleAddOrUpdateManufacturer = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const { name, contactPerson, email, phone, address, gstin } = formState;

        if (name && contactPerson && email && phone && address && gstin) {
            try {
                if(selectedManufacturer && isEditModalOpen) {
                    // Update
                    await updateManufacturer(selectedManufacturer.id, formState);
                    toast({ title: "Success", description: "Manufacturer details updated." });
                    setIsEditModalOpen(false);
                } else {
                    // Add
                    await addManufacturer(formState);
                    toast({ title: "Success", description: "Manufacturer added to master list." });
                    setIsAddModalOpen(false);
                }
                await fetchManufacturers();
                setFormState(defaultFormState);
                setSelectedManufacturer(null);
            } catch (error) {
                 toast({ variant: "destructive", title: "Error", description: "Failed to save manufacturer." });
            }
        } else {
            toast({ variant: "destructive", title: "Error", description: "Please fill all fields." });
        }
    };
    
    const handleFetchGstDetails = () => {
        if (!formState.gstin) {
            toast({ variant: "destructive", title: "Error", description: "Please enter a GSTIN to fetch details." });
            return;
        }

        startFetchingGst(async () => {
            const result = await fetchGstDetails(formState.gstin);
            if (result) {
                setFormState({
                    ...formState,
                    name: result.name,
                    address: result.address,
                });
                toast({ title: "Details Fetched", description: "Manufacturer details have been auto-filled." });
            } else {
                toast({ variant: "destructive", title: "Not Found", description: "Could not find details for this GSTIN. Please enter manually." });
            }
        });
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
                <h1 className="text-xl font-semibold">Manufacturer Master</h1>
                <div className="flex items-center gap-2">
                    <Button onClick={openAddModal} size="icon" className="sm:hidden">
                        <PlusSquare className="h-4 w-4"/>
                    </Button>
                     <Button onClick={openAddModal} size="sm" className="hidden sm:flex">
                        <PlusSquare className="mr-2 h-4 w-4"/>
                        Add Manufacturer
                    </Button>
                    <ThemeToggle />
                </div>
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Manufacturer Master List</CardTitle>
                    <CardDescription>Central repository of all medicine suppliers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden sm:table-cell">Contact Person</TableHead>
                                <TableHead className="hidden md:table-cell">GSTIN</TableHead>
                                <TableHead className="hidden lg:table-cell">Email</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dataLoading ? (
                                Array.from({length: 5}).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : manufacturers.map((man) => (
                                <TableRow key={man.id}>
                                    <TableCell className="font-medium">{man.name}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{man.contactPerson}</TableCell>
                                    <TableCell className="hidden md:table-cell">{man.gstin}</TableCell>
                                    <TableCell className="hidden lg:table-cell">{man.email}</TableCell>
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
                                                <DropdownMenuItem onSelect={() => openViewModal(man)}>
                                                    <Eye className="mr-2 h-4 w-4" /> View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => openEditModal(man)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDelete(man.id)} className="text-destructive">
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

       <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={isEditModalOpen ? setIsEditModalOpen : setIsAddModalOpen}>
            <DialogContent className="sm:max-w-lg">
                 <form onSubmit={handleAddOrUpdateManufacturer}>
                    <DialogHeader>
                        <DialogTitle>{isEditModalOpen ? "Edit Manufacturer" : "Add New Manufacturer"}</DialogTitle>
                        <DialogDescription>
                           {isEditModalOpen ? "Update the details for this supplier." : "Define a new supplier. Enter GSTIN to fetch details automatically (simulated)."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                             <Label htmlFor="gstin">GSTIN</Label>
                             <div className="flex gap-2">
                                <Input id="gstin" name="gstin" value={formState.gstin} onChange={handleFormChange} placeholder="15-digit GSTIN" required />
                                <Button type="button" variant="outline" size="icon" onClick={handleFetchGstDetails} disabled={isFetchingGst}>
                                    <Search className={isFetchingGst ? 'animate-spin' : ''} />
                                </Button>
                             </div>
                             <p className="text-xs text-muted-foreground">Try: 27AAFCT6913H1Z3 or 27AABCP5871N1Z5</p>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="name">Manufacturer Name</Label>
                            <Input id="name" name="name" value={formState.name} onChange={handleFormChange} placeholder="e.g., Cipla Inc." required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cin">CIN</Label>
                            <Input id="cin" name="cin" value={formState.cin} onChange={handleFormChange} placeholder="Corporate Identification Number" />
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson">Contact Person</Label>
                                <Input id="contactPerson" name="contactPerson" value={formState.contactPerson} onChange={handleFormChange} placeholder="e.g., Priya Singh" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" name="phone" value={formState.phone} onChange={handleFormChange} type="tel" placeholder="e.g., 9876543210" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" value={formState.email} onChange={handleFormChange} type="email" placeholder="e.g., priya.singh@cipla.com" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" name="address" value={formState.address} onChange={handleFormChange} placeholder="e.g., Cipla House, Peninsula Business Park, Mumbai" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedManufacturer(null); }}>Cancel</Button>
                        </DialogClose>
                        <Button type="submit">{isEditModalOpen ? "Save Changes" : "Add to Master"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        
        {selectedManufacturer && (
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{selectedManufacturer.name}</DialogTitle>
                        <DialogDescription>ID: {selectedManufacturer.id}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 text-sm">
                        <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                           <span className="font-semibold text-muted-foreground">GSTIN</span>
                           <span>{selectedManufacturer.gstin}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                           <span className="font-semibold text-muted-foreground">CIN</span>
                           <span>{selectedManufacturer.cin || 'N/A'}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                           <span className="font-semibold text-muted-foreground">Contact Person</span>
                           <span>{selectedManufacturer.contactPerson}</span>
                        </div>
                        <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                           <span className="font-semibold text-muted-foreground">Email</span>
                           <span>{selectedManufacturer.email}</span>
                        </div>
                         <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                           <span className="font-semibold text-muted-foreground">Phone</span>
                           <span>{selectedManufacturer.phone}</span>
                        </div>
                         <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                           <span className="font-semibold text-muted-foreground">Address</span>
                           <span>{selectedManufacturer.address}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" onClick={() => setSelectedManufacturer(null)}>Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
    </div>
  );
}
