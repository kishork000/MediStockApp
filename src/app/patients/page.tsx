
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
import { Home as HomeIcon, LayoutGrid, Package, Users, ShoppingCart, BarChart, PlusSquare, Users2, Activity, MoreHorizontal, FilePenLine, Trash2, Settings, GitBranch } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Patient {
    id: string;
    name: string;
    age: number;
    gender: "Female" | "Male" | "Other";
    mobile: string;
    lastVisit: string;
    bp?: string;
    sugar?: string;
    address?: string;
}

const initialPatients: Patient[] = [
    { id: "PAT001", name: "Alice Johnson", age: 58, gender: "Female", mobile: "9876543210", lastVisit: "2024-07-15", bp: "120/80", sugar: "98 mg/dL", address: "123 Maple St, Springfield" },
    { id: "PAT002", name: "Bob Williams", age: 45, gender: "Male", mobile: "9876543211", lastVisit: "2024-07-12", bp: "130/85", sugar: "110 mg/dL", address: "456 Oak Ave, Springfield" },
    { id: "PAT003", name: "Charlie Brown", age: 62, gender: "Male", mobile: "9876543212", lastVisit: "2024-07-20", bp: "140/90", sugar: "150 mg/dL", address: "789 Pine Ln, Springfield" },
    { id: "PAT004", name: "Diana Miller", age: 34, gender: "Female", mobile: "9876543213", lastVisit: "2024-06-30", bp: "110/70", sugar: "85 mg/dL", address: "101 Elm Ct, Springfield" },
    { id: "PAT005", name: "Ethan Davis", age: 71, gender: "Male", mobile: "9876543214", lastVisit: "2024-07-18", bp: "135/88", sugar: "125 mg/dL", address: "212 Birch Rd, Springfield" },
];


export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = (id: string) => {
    setPatients(patients.filter(p => p.id !== id));
  };
  
  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewModalOpen(true);
  }

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditModalOpen(true);
  }

  const handleUpdatePatient = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!selectedPatient) return;

      const formData = new FormData(e.currentTarget);
      const updatedPatient: Patient = {
          ...selectedPatient,
          name: formData.get('name') as string,
          mobile: formData.get('mobile') as string,
          age: parseInt(formData.get('age') as string, 10),
          gender: formData.get('gender') as Patient['gender'],
          bp: formData.get('bp') as string,
          sugar: formData.get('sugar') as string,
          address: formData.get('address') as string,
      };

      setPatients(patients.map(p => p.id === updatedPatient.id ? updatedPatient : p));
      setIsEditModalOpen(false);
      setSelectedPatient(null);
  }


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
                  <SidebarMenuButton href="/patients" isActive={true} tooltip="Patients">
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
           <h1 className="text-xl font-semibold">Patients</h1>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Patient Directory</CardTitle>
                    <CardDescription>View and manage patient records. New patients are added via the sales form.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden sm:table-cell">Mobile No.</TableHead>
                                <TableHead className="hidden sm:table-cell">Age</TableHead>
                                <TableHead className="hidden md:table-cell">Last Visit</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {patients.map((patient) => (
                                <TableRow key={patient.id}>
                                    <TableCell className="font-medium">{patient.name}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{patient.mobile}</TableCell>
                                    <TableCell className="hidden sm:table-cell">{patient.age}</TableCell>
                                    <TableCell className="hidden md:table-cell">{patient.lastVisit}</TableCell>
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
                                                <DropdownMenuItem onSelect={() => handleViewDetails(patient)}>View Details</DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleEdit(patient)}>
                                                    <FilePenLine className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleDelete(patient.id)} className="text-destructive">
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
      
        {selectedPatient && (
            <>
                <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Patient Details: {selectedPatient.name}</DialogTitle>
                            <DialogDescription>
                                Full record for {selectedPatient.name}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <p><strong className="font-medium">ID:</strong> {selectedPatient.id}</p>
                                <p><strong className="font-medium">Age:</strong> {selectedPatient.age}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <p><strong className="font-medium">Gender:</strong> {selectedPatient.gender}</p>
                                <p><strong className="font-medium">Mobile:</strong> {selectedPatient.mobile}</p>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <p><strong className="font-medium">BP:</strong> {selectedPatient.bp || 'N/A'}</p>
                                <p><strong className="font-medium">Sugar:</strong> {selectedPatient.sugar || 'N/A'}</p>
                            </div>
                             <p><strong className="font-medium">Address:</strong> {selectedPatient.address || 'N/A'}</p>
                            <p><strong className="font-medium">Last Visit:</strong> {selectedPatient.lastVisit}</p>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Edit Patient: {selectedPatient.name}</DialogTitle>
                            <DialogDescription>
                                Update the patient's information below.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdatePatient} className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Name</Label>
                                    <Input id="edit-name" name="name" defaultValue={selectedPatient.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-mobile">Mobile Number</Label>
                                    <Input id="edit-mobile" name="mobile" defaultValue={selectedPatient.mobile} />
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-age">Age</Label>
                                    <Input id="edit-age" name="age" type="number" defaultValue={selectedPatient.age} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-gender">Gender</Label>
                                    <Select name="gender" defaultValue={selectedPatient.gender}>
                                        <SelectTrigger id="edit-gender">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-bp">Blood Pressure</Label>
                                    <Input id="edit-bp" name="bp" defaultValue={selectedPatient.bp} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-sugar">Blood Sugar</Label>
                                    <Input id="edit-sugar" name="sugar" defaultValue={selectedPatient.sugar} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-address">Address</Label>
                                <Textarea id="edit-address" name="address" defaultValue={selectedPatient.address} />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Save Changes</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </>
        )}
    </div>
  );
}

    