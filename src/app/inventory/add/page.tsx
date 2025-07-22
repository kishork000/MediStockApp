
"use client";

import { useMemo, useEffect, useState } from "react";
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, Warehouse, GitBranch, LogOut, ChevronDown, TrendingUp, PlusCircle, Trash2, Upload, File, Download, Undo, Pill, Building, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { getMedicines, Medicine } from "@/services/medicine-service";
import { getManufacturers, Manufacturer } from "@/services/manufacturer-service";
import { addStockToInventory } from "@/services/inventory-service";
import { recordPurchase, PurchaseItem } from "@/services/purchase-service";


export default function AddStockPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date());
    const [manufacturerId, setManufacturerId] = useState("");
    const [destination, setDestination] = useState("warehouse");

    const [medicineMaster, setMedicineMaster] = useState<Medicine[]>([]);
    const [manufacturerMaster, setManufacturerMaster] = useState<Manufacturer[]>([]);

    const sidebarRoutes = useMemo(() => allAppRoutes.filter(route => route.path !== '/'), []);
    const stockManagementRoutes = useMemo(() => allAppRoutes.filter(route => route.path.startsWith('/inventory/') && route.inSidebar && hasPermission(route.path)), [hasPermission]);

     useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [medicines, manufacturers] = await Promise.all([
                    getMedicines(),
                    getManufacturers()
                ]);
                setMedicineMaster(medicines);
                setManufacturerMaster(manufacturers);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load master data.' });
            }
        };

        if (user) {
            fetchMasters();
        }
    }, [user, toast]);


    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    const handleAddItem = () => {
        const newItem: PurchaseItem = {
            id: Date.now().toString(),
            medicineId: "",
            medicineName: "",
            quantity: 1,
            pricePerUnit: 0,
            expiryDate: "",
        };
        setPurchaseItems([...purchaseItems, newItem]);
    };

    const handleItemChange = (id: string, field: keyof PurchaseItem, value: string | number) => {
        setPurchaseItems(purchaseItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleMedicineSelect = (id: string, medicineId: string) => {
        const selectedMedicine = medicineMaster.find(m => m.id === medicineId);
        if (!selectedMedicine) return;

        setPurchaseItems(purchaseItems.map(item =>
            item.id === id ? { 
                ...item, 
                medicineId: selectedMedicine.id,
                medicineName: selectedMedicine.name,
                pricePerUnit: selectedMedicine.purchasePrice,
            } : item
        ));
    };

    const handleRemoveItem = (id: string) => {
        setPurchaseItems(purchaseItems.filter(item => item.id !== id));
    };

    const totalInvoiceValue = useMemo(() => {
        return purchaseItems.reduce((acc, item) => acc + (item.quantity * item.pricePerUnit), 0);
    }, [purchaseItems]);

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!invoiceNumber) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a purchase invoice number.' });
            return;
        }
         if (!invoiceDate) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a purchase invoice date.' });
            return;
        }
        if (!manufacturerId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a manufacturer.' });
            return;
        }
        if (purchaseItems.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please add at least one medicine to the list.' });
            return;
        }
        for (const item of purchaseItems) {
            if (!item.medicineId || item.quantity <= 0 || item.pricePerUnit <= 0) {
                toast({ variant: 'destructive', title: 'Error', description: `Please complete all required fields for ${item.medicineName || 'a new row'}. Medicine, Quantity and Price are required.` });
                return;
            }
        }
        
        try {
            const stockToAdd = purchaseItems.map(item => ({
                medicineId: item.medicineId,
                medicineName: item.medicineName,
                quantity: item.quantity,
            }));
            
            await addStockToInventory(destination, stockToAdd);

            const manufacturer = manufacturerMaster.find(m => m.id === manufacturerId);

            await recordPurchase({
                invoiceId: invoiceNumber,
                date: invoiceDate.toISOString(),
                manufacturerId: manufacturerId,
                manufacturerName: manufacturer?.name || 'N/A',
                items: purchaseItems,
                totalAmount: totalInvoiceValue,
            });

            toast({ title: 'Success', description: 'Stock added and purchase recorded successfully.' });
            setPurchaseItems([]);
            setInvoiceNumber("");
            setManufacturerId("");
            setInvoiceDate(new Date());

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add stock to inventory.' });
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            toast({
                title: "File Uploaded",
                description: `${file.name} has been uploaded. Processing will happen on the backend.`,
            });
        }
    };
    
    const downloadSampleCsv = () => {
        const header = "MedicineID,Quantity,PricePerUnit,PurchaseDate(YYYY-MM-DD),ExpiryDate(YYYY-MM-DD)\n";
        const exampleRow = "MED001,100,10.50,2024-07-20,2026-12-31\n";
        const blob = new Blob([header, exampleRow], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "sample_stock_import.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
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
            case 'Medicine Master': return <Pill />;
            case 'Manufacturer Master': return <Building />;
            case 'Add Stock': return <PlusSquare />;
            case 'Return to Manufacturer': return <Undo />;
            case 'Stock Transfer': return <GitBranch />;
            case 'Inventory Reports': return <BarChart />;
            case 'Valuation Report': return <TrendingUp />;
            case 'Diseases': return <Activity />;
            case 'Admin': return <Settings />;
            default: return <LayoutGrid />;
        }
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
                {hasPermission('/') && (
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/" tooltip="Dashboard">
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
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <SidebarTrigger className="sm:hidden" />
           <div className="flex w-full items-center justify-between">
              <h1 className="text-xl font-semibold">Stock Inflow</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs defaultValue="bulk-add">
                <TabsList>
                    <TabsTrigger value="bulk-add">Add Stock</TabsTrigger>
                    <TabsTrigger value="csv-import">Import from CSV</TabsTrigger>
                </TabsList>
                <TabsContent value="bulk-add">
                    <form onSubmit={handleFormSubmit}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Add New Stock</CardTitle>
                                <CardDescription>Fill in the form to add new stock to the warehouse based on a purchase invoice.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="invoice-number">Purchase Invoice Number</Label>
                                        <Input id="invoice-number" placeholder="e.g., INV-2024-123" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="invoice-date">Purchase Invoice Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn("w-full justify-start text-left font-normal", !invoiceDate && "text-muted-foreground" )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={invoiceDate} onSelect={setInvoiceDate} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="manufacturer">Manufacturer</Label>
                                        <Select value={manufacturerId} onValueChange={setManufacturerId} required>
                                            <SelectTrigger id="manufacturer">
                                                <SelectValue placeholder="Select Manufacturer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {manufacturerMaster.map(man => (
                                                    <SelectItem key={man.id} value={man.id}>{man.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="destination-store">Destination</Label>
                                        <Select value={destination} onValueChange={setDestination}>
                                            <SelectTrigger id="destination-store">
                                                <SelectValue placeholder="Select Store" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="warehouse">Main Warehouse</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {purchaseItems.length > 0 && (
                                    <div className="relative w-full overflow-auto rounded-lg border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="min-w-[250px]">Medicine</TableHead>
                                                    <TableHead className="w-[100px]">Quantity</TableHead>
                                                    <TableHead className="w-[150px]">Price/Unit (₹)</TableHead>
                                                    <TableHead className="w-[150px]">Expiry</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {purchaseItems.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            <Select value={item.medicineId} onValueChange={value => handleMedicineSelect(item.id, value)} required>
                                                                <SelectTrigger><SelectValue placeholder="Select Medicine" /></SelectTrigger>
                                                                <SelectContent>
                                                                    {medicineMaster.map(med => (
                                                                        <SelectItem key={med.id} value={med.id}>{med.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value, 10) || 0)} min="1" required/>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input type="number" value={item.pricePerUnit} onChange={e => handleItemChange(item.id, 'pricePerUnit', parseFloat(e.target.value) || 0)} step="0.01" min="0.01" required/>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input type="date" value={item.expiryDate} onChange={e => handleItemChange(item.id, 'expiryDate', e.target.value)} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                                
                                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                                     <Button type="button" variant="outline" onClick={handleAddItem}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Row
                                    </Button>
                                    <div className="flex-grow text-right">
                                        {purchaseItems.length > 0 && (
                                            <p className="text-lg font-bold">Total Invoice Amount: ₹{totalInvoiceValue.toFixed(2)}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                            <CardContent className="pt-0">
                                <div className="flex justify-end">
                                    <Button type="submit">
                                        <PlusSquare className="mr-2 h-4 w-4"/>
                                        Add All to Inventory
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </TabsContent>
                <TabsContent value="csv-import">
                    <Card>
                        <CardHeader>
                            <CardTitle>Import Stock from CSV File</CardTitle>
                            <CardDescription>Upload a CSV file to add multiple medicines to your inventory at once. MedicineID, Quantity, and PricePerUnit are required.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="csv-invoice-number">Purchase Invoice Number</Label>
                                    <Input id="csv-invoice-number" placeholder="e.g., INV-2024-123" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="csv-manufacturer">Manufacturer</Label>
                                    <Select required>
                                        <SelectTrigger id="csv-manufacturer">
                                            <SelectValue placeholder="Select Manufacturer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {manufacturerMaster.map(man => (
                                                <SelectItem key={man.id} value={man.name}>{man.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                                <Upload className="h-12 w-12 text-muted-foreground" />
                                <p className="mt-4 text-muted-foreground">Drag & drop your CSV file here or click to upload.</p>
                                <Button asChild className="mt-4">
                                    <label htmlFor="csv-upload">
                                        <File className="mr-2 h-4 w-4" />
                                        Choose File
                                        <Input id="csv-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileUpload} />
                                    </label>
                                </Button>
                            </div>
                            <Button variant="link" onClick={downloadSampleCsv}>
                                <Download className="mr-2 h-4 w-4" />
                                Download Sample CSV File
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
      </div>
    </div>
  );
}
