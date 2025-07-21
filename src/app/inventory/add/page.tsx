
"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Home as HomeIcon, LayoutGrid, Package, Users, ShoppingCart, BarChart, PlusSquare, Users2, Activity, Settings, Warehouse, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function AddMedicinePage() {
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
                 <SidebarMenuItem>
                  <SidebarMenuButton href="/patients" tooltip="Patients">
                    <Users2 />
                    <span>Patients</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href="/sales" tooltip="Sales">
                    <ShoppingCart />
                    <span>Sales</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href="/" tooltip="Inventory">
                    <Package />
                    <span>Inventory</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton href="/inventory/add" isActive={true} tooltip="Add Medicine">
                    <PlusSquare />
                    <span>Add Medicine</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton href="/inventory/transfer" tooltip="Stock Transfer">
                    <GitBranch />
                    <span>Stock Transfer</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton href="/diseases" tooltip="Diseases">
                    <Activity />
                    <span>Diseases</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href="/" tooltip="Reports">
                    <BarChart />
                    <span>Reports</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton href="/admin" tooltip="Admin">
                    <Settings />
                    <span>Admin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
      </Sidebar>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger className="sm:hidden" />
           <h1 className="text-xl font-semibold">Add New Medicine Stock</h1>
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
                                        {/* In a real app, other stores would be listed here */}
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
