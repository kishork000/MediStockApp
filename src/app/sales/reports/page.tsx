
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
import { Home as HomeIcon, LayoutGrid, Package, Users2, ShoppingCart, BarChart, PlusSquare, Activity, Settings, GitBranch, LogOut, ChevronDown, Warehouse, TrendingUp, Filter, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { allAppRoutes } from "@/lib/types";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { DateRange } from "react-day-picker";
import { addDays, parseISO, startOfDay, endOfDay, format } from "date-fns";
import { SalesByPharmacistChart } from "@/components/sales/SalesByPharmacistChart";
import { TopSellingMedicinesChart } from "@/components/sales/TopSellingMedicinesChart";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const salesData = [
    { invoiceId: "SALE001", pharmacist: "Pharmacist One", store: "Downtown Pharmacy", medicine: "Aspirin", quantity: 5, total: 50.00, date: "2024-07-28", paymentMethod: "Cash", patientName: "Alice Johnson", storeId: "STR002" },
    { invoiceId: "SALE002", pharmacist: "Pharmacist One", store: "Downtown Pharmacy", medicine: "Paracetamol", quantity: 10, total: 57.50, date: "2024-07-28", paymentMethod: "Online", patientName: "Bob Williams", storeId: "STR002" },
    { invoiceId: "SALE003", pharmacist: "Pharmacist Two", store: "Uptown Health", medicine: "Ibuprofen", quantity: 8, total: 124.00, date: "2024-07-29", paymentMethod: "Cash", patientName: "Charlie Brown", storeId: "STR003" },
    { invoiceId: "SALE004", pharmacist: "Pharmacist One", store: "Downtown Pharmacy", medicine: "Aspirin", quantity: 3, total: 30.00, date: "2024-07-29", paymentMethod: "Cash", patientName: "Diana Miller", storeId: "STR002" },
    { invoiceId: "SALE005", pharmacist: "Admin User", store: "Downtown Pharmacy", medicine: "Atorvastatin", quantity: 2, total: 90.00, date: "2024-07-30", paymentMethod: "Online", patientName: "Ethan Davis", storeId: "STR002" },
    { invoiceId: "SALE006", pharmacist: "Pharmacist Two", store: "Uptown Health", medicine: "Metformin", quantity: 5, total: 125.00, date: "2024-07-30", paymentMethod: "Online", patientName: "Alice Johnson", storeId: "STR003" },
];

const allStores = [
    { id: "all", name: "All Stores", storeId: "all" },
    { id: "Downtown Pharmacy", name: "Downtown Pharmacy", storeId: "STR002" },
    { id: "Uptown Health", name: "Uptown Health", storeId: "STR003" },
];

const pharmacists = [
    { id: "all", name: "All Pharmacists" },
    { id: "Pharmacist One", name: "Pharmacist One" },
    { id: "Pharmacist Two", name: "Pharmacist Two" },
    { id: "Admin User", name: "Admin User" },
];

const salesOverTimeChartConfig = {
  total: {
    label: "Total Sales",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const highSellingChartConfig = {
  quantity: {
    label: "Quantity",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const pharmacistSalesChartConfig = {
  salesValue: {
    label: "Sales Value",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function SalesReportPage() {
    const { user, logout, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [filteredData, setFilteredData] = useState(salesData);
    const [selectedStore, setSelectedStore] = useState("all");
    const [selectedPharmacist, setSelectedPharmacist] = useState("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: new Date(2024, 6, 20),
      to: addDays(new Date(), 0), // Set 'to' date to today
    });
    
    const [isSalesDetailModalOpen, setIsSalesDetailModalOpen] = useState(false);
    const [modalView, setModalView] = useState<'summary' | 'cash' | 'online'>('summary');


    const availableStores = useMemo(() => {
        if (user?.role === 'Admin') {
            return allStores;
        }
        if (user?.role === 'Pharmacist' && user.assignedStore) {
            return allStores.filter(s => s.storeId === user.assignedStore || s.storeId === 'all');
        }
        return [];
    }, [user]);

    
    const handleApplyFilters = () => {
        let data = [...salesData];

        if (selectedStore !== "all") {
            const store = allStores.find(s => s.id === selectedStore);
            if (store) {
                 data = data.filter(sale => sale.storeId === store.storeId);
            }
        }

        if (selectedPharmacist !== "all") {
            data = data.filter(sale => sale.pharmacist === selectedPharmacist);
        }

        if (dateRange?.from && dateRange?.to) {
            const fromDate = startOfDay(dateRange.from);
            const toDate = endOfDay(dateRange.to);
            data = data.filter(sale => {
                const saleDate = parseISO(sale.date);
                return saleDate >= fromDate && saleDate <= toDate;
            });
        }
        
        setFilteredData(data);
    };
    
    // Apply filters on initial load and when user changes
    useEffect(() => {
        if (user?.role === 'Pharmacist' && user.assignedStore) {
            const assignedStore = allStores.find(s => s.storeId === user.assignedStore);
            if(assignedStore) {
                setSelectedStore(assignedStore.id);
            }
        } else if (user?.role === 'Admin') {
            setSelectedStore('all');
        }
    }, [user]);

    useEffect(() => {
        handleApplyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStore, selectedPharmacist, dateRange, user]);


    const analytics = useMemo(() => {
        const totalSalesValue = filteredData.reduce((acc, sale) => acc + sale.total, 0);
        const cashSalesValue = filteredData.filter(s => s.paymentMethod === 'Cash').reduce((acc, sale) => acc + sale.total, 0);
        const onlineSalesValue = filteredData.filter(s => s.paymentMethod === 'Online').reduce((acc, sale) => acc + sale.total, 0);
        
        const totalItemsSold = filteredData.reduce((acc, sale) => acc + sale.quantity, 0);
        const cashInvoices = filteredData.filter(s => s.paymentMethod === 'Cash');
        const onlineInvoices = filteredData.filter(s => s.paymentMethod === 'Online');


        const highSellingMedicines = filteredData.reduce((acc, sale) => {
            const existing = acc.find(item => item.name === sale.medicine);
            if (existing) {
                existing.quantity += sale.quantity;
            } else {
                acc.push({ name: sale.medicine, quantity: sale.quantity });
            }
            return acc;
        }, [] as { name: string; quantity: number; }[]).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

        const pharmacistSales = filteredData.reduce((acc, sale) => {
            const existing = acc.find(item => item.name === sale.pharmacist);
            if (existing) {
                existing.salesValue += sale.total;
            } else {
                acc.push({ name: sale.pharmacist, salesValue: sale.total });
            }
            return acc;
        }, [] as { name: string; salesValue: number; }[]).sort((a, b) => b.salesValue - a.salesValue);
        
        const salesOverTime = filteredData.reduce((acc, sale) => {
            const saleDate = format(parseISO(sale.date), "MMM dd");
            const existing = acc.find(item => item.date === saleDate);
            if (existing) {
                existing.total += sale.total;
            } else {
                acc.push({ date: saleDate, total: sale.total });
            }
            return acc;
        }, [] as { date: string; total: number; }[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


        return { totalSalesValue, cashSalesValue, onlineSalesValue, totalItemsSold, highSellingMedicines, pharmacistSales, salesOverTime, cashInvoices, onlineInvoices };

    }, [filteredData]);


    const sidebarRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path !== '/');
    }, []);

    const stockManagementRoutes = useMemo(() => {
        return allAppRoutes.filter(route => route.path.startsWith('/inventory/') && hasPermission(route.path));
    }, [hasPermission]);

     useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

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

    const handleSalesCardClick = () => {
        setModalView('summary');
        setIsSalesDetailModalOpen(true);
    };

  return (
    <>
    
      
          
            
              
  
                
                    
                

                
                     
                    
                     
                    
                
                 
                
               
                 

              
              
                   
                   
                   
               
                
                    Sales Performance
                    Analyze sales data with powerful filters.
                    
                        
                             
                                Select Store
                                   
                                           
                                                {availableStores.map(store => (
                                               {store.name}
                                            
                                        
                                     
                               
                                 
                               
                                Select Pharmacist
                                   
                                           
                                       
                                  

                                          
                                            {pharmacists.map(p => (
                                               {p.name}
                                           
                                        
                                     
                                 
                             
                             
                        
                    
                
                
                  
                    
                         
                         Total Sales Value
                           
                        
                         ₹{analytics.totalSalesValue.toFixed(2)}
                         Click to see details
                     
                      
                          Total Items Sold
                           
                        
                        {analytics.totalItemsSold}
                    

                     
                        Sales Over Time
                         Total sales value in the selected period.
                        
                                   {  }
                    

                     
                        
                    
                  
                    
                      
                   

        
          
            
              
                
                    
                        

                
            
       
    
  );
}
