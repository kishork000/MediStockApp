
"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
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
import { Home as HomeIcon, LayoutGrid, Package, Users, ShoppingCart, BarChart, PlusSquare, Users2, Activity, Settings, Store, MoreHorizontal, Trash2, GitBranch, LogOut, ShieldCheck, ChevronDown, Warehouse, TrendingUp, Building, UserPlus, Layers, Box, KeyRound, Pill, Undo } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useAuth, NewUser, UpdateUser } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { allAppRoutes, AppRoute } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { UnitType, getUnitTypes, addUnitType, deleteUnitType } from "@/services/unit-service";
import { PackagingType, getPackagingTypes, addPackagingType, deletePackagingType } from "@/services/packaging-service";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


interface User {
    id: string;
    loginId: string;
    name: string;
    email: string;
    role: string;
    assignedStore?: string;
    password?: string;
    altMobile?: string;
    pan?: string;
    aadhar?: string;
}

interface Store {
    id: string;
    storeCode: string;
    name: string;
    address: string;
    gstin: string;
    cin?: string;
    disclaimer?: string;
}

const initialStores: Store[] = [
    { id: "STR001", storeCode: "WH01", name: "Main Warehouse", address: "456 Industrial Ave, Metro City", gstin: "29BBBBB1111B1Z6", cin: "U12345MH2024PTC123456" },
    { id: "STR002", storeCode: "DP01", name: "Downtown Pharmacy", address: "123 Main St, Wellness City", gstin: "22AAAAA0000A1Z5", cin: "U12345MH2024PTC123457", disclaimer: "All sales are final." },
    { id: "STR003", storeCode: "UH01", name: "Uptown Health", address: "789 Cure Blvd, Healthfield", gstin: "23CCCCC0000C1Z7", cin: "U12345MH2024PTC123458" },
];


