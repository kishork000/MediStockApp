
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
import { Home as HomeIcon, LayoutGrid, Package, Users, ShoppingCart, BarChart, PlusSquare, Users2, Trash2, PlusCircle, Activity, Printer, Settings, GitBranch } from "lucide-react";
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

interface SaleItem {
    id: number;
    medicine: string;
    quantity: number;
    price: number;
    gst: number;
    total: number;
}

const medicineOptions = [
    { value: "aspirin", label: "Aspirin", price: 10.00, gst: 5 },
    { value: "ibuprofen", label: "Ibuprofen", price: 15.50, gst: 5 },
    { value: "paracetamol", label: "Paracetamol", price: 5.75, gst: 5 },
    { value: "amoxicillin", label: "Amoxicillin", price: 55.20, gst: 12 },
    { value: "metformin", label: "Metformin", price: 25.00, gst: 12 },
    { value: "atorvastatin", label: "Atorvastatin", price: 45.00, gst: 12 },
];

const diseaseOptions = [
    { id: "d1", label: "Fever" },
    { id: "d2", label: "Headache" },
    { id: "d3", label: "Diabetes" },
    { id: "d4", label: "Hypertension" },
    { id: "d5", label: "Common Cold" },
    { id: "d6", label: "Allergy" },
];

// In a real app, this would come from a database or a global state management library like Zustand or Redux
const companyInfo = {
    name: "MediStock Pharmacy",
    address: "123 Health St, Wellness City, State 12345",
    gstin: "22AAAAA0000A1Z5"
};


export default function SalesPage() {
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [currentItem, setCurrentItem] = useState({ medicine: "", quantity: 1 });
  const [selectedDiseases, setSelectedDiseases] = useState<string[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);


  const handleAddItem = () => {
      const selectedMedicine = medicineOptions.find(m => m.value === currentItem.medicine);
      if (!selectedMedicine || currentItem.quantity <= 0) return;

      const newItem: SaleItem = {
          id: Date.now(),
          medicine: selectedMedicine.label,
          quantity: currentItem.quantity,
          price: selectedMedicine.price,
          gst: selectedMedicine.gst,
          total: selectedMedicine.price * currentItem.quantity,
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

  const handleRecordSale = (e: React.FormEvent) => {
      e.preventDefault();
      // In a real app, you would save this data to a database.
      if (saleItems.length > 0) {
        setPaymentModalOpen(true);
      }
  }

  const handlePrint = () => {
    window.print();
  }


  const subtotal = calculateSubtotal();
  const totalGst = calculateTotalGst();
  const grandTotal = subtotal + totalGst;


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
                  <SidebarMenuButton href="/sales" isActive={true} tooltip="Sales">
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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 print:hidden">
           <SidebarTrigger className="sm:hidden" />
           <h1 className="text-xl font-semibold">Record a Sale</h1>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 print:p-0">
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
                                                    <SelectItem key={med.value} value={med.value}>{med.label}</SelectItem>
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
                                            {saleItems.map(item => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.medicine}</TableCell>
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
                                            ))}
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
                             <Button type="submit" disabled={saleItems.length === 0}>
                                Record Sale & Proceed to Payment
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

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
