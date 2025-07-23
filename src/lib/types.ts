
export type UserRole = string;

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    assignedStore?: string;
}

export type RolePermissions = {
    [key in UserRole]: string[];
};

export interface AppRoute {
    path: string;
    name: string;
    inSidebar: boolean;
    parent?: string; // Used to build hierarchy
    children?: AppRoute[]; // Used for UI rendering
}

export const allAppRoutes: AppRoute[] = [
    { path: "/", name: "Dashboard", inSidebar: true },
    { path: "/patients", name: "Patients", inSidebar: true },
    
    // Sales
    { path: "/sales", name: "Sales", inSidebar: true, parent: "Sales" },
    { path: "/sales/reports", name: "Sales Reports", inSidebar: true, parent: "Sales" },
    { path: "/reports/profit-loss", name: "Profit & Loss Report", inSidebar: true, parent: "Sales" },
    { path: "/reports", name: "Universal Report", inSidebar: true, parent: "Sales" },
    
    // Inventory
    { path: "/inventory", name: "Stock Management", inSidebar: false }, // Parent group
    { path: "/inventory/stores", name: "Store Stock", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/master", name: "Medicine Master", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/manufacturer", name: "Manufacturer Master", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/add", name: "Add Stock", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/returns", name: "Return to Manufacturer", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/transfer", name: "Stock Transfer", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/adjustment", name: "Stock Adjustment", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/damaged", name: "Damaged Stock", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/reports", name: "Inventory Reports", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/valuation", name: "Valuation Report", inSidebar: true, parent: "/inventory" },
    { path: "/inventory/ledger", name: "Stock Ledger", inSidebar: true, parent: "/inventory" },
    
    // Other
    { path: "/diseases", name: "Diseases", inSidebar: true },
    { path: "/documentation", name: "Documentation", inSidebar: true },
    { path: "/admin", name: "Admin", inSidebar: true },
];

/**
 * Builds a tree structure from the flat list of routes.
 */
export function buildRoutesTree(routes: AppRoute[]): AppRoute[] {
    const routeMap = new Map<string, AppRoute>();
    const tree: AppRoute[] = [];

    // First pass: create a map of all routes and prepare children arrays
    routes.forEach(route => {
        routeMap.set(route.path, { ...route, children: [] });
    });

    // Second pass: build the tree
    routeMap.forEach(route => {
        if (route.parent && routeMap.has(route.parent)) {
            const parent = routeMap.get(route.parent)!;
            parent.children?.push(route);
        } else if (route.parent === "Sales" && !routeMap.has("Sales")) {
            // Create a virtual parent for Sales
             if (!routeMap.has("Sales")) {
                const salesParent: AppRoute = { path: "Sales", name: "Sales", inSidebar: false, children: [] };
                routeMap.set("Sales", salesParent);
                tree.push(salesParent);
            }
            routeMap.get("Sales")!.children!.push(route);
        }
        else if (!route.parent) {
            tree.push(route);
        }
    });
    
    // Ensure the virtual "Sales" parent is in the tree if it was created
    const salesParent = routeMap.get("Sales");
    if (salesParent && !tree.some(r => r.path === 'Sales')) {
        tree.push(salesParent);
    }
    
    // Move inventory into its own group
    const inventoryParent = routeMap.get('/inventory');
    if (inventoryParent) {
        inventoryParent.name = "Stock Management"; // Rename for UI
        tree.push(inventoryParent);
    }
    
    // Filter out children that have been moved under a parent
    return tree.filter(route => !route.parent);
}
