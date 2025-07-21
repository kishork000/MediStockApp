
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, MoreHorizontal, Trash2, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";

interface Disease {
    id: string;
    name: string;
    description: string;
}

const initialDiseases: Disease[] = [
    { id: "DIS001", name: "Fever", description: "Characterized by a body temperature higher than normal." },
    { id: "DIS002", name: "Headache", description: "Pain in any part of the head, ranging from sharp to dull." },
    { id: "DIS003", name: "Diabetes", description: "A chronic disease related to high blood sugar levels." },
    { id: "DIS004", name: "Hypertension", description: "Also known as high blood pressure." },
    { id: "DIS005", name: "Common Cold", description: "A viral infectious disease of the upper respiratory tract." },
];

export default function DiseasesPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [diseases, setDiseases] = useState(initialDiseases);

    const sidebarRoutes = useMemo(() => {
        return allAppRoutes.filter(route => hasPermission(route.path) && route.path !== '/');
    }, [hasPermission]);

     useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);


    const handleDelete = (id: string) => {
        setDiseases(diseases.filter(d => d.id !== id));
    };

    const handleAddDisease = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("disease-name") as string;
        const description = formData.get("disease-description") as string;

        if (name && description) {
            const newDisease: Disease = {
                id: `DIS${(diseases.length + 1).toString().padStart(3, '0')}`,
                name,
                description,
            };
            setDiseases([...diseases, newDisease]);
            alert("Disease added successfully!");
            e.currentTarget.reset();
        } else {
            alert("Please fill all fields.");
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
                <SidebarMenuItem>
                  <SidebarMenuButton href="/" tooltip="Dashboard">
                    <HomeIcon />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {sidebarRoutes.filter(r => !r.path.startsWith('/inventory') && r.inSidebar).map((route) => (
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
                            <SidebarMenuItem>
                                <SidebarMenuButton className="justify-between">
                                    <div className="flex items-center gap-3">
                                        <Package />
                                        <span>Stock Management</span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                </SidebarMenuButton>
                            </SidebarMenuItem>
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger className="sm:hidden" />
           <div className="flex w-full items-center justify-between">
                <h1 className="text-xl font-semibold">Disease Management</h1>
                <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs defaultValue="all-diseases">
                <div className="flex items-center">
                    <TabsList>
                        <TabsTrigger value="all-diseases">All Diseases</TabsTrigger>
                        <TabsTrigger value="add-disease">Add Disease</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="all-diseases">
                    <Card>
                        <CardHeader>
                            <CardTitle>Disease Master List</CardTitle>
                            <CardDescription>View, manage, and track all diseases.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="hidden sm:table-cell">ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden md:table-cell">Description</TableHead>
                                        <TableHead>
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {diseases.map((disease) => (
                                        <TableRow key={disease.id}>
                                            <TableCell className="hidden sm:table-cell font-medium">{disease.id}</TableCell>
                                            <TableCell>{disease.name}</TableCell>
                                            <TableCell className="hidden md:table-cell">{disease.description}</TableCell>
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
                                                        <DropdownMenuItem onSelect={() => handleDelete(disease.id)} className="text-destructive">
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
                <TabsContent value="add-disease">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Disease</CardTitle>
                            <CardDescription>Fill in the details to add a new disease to the master list.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4" onSubmit={handleAddDisease}>
                                <div className="space-y-2">
                                    <Label htmlFor="disease-name">Disease Name</Label>
                                    <Input id="disease-name" name="disease-name" placeholder="e.g., Influenza" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="disease-description">Description</Label>
                                    <Textarea id="disease-description" name="disease-description" placeholder="Describe the disease, its symptoms, etc." required />
                                </div>
                                <Button type="submit">Add Disease</Button>
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