export default function AdminPage() {
    const { user, logout, loading, permissions, setPermissions, hasPermission, users: userList, createUser, updateUser, deleteUser: deleteUserFromContext, addRole, editRole, deleteRole } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [companyName, setCompanyName] = useState("MediStock Pharmacy");
    const [companyAddress, setCompanyAddress] = useState("123 Health St, Wellness City, State 12345");
    const [gstin, setGstin] = useState("22AAAAA0000A1Z5");
    const [cin, setCin] = useState("U12345MH2024PLC123456");
    const [stores, setStores] = useState<Store[]>(initialStores);
    
    // Store Modal State
    const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
    const [storeModalMode, setStoreModalMode] = useState<'add' | 'edit'>('add');
    const [selectedStore, setSelectedStore] = useState<Store | null>(null);

    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        setUsers(userList);
    }, [userList]);

    // State for Unit Types
    const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
    const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
    const [newUnitTypeName, setNewUnitTypeName] = useState("");

    // State for Packaging Types
    const [packagingTypes, setPackagingTypes] = useState<PackagingType[]>([]);
    const [isAddPackagingModalOpen, setIsAddPackagingModalOpen] = useState(false);
    const [newPackagingTypeName, setNewPackagingTypeName] = useState("");
    
    const [dataLoading, setDataLoading] = useState(true);
    
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'user' | 'store' | 'unit' | 'packaging' | 'role' } | null>(null);

    // State for Role Management
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [roleModalMode, setRoleModalMode] = useState<'add' | 'edit'>('add');
    const [roleName, setRoleName] = useState("");
    const [originalRoleName, setOriginalRoleName] = useState("");

    // State for User Edit
    const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);


    const sidebarRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path !== '/');
    }, []);

     useEffect(() => {
        if (!loading && (!user || user.role !== 'Admin')) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    const fetchMasterData = async () => {
        setDataLoading(true);
        try {
            const [units, packagings] = await Promise.all([
                getUnitTypes(),
                getPackagingTypes(),
            ]);
            setUnitTypes(units);
            setPackagingTypes(packagings);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch master data.' });
        }
        setDataLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchMasterData();
        }
    }, [user, toast]);


    const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setCompanyName(formData.get("company-name") as string);
        setCompanyAddress(formData.get("company-address") as string);
        setGstin(formData.get("gstin") as string);
        setCin(formData.get("cin") as string);
        toast({ title: "Success", description: "Settings saved successfully." });
    };
    
    const handleAddStore = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newStore: Store = {
            id: `STR${(stores.length + 1).toString().padStart(3, '0')}`,
            storeCode: formData.get("store-code") as string,
            name: formData.get("store-name") as string,
            address: formData.get("store-address") as string,
            gstin: formData.get("store-gstin") as string,
            cin: formData.get("store-cin") as string,
            disclaimer: formData.get("disclaimer") as string,
        };
        setStores([...stores, newStore]);
        setIsStoreModalOpen(false);
        e.currentTarget.reset();
        toast({ title: "Success", description: "Store added successfully." });
    };
    
    const handleUpdateStore = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedStore) return;

        const formData = new FormData(e.currentTarget);
        const updatedStore: Store = {
            id: selectedStore.id,
            storeCode: formData.get("store-code") as string,
            name: formData.get("store-name") as string,
            address: formData.get("store-address") as string,
            gstin: formData.get("store-gstin") as string,
            cin: formData.get("store-cin") as string,
            disclaimer: formData.get("disclaimer") as string,
        };
        setStores(stores.map(s => s.id === updatedStore.id ? updatedStore : s));
        setIsStoreModalOpen(false);
        e.currentTarget.reset();
        toast({ title: "Success", description: "Store details updated." });
    };

    const confirmDelete = (id: string, type: 'user' | 'store' | 'unit' | 'packaging' | 'role') => {
        setItemToDelete({ id, type });
        setIsDeleteConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;

        const { id, type } = itemToDelete;
        
        try {
            if (type === 'store') {
                setStores(stores.filter(s => s.id !== id));
                toast({ title: "Success", description: "Store deleted." });
            } else if (type === 'user') {
                await deleteUserFromContext(id);
                toast({ title: "Success", description: `User has been deleted.`});
            } else if (type === 'unit') {
                await deleteUnitType(id);
                await fetchMasterData();
                toast({ title: "Success", description: "Unit type deleted." });
            } else if (type === 'packaging') {
                await deletePackagingType(id);
                await fetchMasterData();
                toast({ title: "Success", description: "Packaging type deleted." });
            } else if (type === 'role') {
                await deleteRole(id);
                toast({ title: "Success", description: `Role "${id}" has been deleted.`});
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message || `Failed to delete ${type}.` });
        } finally {
            setItemToDelete(null);
            setIsDeleteConfirmOpen(false);
        }
    };


    const openAddStoreModal = () => {
        setStoreModalMode('add');
        setSelectedStore(null);
        setIsStoreModalOpen(true);
    };

    const openEditStoreModal = (store: Store) => {
        setStoreModalMode('edit');
        setSelectedStore(store);
        setIsStoreModalOpen(true);
    };

    const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newUser: NewUser = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            loginId: formData.get("loginId") as string,
            role: formData.get("role") as string,
            assignedStore: formData.get("assignedStore") as string || undefined,
            password: formData.get("password") as string,
            altMobile: formData.get("altMobile") as string || undefined,
            pan: formData.get("pan") as string || undefined,
            aadhar: formData.get("aadhar") as string || undefined,
        };
        
        if (newUser.name && newUser.email && newUser.loginId && newUser.role && newUser.password) {
            try {
                await createUser(newUser);
                 toast({ title: "Success", description: "User created successfully!" });
                 e.currentTarget.reset();
            } catch (error: any) {
                 toast({ variant: "destructive", title: "Error", description: error.message });
            }
        } else {
            toast({ variant: "destructive", title: "Error", description: "Please fill all required user details." });
        }
    };

    const handleUserUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedUser) return;
        const formData = new FormData(e.currentTarget);
        const updatedData: UpdateUser = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            role: formData.get("role") as string,
            assignedStore: formData.get("assignedStore") as string || undefined,
            altMobile: formData.get("altMobile") as string || undefined,
            pan: formData.get("pan") as string || undefined,
            aadhar: formData.get("aadhar") as string || undefined,
        };

        try {
            await updateUser(selectedUser.id, updatedData);
            toast({ title: "Success", description: "User updated successfully." });
            setIsEditUserModalOpen(false);
            setSelectedUser(null);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    const openEditUserModal = (userToEdit: User) => {
        setSelectedUser(userToEdit);
        setIsEditUserModalOpen(true);
    }

    const handlePermissionChange = (role: string, route: string, checked: boolean | 'indeterminate') => {
        if (typeof checked !== 'boolean' || role === 'Admin') return;
        
        const newPermissions = { ...permissions };
        if (checked) {
            newPermissions[role] = [...newPermissions[role], route];
        } else {
            newPermissions[role] = newPermissions[role].filter(r => r !== route);
        }
        setPermissions(newPermissions);
    };

    const handleAddUnitType = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newUnitTypeName.trim()) {
            try {
                await addUnitType({ name: newUnitTypeName.trim() });
                toast({ title: "Success", description: "Unit type added." });
                await fetchMasterData();
                setIsAddUnitModalOpen(false);
                setNewUnitTypeName("");
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to add unit type." });
            }
        } else {
            toast({ variant: "destructive", title: "Error", description: "Please enter a name." });
        }
    };

     const handleAddPackagingType = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newPackagingTypeName.trim()) {
            try {
                await addPackagingType({ name: newPackagingTypeName.trim() });
                toast({ title: "Success", description: "Packaging type added." });
                await fetchMasterData();
                setIsAddPackagingModalOpen(false);
                setNewPackagingTypeName("");
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to add packaging type." });
            }
        } else {
            toast({ variant: "destructive", title: "Error", description: "Please enter a name." });
        }
    };

    const openAddRoleModal = () => {
        setRoleModalMode('add');
        setRoleName("");
        setIsRoleModalOpen(true);
    };

    const openEditRoleModal = (role: string) => {
        setRoleModalMode('edit');
        setRoleName(role);
        setOriginalRoleName(role);
        setIsRoleModalOpen(true);
    };

    const handleRoleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!roleName.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Role name cannot be empty.' });
            return;
        }

        try {
            if (roleModalMode === 'add') {
                await addRole(roleName.trim());
                toast({ title: 'Success', description: `Role "${roleName.trim()}" created.` });
            } else {
                await editRole(originalRoleName, roleName.trim());
                toast({ title: 'Success', description: `Role "${originalRoleName}" renamed to "${roleName.trim()}".` });
            }
            setIsRoleModalOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    };


    if (loading || !user) {
        return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-2xl">Loading...</div>
        </div>
        );
    }

    if (user.role !== 'Admin') {
         return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-2xl text-destructive">Access Denied. Admins only.</div>
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

    const stockManagementRoutes = sidebarRoutes.filter(r => r.path.startsWith('/inventory/') && r.inSidebar);

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
                        <SidebarMenuButton href="/" tooltip="Dashboard" isActive={pathname === '/'}>
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
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger />
           <div className="flex w-full items-center justify-between">
              <h1 className="text-xl font-semibold">Admin Settings</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <TooltipProvider>
            <Tabs defaultValue="users">
                <div className="flex items-center">
                    <TabsList className="flex-wrap h-auto">
                        <Tooltip><TooltipTrigger asChild>
                            <TabsTrigger value="users"><Users className="md:hidden" /><span className="hidden md:inline">User Management</span></TabsTrigger>
                        </TooltipTrigger><TooltipContent>User Management</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild>
                           <TabsTrigger value="roles"><KeyRound className="md:hidden" /><span className="hidden md:inline">Role Management</span></TabsTrigger>
                        </TooltipTrigger><TooltipContent>Role Management</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild>
                           <TabsTrigger value="permissions"><ShieldCheck className="md:hidden" /><span className="hidden md:inline">Permissions</span></TabsTrigger>
                        </TooltipTrigger><TooltipContent>Permissions</TooltipContent></Tooltip>
                         <Tooltip><TooltipTrigger asChild>
                            <TabsTrigger value="stores"><Store className="md:hidden" /><span className="hidden md:inline">Store Management</span></TabsTrigger>
                        </TooltipTrigger><TooltipContent>Store Management</TooltipContent></Tooltip>
                         <Tooltip><TooltipTrigger asChild>
                             <TabsTrigger value="units"><Layers className="md:hidden" /><span className="hidden md:inline">Unit Types</span></TabsTrigger>
                        </TooltipTrigger><TooltipContent>Unit Types</TooltipContent></Tooltip>
                         <Tooltip><TooltipTrigger asChild>
                            <TabsTrigger value="packaging"><Box className="md:hidden" /><span className="hidden md:inline">Packaging Types</span></TabsTrigger>
                        </TooltipTrigger><TooltipContent>Packaging Types</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild>
                            <TabsTrigger value="add-user"><UserPlus className="md:hidden" /><span className="hidden md:inline">Add User</span></TabsTrigger>
                        </TooltipTrigger><TooltipContent>Add User</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild>
                           <TabsTrigger value="settings"><Building className="md:hidden" /><span className="hidden md:inline">Company Settings</span></TabsTrigger>
                        </TooltipTrigger><TooltipContent>Company Settings</TooltipContent></Tooltip>
                    </TabsList>
                </div>
                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>Manage your pharmacy staff and their roles.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden sm:table-cell">Login ID</TableHead>
                                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="hidden md:table-cell">Assigned Store</TableHead>
                                        <TableHead>
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell>
                                                <Button variant="link" className="p-0 h-auto font-medium md:hidden" onClick={() => openEditUserModal(u)}>{u.name}</Button>
                                                <span className="font-medium hidden md:inline">{u.name}</span>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">{u.loginId}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{u.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={u.role === 'Admin' ? 'destructive' : u.role === 'Supervisor' ? 'secondary' : 'default'}>
                                                    {u.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">{stores.find(s => s.id === u.assignedStore)?.name || 'N/A'}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={u.email === user.email}>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => openEditUserModal(u)}>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => confirmDelete(u.id, 'user')} className="text-destructive">Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="roles">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Role Management</CardTitle>
                                <CardDescription>Define custom user roles for your application.</CardDescription>
                            </div>
                           <Button onClick={openAddRoleModal} size="sm"><PlusSquare className="mr-2 h-4 w-4" /> Add Role</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Role Name</TableHead>
                                        <TableHead>Assigned Users</TableHead>
                                        <TableHead><span className="sr-only">Actions</span></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.keys(permissions).map((role) => (
                                    <TableRow key={role}>
                                        <TableCell className="font-medium">{role}</TableCell>
                                        <TableCell>{users.filter(u => u.role === role).length}</TableCell>
                                        <TableCell className="text-right">
                                             <Button variant="ghost" size="sm" onClick={() => openEditRoleModal(role)} disabled={role === 'Admin'}>Edit</Button>
                                             <Button variant="ghost" size="icon" onClick={() => confirmDelete(role, 'role')} disabled={role === 'Admin' || users.some(u => u.role === role)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="permissions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Permissions</CardTitle>
                            <CardDescription>Define which pages each role can access. Changes are saved automatically.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[250px]">Page / Feature</TableHead>
                                            {Object.keys(permissions).map(role => (
                                                <TableHead key={role} className="text-center">{role}</TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allAppRoutes.map(route => (
                                            <TableRow key={route.path}>
                                                <TableCell className="font-medium">{route.name}</TableCell>
                                                {Object.keys(permissions).map(role => (
                                                    <TableCell key={`${role}-${route.path}`} className="text-center">
                                                        <Checkbox 
                                                            checked={role === 'Admin' || permissions[role]?.includes(route.path)}
                                                            onCheckedChange={(checked) => handlePermissionChange(role, route.path, checked)}
                                                            disabled={role === 'Admin'}
                                                        />
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="stores">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                           <div>
                             <CardTitle>Store Management</CardTitle>
                             <CardDescription>Manage your pharmacy stores and warehouses.</CardDescription>
                           </div>
                           <Button onClick={openAddStoreModal}>
                               <Store className="mr-2 h-4 w-4" />
                               Add Store
                           </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Store Code</TableHead>
                                        <TableHead>Store Name</TableHead>
                                        <TableHead className="hidden sm:table-cell">Address</TableHead>
                                        <TableHead className="hidden md:table-cell">GSTIN</TableHead>
                                        <TableHead>
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stores.map((store) => (
                                        <TableRow key={store.id}>
                                            <TableCell className="font-medium">{store.storeCode}</TableCell>
                                            <TableCell className="font-medium">{store.name}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{store.address}</TableCell>
                                            <TableCell className="hidden md:table-cell">{store.gstin}</TableCell>
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
                                                        <DropdownMenuItem onSelect={() => openEditStoreModal(store)}>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => confirmDelete(store.id, 'store')} className="text-destructive">
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
                </TabsContent>
                 <TabsContent value="units">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                               <CardTitle>Unit Types</CardTitle>
                               <CardDescription>Manage the base measurement units for medicines (e.g., PCS, BTL, ML).</CardDescription>
                            </div>
                           <Button onClick={() => setIsAddUnitModalOpen(true)} size="sm"><PlusSquare className="mr-2 h-4 w-4" /> Add Unit Type</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {dataLoading ? (Array.from({ length: 3 }).map((_, i) => (<TableRow key={i}><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-8 w-8" /></TableCell></TableRow>)))
                                        : unitTypes.map((type) => (<TableRow key={type.id}><TableCell className="font-medium">{type.name}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => confirmDelete(type.id, 'unit')}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="packaging">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle>Packaging Types</CardTitle>
                            <CardDescription>Manage the types of packaging for medicines (e.g., Box, Strip).</CardDescription>
                          </div>
                           <Button onClick={() => setIsAddPackagingModalOpen(true)} size="sm"><PlusSquare className="mr-2 h-4 w-4" /> Add Packaging Type</Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {dataLoading ? (Array.from({ length: 3 }).map((_, i) => (<TableRow key={i}><TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-8 w-8" /></TableCell></TableRow>)))
                                        : packagingTypes.map((type) => (<TableRow key={type.id}><TableCell className="font-medium">{type.name}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => confirmDelete(type.id, 'packaging')}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="add-user">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New User</CardTitle>
                            <CardDescription>Fill in the details to add a new staff member.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4" onSubmit={handleAddUser}>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" placeholder="Full Name" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="loginId">Login ID</Label>
                                        <Input id="loginId" name="loginId" placeholder="e.g., user01" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" placeholder="user@medistock.com" required />
                                    </div>
                                </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input id="password" name="password" type="password" required />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="altMobile">Alt. Mobile No.</Label>
                                        <Input id="altMobile" name="altMobile" type="tel" />
                                    </div>
                                 </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="pan">PAN Number</Label>
                                        <Input id="pan" name="pan" />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="aadhar">Aadhar Number</Label>
                                        <Input id="aadhar" name="aadhar" />
                                    </div>
                                 </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select name="role" required>
                                            <SelectTrigger id="role">
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                 {Object.keys(permissions).map(role => (
                                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="assignedStore">Assign to Store</Label>
                                        <Select name="assignedStore">
                                            <SelectTrigger id="assignedStore">
                                                <SelectValue placeholder="Select a store" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {stores.map(store => (
                                                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button type="submit">Create User</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company &amp; GST Settings</CardTitle>
                            <CardDescription>Manage your company information and tax details.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4" onSubmit={handleSaveSettings}>
                                <div className="space-y-2">
                                    <Label htmlFor="company-name">Company Name</Label>
                                    <Input id="company-name" name="company-name" defaultValue={companyName} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company-address">Company Address</Label>
                                    <Textarea id="company-address" name="company-address" defaultValue={companyAddress} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gstin">GSTIN</Label>
                                        <Input id="gstin" name="gstin" defaultValue={gstin} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cin">CIN</Label>
                                        <Input id="cin" name="cin" defaultValue={cin} />
                                    </div>
                                </div>
                                <Button type="submit">Save Settings</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            </TooltipProvider>
        </main>
      </div>

      <Dialog open={isStoreModalOpen} onOpenChange={setIsStoreModalOpen}>
          <DialogContent className="sm:max-w-md">
               <form onSubmit={storeModalMode === 'add' ? handleAddStore : handleUpdateStore}>
                  <DialogHeader>
                      <DialogTitle>{storeModalMode === 'add' ? 'Add New Store' : 'Edit Store'}</DialogTitle>
                      <DialogDescription>
                          {storeModalMode === 'add' ? 'Fill in the details for the new store or warehouse.' : 'Update the details for this store.'}
                      </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="store-code">Store Code</Label>
                            <Input id="store-code" name="store-code" defaultValue={selectedStore?.storeCode} placeholder="e.g., DP01" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="store-name">Store Name</Label>
                            <Input id="store-name" name="store-name" defaultValue={selectedStore?.name} placeholder="e.g., Downtown Pharmacy" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="store-address">Address</Label>
                          <Textarea id="store-address" name="store-address" defaultValue={selectedStore?.address} placeholder="123 Main St..." required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="store-gstin">GSTIN</Label>
                            <Input id="store-gstin" name="store-gstin" defaultValue={selectedStore?.gstin} placeholder="Store's GST Number" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="store-cin">CIN</Label>
                            <Input id="store-cin" name="store-cin" defaultValue={selectedStore?.cin} placeholder="Store's CIN" />
                        </div>
                      </div>
                      <div className="space-y-2">
                            <Label htmlFor="disclaimer">Disclaimer</Label>
                            <Textarea id="disclaimer" name="disclaimer" defaultValue={selectedStore?.disclaimer} placeholder="e.g., All sales are final." />
                      </div>
                  </div>
                  <DialogFooter>
                      <DialogClose asChild>
                          <Button type="button" variant="secondary" onClick={() => { setIsStoreModalOpen(false); setSelectedStore(null);}}>Cancel</Button>
                      </DialogClose>
                      <Button type="submit">{storeModalMode === 'add' ? 'Add Store' : 'Save Changes'}</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
        <Dialog open={isAddUnitModalOpen} onOpenChange={setIsAddUnitModalOpen}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleAddUnitType}>
                    <DialogHeader><DialogTitle>Add New Unit Type</DialogTitle><DialogDescription>Create a new base unit for use in the medicine master.</DialogDescription></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="unit-name">Unit Type Name</Label>
                            <Input id="unit-name" name="name" value={newUnitTypeName} onChange={(e) => setNewUnitTypeName(e.target.value)} placeholder="e.g., PCS" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                        <Button type="submit">Add Unit</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
         <Dialog open={isAddPackagingModalOpen} onOpenChange={setIsAddPackagingModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleAddPackagingType}>
                        <DialogHeader><DialogTitle>Add New Packaging Type</DialogTitle><DialogDescription>Create a new packaging type for use in the medicine master.</DialogDescription></DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="packaging-name">Packaging Type Name</Label>
                                <Input id="packaging-name" name="name" value={newPackagingTypeName} onChange={(e) => setNewPackagingTypeName(e.target.value)} placeholder="e.g., Box" required />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit">Add Type</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleRoleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{roleModalMode === 'add' ? 'Add New Role' : 'Edit Role'}</DialogTitle>
                            <DialogDescription>{roleModalMode === 'add' ? 'Enter the name for the new role.' : 'Enter the new name for this role.'}</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="role-name">Role Name</Label>
                                <Input id="role-name" value={roleName} onChange={(e) => setRoleName(e.target.value)} required />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                            <Button type="submit">{roleModalMode === 'add' ? 'Add Role' : 'Save Changes'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
             <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={handleUserUpdateSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit User: {selectedUser?.name}</DialogTitle>
                            <DialogDescription>Update the user's details below.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                             <div className="space-y-2">
                                <Label htmlFor="edit-name">Full Name</Label>
                                <Input id="edit-name" name="name" defaultValue={selectedUser?.name} required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-loginId">Login ID</Label>
                                    <Input id="edit-loginId" name="loginId" defaultValue={selectedUser?.loginId} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input id="edit-email" name="email" type="email" defaultValue={selectedUser?.email} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-altMobile">Alt. Mobile No.</Label>
                                <Input id="edit-altMobile" name="altMobile" type="tel" defaultValue={selectedUser?.altMobile} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-pan">PAN Number</Label>
                                    <Input id="edit-pan" name="pan" defaultValue={selectedUser?.pan} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-aadhar">Aadhar Number</Label>
                                    <Input id="edit-aadhar" name="aadhar" defaultValue={selectedUser?.aadhar} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-role">Role</Label>
                                    <Select name="role" defaultValue={selectedUser?.role} required>
                                        <SelectTrigger id="edit-role">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.keys(permissions).map(role => (
                                                <SelectItem key={role} value={role}>{role}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-assignedStore">Assign to Store</Label>
                                    <Select name="assignedStore" defaultValue={selectedUser?.assignedStore}>
                                        <SelectTrigger id="edit-assignedStore">
                                            <SelectValue placeholder="Select a store" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stores.map(store => (
                                                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" onClick={() => setIsEditUserModalOpen(false)}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the {itemToDelete?.type} from the system.
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
