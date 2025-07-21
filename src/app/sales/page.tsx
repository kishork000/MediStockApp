
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Trash2, PlusCircle, Activity, Printer, Settings, GitBranch, Search, Undo, LogOut, ChevronDown, Warehouse } from "lucide-react";
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

const medicineOptions = [
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
        invoiceId: "SALE001",
        customer: "John Doe",
        date: "2024-07-20",
        items: [
            { id: 1, medicine: "Paracetamol", quantity: 2, price: 5.75, gst: 5, total: 11.50, stock: 100 },
            { id: 2, medicine: "Amoxicillin", quantity: 1, price: 55.20, gst: 12, total: 55.20, stock: 80 },
        ],
        store: "Downtown Pharmacy"
    }
];

const companyInfo = {
    name: "MediStock Pharmacy",
    address: "123 Health St, Wellness City, State 12345",
    gstin: "22AAAAA0000A1Z5"
};


export default function SalesPage() {
  const { user, logout, loading, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("new-sale");
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [currentItem, setCurrentItem] = useState({ medicine: "", quantity: 1 });
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  
  // Return state
  const [invoiceIdToReturn, setInvoiceIdToReturn] = useState("");
  const [saleToReturn, setSaleToReturn] = useState<any>(null);
  const [itemsToReturn, setItemsToReturn] = useState<ReturnItem[]>([]);

  const sidebarRoutes = useMemo(() => {
    return allAppRoutes.filter(route => hasPermission(route.path) && route.path !== '/');
  }, [hasPermission]);

  useEffect(() => {
    if (!loading && !user) {
        router.push('/login');
    }
  }, [user, loading, router]);


  const handleAddItem = () => {
      const selectedMedicine = medicineOptions.find(m => m.value === currentItem.medicine);
      if (!selectedMedicine || currentItem.quantity <= 0) return;

      const newItem: SaleItem = {
          id: Date.now(),
          medicine: selectedMedicine.label,
          medicineValue: selectedMedicine.value,
          quantity: currentItem.quantity,
          price: selectedMedicine.price,
          gst: selectedMedicine.gst,
          total: selectedMedicine.price * currentItem.quantity,
          stock: selectedMedicine.stock,
      };

      setSaleItems([...saleItems, newItem]);
      setCurrentItem({ medicine: "", quantity: 1 }); // Reset for next item
  };
  
  const handleRemoveItem = (id: number) => {
      setSaleItems(saleItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return saleItems.reduce((acc, item) => acc + item.total, 0);
  };

  const calculateTotalGst = () => {
      return saleItems.reduce((acc, item) => {
          const itemGst = item.total * (item.gst / 100);
          return acc + itemGst;
      }, 0);
  };
  
  const handleDiseaseSelection = (diseaseId: string) => {
      setSelectedDiseases(prev => 
          prev.includes(diseaseId) 
              ? prev.filter(id => id !== diseaseId) 
              : [...prev, diseaseId]
      );
  };
  
  const isSaleValid = useMemo(() => {
    if (saleItems.length === 0) return false;
    return saleItems.every(item => item.quantity <= item.stock);
  }, [saleItems]);

  const handleRecordSale = (e: React.FormEvent) => {
      e.preventDefault();
      if (isSaleValid) {
        setPaymentModalOpen(true);
      }
  }

  const handlePrint = () => {
    window.print();
  }

  const handleSearchInvoice = () => {
      const foundSale = pastSales.find(s => s.invoiceId.toLowerCase() === invoiceIdToReturn.toLowerCase());
      if (foundSale) {
          setSaleToReturn(foundSale);
          // Initialize items to return with returnQuantity
          setItemsToReturn(foundSale.items.map(item => ({ ...item, returnQuantity: 0 })));
      } else {
          alert("Invoice not found.");
          setSaleToReturn(null);
          setItemsToReturn([]);
      }
  };
  
  const handleReturnQuantityChange = (itemId: number, quantity: number) => {
      setItemsToReturn(itemsToReturn.map(item =>
          item.id === itemId ? { ...item, returnQuantity: Math.min(quantity, item.quantity) } : item
      ));
  };

  const handleProcessRefund = () => {
      const itemsBeingReturned = itemsToReturn.filter(item => item.returnQuantity > 0);
      if(itemsBeingReturned.length === 0) {
          alert("Please specify a quantity to return for at least one item.");
          return;
      }
      // In a real app, this would trigger backend logic:
      // 1. Create a credit note record.
      // 2. Increase stock for the returned items in the specific store.
      // 3. Record the refund against the payment method.
      const refundAmount = itemsBeingReturned.reduce((acc, item) => {
        const pricePerUnit = item.price;
        const gstMultiplier = 1 + (item.gst / 100);
        return acc + (pricePerUnit * item.returnQuantity * gstMultiplier);
      }, 0).toFixed(2);

      alert(`Refund of ₹${refundAmount} processed for invoice ${saleToReturn.invoiceId}. Stock for ${saleToReturn.store} has been updated.`);
      // Reset state
      setInvoiceIdToReturn("");
      setSaleToReturn(null);
      setItemsToReturn([]);
  };


  const subtotal = calculateSubtotal();
  const totalGst = calculateTotalGst();
  const grandTotal = subtotal + totalGst;

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
                        <SidebarMenuButton href={route.path} tooltip={route.name} isActive={pathname === route.path}>
                            {getIcon(route.name)}
                            <span>{route.name}</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}

                {hasPermission('/inventory') && (
                    <Collapsible className="w-full">
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 print:hidden">
           <SidebarTrigger className="sm:hidden" />
           <div className="flex-1">
             <h1 className="text-xl font-semibold">Sales & Returns</h1>
           </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Label htmlFor="current-store" className="hidden sm:block">Current Store:</Label>
                    <Select defaultValue="downtown-pharmacy">
                        <SelectTrigger id="current-store" className="w-[180px]">
                            <SelectValue placeholder="Select Store"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="downtown-pharmacy">Downtown Pharmacy</SelectItem>
                            <SelectItem value="uptown-health">Uptown Health</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 print:p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                 <TabsList className="print:hidden">
                    <TabsTrigger value="new-sale">New Sale</TabsTrigger>
                    <TabsTrigger value="return-refund">Return & Refund</TabsTrigger>
                </TabsList>

                <TabsContent value="new-sale">
                    <Card className="print:shadow-none print:border-none">
                        <CardHeader className="print:hidden">
                            <CardTitle>New Sale</CardTitle>
                            <CardDescription>Add patient and medicine details to record a new sale.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleRecordSale} className="space-y-6">
                                
                                <Card className="print:hidden">
                                    <CardHeader>
                                        <CardTitle>Patient Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="patient-name">Patient Name</Label>
                                                <Input id="patient-name" placeholder="John Doe" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="mobile-number">Mobile Number</Label>
                                                <Input id="mobile-number" type="tel" placeholder="9876543210" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="age">Age</Label>
                                                <Input id="age" type="number" placeholder="42" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="gender">Gender</Label>
                                                <Select>
                                                    <SelectTrigger id="gender">
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="male">Male</SelectItem>
                                                        <SelectItem value="female">Female</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="bp">Blood Pressure (BP)</Label>
                                                <Input id="bp" placeholder="e.g., 120/80" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="sugar">Blood Sugar</Label>
                                                <Input id="sugar" placeholder="e.g., 98 mg/dL" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Address</Label>
                                            <Textarea id="address" placeholder="123 Main St, Anytown..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Disease(s)</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-start font-normal">
                                                        {selectedDiseases.length > 0 ? selectedDiseases.map(id => diseaseOptions.find(d => d.id === id)?.label).join(', ') : "Select diseases"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-56 p-0">
                                                    <div className="space-y-2 p-2">
                                                        {diseaseOptions.map(disease => (
                                                            <div key={disease.id} className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={disease.id}
                                                                    checked={selectedDiseases.includes(disease.id)}
                                                                    onCheckedChange={() => handleDiseaseSelection(disease.id)}
                                                                />
                                                                <Label htmlFor={disease.id} className="font-normal">{disease.label}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </CardContent>
                                </Card>
                                
                                <div className="p-4 border rounded-lg space-y-4 print:hidden">
                                    <h3 className="font-semibold">Add Medicine to Sale</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="medicine">Medicine</Label>
                                                <Select value={currentItem.medicine} onValueChange={(value) => setCurrentItem({...currentItem, medicine: value})}>
                                                    <SelectTrigger id="medicine">
                                                        <SelectValue placeholder="Select a medicine" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {medicineOptions.map(med => (
                                                            <SelectItem key={med.value} value={med.value}>{med.label} (Stock: {med.stock})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="quantity">Quantity</Label>
                                                <Input id="quantity" type="number" placeholder="1" value={currentItem.quantity} onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value, 10) || 1})} min="1"/>
                                            </div>
                                        </div>
                                        <div className="flex items-end">
                                            <Button type="button" onClick={handleAddItem} className="w-full">
                                                <PlusCircle className="mr-2" /> Add Item
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {saleItems.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <div className="hidden print:block text-center mb-4">
                                                <h2 className="text-xl font-bold">{companyInfo.name}</h2>
                                                <p className="text-sm">{companyInfo.address}</p>
                                                <p className="text-sm font-semibold">GSTIN: {companyInfo.gstin}</p>
                                                <hr className="my-2" />
                                                <h3 className="text-lg font-semibold">Tax Invoice</h3>
                                            </div>
                                            <CardTitle className="print:hidden">Current Sale Items</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Medicine</TableHead>
                                                        <TableHead className="text-center">Quantity</TableHead>
                                                        <TableHead className="text-right">Price (₹)</TableHead>
                                                        <TableHead className="text-center">GST (%)</TableHead>
                                                        <TableHead className="text-right">Total (₹)</TableHead>
                                                        <TableHead className="print:hidden">Action</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {saleItems.map(item => {
                                                        const hasInsufficientStock = item.quantity > item.stock;
                                                        return (
                                                            <TableRow key={item.id} className={cn(hasInsufficientStock && "bg-destructive/20")}>
                                                                <TableCell>
                                                                    {item.medicine}
                                                                    {hasInsufficientStock && <p className="text-xs text-destructive">Stock: {item.stock}</p>}
                                                                </TableCell>
                                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                                <TableCell className="text-right">{item.price.toFixed(2)}</TableCell>
                                                                <TableCell className="text-center">{item.gst}%</TableCell>
                                                                <TableCell className="text-right">{item.total.toFixed(2)}</TableCell>
                                                                <TableCell className="print:hidden">
                                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                            <div className="mt-4 pt-4 border-t space-y-2 text-right">
                                                <p className="font-semibold">Subtotal: <span className="font-normal">₹{subtotal.toFixed(2)}</span></p>
                                                <p className="font-semibold">Total GST: <span className="font-normal">₹{totalGst.toFixed(2)}</span></p>
                                                <p className="text-lg font-bold">Grand Total: <span className="font-bold">₹{grandTotal.toFixed(2)}</span></p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                
                                <div className="flex justify-end gap-2 print:hidden">
                                    <Button type="submit" disabled={!isSaleValid}>
                                        Record Sale & Proceed to Payment
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="return-refund">
                    <Card>
                        <CardHeader>
                            <CardTitle>Return Medicine & Process Refund</CardTitle>
                            <CardDescription>Search for a past invoice to process a return.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-end gap-2">
                                <div className="flex-grow space-y-2">
                                    <Label htmlFor="invoice-search">Invoice Number</Label>
                                    <Input 
                                        id="invoice-search" 
                                        placeholder="Enter invoice ID..."
                                        value={invoiceIdToReturn}
                                        onChange={(e) => setInvoiceIdToReturn(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleSearchInvoice}>
                                    <Search className="mr-2 h-4 w-4"/> Search
                                </Button>
                            </div>

                            {saleToReturn && (
                                <Card className="bg-muted/50">
                                    <CardHeader>
                                        <CardTitle>Invoice Details</CardTitle>
                                        <CardDescription>
                                            Invoice ID: {saleToReturn.invoiceId} | Customer: {saleToReturn.customer} | Store: {saleToReturn.store}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Medicine</TableHead>
                                                    <TableHead className="text-center">Qty Sold</TableHead>
                                                    <TableHead className="text-center">Return Qty</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {itemsToReturn.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>{item.medicine}</TableCell>
                                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Input
                                                                type="number"
                                                                className="w-20 mx-auto h-8"
                                                                min={0}
                                                                max={item.quantity}
                                                                value={item.returnQuantity}
                                                                onChange={(e) => handleReturnQuantityChange(item.id, parseInt(e.target.value, 10))}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <div className="mt-4 flex justify-end">
                                            <Button onClick={handleProcessRefund}>
                                                <Undo className="mr-2 h-4 w-4"/> Process Refund & Restock
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Complete Payment</DialogTitle>
                        <DialogDescription>
                            Select a payment method to finalize the sale. Grand Total: ₹{grandTotal.toFixed(2)}
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="cash" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="cash">Cash</TabsTrigger>
                            <TabsTrigger value="online">Online</TabsTrigger>
                        </TabsList>
                        <TabsContent value="cash">
                           <div className="py-4 text-center">
                                <p className="text-sm text-muted-foreground mb-4">Confirm cash payment and print the invoice.</p>
                                <Button onClick={handlePrint}>
                                    <Printer className="mr-2 h-4 w-4" /> Print Invoice
                                </Button>
                           </div>
                        </TabsContent>
                        <TabsContent value="online">
                            <div className="py-4 text-center">
                                <p className="text-sm text-muted-foreground mb-4">Scan the QR code to complete the payment.</p>
                                <div className="flex justify-center mb-4">
                                     <Image src="https://placehold.co/200x200.png" alt="QR Code" width={200} height={200} data-ai-hint="qr code" />
                                </div>
                                <Button onClick={handlePrint}>
                                    <Printer className="mr-2 h-4 w-4" /> Confirm Payment & Print
                                </Button>
                           </div>
                        </TabsContent>
                    </Tabs>
                    <DialogFooter>
                       <DialogClose asChild>
                            <Button type="button" variant="secondary">Close</Button>
                       </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </main>
      </div>
    </div>
  );
}
