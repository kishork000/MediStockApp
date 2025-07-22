
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Home as HomeIcon, LayoutGrid, Package, Users, ShoppingCart, BarChart, PlusSquare, Users2, Activity, Settings, Store, MoreHorizontal, Trash2, GitBranch, LogOut, ShieldCheck, ChevronDown, Warehouse, TrendingUp, Building, UserPlus } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { allAppRoutes, AppRoute, UserRole } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";


interface User {
    name: string;
    email: string;
    role: UserRole;
    assignedStore?: string;
    password?: string;
}

interface Store {
    id: string;
    name: string;
    address: string;
    gstin: string;
}

const initialStores: Store[] = [
    { id: "STR001", name: "Main Warehouse", address: "456 Industrial Ave, Metro City", gstin: "29BBBBB1111B1Z6"},
    { id: "STR002", name: "Downtown Pharmacy", address: "123 Main St, Wellness City", gstin: "22AAAAA0000A1Z5"},
    { id: "STR003", name: "Uptown Health", address: "789 Cure Blvd, Healthfield", gstin: "23CCCCC0000C1Z7"},
];

// This local user list was causing the issue. It's now removed.

export default function AdminPage() {
    const { user, logout, loading, permissions, setPermissions, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [companyName, setCompanyName] = useState("MediStock Pharmacy");
    const [companyAddress, setCompanyAddress] = useState("123 Health St, Wellness City, State 12345");
    const [gstin, setGstin] = useState("22AAAAA0000A1Z5");
    const [stores, setStores] = useState<Store[]>(initialStores);
    const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
    
    // The user state now comes from a single source of truth: the Auth context
    const [users, setUsers] = useState<User[]>([
        { name: "Admin User", email: "admin@medistock.com", role: "Admin", assignedStore: "STR001", password: "password" },
        { name: "Pharmacist One", email: "pharmacist1@medistock.com", role: "Pharmacist", assignedStore: "STR002", password: "password" },
        { name: "Pharmacist Two", email: "pharmacist2@medistock.com", role: "Pharmacist", assignedStore: "STR003", password: "password" },
        { name: "Supervisor One", email: "supervisor1@medistock.com", role: "Supervisor", password: "password" },
    ]);

    const sidebarRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path !== '/');
    }, []);

     useEffect(() => {
        if (!loading && (!user || user.role !== 'Admin')) {
            router.push('/login');
        }
    }, [user, loading, router]);


    const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        setCompanyName(formData.get("company-name") as string);
        setCompanyAddress(formData.get("company-address") as string);
        setGstin(formData.get("gstin") as string);
        alert("Settings Saved!");
    };
    
    const handleAddStore = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newStore: Store = {
            id: `STR${(stores.length + 1).toString().padStart(3, '0')}`,
            name: formData.get("store-name") as string,
            address: formData.get("store-address") as string,
            gstin: formData.get("store-gstin") as string,
        };
        setStores([...stores, newStore]);
        setIsAddStoreModalOpen(false);
        e.currentTarget.reset();
    };

    const handleDeleteStore = (id: string) => {
        setStores(stores.filter(s => s.id !== id));
    };

    const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newUser: User = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            role: formData.get("role") as User['role'],
            assignedStore: formData.get("assignedStore") as string | undefined,
            password: formData.get("password") as string,
        };
        if (newUser.name && newUser.email && newUser.role && newUser.password) {
            setUsers([...users, newUser]);
            alert("User created successfully!");
            e.currentTarget.reset();
        } else {
            alert("Please fill all user details including password.");
        }
    };

    const handleDeleteUser = (email: string) => {
        setUsers(users.filter(u => u.email !== email));
    };

    const handlePermissionChange = (role: UserRole, route: string, checked: boolean | 'indeterminate') => {
        if (typeof checked !== 'boolean' || role === 'Admin') return;
        
        const newPermissions = { ...permissions };
        if (checked) {
            newPermissions[role] = [...newPermissions[role], route];
        } else {
            newPermissions[role] = newPermissions[role].filter(r => r !== route);
        }
        setPermissions(newPermissions);
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
            case 'Add Medicine': return <PlusSquare />;
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger className="sm:hidden" />
           <div className="flex w-full items-center justify-between">
              <h1 className="text-xl font-semibold">Admin Settings</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs defaultValue="users">
                <div className="flex items-center">
                    <TabsList>
                        <TabsTrigger value="users">
                            <Users className="md:hidden" />
                            <span className="hidden md:inline">User Management</span>
                        </TabsTrigger>
                        <TabsTrigger value="permissions">
                            <ShieldCheck className="md:hidden" />
                            <span className="hidden md:inline">Permissions</span>
                        </TabsTrigger>
                        <TabsTrigger value="stores">
                            <Store className="md:hidden" />
                            <span className="hidden md:inline">Store Management</span>
                        </TabsTrigger>
                        <TabsTrigger value="add-user">
                             <UserPlus className="md:hidden" />
                             <span className="hidden md:inline">Add User</span>
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <Building className="md:hidden" />
                            <span className="hidden md:inline">Company Settings</span>
                        </TabsTrigger>
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
                                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="hidden md:table-cell">Assigned Store</TableHead>
                                        <TableHead>
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.email}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'Admin' ? 'destructive' : user.role === 'Supervisor' ? 'secondary' : 'default'}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">{stores.find(s => s.id === user.assignedStore)?.name || 'N/A'}</TableCell>
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
                                                        <DropdownMenuItem onSelect={() => handleDeleteUser(user.email)} className="text-destructive">Delete</DropdownMenuItem>
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
                <TabsContent value="permissions">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Permissions</CardTitle>
                            <CardDescription>Define which pages each role can access. Changes are saved automatically.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {(Object.keys(permissions) as UserRole[]).map(role => (
                                    <div key={role}>
                                        <h3 className="font-semibold text-lg mb-4 flex items-center">
                                            <ShieldCheck className="mr-2 h-5 w-5" /> {role}
                                        </h3>
                                        <div className="space-y-3">
                                            {allAppRoutes.map(route => (
                                                <div key={`${role}-${route.path}`} className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id={`${role}-${route.path}`}
                                                        checked={role === 'Admin' ? true : permissions[role].includes(route.path)}
                                                        onCheckedChange={(checked) => handlePermissionChange(role, route.path, checked)}
                                                        disabled={role === 'Admin'}
                                                    />
                                                    <label
                                                        htmlFor={`${role}-${route.path}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {route.name}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
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
                           <Button onClick={() => setIsAddStoreModalOpen(true)}>
                               <Store className="mr-2 h-4 w-4" />
                               Add Store
                           </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
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
                                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleDeleteStore(store.id)} className="text-destructive">
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
                <TabsContent value="add-user">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New User</CardTitle>
                            <CardDescription>Fill in the details to add a new staff member.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4" onSubmit={handleAddUser}>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" name="name" placeholder="Full Name" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" placeholder="user@medistock.com" required />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" name="password" type="password" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="role">Role</Label>
                                        <Select name="role" required>
                                            <SelectTrigger id="role">
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Pharmacist">Pharmacist</SelectItem>
                                                <SelectItem value="Supervisor">Supervisor</SelectItem>
                                                <SelectItem value="Admin">Admin</SelectItem>
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
                                <div className="space-y-2">
                                    <Label htmlFor="gstin">GSTIN</Label>
                                    <Input id="gstin" name="gstin" defaultValue={gstin} />
                                </div>
                                <Button type="submit">Save Settings</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
      </div>

      <Dialog open={isAddStoreModalOpen} onOpenChange={setIsAddStoreModalOpen}>
          <DialogContent className="sm:max-w-md">
               <form onSubmit={handleAddStore}>
                  <DialogHeader>
                      <DialogTitle>Add New Store</DialogTitle>
                      <DialogDescription>
                          Fill in the details for the new store or warehouse.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                          <Label htmlFor="store-name">Store Name</Label>
                          <Input id="store-name" name="store-name" placeholder="e.g., Downtown Pharmacy" required />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="store-address">Address</Label>
                          <Textarea id="store-address" name="store-address" placeholder="123 Main St..." required />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="store-gstin">GSTIN</Label>
                          <Input id="store-gstin" name="store-gstin" placeholder="Store's GST Number" required />
                      </div>
                  </div>
                  <DialogFooter>
                      <DialogClose asChild>
                          <Button type="button" variant="secondary">Cancel</Button>
                      </DialogClose>
                      <Button type="submit">Add Store</Button>
                  </DialogFooter>
              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}

    