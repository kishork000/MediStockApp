
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Trash2, PlusCircle, Activity, Printer, Settings, GitBranch, Search, Undo, LogOut, ChevronDown, Warehouse, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { findPatientByMobile, addPatient, Patient } from "@/services/patient-service";
import { getMedicines, Medicine } from "@/services/medicine-service";
import { getAvailableStockForLocation, InventoryItem } from "@/services/inventory-service";
import { recordSale, Sale, SaleItem } from "@/services/sales-service";


interface ReturnItem extends SaleItem {
    returnQuantity: number;
}

interface BlindReturnItem {
    id: number;
    medicine: string;
    medicineValue: string;
    quantity: number;
}

const diseaseOptions = [
    { id: "d1", label: "Fever" },
    { id: "d2", label: "Headache" },
    { id: "d3", label: "Diabetes" },
    { id: "d4", label: "Hypertension" },
    { id: "d5", label: "Common Cold" },
    { id: "d6", label: "Allergy" },
];

// Mock data removed

const companyInfo = {
    name: "MediStock Pharmacy",
    address: "123 Health St, Wellness City, State 12345",
    gstin: "22AAAAA0000A1Z5"
};

const storeOptions = [
    { value: "STR002", label: "Downtown Pharmacy" },
    { value: "STR003", label: "Uptown Health" },
];


