
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


interface SaleItem {
    id: number;
    medicine: string;
    medicineValue: string;
    quantity: number;
    price: number;
    gst: number;
    total: number;
    stock: number;
}

interface ReturnItem extends SaleItem {
    returnQuantity: number;
}

interface BlindReturnItem {
    id: number;
    medicine: string;
    medicineValue: string;
    quantity: number;
}

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

interface Medicine {
    value: string;
    label: string;
    price: number;
    gst: number;
    stock: number;
}

const initialPatients: Patient[] = [
    { id: "PAT001", name: "Alice Johnson", age: 58, gender: "Female", mobile: "9876543210", lastVisit: "2024-07-15", bp: "120/80", sugar: "98 mg/dL", address: "123 Maple St, Springfield" },
    { id: "PAT002", name: "Bob Williams", age: 45, gender: "Male", mobile: "9876543211", lastVisit: "2024-07-12", bp: "130/85", sugar: "110 mg/dL", address: "456 Oak Ave, Springfield" },
    { id: "PAT003", name: "Charlie Brown", age: 62, gender: "Male", mobile: "9876543212", lastVisit: "2024-07-20", bp: "140/90", sugar: "150 mg/dL", address: "789 Pine Ln, Springfield" },
];


const initialMedicineStock: Medicine[] = [
    { value: "aspirin", label: "Aspirin", price: 10.00, gst: 5, stock: 150 },
    { value: "ibuprofen", label: "Ibuprofen", price: 15.50, gst: 5, stock: 20 },
    { value: "paracetamol", label: "Paracetamol", price: 5.75, gst: 5, stock: 100 },
    { value: "amoxicillin", label: "Amoxicillin", price: 55.20, gst: 12, stock: 80 },
    { value: "metformin", label: "Metformin", price: 25.00, gst: 12, stock: 0 },
    { value: "atorvastatin", label: "Atorvastatin", price: 45.00, gst: 12, stock: 120 },
];

const diseaseOptions = [
    { id: "d1", label: "Fever" },
    { id: "d2", label: "Headache" },
    { id: "d3", label: "Diabetes" },
    { id: "d4", label: "Hypertension" },
    { id: "d5", label: "Common Cold" },
    { id: "d6", label: "Allergy" },
];

const pastSales = [
    { 
        invoiceId: "SALE001", customer: "Alice Johnson", mobile: "9876543210", date: "2024-07-20",
        items: [ { id: 1, medicine: "Paracetamol", medicineValue: "paracetamol", quantity: 2, price: 5.75, gst: 5, total: 11.50, stock: 100 }, { id: 2, medicine: "Amoxicillin", medicineValue: "amoxicillin", quantity: 1, price: 55.20, gst: 12, total: 55.20, stock: 80 }, ],
        store: "Downtown Pharmacy"
    },
    { 
        invoiceId: "SALE002", customer: "Bob Williams", mobile: "9876543211", date: "2024-07-22",
        items: [ { id: 3, medicine: "Ibuprofen", medicineValue: "ibuprofen", quantity: 1, price: 15.50, gst: 5, total: 15.50, stock: 20 } ],
        store: "Downtown Pharmacy"
    },
    { 
        invoiceId: "SALE003", customer: "Alice Johnson", mobile: "9876543210", date: "2024-07-25",
        items: [ { id: 4, medicine: "Aspirin", medicineValue: "aspirin", quantity: 10, price: 10.00, gst: 5, total: 100.00, stock: 150 } ],
        store: "Downtown Pharmacy"
    }
];

const companyInfo = {
    name: "MediStock Pharmacy",
    address: "123 Health St, Wellness City, State 12345",
    gstin: "22AAAAA0000A1Z5"
};

