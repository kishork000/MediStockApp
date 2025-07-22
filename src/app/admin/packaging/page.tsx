
"use client";

import { useState, useMemo, useEffect } from "react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, MoreHorizontal, Trash2, Building, Pill, Undo } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { PackagingType, getPackagingTypes, addPackagingType, deletePackagingType } from "@/services/packaging-service";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function PackagingTypeMasterPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const [packagingTypes, setPackagingTypes] = useState<PackagingType[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newPackagingTypeName, setNewPackagingTypeName] = useState("");
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const sidebarRoutes = useMemo(() => allAppRoutes.filter(route => route.path !== '/'), []);
    const stockManagementRoutes = useMemo(() => allAppRoutes.filter(route => route.path.startsWith('/inventory/') && route.inSidebar && hasPermission(route.path)), [hasPermission]);

    const fetchPackagingTypes = async () => {
        setDataLoading(true);
        const typesFromDb = await getPackagingTypes();
        setPackagingTypes(typesFromDb);
        setDataLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchPackagingTypes();
        }
    }, [user]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    const confirmDelete = (id: string) => {
        setItemToDelete(id);
        setIsDeleteConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deletePackagingType(itemToDelete);
            await fetchPackagingTypes();
            toast({ title: "Success", description: "Packaging type deleted." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete packaging type." });
        } finally {
            setItemToDelete(null);
            setIsDeleteConfirmOpen(false);
        }
    };

    const handleAddPackagingType = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newPackagingTypeName.trim()) {
            try {
                await addPackagingType({ name: newPackagingTypeName.trim() });
                toast({ title: "Success", description: "Packaging type added." });
                await fetchPackagingTypes();
                setIsAddModalOpen(false);
                setNewPackagingTypeName("");
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to add packaging type." });
            }
        } else {
            toast({ variant: "destructive", title: "Error", description: "Please enter a name." });
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
                <SidebarHeader><SidebarMenuButton className="pointer-events-none"><LayoutGrid className="size-6" /><span className="text-lg font-semibold">MediStock</span></SidebarMenuButton></SidebarHeader>
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
                        {sidebarRoutes.filter(r => !r.path.startsWith('/inventory/') && r.inSidebar && hasPermission(r.path) && r.path !== '/admin').map((route) => (<SidebarMenuItem key={route.path}><SidebarMenuButton href={route.path} tooltip={route.name} isActive={pathname === route.path}>{getIcon(route.name)}<span>{route.name}</span></SidebarMenuButton></SidebarMenuItem>))}
                        {hasPermission('/inventory') && (
                            <Collapsible className="w-full" defaultOpen={pathname.startsWith('/inventory')}>
                                <CollapsibleTrigger asChild><SidebarMenuButton className="justify-between"><div className="flex items-center gap-3"><Package /><span>Stock Management</span></div><ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" /></SidebarMenuButton></CollapsibleTrigger>
                                <CollapsibleContent><SidebarMenu className="ml-7 mt-2 border-l pl-3">{stockManagementRoutes.map((route) => (<SidebarMenuItem key={route.path}><SidebarMenuButton href={route.path} tooltip={route.name} size="sm" isActive={pathname === route.path}>{getIcon(route.name)}<span>{route.name}</span></SidebarMenuButton></SidebarMenuItem>))}</SidebarMenu></CollapsibleContent>
                            </Collapsible>
                        )}
                        {hasPermission('/admin') && (<SidebarMenuItem><SidebarMenuButton href="/admin" tooltip="Admin" isActive={pathname.startsWith('/admin')}>{getIcon('Admin')}<span>Admin</span></SidebarMenuButton></SidebarMenuItem>)}
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter><SidebarMenu><SidebarMenuItem><SidebarMenuButton onClick={logout} tooltip="Logout"><LogOut /><span>Logout</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarFooter>
            </Sidebar>
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 group-[[data-sidebar-state=expanded]]:sm:pl-56">
                <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <SidebarTrigger />
                    <div className="flex w-full items-center justify-between">
                        <h1 className="text-xl font-semibold">Packaging Type Master</h1>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setIsAddModalOpen(true)} size="sm"><PlusSquare className="mr-2 h-4 w-4" /> Add Packaging Type</Button>
                            <ThemeToggle />
                        </div>
                    </div>
                </header>
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    <Card>
                        <CardHeader><CardTitle>Packaging Types</CardTitle><CardDescription>Manage the types of packaging for medicines (e.g., Box, Strip).</CardDescription></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {dataLoading ? (Array.from({ length: 3 }).map((_, i) => (<TableRow key={i}><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-8 w-8" /></TableCell></TableRow>)))
                                        : packagingTypes.map((type) => (<TableRow key={type.id}><TableCell className="font-medium">{type.name}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => confirmDelete(type.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </main>
            </div>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleAddPackagingType}>
                        <DialogHeader><DialogTitle>Add New Packaging Type</DialogTitle><DialogDescription>Create a new packaging type for use in the medicine master.</DialogDescription></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Packaging Type Name</Label>
                                <Input id="name" name="name" value={newPackagingTypeName} onChange={(e) => setNewPackagingTypeName(e.target.value)} placeholder="e.g., Box" required />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit">Add Type</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the packaging type.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
