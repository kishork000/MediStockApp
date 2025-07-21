
"use client";

import { useMemo, useEffect } from "react";
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, Warehouse, GitBranch, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AddMedicinePage() {
  const { user, logout, loading, hasPermission } = useAuth();
  const router = useRouter();

  const sidebarRoutes = useMemo(() => {
      return allAppRoutes.filter(route => hasPermission(route.path) && route.path !== '/');
  }, [hasPermission]);

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
          case 'Warehouse Stock': return <Warehouse />;
          case 'Store Stock': return <Package />;
          case 'Add Medicine': return <PlusSquare />;
          case 'Stock Transfer': return <GitBranch />;
          case 'Stock Reports': return <BarChart />;
          case 'Diseases': return <Activity />;
          case 'Admin': return <Settings />;
          default: return <LayoutGrid />;
      }
  };

  const stockManagementRoutes = sidebarRoutes.filter(r => r.path.startsWith('/inventory'));

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
                        <SidebarMenuButton href={route.path} tooltip={route.name}>
                            {getIcon(route.name)}
                            <span>{route.name}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}

                {hasPermission('/inventory') && (
                    <Collapsible className="w-full" defaultOpen={true}>
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
                                        <SidebarMenuButton href={route.path} tooltip={route.name} size="sm" isActive={router.pathname === route.path}>
                                            {getIcon(route.name)}
                                            <span>{route.name}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </CollapsibleContent>
                    </Collapsible>
                )}
                 
                 <SidebarMenuItem>
                  <SidebarMenuButton href="/" tooltip="Reports">
                    <BarChart />
                    <span>Reports</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
              <h1 className="text-xl font-semibold">Add New Medicine Stock</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Medicine Details</CardTitle>
                    <CardDescription>Fill in the form to add new medicine stock to the warehouse.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="medicine-name">Medicine Name</Label>
                                <Input id="medicine-name" placeholder="e.g., Paracetamol 500mg" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="manufacturer">Manufacturer</Label>
                                <Input id="manufacturer" placeholder="e.g., Pharma Inc." />
                            </div>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="invoice-number">Purchase Invoice Number</Label>
                                <Input id="invoice-number" placeholder="e.g., INV-2024-123" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="stock">Quantity Received</Label>
                                <Input id="stock" type="number" placeholder="100" />
                            </div>
                        </div>
                        
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="price-per-unit">Price per Unit (₹)</Label>
                                <Input id="price-per-unit" type="number" placeholder="10.50" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="expiry-date">Expiry Date</Label>
                                <Input id="expiry-date" type="date" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="gst-slab">GST Slab</Label>
                                <Select>
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
                             <div className="space-y-2">
                                <Label htmlFor="destination-store">Destination</Label>
                                <Select defaultValue="warehouse">
                                    <SelectTrigger id="destination-store">
                                        <SelectValue placeholder="Select Store" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="warehouse">Main Warehouse</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="notes">Description / Notes</Label>
                            <Textarea id="notes" placeholder="Describe the medicine or add storage instructions." />
                        </div>
                        <Button type="submit">
                            <PlusSquare className="mr-2 h-4 w-4"/>
                            Add to Inventory
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
      </div>
    </div>
  );
}

    