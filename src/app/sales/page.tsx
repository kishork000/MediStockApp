
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
import { Input from "@/components/ui/input";
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
    { value: "uptown-health", label: "Uptown Health", id: "STR003" },
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
    return allAppRoutes.filter(route => route.path !== '/');
  }, []);
  
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
                                        SidebarMenuButton> 
                                    SidebarMenuItem> 
                                ))} 
                            SidebarMenu> 
                        CollapsibleContent>
                    Collapsible>
                )}
                 
                 {hasPermission('/admin') && (
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/admin" tooltip="Admin" isActive={pathname === '/admin'}>
                            {getIcon('Admin')}
                            <span>Admin</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                 )}
            SidebarMenu>
          SidebarContent>
           <SidebarFooter>  <span>Logout</span>  </SidebarMenuButton>  </SidebarMenuItem> </SidebarMenu> </SidebarFooter>
      Sidebar>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           SidebarTrigger  
           
                Sales &amp; Returns
                 
                
                     Current Store:   
                         
                           
                               {availableStores.map(store => (  {store.label}  ))}
                           
                         
                     
                 
                 
           
        header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
             
                 New Sale
                  
                  
                  
                     Patient Information 
                     
                         
                            Patient Name
                             John Doe
                         
                         
                            Mobile Number
                              
                                
                                  
                              
                             
                         
                     
                         
                            Age
                             42
                         
                         
                            Gender
                             
                                 
                                    
                                
                            
                         
                     
                         
                            Blood Pressure (BP)
                             e.g., 120/80
                         
                         
                            Blood Sugar
                             e.g., 98 mg/dL
                         
                     
                         Address
                          123 Main St, Anytown...
                         
                         
                            Disease(s)
                                 
                                         
                                               
                                                    
                                                
                                              
                                      
                                     
                                 
                             
                         
                     
                 
                  
                     Add Medicine to Sale
                     
                         
                                 Medicine
                                   
                                         Select a medicine
                                         {medicineOptions.map(med => (  {med.label} (Stock: {med.stock}) ))}
                                       
                                       
                                
                             
                             Quantity
                              
                         
                         
                             Add Item 
                         
                     
                 
                  
                     Current Sale Items
                     
                         
                             
                                 
                                     Item
                                     Qty
                                     Price (₹)
                                     GST (%)
                                     Total (₹)
                                     
                                 
                             
                                 {saleItems.map(item => { const hasInsufficientStock = item.quantity > item.stock;
                                     return (  
                                          {item.medicine}  {hasInsufficientStock &&  Stock: {item.stock} } 
                                          {item.quantity}
                                         {item.price.toFixed(2)}
                                         {item.gst}%
                                         {item.total.toFixed(2)}
                                           
                                               
                                       
                                      )
                                 })}
                             
                             
                                 Subtotal:  ₹{subtotal.toFixed(2)}
                                 Total GST:  ₹{totalGst.toFixed(2)}
                                 Grand Total:  ₹{grandTotal.toFixed(2)}
                             
                         
                     
                 
                 
                     Record Sale &amp; Proceed to Payment 
                 
             
                 
                     Return Medicine &amp; Process Refund
                     
                        
                           
                                Search By
                                   
                                         
                                       
                                      
                                 
                                  Invoice Number
                                  Mobile Number
                             
                             {searchType === 'invoice' ? 'Invoice Number' : 'Mobile Number'}
                              Enter invoice ID...
                              Enter mobile number...
                         
                        
                         Search
                     

                       {searchResults.length > 0 && (
                          
                             Search Results
                            Select an invoice to process a return.
                            
                                 
                                   
                                      Invoice ID
                                      Customer
                                      Date
                                      
                                   
                                 
                                {searchResults.map(sale => (
                                    
                                       {sale.invoiceId}
                                       {sale.customer}
                                       {sale.date}
                                      
                                    
                                ))}
                             
                          
                       )}

                       {saleToReturn && (
                          
                             Invoice Details
                              Invoice ID: {saleToReturn.invoiceId} | Customer: {saleToReturn.customer} | Store: {saleToReturn.store} 
                             
                                 
                                   
                                      Medicine
                                      Qty Sold
                                      Return Qty
                                   
                                 
                                {itemsToReturn.map(item => (
                                    
                                       {item.medicine}
                                       {item.quantity}
                                        
                                           
                                               
                                       
                                    
                                ))}
                                 Process Refund &amp; Restock 
                             
                          
                       )}
                     
                 

                 
                     Blind Return (No Invoice)
                     
                         
                           Process a return for an item without an original invoice. Stock will be updated. Issue store credit manually.
                          
                             Add Medicine to Return
                             
                                  
                                         Medicine
                                            
                                                
                                                   
                                               
                                             
                                           
                                          
                                  
                                   Quantity
                                     
                                 
                                  Add Item 
                             
                         

                        {blindReturnItems.length > 0 && (
                           
                                
                                    
                                        Medicine
                                        Quantity
                                         
                                    
                                    
                                        {blindReturnItems.map(item => (
                                           
                                                {item.medicine}
                                               {item.quantity}
                                                
                                                   
                                                       
                                                   
                                                
                                           
                                        ))}
                                    
                                
                           
                        )}
                        
                         Process Blind Return &amp; Restock 
                     
                 
             
             
                 Complete Payment
                  
                   Select a payment method to finalize the sale. Grand Total: ₹{grandTotal.toFixed(2)} 
                     
                         Cash
                         Online
                         
                             
                                 Confirm cash payment and print the invoice.
                                  
                                       Paper Size
                                       
                                          
                                                
                                                   
                                               
                                            
                                       
                                     
                                  
                                 Print Invoice 
                                
                         
                         
                            Scan the QR code to complete the payment.
                             
                              
                               Paper Size
                                
                                   
                                        
                                           
                                       
                                    
                                 
                            
                             Confirm &amp; Print 
                         
                     
                     
                         Close
                     
                 
            
        
    

   MediStock Pharmacy
   123 Health St, Wellness City, State 12345
   GSTIN: 22AAAAA0000A1Z5
   
   Tax Invoice
   Patient: {patientForm.name}
   Mobile: {patientForm.mobile}
   Invoice No: SALE-{(Math.random() * 10000).toFixed(0)}
   Date: {new Date().toLocaleString()}
   
       
            Item
             Qty
            Price
            Total
       
            {saleItems.map(item => ( 
                {item.medicine}
                {item.quantity}
                 {item.price.toFixed(2)}
                 {item.total.toFixed(2)}
            ))}
       
       
        Subtotal: {subtotal.toFixed(2)}
        Total GST: {totalGst.toFixed(2)}
        Grand Total: {grandTotal.toFixed(2)}
        
            Thank you for your visit!
             Get well soon.
        
   
</>
  );
}