export default function SalesPage() {
  const { user, logout, loading, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("new-sale");
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [currentItem, setCurrentItem] = useState({ medicine: "", quantity: 1 });
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [printSize, setPrintSize] = useState("80mm");
  
  const [availableStock, setAvailableStock] = useState<InventoryItem[]>([]);
  const [medicineMaster, setMedicineMaster] = useState<Medicine[]>([]);

  const [currentStore, setCurrentStore] = useState(storeOptions[0].value);
  
  // Patient form state
  const [patientForm, setPatientForm] = useState({ id: "", name: "", mobile: "", age: "", gender: "" as Patient['gender'], bp: "", sugar: "", address: "", });
  
  // Return state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("invoice");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [saleToReturn, setSaleToReturn] = useState<any>(null);
  const [itemsToReturn, setItemsToReturn] = useState<ReturnItem[]>([]);
  
  // Blind Return state
  const [blindReturnItems, setBlindReturnItems] = useState<BlindReturnItem[]>([]);
  const [currentBlindReturnItem, setCurrentBlindReturnItem] = useState({ medicine: "", quantity: 1 });


  const sidebarRoutes = useMemo(() => {
    return allAppRoutes.filter(route => route.path !== '/');
  }, []);
  
  const availableStores = useMemo(() => {
    if (user?.role === 'Admin') { return storeOptions; }
    if (user?.role === 'Pharmacist' && user.assignedStore) { return storeOptions.filter(s => s.value === user.assignedStore); }
    return [];
  }, [user]);

  useEffect(() => {
    if (user?.role === 'Pharmacist' && availableStores.length > 0) { setCurrentStore(availableStores[0].value); }
  }, [user, availableStores]);


  const fetchPrerequisites = useCallback(async () => {
    try {
        const [medicines, stock] = await Promise.all([
            getMedicines(),
            getAvailableStockForLocation(currentStore)
        ]);
        setMedicineMaster(medicines);
        setAvailableStock(stock);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load medicines or stock.' });
    }
  }, [currentStore, toast]);

  useEffect(() => {
    if (user && currentStore) {
        fetchPrerequisites();
    }
  }, [user, currentStore, fetchPrerequisites]);


  useEffect(() => {
    if (!loading && !user) { router.push('/login'); }
  }, [user, loading, router]);


  const handleAddItem = () => {
      const stockItem = availableStock.find(m => m.medicineId === currentItem.medicine);
      if (!stockItem || currentItem.quantity <= 0) return;

      const medicineDetails = medicineMaster.find(m => m.id === stockItem.medicineId);
      if (!medicineDetails) return;

      const newItem: SaleItem = { 
          id: Date.now(), 
          medicine: medicineDetails.name, 
          medicineValue: medicineDetails.id, 
          quantity: currentItem.quantity, 
          price: medicineDetails.sellingPrice, 
          gst: parseFloat(medicineDetails.gstSlab), 
          total: medicineDetails.sellingPrice * currentItem.quantity, 
          stock: stockItem.quantity, 
      };
      setSaleItems([...saleItems, newItem]);
      setCurrentItem({ medicine: "", quantity: 1 });
  };
  
  const handleRemoveItem = (id: number) => { setSaleItems(saleItems.filter(item => item.id !== id)); };

  const calculateSubtotal = () => saleItems.reduce((acc, item) => acc + item.total, 0);

  const calculateTotalGst = () => saleItems.reduce((acc, item) => acc + (item.total * (item.gst / 100)), 0);
  
  const handleDiseaseSelection = (diseaseId: string) => { setSelectedDiseases(prev => prev.includes(diseaseId) ? prev.filter(id => id !== diseaseId) : [...prev, diseaseId] ); };
  
  const isSaleValid = useMemo(() => {
    if (saleItems.length === 0 || !patientForm.name || !patientForm.mobile) return false;
    return saleItems.every(item => item.quantity <= item.stock);
  }, [saleItems, patientForm]);

  const handleRecordSale = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!isSaleValid) return;

      let patientId = patientForm.id;

      if (!patientId) {
          const newPatientData = {
              name: patientForm.name,
              mobile: patientForm.mobile,
              age: parseInt(patientForm.age, 10) || 0,
              gender: patientForm.gender,
              bp: patientForm.bp,
              sugar: patientForm.sugar,
              address: patientForm.address,
              lastVisit: new Date().toISOString().split('T')[0],
          };
          const newPatientRef = await addPatient(newPatientData);
          patientId = newPatientRef.id;
          toast({ title: "New Patient Created", description: "A new patient record has been added to the database." });
      }
      
      setPatientForm(prev => ({...prev, id: patientId}));
      setPaymentModalOpen(true); 
  }
  
  const processSale = async (paymentMethod: 'Cash' | 'Online') => {
    if (!user || !patientForm.id) return;
    
    const saleData: Omit<Sale, 'createdAt'> = {
        patientId: patientForm.id,
        patientName: patientForm.name,
        storeId: currentStore,
        storeName: storeOptions.find(s => s.value === currentStore)?.label || '',
        items: saleItems.map(({ id, stock, ...item }) => item),
        subtotal,
        totalGst,
        grandTotal,
        paymentMethod,
        soldBy: user.name,
    };
    
    try {
        await recordSale(saleData);
        toast({ title: "Sale Recorded", description: "Stock levels have been updated." });
        setTimeout(() => { 
            window.print(); 
            setPaymentModalOpen(false); 
            resetSaleForm();
            fetchPrerequisites(); // Refresh stock levels
        }, 100);
    } catch (error: any) {
         toast({ variant: 'destructive', title: "Sale Failed", description: error.message });
    }
  }

  const handlePrint = (paymentMethod: 'Cash' | 'Online') => { processSale(paymentMethod); }
  const resetSaleForm = () => { setSaleItems([]); setSelectedDiseases([]); setPatientForm({ id: "", name: "", mobile: "", age: "", gender: "" as Patient['gender'], bp: "", sugar: "", address: "" }); }
  
  const handlePatientFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { id, value } = e.target; setPatientForm(prev => ({ ...prev, [id]: value })); };
  const handlePatientSelectChange = (value: Patient['gender']) => { setPatientForm(prev => ({ ...prev, gender: value })); };

  const handleSearchPatient = async () => {
    if (!patientForm.mobile) { toast({ variant: "destructive", title: "Error", description: "Please enter a mobile number to search." }); return; }
    const foundPatient = await findPatientByMobile(patientForm.mobile);
    if (foundPatient) { 
        setPatientForm({ id: foundPatient.id, name: foundPatient.name, mobile: foundPatient.mobile, age: foundPatient.age.toString(), gender: foundPatient.gender, bp: foundPatient.bp || "", sugar: foundPatient.sugar || "", address: foundPatient.address || "", }); 
        toast({ title: "Patient Found", description: `${foundPatient.name}'s details have been filled in.` });
    } else { 
        toast({ variant: "destructive", title: "Patient Not Found", description: "No existing patient with this mobile number. Please fill in the details." }); 
    }
  };

  const handleSearchReturns = () => {
    toast({ variant: "destructive", title: "Not Implemented", description: "Return by invoice functionality is not yet live." });
  };
  
  const handleSelectInvoice = (sale: any) => {
    // Logic to be implemented
  };

  const handleReturnQuantityChange = (itemId: number, quantity: number) => {
      // Logic to be implemented
  };

  const handleProcessRefund = () => {
    toast({ variant: "destructive", title: "Not Implemented", description: "Refund functionality is not yet live." });
  };

  const handleAddBlindReturnItem = () => {
     // Logic to be implemented
  };
  
  const handleRemoveBlindReturnItem = (id: number) => { setBlindReturnItems(blindReturnItems.filter(item => item.id !== id)); };

  const handleProcessBlindReturn = () => {
      toast({ variant: "destructive", title: "Not Implemented", description: "Blind return functionality is not yet live." });
  };


  const subtotal = calculateSubtotal();
  const totalGst = calculateTotalGst();
  const grandTotal = subtotal + totalGst;

    if (loading || !user) { return ( <div className="flex items-center justify-center min-h-screen"><div className="text-2xl">Loading...</div></div> ); }
    
    const getIcon = (name: string) => {
        switch (name) {
            case 'Dashboard': return <HomeIcon />; case 'Patients': return <Users2 />; case 'Sales': return <ShoppingCart />; case 'Sales Reports': return <BarChart />; case 'Warehouse Stock': return <Warehouse />; case 'Store Stock': return <Package />; case 'Add Medicine': return <PlusSquare />; case 'Stock Transfer': return <GitBranch />; case 'Inventory Reports': return <BarChart />; case 'Valuation Report': return <TrendingUp />; case 'Diseases': return <Activity />; case 'Admin': return <Settings />; default: return <LayoutGrid />;
        }
    };
    
    const stockManagementRoutes = sidebarRoutes.filter(r => r.path.startsWith('/inventory/') && r.inSidebar);

    const diseaseButtonText = selectedDiseases.length > 0 ? selectedDiseases.map(id => diseaseOptions.find(d => d.id === id)?.label).join(', ') : "Select diseases";


  return (
    <>
    <div className="flex min-h-screen w-full flex-col bg-muted/40 print:hidden">
      <Sidebar>
          <SidebarHeader> <SidebarMenuButton className="pointer-events-none"> <LayoutGrid className="size-6" /> <span className="text-lg font-semibold">MediStock</span> </SidebarMenuButton> </SidebarHeader>
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
                                    <Package /> <span>Stock Management</span>
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
              <h1 className="text-xl font-semibold">Sales &amp; Returns</h1>
              <div className="flex items-center gap-4">
                  <Select value={currentStore} onValueChange={setCurrentStore} disabled={availableStores.length <= 1}>
                     <SelectTrigger className="w-[180px]">
                         <SelectValue placeholder="Select Store" />
                     </SelectTrigger>
                     <SelectContent>
                         {availableStores.map(store => (<SelectItem key={store.value} value={store.value}>{store.label}</SelectItem>))}
                     </SelectContent>
                  </Select>
                 <ThemeToggle />
              </div>
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="new-sale">New Sale</TabsTrigger>
                    <TabsTrigger value="return-invoice">Return by Invoice</TabsTrigger>
                    <TabsTrigger value="return-blind">Blind Return</TabsTrigger>
                </TabsList>
                <TabsContent value="new-sale">
                    <form onSubmit={handleRecordSale}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Patient Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Patient Name</Label>
                                            <Input id="name" value={patientForm.name} onChange={handlePatientFormChange} placeholder="John Doe" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mobile">Mobile Number</Label>
                                            <div className="flex gap-2">
                                                <Input id="mobile" value={patientForm.mobile} onChange={handlePatientFormChange} type="tel" placeholder="9876543210" required />
                                                <Button type="button" variant="outline" size="icon" onClick={handleSearchPatient}><Search /></Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="age">Age</Label>
                                                <Input id="age" value={patientForm.age} onChange={handlePatientFormChange} type="number" placeholder="42" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="gender">Gender</Label>
                                                <Select value={patientForm.gender} onValueChange={handlePatientSelectChange}>
                                                    <SelectTrigger id="gender"><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="bp">Blood Pressure (BP)</Label>
                                                <Input id="bp" value={patientForm.bp} onChange={handlePatientFormChange} placeholder="e.g., 120/80" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="sugar">Blood Sugar</Label>
                                                <Input id="sugar" value={patientForm.sugar} onChange={handlePatientFormChange} placeholder="e.g., 98 mg/dL" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Address</Label>
                                            <Textarea id="address" value={patientForm.address} onChange={handlePatientFormChange} placeholder="123 Main St, Anytown..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Disease(s)</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-start font-normal truncate">
                                                        <span className="truncate">{diseaseButtonText}</span>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-80" align="start">
                                                    <div className="space-y-2">
                                                        {diseaseOptions.map(disease => (
                                                            <div key={disease.id} className="flex items-center space-x-2">
                                                                <Checkbox id={disease.id} checked={selectedDiseases.includes(disease.id)} onCheckedChange={() => handleDiseaseSelection(disease.id)} />
                                                                <Label htmlFor={disease.id}>{disease.label}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Add Medicine to Sale</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                            <div className="md:col-span-3 space-y-2">
                                                <Label htmlFor="medicine">Medicine</Label>
                                                <Select value={currentItem.medicine} onValueChange={(value) => setCurrentItem({...currentItem, medicine: value})}>
                                                    <SelectTrigger id="medicine"><SelectValue placeholder="Select a medicine" /></SelectTrigger>
                                                    <SelectContent>
                                                        {availableStock.map(med => ( <SelectItem key={med.medicineId} value={med.medicineId} disabled={med.quantity <= 0}>{med.medicineName} (Stock: {med.quantity})</SelectItem> ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="quantity">Quantity</Label>
                                                <Input id="quantity" type="number" placeholder="1" value={currentItem.quantity} onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value, 10) || 1})} min="1"/>
                                            </div>
                                            <Button type="button" onClick={handleAddItem} className="w-full"><PlusCircle className="mr-2" /> Add Item</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle>Current Sale Items</CardTitle></CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Item</TableHead>
                                                    <TableHead>Qty</TableHead>
                                                    <TableHead>Price (₹)</TableHead>
                                                    <TableHead>GST (%)</TableHead>
                                                    <TableHead>Total (₹)</TableHead>
                                                    <TableHead></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {saleItems.map(item => { const hasInsufficientStock = item.quantity > item.stock;
                                                    return (<TableRow key={item.id} className={cn(hasInsufficientStock && 'bg-destructive/20')}>
                                                        <TableCell>{item.medicine} {hasInsufficientStock && <span className="text-destructive text-xs block">(Stock: {item.stock})</span>}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell>{item.price.toFixed(2)}</TableCell>
                                                        <TableCell>{item.gst}%</TableCell>
                                                        <TableCell>{item.total.toFixed(2)}</TableCell>
                                                        <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                                    </TableRow>)
                                                })}
                                            </TableBody>
                                        </Table>
                                        <div className="mt-4 text-right space-y-1">
                                            <p>Subtotal: <span className="font-semibold">₹{subtotal.toFixed(2)}</span></p>
                                            <p>Total GST: <span className="font-semibold">₹{totalGst.toFixed(2)}</span></p>
                                            <p className="text-xl font-bold">Grand Total: <span className="font-bold">₹{grandTotal.toFixed(2)}</span></p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Button type="submit" className="w-full" disabled={!isSaleValid}>
                                    <ShoppingCart className="mr-2"/> Record Sale &amp; Proceed to Payment
                                </Button>
                            </div>
                        </div>
                    </form>
                </TabsContent>
                <TabsContent value="return-invoice">
                    <Card>
                        <CardHeader>
                            <CardTitle>Return Medicine &amp; Process Refund</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex flex-col sm:flex-row gap-4">
                               <Select value={searchType} onValueChange={setSearchType}>
                                 <SelectTrigger className="w-full sm:w-[150px]">
                                     <SelectValue placeholder="Search By" />
                                 </SelectTrigger>
                                 <SelectContent>
                                     <SelectItem value="invoice">Invoice Number</SelectItem>
                                     <SelectItem value="mobile">Mobile Number</SelectItem>
                                 </SelectContent>
                               </Select>
                               <Input
                                   value={searchQuery}
                                   onChange={(e) => setSearchQuery(e.target.value)}
                                   placeholder={searchType === 'invoice' ? 'Enter invoice ID...' : 'Enter mobile number...'}
                               />
                               <Button onClick={handleSearchReturns}><Search className="mr-2" /> Search</Button>
                           </div>

                          {searchResults.length > 0 && (
                             <Card>
                                <CardHeader><CardTitle>Search Results</CardTitle><CardDescription>Select an invoice to process a return.</CardDescription></CardHeader>
                                <CardContent>
                                    <Table>
                                      <TableHeader><TableRow><TableHead>Invoice ID</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead></TableHead></TableRow></TableHeader>
                                      <TableBody>
                                       {searchResults.map(sale => (
                                          <TableRow key={sale.invoiceId}>
                                             <TableCell>{sale.invoiceId}</TableCell>
                                             <TableCell>{sale.customer}</TableCell>
                                             <TableCell>{sale.date}</TableCell>
                                             <TableCell className="text-right"><Button onClick={() => handleSelectInvoice(sale)}>Select</Button></TableCell>
                                          </TableRow>
                                       ))}
                                      </TableBody>
                                    </Table>
                                </CardContent>
                             </Card>
                          )}

                          {saleToReturn && (
                             <Card>
                                <CardHeader><CardTitle>Invoice Details</CardTitle><CardDescription>Invoice ID: {saleToReturn.invoiceId} | Customer: {saleToReturn.customer} | Store: {saleToReturn.store}</CardDescription></CardHeader>
                                <CardContent className="space-y-4">
                                    <Table>
                                       <TableHeader><TableRow><TableHead>Medicine</TableHead><TableHead>Qty Sold</TableHead><TableHead>Return Qty</TableHead></TableRow></TableHeader>
                                       <TableBody>
                                        {itemsToReturn.map(item => (
                                           <TableRow key={item.id}>
                                              <TableCell>{item.medicine}</TableCell>
                                              <TableCell>{item.quantity}</TableCell>
                                              <TableCell>
                                                 <Input
                                                     type="number"
                                                     className="w-20"
                                                     max={item.quantity}
                                                     min={0}
                                                     value={item.returnQuantity}
                                                     onChange={(e) => handleReturnQuantityChange(item.id, parseInt(e.target.value, 10))}
                                                 />
                                              </TableCell>
                                           </TableRow>
                                        ))}
                                       </TableBody>
                                    </Table>
                                    <Button onClick={handleProcessRefund}><Undo className="mr-2"/> Process Refund &amp; Restock</Button>
                                </CardContent>
                             </Card>
                          )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="return-blind">
                    <Card>
                        <CardHeader>
                            <CardTitle>Blind Return (No Invoice)</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <p className="text-sm text-muted-foreground mb-4">Process a return for an item without an original invoice. Stock will be updated. Issue store credit manually.</p>
                           <Card className="mb-6">
                              <CardHeader><CardTitle className="text-lg">Add Medicine to Return</CardTitle></CardHeader>
                              <CardContent>
                                 <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                     <div className="md:col-span-3 space-y-2">
                                         <Label htmlFor="blind-return-medicine">Medicine</Label>
                                         <Select value={currentBlindReturnItem.medicine} onValueChange={(value) => setCurrentBlindReturnItem({...currentBlindReturnItem, medicine: value})}>
                                             <SelectTrigger id="blind-return-medicine"><SelectValue placeholder="Select a medicine" /></SelectTrigger>
                                             <SelectContent>
                                                 {medicineMaster.map(med => ( <SelectItem key={med.id} value={med.id}>{med.name}</SelectItem> ))}
                                             </SelectContent>
                                         </Select>
                                     </div>
                                      <div className="space-y-2">
                                         <Label htmlFor="blind-return-quantity">Quantity</Label>
                                         <Input id="blind-return-quantity" type="number" placeholder="1" value={currentBlindReturnItem.quantity} onChange={(e) => setCurrentBlindReturnItem({...currentBlindReturnItem, quantity: parseInt(e.target.value, 10) || 1})} min="1"/>
                                     </div>
                                     <Button type="button" onClick={handleAddBlindReturnItem} className="w-full"><PlusCircle className="mr-2" /> Add Item</Button>
                                 </div>
                              </CardContent>
                           </Card>

                           {blindReturnItems.length > 0 && (
                              <Card className="mb-6">
                                 <CardHeader><CardTitle>Items to Return</CardTitle></CardHeader>
                                 <CardContent>
                                     <Table>
                                         <TableHeader><TableRow><TableHead>Medicine</TableHead><TableHead>Quantity</TableHead><TableHead></TableHead></TableRow></TableHeader>
                                         <TableBody>
                                             {blindReturnItems.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.medicine}</TableCell>
                                                    <TableCell>{item.quantity}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveBlindReturnItem(item.id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                             ))}
                                         </TableBody>
                                     </Table>
                                 </CardContent>
                              </Card>
                           )}
                           <Button onClick={handleProcessBlindReturn}><Undo className="mr-2" /> Process Blind Return &amp; Restock</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
      </div>
    </div>
    
    <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Complete Payment</DialogTitle>
                <DialogDescription>Select a payment method to finalize the sale. Grand Total: ₹{grandTotal.toFixed(2)}</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="cash" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="cash">Cash</TabsTrigger>
                    <TabsTrigger value="online">Online</TabsTrigger>
                </TabsList>
                <TabsContent value="cash">
                    <div className="p-4 space-y-4 text-center">
                        <p>Confirm cash payment and print the invoice.</p>
                        <div className="space-y-2">
                           <Label htmlFor="print-size-cash">Paper Size</Label>
                           <Select value={printSize} onValueChange={setPrintSize}>
                               <SelectTrigger id="print-size-cash">
                                   <SelectValue placeholder="Select size" />
                               </SelectTrigger>
                               <SelectContent>
                                   <SelectItem value="57mm">57mm</SelectItem>
                                   <SelectItem value="80mm">80mm</SelectItem>
                                   <SelectItem value="112mm">112mm</SelectItem>
                               </SelectContent>
                           </Select>
                        </div>
                        <Button onClick={() => handlePrint('Cash')} className="w-full"><Printer className="mr-2" /> Print Invoice</Button>
                    </div>
                </TabsContent>
                <TabsContent value="online">
                   <div className="p-4 space-y-4 text-center">
                       <p>Scan the QR code to complete the payment.</p>
                       <div className="flex justify-center">
                           <Image src="https://placehold.co/200x200.png" width={200} height={200} alt="QR Code" data-ai-hint="qr code"/>
                       </div>
                       <div className="space-y-2">
                           <Label htmlFor="print-size-online">Paper Size</Label>
                           <Select value={printSize} onValueChange={setPrintSize}>
                               <SelectTrigger id="print-size-online">
                                   <SelectValue placeholder="Select size" />
                               </SelectTrigger>
                               <SelectContent>
                                   <SelectItem value="57mm">57mm</SelectItem>
                                   <SelectItem value="80mm">80mm</SelectItem>
                                   <SelectItem value="112mm">112mm</SelectItem>
                               </SelectContent>
                           </Select>
                       </div>
                       <Button onClick={() => handlePrint('Online')} className="w-full"><Printer className="mr-2" /> Confirm &amp; Print</Button>
                   </div>
                </TabsContent>
            </Tabs>
            <DialogFooter className="sm:justify-start">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Close</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <div id="invoice-print-area" className={cn("hidden print:block print:p-2", `print-${printSize}`)}>
        <div className="text-center space-y-1">
            <h2 className="font-bold text-base">{companyInfo.name}</h2>
            <p className="text-xs">{companyInfo.address}</p>
            <p className="text-xs">GSTIN: {companyInfo.gstin}</p>
            <hr className="my-1 border-dashed border-black"/>
            <h3 className="font-bold text-sm">Tax Invoice</h3>
        </div>
        <div className="text-xs space-y-0.5 mt-2">
             <p>Patient: {patientForm.name}</p>
             <p>Mobile: {patientForm.mobile}</p>
             <p>Invoice No: SALE-{(Math.random() * 10000).toFixed(0)}</p>
             <p>Date: {new Date().toLocaleString()}</p>
        </div>
        <hr className="my-1 border-dashed border-black"/>
        <table className="w-full text-xs">
            <thead>
                <tr>
                    <th className="text-left">Item</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
            {saleItems.map(item => (
                <tr key={item.id}>
                    <td>{item.medicine}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{item.price.toFixed(2)}</td>
                    <td className="text-right">{item.total.toFixed(2)}</td>
                </tr>
            ))}
            </tbody>
        </table>
        <hr className="my-1 border-dashed border-black"/>
        <div className="text-xs text-right space-y-0.5">
            <p>Subtotal: {subtotal.toFixed(2)}</p>
            <p>Total GST: {totalGst.toFixed(2)}</p>
            <p className="font-bold">Grand Total: {grandTotal.toFixed(2)}</p>
        </div>
        <hr className="my-1 border-dashed border-black"/>
        <div className="text-center text-xs mt-2 space-y-1">
            <p>Thank you for your visit!</p>
            <p>Get well soon.</p>
        </div>
    </div>
</>
  );
}