const storeOptions = [
    { value: "downtown-pharmacy", label: "Downtown Pharmacy", id: "STR002" },
    { value: "uptown-health", label: "Uptown Health", id: "STR003" }, // Assuming a new store
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
  const [medicineOptions, setMedicineOptions] = useState<Medicine[]>(initialMedicineStock);
  const [currentStore, setCurrentStore] = useState(storeOptions[0].value);
  
  // Patient form state
  const [patientForm, setPatientForm] = useState({ name: "", mobile: "", age: "", gender: "", bp: "", sugar: "", address: "", });
  
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
    return allAppRoutes.filter(route => hasPermission(route.path) && route.path !== '/');
  }, [hasPermission]);
  
  const availableStores = useMemo(() => {
    if (user?.role === 'Admin') { return storeOptions; }
    if (user?.role === 'Pharmacist' && user.assignedStore) { return storeOptions.filter(s => s.id === user.assignedStore); }
    return [];
  }, [user]);

  useEffect(() => {
    if (user?.role === 'Pharmacist' && availableStores.length > 0) { setCurrentStore(availableStores[0].value); }
  }, [user, availableStores]);


  useEffect(() => {
    if (!loading && !user) { router.push('/login'); }
  }, [user, loading, router]);


  const handleAddItem = () => {
      const selectedMedicine = medicineOptions.find(m => m.value === currentItem.medicine);
      if (!selectedMedicine || currentItem.quantity <= 0) return;

      const newItem: SaleItem = { id: Date.now(), medicine: selectedMedicine.label, medicineValue: selectedMedicine.value, quantity: currentItem.quantity, price: selectedMedicine.price, gst: selectedMedicine.gst, total: selectedMedicine.price * currentItem.quantity, stock: selectedMedicine.stock, };
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

  const handleRecordSale = (e: React.FormEvent) => { e.preventDefault(); if (isSaleValid) { setPaymentModalOpen(true); } }
  
  const processSale = () => {
    const newMedicineOptions = [...medicineOptions];
    saleItems.forEach(soldItem => {
        const medicineIndex = newMedicineOptions.findIndex(med => med.value === soldItem.medicineValue);
        if (medicineIndex > -1) { newMedicineOptions[medicineIndex].stock -= soldItem.quantity; }
    });
    setMedicineOptions(newMedicineOptions);
    toast({ title: "Sale Recorded", description: "Stock levels have been updated." });
  }

  const handlePrint = () => { processSale(); setTimeout(() => { window.print(); setPaymentModalOpen(false); resetSaleForm(); }, 100); }
  const resetSaleForm = () => { setSaleItems([]); setSelectedDiseases([]); setPatientForm({ name: "", mobile: "", age: "", gender: "", bp: "", sugar: "", address: "" }); }
  
  const handlePatientFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { id, value } = e.target; setPatientForm(prev => ({ ...prev, [id]: value })); };
  const handlePatientSelectChange = (value: string) => { setPatientForm(prev => ({ ...prev, gender: value })); };

  const handleSearchPatient = () => {
    if (!patientForm.mobile) { toast({ variant: "destructive", title: "Error", description: "Please enter a mobile number to search." }); return; }
    const foundPatient = initialPatients.find(p => p.mobile === patientForm.mobile);
    if (foundPatient) { setPatientForm({ name: foundPatient.name, mobile: foundPatient.mobile, age: foundPatient.age.toString(), gender: foundPatient.gender, bp: foundPatient.bp || "", sugar: foundPatient.sugar || "", address: foundPatient.address || "", }); toast({ title: "Patient Found", description: `${foundPatient.name}'s details have been filled in.` });
    } else { toast({ variant: "destructive", title: "Patient Not Found", description: "No existing patient with this mobile number. Please fill in the details." }); }
  };

  const handleSearchReturns = () => {
      let results = [];
      if (searchType === 'invoice') {
          const foundSale = pastSales.find(s => s.invoiceId.toLowerCase() === searchQuery.toLowerCase());
          if (foundSale) {
              handleSelectInvoice(foundSale);
              return;
          }
          results = [];
      } else { // mobile search
          results = pastSales.filter(s => s.mobile === searchQuery);
      }

      setSearchResults(results);
      setSaleToReturn(null);
      if (results.length === 0) {
          toast({ variant: "destructive", title: "Not Found", description: "No records found for the given search query." });
      }
  };
  
  const handleSelectInvoice = (sale: any) => {
    setSaleToReturn(sale);
    setSearchResults([]);
    setItemsToReturn(sale.items.map((item: any) => ({ ...item, returnQuantity: 0 })));
  };

  const handleReturnQuantityChange = (itemId: number, quantity: number) => {
      setItemsToReturn(itemsToReturn.map(item => item.id === itemId ? { ...item, returnQuantity: Math.min(quantity, item.quantity) } : item ));
  };

  const handleProcessRefund = () => {
      const itemsBeingReturned = itemsToReturn.filter(item => item.returnQuantity > 0);
      if(itemsBeingReturned.length === 0) { toast({ variant: "destructive", title: "Error", description: "Please specify a quantity to return for at least one item." }); return; }
      
      const newMedicineOptions = [...medicineOptions];
      itemsBeingReturned.forEach(returnedItem => {
          const medicineIndex = newMedicineOptions.findIndex(med => med.value === returnedItem.medicineValue);
          if (medicineIndex > -1) { newMedicineOptions[medicineIndex].stock += returnedItem.returnQuantity; }
      });
      setMedicineOptions(newMedicineOptions);

      const refundAmount = itemsBeingReturned.reduce((acc, item) => { const pricePerUnit = item.price; const gstMultiplier = 1 + (item.gst / 100); return acc + (pricePerUnit * item.returnQuantity * gstMultiplier); }, 0).toFixed(2);
      toast({ title: "Refund Processed", description: `Refund of ₹${refundAmount} for invoice ${saleToReturn.invoiceId}. Stock has been updated.` });
      
      setSearchQuery(""); setSaleToReturn(null); setItemsToReturn([]);
  };

  const handleAddBlindReturnItem = () => {
      const selectedMedicine = medicineOptions.find(m => m.value === currentBlindReturnItem.medicine);
      if (!selectedMedicine || currentBlindReturnItem.quantity <= 0) return;
      const newItem: BlindReturnItem = { id: Date.now(), medicine: selectedMedicine.label, medicineValue: selectedMedicine.value, quantity: currentBlindReturnItem.quantity };
      setBlindReturnItems([...blindReturnItems, newItem]);
      setCurrentBlindReturnItem({ medicine: "", quantity: 1 });
  };
  
  const handleRemoveBlindReturnItem = (id: number) => { setBlindReturnItems(blindReturnItems.filter(item => item.id !== id)); };

  const handleProcessBlindReturn = () => {
      if (blindReturnItems.length === 0) { toast({ variant: "destructive", title: "Error", description: "Please add at least one item to return." }); return; }

      const newMedicineOptions = [...medicineOptions];
      blindReturnItems.forEach(returnedItem => {
          const medicineIndex = newMedicineOptions.findIndex(med => med.value === returnedItem.medicineValue);
          if (medicineIndex > -1) { newMedicineOptions[medicineIndex].stock += returnedItem.quantity; }
      });
      setMedicineOptions(newMedicineOptions);

      toast({ title: "Blind Return Processed", description: "Stock has been updated. Please issue store credit or exchange manually." });
      setBlindReturnItems([]);
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
    
    const stockManagementRoutes = sidebarRoutes.filter(r => r.path.startsWith('/inventory') && r.inSidebar);


  return (
    <>
    <div className="flex min-h-screen w-full flex-col bg-muted/40 print:hidden">
      <Sidebar>
          <SidebarHeader> <SidebarMenuButton className="pointer-events-none"> <LayoutGrid className="size-6" /> <span className="text-lg font-semibold">MediStock</span> </SidebarMenuButton> </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem> <SidebarMenuButton href="/" tooltip="Dashboard"> <HomeIcon /> <span>Dashboard</span> </SidebarMenuButton> </SidebarMenuItem>
                {sidebarRoutes.filter(r => !r.path.startsWith('/inventory') && r.inSidebar).map((route) => ( <SidebarMenuItem key={route.path}> <SidebarMenuButton href={route.path} tooltip={route.name} isActive={pathname === route.path}> {getIcon(route.name)} <span>{route.name}</span> </SidebarMenuButton> </SidebarMenuItem> ))}
                {hasPermission('/inventory') && (
                    <Collapsible className="w-full" defaultOpen={pathname.startsWith('/inventory')}>
                        <CollapsibleTrigger asChild> <SidebarMenuItem> <SidebarMenuButton className="justify-between"> <div className="flex items-center gap-3"> <Package /> <span>Stock Management</span> </div> <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" /> </SidebarMenuButton> </SidebarMenuItem> </CollapsibleTrigger>
                        <CollapsibleContent> <SidebarMenu className="ml-7 mt-2 border-l pl-3"> {stockManagementRoutes.map((route) => ( <SidebarMenuItem key={route.path}> <SidebarMenuButton href={route.path} tooltip={route.name} size="sm" isActive={pathname === route.path}> {getIcon(route.name)} <span>{route.name}</span> </SidebarMenuButton> </SidebarMenuItem> ))} </SidebarMenu> </CollapsibleContent>
                    </Collapsible>
                )}
            </SidebarMenu>
          </SidebarContent>
           <SidebarFooter> <SidebarMenu> <SidebarMenuItem> <SidebarMenuButton onClick={logout} tooltip="Logout"> <LogOut /> <span>Logout</span> </SidebarMenuButton> </SidebarMenuItem> </SidebarMenu> </SidebarFooter>
      </Sidebar>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger className="sm:hidden" />
           <div className="flex-1"> <h1 className="text-xl font-semibold">Sales & Returns</h1> </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"> <Label htmlFor="current-store" className="hidden sm:block">Current Store:</Label> <Select value={currentStore} onValueChange={setCurrentStore} disabled={user?.role === 'Pharmacist' && availableStores.length === 1}> <SelectTrigger id="current-store" className="w-[180px]"> <SelectValue placeholder="Select Store"/> </SelectTrigger> <SelectContent> {availableStores.map(store => ( <SelectItem key={store.value} value={store.value}>{store.label}</SelectItem> ))} </SelectContent> </Select> </div>
                <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                 <TabsList> <TabsTrigger value="new-sale">New Sale</TabsTrigger> <TabsTrigger value="return-refund">Return & Refund</TabsTrigger> <TabsTrigger value="blind-return">Blind Return</TabsTrigger> </TabsList>

                <TabsContent value="new-sale">
                    <Card>
                        <CardHeader> <CardTitle>New Sale</CardTitle> <CardDescription>Add patient and medicine details to record a new sale.</CardDescription> </CardHeader>
                        <CardContent>
                            <form onSubmit={handleRecordSale} className="space-y-6">
                                <Card>
                                    <CardHeader> <CardTitle>Patient Information</CardTitle> </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2"> <Label htmlFor="name">Patient Name</Label> <Input id="name" placeholder="John Doe" value={patientForm.name} onChange={handlePatientFormChange} required /> </div>
                                            <div className="space-y-2"> <Label htmlFor="mobile">Mobile Number</Label> <div className="flex gap-2"> <Input id="mobile" type="tel" placeholder="9876543210" value={patientForm.mobile} onChange={handlePatientFormChange} required /> <Button type="button" variant="outline" onClick={handleSearchPatient}> <Search className="h-4 w-4" /> <span className="sr-only">Search</span> </Button> </div> </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2"> <Label htmlFor="age">Age</Label> <Input id="age" type="number" placeholder="42" value={patientForm.age} onChange={handlePatientFormChange} /> </div>
                                            <div className="space-y-2"> <Label htmlFor="gender">Gender</Label> <Select value={patientForm.gender} onValueChange={handlePatientSelectChange}> <SelectTrigger id="gender"> <SelectValue placeholder="Select gender" /> </SelectTrigger> <SelectContent> <SelectItem value="Male">Male</SelectItem> <SelectItem value="Female">Female</SelectItem> <SelectItem value="Other">Other</SelectItem> </SelectContent> </Select> </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2"> <Label htmlFor="bp">Blood Pressure (BP)</Label> <Input id="bp" placeholder="e.g., 120/80" value={patientForm.bp} onChange={handlePatientFormChange}/> </div>
                                            <div className="space-y-2"> <Label htmlFor="sugar">Blood Sugar</Label> <Input id="sugar" placeholder="e.g., 98 mg/dL" value={patientForm.sugar} onChange={handlePatientFormChange}/> </div>
                                        </div>
                                        <div className="space-y-2"> <Label htmlFor="address">Address</Label> <Textarea id="address" placeholder="123 Main St, Anytown..." value={patientForm.address} onChange={handlePatientFormChange}/> </div>
                                        <div className="space-y-2"> <Label>Disease(s)</Label> <Popover> <PopoverTrigger asChild> <Button variant="outline" className="w-full justify-start font-normal"> {selectedDiseases.length > 0 ? selectedDiseases.map(id => diseaseOptions.find(d => d.id === id)?.label).join(', ') : "Select diseases"} </Button> </PopoverTrigger> <PopoverContent className="w-56 p-0"> <div className="space-y-2 p-2"> {diseaseOptions.map(disease => ( <div key={disease.id} className="flex items-center space-x-2"> <Checkbox id={disease.id} checked={selectedDiseases.includes(disease.id)} onCheckedChange={() => handleDiseaseSelection(disease.id)} /> <Label htmlFor={disease.id} className="font-normal">{disease.label}</Label> </div> ))} </div> </PopoverContent> </Popover> </div>
                                    </CardContent>
                                </Card>
                                
                                <div className="p-4 border rounded-lg space-y-4">
                                    <h3 className="font-semibold">Add Medicine to Sale</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2"> <Label htmlFor="medicine">Medicine</Label> <Select value={currentItem.medicine} onValueChange={(value) => setCurrentItem({...currentItem, medicine: value})}> <SelectTrigger id="medicine"> <SelectValue placeholder="Select a medicine" /> </SelectTrigger> <SelectContent> {medicineOptions.map(med => ( <SelectItem key={med.value} value={med.value} disabled={med.stock <= 0}>{med.label} (Stock: {med.stock})</SelectItem> ))} </SelectContent> </Select> </div>
                                            <div className="space-y-2"> <Label htmlFor="quantity">Quantity</Label> <Input id="quantity" type="number" placeholder="1" value={currentItem.quantity} onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value, 10) || 1})} min="1"/> </div>
                                        </div>
                                        <div className="flex items-end"> <Button type="button" onClick={handleAddItem} className="w-full"> <PlusCircle className="mr-2" /> Add Item </Button> </div>
                                    </div>
                                </div>

                                {saleItems.length > 0 && (
                                    <Card>
                                        <CardHeader> <CardTitle>Current Sale Items</CardTitle> </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader> <TableRow> <TableHead>Medicine</TableHead> <TableHead className="text-center">Quantity</TableHead> <TableHead className="text-right">Price (₹)</TableHead> <TableHead className="text-center">GST (%)</TableHead> <TableHead className="text-right">Total (₹)</TableHead> <TableHead>Action</TableHead> </TableRow> </TableHeader>
                                                <TableBody>
                                                    {saleItems.map(item => { const hasInsufficientStock = item.quantity > item.stock;
                                                        return ( <TableRow key={item.id} className={cn(hasInsufficientStock && "bg-destructive/20")}> <TableCell> {item.medicine} {hasInsufficientStock && <p className="text-xs text-destructive">Stock: {item.stock}</p>} </TableCell> <TableCell className="text-center">{item.quantity}</TableCell> <TableCell className="text-right">{item.price.toFixed(2)}</TableCell> <TableCell className="text-center">{item.gst}%</TableCell> <TableCell className="text-right">{item.total.toFixed(2)}</TableCell> <TableCell> <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}> <Trash2 className="h-4 w-4 text-destructive" /> </Button> </TableCell> </TableRow> )
                                                    })}
                                                </TableBody>
                                            </Table>
                                            <div className="mt-4 pt-4 border-t space-y-2 text-right"> <p className="font-semibold">Subtotal: <span className="font-normal">₹{subtotal.toFixed(2)}</span></p> <p className="font-semibold">Total GST: <span className="font-normal">₹{totalGst.toFixed(2)}</span></p> <p className="text-lg font-bold">Grand Total: <span className="font-bold">₹{grandTotal.toFixed(2)}</span></p> </div>
                                        </CardContent>
                                    </Card>
                                )}
                                
                                <div className="flex justify-end gap-2"> <Button type="submit" disabled={!isSaleValid}> Record Sale & Proceed to Payment </Button> </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="return-refund">
                    <Card>
                        <CardHeader> <CardTitle>Return Medicine & Process Refund</CardTitle> <CardDescription>Search for a past invoice or by mobile number to process a return.</CardDescription> </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="flex items-end gap-2">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-grow">
                                     <div className="space-y-2 sm:col-span-1">
                                        <Label htmlFor="search-type">Search By</Label>
                                        <Select value={searchType} onValueChange={setSearchType}>
                                            <SelectTrigger id="search-type"><SelectValue /></SelectTrigger>
                                            <SelectContent><SelectItem value="invoice">Invoice ID</SelectItem><SelectItem value="mobile">Mobile Number</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 sm:col-span-2">
                                        <Label htmlFor="search-query">{searchType === 'invoice' ? 'Invoice Number' : 'Mobile Number'}</Label>
                                        <Input id="search-query" placeholder={searchType === 'invoice' ? 'Enter invoice ID...' : 'Enter mobile number...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                    </div>
                                </div>
                                <Button onClick={handleSearchReturns}><Search className="mr-2 h-4 w-4"/> Search</Button>
                            </div>

                            {searchResults.length > 0 && (
                                <Card>
                                    <CardHeader><CardTitle>Search Results</CardTitle><CardDescription>Select an invoice to process a return.</CardDescription></CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Invoice ID</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {searchResults.map(sale => (
                                                    <TableRow key={sale.invoiceId}>
                                                        <TableCell>{sale.invoiceId}</TableCell>
                                                        <TableCell>{sale.customer}</TableCell>
                                                        <TableCell>{sale.date}</TableCell>
                                                        <TableCell className="text-right"><Button size="sm" onClick={() => handleSelectInvoice(sale)}>Select</Button></TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            )}

                            {saleToReturn && (
                                <Card className="bg-muted/50">
                                    <CardHeader> <CardTitle>Invoice Details</CardTitle> <CardDescription> Invoice ID: {saleToReturn.invoiceId} | Customer: {saleToReturn.customer} | Store: {saleToReturn.store} </CardDescription> </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader> <TableRow> <TableHead>Medicine</TableHead> <TableHead className="text-center">Qty Sold</TableHead> <TableHead className="text-center">Return Qty</TableHead> </TableRow> </TableHeader>
                                            <TableBody>
                                                {itemsToReturn.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>{item.medicine}</TableCell>
                                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                                        <TableCell className="text-center"> <Input type="number" className="w-20 mx-auto h-8" min={0} max={item.quantity} value={item.returnQuantity} onChange={(e) => handleReturnQuantityChange(item.id, parseInt(e.target.value, 10))} /> </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <div className="mt-4 flex justify-end"> <Button onClick={handleProcessRefund}> <Undo className="mr-2 h-4 w-4"/> Process Refund & Restock </Button> </div>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="blind-return">
                    <Card>
                        <CardHeader> <CardTitle>Blind Return (No Invoice)</CardTitle> <CardDescription>Process a return for an item without an original invoice. Stock will be updated. Issue store credit manually.</CardDescription> </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="p-4 border rounded-lg space-y-4">
                                <h3 className="font-semibold">Add Medicine to Return</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2"> <Label htmlFor="blind-return-medicine">Medicine</Label> <Select value={currentBlindReturnItem.medicine} onValueChange={(value) => setCurrentBlindReturnItem({...currentBlindReturnItem, medicine: value})}> <SelectTrigger id="blind-return-medicine"> <SelectValue placeholder="Select a medicine" /> </SelectTrigger> <SelectContent> {medicineOptions.map(med => ( <SelectItem key={med.value} value={med.value}>{med.label}</SelectItem> ))} </SelectContent> </Select> </div>
                                        <div className="space-y-2"> <Label htmlFor="blind-return-quantity">Quantity</Label> <Input id="blind-return-quantity" type="number" placeholder="1" value={currentBlindReturnItem.quantity} onChange={(e) => setCurrentBlindReturnItem({...currentBlindReturnItem, quantity: parseInt(e.target.value, 10) || 1})} min="1"/> </div>
                                    </div>
                                    <div className="flex items-end"> <Button type="button" onClick={handleAddBlindReturnItem} className="w-full"> <PlusCircle className="mr-2" /> Add Item </Button> </div>
                                </div>
                            </div>
                            {blindReturnItems.length > 0 && (
                                <Table>
                                    <TableHeader> <TableRow> <TableHead>Medicine</TableHead> <TableHead className="text-center">Quantity</TableHead> <TableHead>Action</TableHead> </TableRow> </TableHeader>
                                    <TableBody>
                                        {blindReturnItems.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.medicine}</TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveBlindReturnItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                            <div className="flex justify-end"> <Button onClick={handleProcessBlindReturn} disabled={blindReturnItems.length === 0}> <Undo className="mr-2 h-4 w-4"/> Process Blind Return & Restock </Button> </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader> <DialogTitle>Complete Payment</DialogTitle> <DialogDescription> Select a payment method to finalize the sale. Grand Total: ₹{grandTotal.toFixed(2)} </DialogDescription> </DialogHeader>
                    <Tabs defaultValue="cash" className="w-full">
                        <TabsList className="grid w-full grid-cols-2"> <TabsTrigger value="cash">Cash</TabsTrigger> <TabsTrigger value="online">Online</TabsTrigger> </TabsList>
                        <TabsContent value="cash">
                           <div className="py-4 text-center space-y-4">
                                <p className="text-sm text-muted-foreground">Confirm cash payment and print the invoice.</p>
                                <div className="flex justify-center items-center gap-4"> <Label htmlFor="print-size-cash">Paper Size</Label> <Select value={printSize} onValueChange={setPrintSize}> <SelectTrigger id="print-size-cash" className="w-[120px]"> <SelectValue /> </SelectTrigger> <SelectContent> <SelectItem value="57mm">57mm</SelectItem> <SelectItem value="80mm">80mm</SelectItem> <SelectItem value="112mm">112mm</SelectItem> </SelectContent> </Select> </div>
                                <Button onClick={handlePrint}> <Printer className="mr-2 h-4 w-4" /> Print Invoice </Button>
                           </div>
                        </TabsContent>
                        <TabsContent value="online">
                            <div className="py-4 text-center space-y-4">
                                <p className="text-sm text-muted-foreground">Scan the QR code to complete the payment.</p>
                                <div className="flex justify-center"> <Image src="https://placehold.co/200x200.png" alt="QR Code" width={150} height={150} data-ai-hint="qr code" /> </div>
                                 <div className="flex justify-center items-center gap-4"> <Label htmlFor="print-size-online">Paper Size</Label> <Select value={printSize} onValueChange={setPrintSize}> <SelectTrigger id="print-size-online" className="w-[120px]"> <SelectValue /> </SelectTrigger> <SelectContent> <SelectItem value="57mm">57mm</SelectItem> <SelectItem value="80mm">80mm</SelectItem> <SelectItem value="112mm">112mm</SelectItem> </SelectContent> </Select> </div>
                                <Button onClick={handlePrint}> <Printer className="mr-2 h-4 w-4" /> Confirm & Print </Button>
                           </div>
                        </TabsContent>
                    </Tabs>
                    <DialogFooter> <DialogClose asChild> <Button type="button" variant="secondary" onClick={() => setPaymentModalOpen(false)}>Close</Button> </DialogClose> </DialogFooter>
                </DialogContent>
            </Dialog>

        </main>
      </div>
    </div>
    <div id="invoice-print-area" className={cn("hidden print:block p-2", `print-${printSize}`)}>
        <div className="text-center mb-2"> <h2 className="font-bold text-sm">{companyInfo.name}</h2> <p className="text-xs">{companyInfo.address}</p> <p className="text-xs font-semibold">GSTIN: {companyInfo.gstin}</p> <hr className="my-1 border-dashed border-black" /> <h3 className="font-semibold">Tax Invoice</h3> </div>
        <div className="text-xs mb-2"> <p><strong>Patient:</strong> {patientForm.name}</p> <p><strong>Mobile:</strong> {patientForm.mobile}</p> <p><strong>Invoice No:</strong> SALE-{(Math.random() * 10000).toFixed(0)}</p> <p><strong>Date:</strong> {new Date().toLocaleString()}</p> </div>
        <table className="w-full text-xs">
            <thead> <tr className="border-t border-b border-dashed border-black"> <th className="text-left py-1">Item</th> <th className="text-center">Qty</th> <th className="text-right">Price</th> <th className="text-right">Total</th> </tr> </thead>
            <tbody> {saleItems.map(item => ( <tr key={item.id}> <td className="py-0.5">{item.medicine}</td> <td className="text-center">{item.quantity}</td> <td className="text-right">{item.price.toFixed(2)}</td> <td className="text-right">{item.total.toFixed(2)}</td> </tr> ))} </tbody>
        </table>
        <hr className="my-1 border-dashed border-black" />
        <div className="text-xs text-right space-y-0.5"> <p>Subtotal: {subtotal.toFixed(2)}</p> <p>Total GST: {totalGst.toFixed(2)}</p> <p className="font-bold text-sm">Grand Total: {grandTotal.toFixed(2)}</p> </div>
         <div className="text-center mt-2 text-xs"> <p>Thank you for your visit!</p> <p>Get well soon.</p> </div>
    </div>
    </>
  );
}
