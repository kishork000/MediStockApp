
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

    // Create a virtual Sales parent if it doesn't exist.
    if (!routeMap.has("Sales")) {
        const salesParent: AppRoute = { path: "Sales", name: "Sales", inSidebar: false, children: [] };
        routeMap.set("Sales", salesParent);
    }

    // First pass: create a map of all routes and prepare children arrays
    routes.forEach(route => {
        routeMap.set(route.path, { ...route, children: [] });
    });

    // Second pass: build the tree
    routeMap.forEach(route => {
        if (route.parent && routeMap.has(route.parent)) {
            const parent = routeMap.get(route.parent)!;
            // The check for `parent.children` is important because the base object in the map might not have it initialized
            if (parent.children) {
                 parent.children.push(route);
            } else {
                 parent.children = [route];
            }
        } else if (!route.parent) {
            tree.push(route);
        }
    });

    // Return only the top-level routes (those without a parent in the original list, or our virtual ones)
    return tree.filter(route => !route.parent || (route.parent && !routes.find(r => r.path === route.parent)));
}
