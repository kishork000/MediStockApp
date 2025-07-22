
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, MoreHorizontal, FilePenLine, Trash2, Search, Upload, Send, FileText, TrendingUp, Pill, Building, Undo } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Patient, getPatients, updatePatient, deletePatient } from "@/services/patient-service";
import { Skeleton } from "@/components/ui/skeleton";


export default function PatientsPage() {
  const { user, logout, loading, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);


  const sidebarRoutes = useMemo(() => {
    return allAppRoutes.filter(route => route.path !== '/');
  }, []);

  const fetchPatients = async () => {
    setDataLoading(true);
    try {
        const patientsFromDb = await getPatients();
        setPatients(patientsFromDb);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch patients.' });
    }
    setDataLoading(false);
  };

  useEffect(() => {
    if (user) {
        fetchPatients();
    }
  }, [user]);
  
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

  const handleDelete = async (id: string) => {
    try {
        await deletePatient(id);
        await fetchPatients();
        toast({ title: 'Success', description: 'Patient record deleted.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete patient.' });
    } finally {
        setIsDeleteConfirmOpen(false);
        setPatientToDelete(null);
    }
  };
  
  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewModalOpen(true);
  }

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditModalOpen(true);
  }
  
  const handleDeleteClick = (patientId: string) => {
    setPatientToDelete(patientId);
    setIsDeleteConfirmOpen(true);
  };

  const handleUpdatePatient = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!selectedPatient) return;

      const formData = new FormData(e.currentTarget);
      const updatedPatientData: Omit<Patient, 'id'> = {
          name: formData.get('name') as string,
          mobile: formData.get('mobile') as string,
          age: parseInt(formData.get('age') as string, 10),
          gender: formData.get('gender') as Patient['gender'],
          bp: formData.get('bp') as string,
          sugar: formData.get('sugar') as string,
          address: formData.get('address') as string,
          lastVisit: selectedPatient.lastVisit, // This should probably be updated on sale, not here.
          // History and reports are managed separately
      };
      
      try {
        await updatePatient(selectedPatient.id, updatedPatientData);
        await fetchPatients();
        toast({ title: 'Success', description: 'Patient details updated.' });
        setIsEditModalOpen(false);
        setSelectedPatient(null);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update patient.' });
      }
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
            case 'Dashboard': return <HomeIcon />; case 'Patients': return <Users2 />; case 'Sales': return <ShoppingCart />; case 'Universal Report': return <BarChart />; case 'Warehouse Stock': return <Warehouse />; case 'Store Stock': return <Package />; case 'Medicine Master': return <Pill />; case 'Manufacturer Master': return <Building />; case 'Add Stock': return <PlusSquare />; case 'Return to Manufacturer': return <Undo />; case 'Stock Transfer': return <GitBranch />; case 'Inventory Reports': return <BarChart />; case 'Valuation Report': return <TrendingUp />; case 'Diseases': return <Activity />; case 'Admin': return <Settings />; default: return <LayoutGrid />;
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
                
                {sidebarRoutes.filter(r => !r.path.startsWith('/inventory/') && r.inSidebar && hasPermission(r.path)).map((route) => (
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
                           {dataLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredPatients.map((patient) => (
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
                                                {user?.role === 'Admin' && (
                                                    <DropdownMenuItem onSelect={() => handleDeleteClick(patient.id)} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                )}
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
                            <DialogTitle>Edit Patient: {selectedPatient?.name}</DialogTitle>
                            <DialogDescription>
                                Update the patient's information below.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdatePatient} className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-name">Name</Label>
                                    <Input id="edit-name" name="name" defaultValue={selectedPatient?.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-mobile">Mobile Number</Label>
                                    <Input id="edit-mobile" name="mobile" defaultValue={selectedPatient?.mobile} />
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-age">Age</Label>
                                    <Input id="edit-age" name="age" type="number" defaultValue={selectedPatient?.age} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-gender">Gender</Label>
                                    <Select name="gender" defaultValue={selectedPatient?.gender}>
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
                                    <Input id="edit-bp" name="bp" defaultValue={selectedPatient?.bp} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-sugar">Blood Sugar</Label>
                                    <Input id="edit-sugar" name="sugar" defaultValue={selectedPatient?.sugar} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-address">Address</Label>
                                <Textarea id="edit-address" name="address" defaultValue={selectedPatient?.address} />
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

        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        patient record from your system.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPatientToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            if (patientToDelete) {
                                handleDelete(patientToDelete);
                            }
                        }}
                    >
                        Continue
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

    