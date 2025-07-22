
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { InventoryItem, getAvailableStockForLocation } from "@/services/inventory-service";
import { Medicine, getMedicines } from "@/services/medicine-service";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface StockAlert {
    medicineName: string;
    locationName: string;
    quantity: number;
    minStockLevel: number;
}

const allStores = [
    { id: "warehouse", name: "Warehouse" },
    { id: "STR002", name: "Downtown Pharmacy" },
    { id: "STR003", name: "Uptown Health" },
];

export default function StockAlerts() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [alerts, setAlerts] = useState<StockAlert[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const storesToFetch = user.role === 'Admin'
            ? allStores
            : allStores.filter(store => store.id === 'warehouse' || store.id === user.assignedStore);

        try {
            const medicines = await getMedicines();
            const medicineMap = new Map(medicines.map(m => [m.id, m]));

            const stockPromises = storesToFetch.map(store => getAvailableStockForLocation(store.id));
            const stockResults = await Promise.all(stockPromises);

            const allAlerts: StockAlert[] = [];

            stockResults.forEach((stockItems, index) => {
                const location = storesToFetch[index];
                stockItems.forEach(item => {
                    const medicineDetails = medicineMap.get(item.medicineId);
                    if (!medicineDetails) return;
                    
                    const minStockLevel = location.id === 'warehouse' ? medicineDetails.warehouseMinStockLevel : medicineDetails.storeMinStockLevel;

                    if (item.quantity <= minStockLevel) {
                        allAlerts.push({
                            medicineName: item.medicineName,
                            locationName: location.name,
                            quantity: item.quantity,
                            minStockLevel: minStockLevel,
                        });
                    }
                });
            });

            setAlerts(allAlerts);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load stock alerts.' });
        }
        setLoading(false);
    }, [toast, user]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <CardTitle>Stock Alerts</CardTitle>
                </div>
                 {alerts.length > 0 && <Badge variant="destructive">{alerts.length} Items</Badge>}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ) : alerts.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Medicine</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead className="text-right">Qty/Min</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {alerts.map((alert, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{alert.medicineName}</TableCell>
                                        <TableCell>{alert.locationName}</TableCell>
                                        <TableCell className="text-right">{alert.quantity}/{alert.minStockLevel}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No stock alerts at the moment. Everything is well-stocked!</p>
                )}
            </CardContent>
        </Card>
    );
}
