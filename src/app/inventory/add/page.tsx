
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, Warehouse, GitBranch, LogOut, ChevronDown, TrendingUp, PlusCircle, Trash2, Upload, File, Download } from "lucide-react";
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


interface PurchaseItem {
    id: number;
    medicineName: string;
    manufacturer: string;
    quantity: number;
    pricePerUnit: number;
    expiryDate: string;
    gstSlab: string;
}

export default function AddMedicinePage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
    const [invoiceNumber, setInvoiceNumber] = useState("");
    const [destination, setDestination] = useState("warehouse");

    const sidebarRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path !== '/');
    }, []);
    
    const stockManagementRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path.startsWith('/inventory/') && route.inSidebar && hasPermission(route.path));
    }, [hasPermission]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);
    
    const handleAddItem = () => {
        const newItem: PurchaseItem = {
            id: Date.now(),
            medicineName: "",
            manufacturer: "",
            quantity: 1,
            pricePerUnit: 0,
            expiryDate: "",
            gstSlab: "12",
        };
        setPurchaseItems([...purchaseItems, newItem]);
    };

    const handleItemChange = (id: number, field: keyof PurchaseItem, value: string | number) => {
        setPurchaseItems(purchaseItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleRemoveItem = (id: number) => {
        setPurchaseItems(purchaseItems.filter(item => item.id !== id));
    };

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!invoiceNumber) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a purchase invoice number.' });
            return;
        }
        if (purchaseItems.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please add at least one medicine to the list.' });
            return;
        }
        // In a real app, you would send this data to your backend
        console.log({ invoiceNumber, destination, items: purchaseItems });
        toast({ title: 'Success', description: 'Stock added to inventory successfully.' });
        setPurchaseItems([]);
        setInvoiceNumber("");
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Here you would parse the CSV file
            toast({
                title: "File Uploaded",
                description: `${file.name} has been uploaded. Processing will happen on the backend.`,
            });
        }
    };
    
    const downloadSampleCsv = () => {
        const header = "MedicineName,Manufacturer,Quantity,PricePerUnit,ExpiryDate(YYYY-MM-DD),GSTSlab(%)\n";
        const exampleRow = "Paracetamol 500mg,Pharma Inc.,100,10.50,2026-12-31,12\n";
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
            case 'Warehouse Stock': return <Warehouse />;
            case 'Store Stock': return <Package />;
            case 'Add Medicine': return <PlusSquare />;
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

                {hasPermission('/inventory/warehouse') && (
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
                 
                 {hasPermission('/admin') && (
                    <SidebarMenuItem>
                        <SidebarMenuButton href="/admin" tooltip="Admin" isActive={pathname === '/admin'}>
                            {getIcon('Admin')}
                            <span>Admin</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
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
              <h1 className="text-xl font-semibold">Stock Inflow</h1>
              <ThemeToggle />
           </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs defaultValue="bulk-add">
                <TabsList>
                    <TabsTrigger value="bulk-add">Bulk Add Stock</TabsTrigger>
                    <TabsTrigger value="csv-import">Import from CSV</TabsTrigger>
                </TabsList>
                <TabsContent value="bulk-add">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Medicine Stock</CardTitle>
                            <CardDescription>Fill in the form to add new medicine stock to the warehouse.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <form className="space-y-6" onSubmit={handleFormSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="invoice-number">Purchase Invoice Number</Label>
                                        <Input id="invoice-number" placeholder="e.g., INV-2024-123" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required />
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
                                    <div className="relative w-full overflow-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="min-w-[200px]">Medicine Name</TableHead>
                                                    <TableHead className="min-w-[150px]">Manufacturer</TableHead>
                                                    <TableHead className="w-[100px]">Quantity</TableHead>
                                                    <TableHead className="w-[120px]">Price/Unit (₹)</TableHead>
                                                    <TableHead className="w-[150px]">Expiry</TableHead>
                                                    <TableHead className="w-[120px]">GST %</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {purchaseItems.map(item => (
                                                    <TableRow key={item.id}>
                                                        <TableCell>
                                                            <Input value={item.medicineName} onChange={e => handleItemChange(item.id, 'medicineName', e.target.value)} placeholder="e.g., Paracetamol" />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input value={item.manufacturer} onChange={e => handleItemChange(item.id, 'manufacturer', e.target.value)} placeholder="e.g., Pharma Inc." />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value, 10))} min="1" />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input type="number" value={item.pricePerUnit} onChange={e => handleItemChange(item.id, 'pricePerUnit', parseFloat(e.target.value))} />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input type="date" value={item.expiryDate} onChange={e => handleItemChange(item.id, 'expiryDate', e.target.value)} />
                                                        </TableCell>
                                                        <TableCell>
                                                             <Select value={item.gstSlab} onValueChange={value => handleItemChange(item.id, 'gstSlab', value)}>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="0">0%</SelectItem>
                                                                    <SelectItem value="5">5%</SelectItem>
                                                                    <SelectItem value="12">12%</SelectItem>
                                                                    <SelectItem value="18">18%</SelectItem>
                                                                    <SelectItem value="28">28%</SelectItem>
                                                                </SelectContent>
                                                            </Select>
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
                                
                                <div className="flex justify-between items-center">
                                    <Button type="button" variant="outline" onClick={handleAddItem}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Row
                                    </Button>
                                    <Button type="submit">
                                        <PlusSquare className="mr-2 h-4 w-4"/>
                                        Add All to Inventory
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="csv-import">
                    <Card>
                        <CardHeader>
                            <CardTitle>Import Stock from CSV File</CardTitle>
                            <CardDescription>Upload a CSV file to add multiple medicines to your inventory at once.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-center">
                             <div className="border-2 border-dashed border-muted-foreground/50 rounded-lg p-8 flex flex-col items-center justify-center">
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
