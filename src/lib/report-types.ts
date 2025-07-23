
export interface WarehouseLedgerItem {
    type: 'warehouse';
    medicineId: string;
    medicineName: string;
    manufacturerName: string;
    opening: number;
    received: number; // from purchase
    totalStock: number; // opening + received + returned from store
    returnedFromStore: number;
    returnedToManufacturer: number;
    transferred: number; // to stores
    balance: number;
}

export interface StoreLedgerItem {
    type: 'store';
    medicineId: string;
    medicineName: string;
    opening: number;
    received: number; // from warehouse
    sales: number;
    returned: number; // to warehouse
    balance: number;
}
