
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
  SidebarFooter
} from "@/components/ui/sidebar";
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, MoreHorizontal, FilePenLine, Trash2, Search, Upload, Send, FileText, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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
    medicineHistory?: { date: string; medicine: string; dosage: string }[];
    reports?: { date: string; name: string; url: string }[];
}

const initialPatients: Patient[] = [
    { 
        id: "PAT001", name: "Alice Johnson", age: 58, gender: "Female", mobile: "9876543210", lastVisit: "2024-07-15", bp: "120/80", sugar: "98 mg/dL", address: "123 Maple St, Springfield",
        medicineHistory: [
            { date: "2024-07-15", medicine: "Lisinopril", dosage: "10mg daily" },
            { date: "2024-06-10", medicine: "Atorvastatin", dosage: "20mg daily" },
        ],
        reports: [ { date: "2024-07-15", name: "Blood Test Report", url: "#" } ]
    },
    { 
        id: "PAT002", name: "Bob Williams", age: 45, gender: "Male", mobile: "9876543211", lastVisit: "2024-07-12", bp: "130/85", sugar: "110 mg/dL", address: "456 Oak Ave, Springfield",
        medicineHistory: [
            { date: "2024-07-12", medicine: "Ibuprofen", dosage: "200mg as needed" }
        ],
        reports: []
    },
    { 
        id: "PAT003", name: "Charlie Brown", age: 62, gender: "Male", mobile: "9876543212", lastVisit: "2024-07-20", bp: "140/90", sugar: "150 mg/dL", address: "789 Pine Ln, Springfield",
        medicineHistory: [
            { date: "2024-07-20", medicine: "Metformin", dosage: "500mg twice daily" },
            { date: "2024-07-20", medicine: "Aspirin", dosage: "81mg daily" },
        ],
        reports: [ { date: "2024-07-20", name: "ECG Report", url: "#" } ]
    },
    { id: "PAT004", name: "Diana Miller", age: 34, gender: "Female", mobile: "9876543213", lastVisit: "2024-06-30", bp: "110/70", sugar: "85 mg/dL", address: "101 Elm Ct, Springfield", medicineHistory: [], reports: [] },
    { id: "PAT005", name: "Ethan Davis", age: 71, gender: "Male", mobile: "9876543214", lastVisit: "2024-07-18", bp: "135/88", sugar: "125 mg/dL", address: "212 Birch Rd, Springfield", medicineHistory: [], reports: [] },
];


export default function PatientsPage() {
  const { user, logout, loading, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);


  const sidebarRoutes = useMemo(() => {
    return allAppRoutes.filter(route => hasPermission(route.path) && route.path !== '/');
  }, [hasPermission]);
  
  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    const lowercasedQuery = searchQuery.toLowerCase();
    return patients.filter(p => 
        p.name.toLowerCase().includes(lowercasedQuery) ||
        p.mobile.includes(lowercasedQuery) ||
        p.id.toLowerCase().includes(lowercasedQuery)
    );
  }, [patients, searchQuery]);

  useEffect(() => {
    if (!loading && !user) {
        router.push('/login');
    }
  }, [user, loading, router]);

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

  const handleSelectPatient = (patientId: string, checked: boolean | 'indeterminate') => {
      if (typeof checked !== 'boolean') return;
      if (checked) {
          setSelectedPatientIds(prev => [...prev, patientId]);
      } else {
          setSelectedPatientIds(prev => prev.filter(id => id !== patientId));
      }
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
      if (typeof checked !== 'boolean') return;
      if (checked) {
          setSelectedPatientIds(filteredPatients.map(p => p.id));
      } else {
          setSelectedPatientIds([]);
      }
  };

  const sendReminder = (patientName: string) => {
      toast({
          title: "Reminder Sent",
          description: `Reminder has been sent to ${patientName}.`
      });
  };
  
  const sendBulkReminders = () => {
      toast({
          title: "Bulk Reminders Sent",
          description: `Reminders have been sent to ${selectedPatientIds.length} selected patients.`
      });
      setSelectedPatientIds([]);
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
              <h1 className="text-xl font-semibold">Patients</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div>
                            <CardTitle>Patient Directory</CardTitle>
                            <CardDescription>View and manage patient records. New patients are added via the sales form.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedPatientIds.length > 0 && (
                                <Button size="sm" variant="outline" onClick={sendBulkReminders}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Reminder ({selectedPatientIds.length})
                                </Button>
                            )}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search by name, mobile, or ID..."
                                    className="w-full sm:w-[300px] pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox 
                                        onCheckedChange={(checked) => handleSelectAll(checked)}
                                        checked={selectedPatientIds.length === filteredPatients.length && filteredPatients.length > 0}
                                        aria-label="Select all"
                                    />
                                </TableHead>
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
                            {filteredPatients.map((patient) => (
                                <TableRow key={patient.id} data-state={selectedPatientIds.includes(patient.id) ? "selected" : ""}>
                                    <TableCell>
                                        <Checkbox 
                                            onCheckedChange={(checked) => handleSelectPatient(patient.id, checked)}
                                            checked={selectedPatientIds.includes(patient.id)}
                                            aria-label={`Select ${patient.name}`}
                                        />
                                    </TableCell>
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
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Patient Details: {selectedPatient.name}</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="details">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="details">Vitals & Info</TabsTrigger>
                                <TabsTrigger value="history">Medicine History</TabsTrigger>
                                <TabsTrigger value="reports">Health Reports</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details" className="py-4">
                                <div className="grid gap-4">
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
                            </TabsContent>
                            <TabsContent value="history" className="py-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Medicine</TableHead>
                                            <TableHead>Dosage</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedPatient.medicineHistory?.length ? selectedPatient.medicineHistory.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.date}</TableCell>
                                                <TableCell>{item.medicine}</TableCell>
                                                <TableCell>{item.dosage}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={3} className="text-center">No medicine history found.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                            <TabsContent value="reports" className="py-4">
                                <div className="flex justify-end mb-4">
                                    <Button variant="outline" className="relative">
                                        <Upload className="mr-2 h-4 w-4"/> Upload Report
                                        <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    </Button>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Report Name</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedPatient.reports?.length ? selectedPatient.reports.map((report, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{report.date}</TableCell>
                                                <TableCell>{report.name}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <a href={report.url} target="_blank" rel="noopener noreferrer">
                                                            <FileText className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow><TableCell colSpan={3} className="text-center">No reports found.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                        </Tabs>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => sendReminder(selectedPatient.name)}>
                                <Send className="mr-2 h-4 w-4"/> Send Reminder
                            </Button>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" onClick={() => setSelectedPatient(null)}>Close</Button>
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
                                    <Button type="button" variant="secondary" onClick={() => setSelectedPatient(null)}>Cancel</Button>
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
