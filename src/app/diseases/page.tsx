
"use client";

import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Home as HomeIcon, LayoutGrid, Package, Users, ShoppingCart, BarChart, PlusSquare, Users2, Activity, MoreHorizontal, Trash2, Settings } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const initialDiseases = [
    { id: "DIS001", name: "Fever", description: "Characterized by a body temperature higher than normal." },
    { id: "DIS002", name: "Headache", description: "Pain in any part of the head, ranging from sharp to dull." },
    { id: "DIS003", name: "Diabetes", description: "A chronic disease related to high blood sugar levels." },
    { id: "DIS004", name: "Hypertension", description: "Also known as high blood pressure." },
    { id: "DIS005", name: "Common Cold", description: "A viral infectious disease of the upper respiratory tract." },
];

export default function DiseasesPage() {
    const [diseases, setDiseases] = useState(initialDiseases);

    const handleDelete = (id: string) => {
        setDiseases(diseases.filter(d => d.id !== id));
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
                  <SidebarMenuButton href="/inventory/add" tooltip="Add Medicine">
                    <PlusSquare />
                    <span>Add Medicine</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton href="/diseases" isActive={true} tooltip="Diseases">
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
           <h1 className="text-xl font-semibold">Disease Management</h1>
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
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="disease-name">Disease Name</Label>
                                    <Input id="disease-name" placeholder="e.g., Influenza" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="disease-description">Description</Label>
                                    <Textarea id="disease-description" placeholder="Describe the disease, its symptoms, etc." />
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

    